const express = require('express');
const router = express.Router();
const db = require('../config/database');
const Joi = require('joi');

// 薪酬记录验证规则
const salarySchema = Joi.object({
  employee_id: Joi.number().integer().required(),
  year: Joi.number().integer().min(2020).max(2030).required(),
  month: Joi.number().integer().min(1).max(12).required(),
  base_salary: Joi.number().precision(2).min(0).required(),
  allowances: Joi.number().precision(2).min(0).default(0),
  overtime_pay: Joi.number().precision(2).min(0).default(0),
  bonus: Joi.number().precision(2).min(0).default(0),
  deductions: Joi.number().precision(2).min(0).default(0),
  social_insurance: Joi.number().precision(2).min(0).default(0),
  tax: Joi.number().precision(2).min(0).default(0)
});

// 福利验证规则
const benefitSchema = Joi.object({
  name: Joi.string().max(100).required(),
  type: Joi.string().max(50).required(),
  description: Joi.string().optional(),
  amount: Joi.number().precision(2).min(0).required(),
  is_active: Joi.number().integer().valid(0, 1).default(1)
});

// ============= 薪酬记录管理 =============

// 获取薪酬记录列表
router.get('/records', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, employee_id, year, month } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (search) {
      whereClause += ` AND (e.name LIKE ? OR e.employee_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (employee_id) {
      whereClause += ` AND sr.employee_id = ?`;
      params.push(employee_id);
    }
    
    if (year) {
      whereClause += ` AND sr.year = ?`;
      params.push(year);
    }
    
    if (month) {
      whereClause += ` AND sr.month = ?`;
      params.push(month);
    }
    
    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM salary_records sr
      LEFT JOIN employees e ON sr.employee_id = e.id
      WHERE ${whereClause}
    `;
    const countResult = await db.get(countQuery, params);
    
    // 查询数据
    const dataQuery = `
      SELECT 
        sr.*,
        e.name as employee_name,
        e.employee_number,
        d.name as department_name
      FROM salary_records sr
      LEFT JOIN employees e ON sr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${whereClause}
      ORDER BY sr.year DESC, sr.month DESC
      LIMIT ? OFFSET ?
    `;
    
    const records = await db.query(dataQuery, [...params, parseInt(limit), offset]);
    
    res.json({
      status: 'success',
      data: {
        items: records,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取薪酬记录失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取薪酬记录失败'
    });
  }
});

// 获取单个薪酬记录详情
router.get('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const record = await db.get(`
      SELECT 
        sr.*,
        e.name as employee_name,
        e.employee_number,
        e.position,
        e.hire_date,
        d.name as department_name
      FROM salary_records sr
      LEFT JOIN employees e ON sr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE sr.id = ?
    `, [id]);
    
    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: '薪酬记录不存在'
      });
    }
    
    res.json({
      status: 'success',
      data: record
    });
  } catch (error) {
    console.error('获取薪酬记录详情失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取薪酬记录详情失败'
    });
  }
});

// 创建薪酬记录
router.post('/records', async (req, res) => {
  try {
    const { error, value } = salarySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    
    // 计算实发工资
    const grossSalary = value.base_salary + value.allowances + value.overtime_pay + value.bonus;
    const totalDeductions = value.deductions + value.social_insurance + value.tax;
    value.net_salary = grossSalary - totalDeductions;
    
    const fields = Object.keys(value);
    const values = Object.values(value);
    const placeholders = fields.map(() => '?').join(', ');
    
    const result = await db.run(`
      INSERT INTO salary_records (${fields.join(', ')}, created_at, updated_at)
      VALUES (${placeholders}, datetime('now'), datetime('now'))
    `, values);
    
    res.status(201).json({
      status: 'success',
      message: '薪酬记录创建成功',
      data: { id: result.id }
    });
  } catch (error) {
    console.error('创建薪酬记录失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建薪酬记录失败'
    });
  }
});

// 更新薪酬记录
router.put('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = salarySchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    
    // 检查薪酬记录是否存在
    const existingRecord = await db.get('SELECT id, status FROM salary_records WHERE id = ?', [id]);
    if (!existingRecord) {
      return res.status(404).json({
        status: 'error',
        message: '薪酬记录不存在'
      });
    }
    
    if (existingRecord.status === 'paid') {
      return res.status(400).json({
        status: 'error',
        message: '已发放的薪酬记录无法修改'
      });
    }
    
    // 重新计算实发工资
    const grossSalary = value.base_salary + value.allowances + value.overtime_pay + value.bonus;
    const totalDeductions = value.deductions + value.social_insurance + value.tax;
    value.net_salary = grossSalary - totalDeductions;
    
    const fields = Object.keys(value);
    const values = Object.values(value);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    await db.run(`
      UPDATE salary_records 
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
    `, [...values, id]);
    
    res.json({
      status: 'success',
      message: '薪酬记录更新成功'
    });
  } catch (error) {
    console.error('更新薪酬记录失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新薪酬记录失败'
    });
  }
});

// 发放薪酬
router.put('/records/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.run(`
      UPDATE salary_records 
      SET status = 'paid', paid_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ? AND status = 'pending'
    `, [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        status: 'error',
        message: '薪酬记录不存在或已发放'
      });
    }
    
    res.json({
      status: 'success',
      message: '薪酬发放成功'
    });
  } catch (error) {
    console.error('薪酬发放失败:', error);
    res.status(500).json({
      status: 'error',
      message: '薪酬发放失败'
    });
  }
});

// 批量发放薪酬
router.put('/records/batch-pay', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '请提供要发放的薪酬记录ID列表'
      });
    }
    
    const placeholders = ids.map(() => '?').join(',');
    const result = await db.run(`
      UPDATE salary_records 
      SET status = 'paid', paid_at = datetime('now'), updated_at = datetime('now')
      WHERE id IN (${placeholders}) AND status = 'pending'
    `, ids);
    
    res.json({
      status: 'success',
      message: `成功发放${result.changes}条薪酬记录`
    });
  } catch (error) {
    console.error('批量发放薪酬失败:', error);
    res.status(500).json({
      status: 'error',
      message: '批量发放薪酬失败'
    });
  }
});

// 删除薪酬记录
router.delete('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 只能删除未发放的薪酬记录
    const result = await db.run(
      'DELETE FROM salary_records WHERE id = ? AND status = "pending"',
      [id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({
        status: 'error',
        message: '薪酬记录不存在或无法删除'
      });
    }
    
    res.json({
      status: 'success',
      message: '薪酬记录删除成功'
    });
  } catch (error) {
    console.error('删除薪酬记录失败:', error);
    res.status(500).json({
      status: 'error',
      message: '删除薪酬记录失败'
    });
  }
});

// ============= 福利管理 =============

// 获取福利项目列表
router.get('/benefits', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, is_active } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (search) {
      whereClause += ` AND (name LIKE ? OR description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (type) {
      whereClause += ` AND type = ?`;
      params.push(type);
    }
    
    if (is_active !== undefined) {
      whereClause += ` AND is_active = ?`;
      params.push(is_active);
    }
    
    // 查询总数
    const countQuery = `SELECT COUNT(*) as total FROM benefits WHERE ${whereClause}`;
    const countResult = await db.get(countQuery, params);
    
    // 查询数据
    const dataQuery = `
      SELECT * FROM benefits 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const benefits = await db.query(dataQuery, [...params, parseInt(limit), offset]);
    
    res.json({
      status: 'success',
      data: {
        items: benefits,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取福利项目失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取福利项目失败'
    });
  }
});

// 创建福利项目
router.post('/benefits', async (req, res) => {
  try {
    const { error, value } = benefitSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    
    const fields = Object.keys(value);
    const values = Object.values(value);
    const placeholders = fields.map(() => '?').join(', ');
    
    const result = await db.run(`
      INSERT INTO benefits (${fields.join(', ')}, created_at, updated_at)
      VALUES (${placeholders}, datetime('now'), datetime('now'))
    `, values);
    
    res.status(201).json({
      status: 'success',
      message: '福利项目创建成功',
      data: { id: result.id }
    });
  } catch (error) {
    console.error('创建福利项目失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建福利项目失败'
    });
  }
});

// 更新福利项目
router.put('/benefits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = benefitSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    
    const fields = Object.keys(value);
    const values = Object.values(value);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const result = await db.run(`
      UPDATE benefits 
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
    `, [...values, id]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        status: 'error',
        message: '福利项目不存在'
      });
    }
    
    res.json({
      status: 'success',
      message: '福利项目更新成功'
    });
  } catch (error) {
    console.error('更新福利项目失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新福利项目失败'
    });
  }
});

// 获取员工福利记录
router.get('/employee-benefits', async (req, res) => {
  try {
    const { page = 1, limit = 10, employee_id, benefit_id, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (employee_id) {
      whereClause += ` AND eb.employee_id = ?`;
      params.push(employee_id);
    }
    
    if (benefit_id) {
      whereClause += ` AND eb.benefit_id = ?`;
      params.push(benefit_id);
    }
    
    if (status) {
      whereClause += ` AND eb.status = ?`;
      params.push(status);
    }
    
    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM employee_benefits eb 
      WHERE ${whereClause}
    `;
    const countResult = await db.get(countQuery, params);
    
    // 查询数据
    const dataQuery = `
      SELECT 
        eb.*,
        e.name as employee_name,
        e.employee_number,
        b.name as benefit_name,
        b.type as benefit_type
      FROM employee_benefits eb
      LEFT JOIN employees e ON eb.employee_id = e.id
      LEFT JOIN benefits b ON eb.benefit_id = b.id
      WHERE ${whereClause}
      ORDER BY eb.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const records = await db.query(dataQuery, [...params, parseInt(limit), offset]);
    
    res.json({
      status: 'success',
      data: {
        items: records,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取员工福利记录失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取员工福利记录失败'
    });
  }
});

// 为员工分配福利
router.post('/employee-benefits', async (req, res) => {
  try {
    const { employee_id, benefit_id, start_date, end_date, amount } = req.body;
    
    if (!employee_id || !benefit_id || !start_date) {
      return res.status(400).json({
        status: 'error',
        message: '员工ID、福利ID和开始日期为必填项'
      });
    }
    
    // 检查员工和福利是否存在
    const employee = await db.get('SELECT id FROM employees WHERE id = ?', [employee_id]);
    const benefit = await db.get('SELECT id FROM benefits WHERE id = ? AND is_active = 1', [benefit_id]);
    
    if (!employee || !benefit) {
      return res.status(400).json({
        status: 'error',
        message: '员工或福利项目不存在'
      });
    }
    
    const result = await db.run(`
      INSERT INTO employee_benefits (employee_id, benefit_id, start_date, end_date, amount, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [employee_id, benefit_id, start_date, end_date, amount]);
    
    res.status(201).json({
      status: 'success',
      message: '员工福利分配成功',
      data: { id: result.id }
    });
  } catch (error) {
    console.error('分配员工福利失败:', error);
    res.status(500).json({
      status: 'error',
      message: '分配员工福利失败'
    });
  }
});

// ============= 统计分析 =============

// 获取薪酬统计
router.get('/stats', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    let whereClause = '1=1';
    let params = [];
    
    if (year) {
      whereClause += ` AND sr.year = ?`;
      params.push(year);
    }
    
    if (month) {
      whereClause += ` AND sr.month = ?`;
      params.push(month);
    }
    
    // 整体统计
    const overallStats = await db.get(`
      SELECT 
        COUNT(*) as total_records,
        SUM(sr.base_salary) as total_base_salary,
        SUM(sr.net_salary) as total_net_salary,
        AVG(sr.net_salary) as avg_net_salary
      FROM salary_records sr
      WHERE ${whereClause}
    `, params);
    
    res.json({
      status: 'success',
      data: {
        overall: overallStats
      }
    });
  } catch (error) {
    console.error('获取薪酬统计失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取薪酬统计失败'
    });
  }
});

// 生成工资条
router.get('/payslip/:employee_id', async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({
        status: 'error',
        message: '请提供年份和月份'
      });
    }
    
    const payslip = await db.get(`
      SELECT 
        sr.*,
        e.name as employee_name,
        e.employee_number,
        e.position,
        d.name as department_name
      FROM salary_records sr
      LEFT JOIN employees e ON sr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE sr.employee_id = ? AND sr.year = ? AND sr.month = ?
    `, [employee_id, year, month]);
    
    if (!payslip) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该员工的工资记录'
      });
    }
    
    // 获取员工福利
    const benefits = await db.query(`
      SELECT 
        b.name,
        b.type,
        eb.amount
      FROM employee_benefits eb
      LEFT JOIN benefits b ON eb.benefit_id = b.id
      WHERE eb.employee_id = ? AND eb.status = 'active'
        AND eb.start_date <= ? 
        AND (eb.end_date IS NULL OR eb.end_date >= ?)
    `, [employee_id, `${year}-${month.padStart(2, '0')}-01`, `${year}-${month.padStart(2, '0')}-01`]);
    
    res.json({
      status: 'success',
      data: {
        payslip: payslip,
        benefits: benefits
      }
    });
  } catch (error) {
    console.error('生成工资条失败:', error);
    res.status(500).json({
      status: 'error',
      message: '生成工资条失败'
    });
  }
});

module.exports = router; 