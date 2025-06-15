const express = require('express');
const router = express.Router();
const db = require('../config/database');
const Joi = require('joi');

// 验证规则
const employeeSchema = Joi.object({
  employee_number: Joi.string().max(20).required(),
  name: Joi.string().max(50).required(),
  gender: Joi.string().valid('男', '女').optional(),
  birth_date: Joi.date().optional(),
  id_card: Joi.string().max(18).optional(),
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional().messages({
    'string.pattern.base': '手机号格式不正确'
  }),
  email: Joi.string().email().max(100).optional(),
  address: Joi.string().optional(),
  education: Joi.string().max(20).optional(),
  marital_status: Joi.string().valid('未婚', '已婚', '离异', '丧偶').optional(),
  department_id: Joi.number().integer().optional(),
  position: Joi.string().max(50).optional(),
  hire_date: Joi.date().optional(),
  status: Joi.string().valid('active', 'inactive', 'resigned').default('active'),
  salary: Joi.number().precision(2).min(0).optional(),
  emergency_contact_name: Joi.string().max(50).optional(),
  emergency_contact_phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional().messages({
    'string.pattern.base': '紧急联系人手机号格式不正确'
  }),
  notes: Joi.string().optional()
});

// 获取员工列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, department_id, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (search) {
      whereClause += ` AND (e.name LIKE ? OR e.employee_number LIKE ? OR e.phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (department_id) {
      whereClause += ` AND e.department_id = ?`;
      params.push(department_id);
    }
    
    if (status) {
      whereClause += ` AND e.status = ?`;
      params.push(status);
    }
    
    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM employees e 
      WHERE ${whereClause}
    `;
    const countResult = await db.get(countQuery, params);
    
    // 查询数据
    const dataQuery = `
      SELECT 
        e.*,
        d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const employees = await db.query(dataQuery, [...params, parseInt(limit), offset]);
    
    res.json({
      status: 'success',
      data: {
        items: employees,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取员工列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取员工列表失败'
    });
  }
});

// 获取简化的员工列表（仅包含id和name）
router.get('/simple', async (req, res) => {
  try {
    const employees = await db.query(`
      SELECT id, name, employee_number, department_id
      FROM employees
      WHERE status = 'active'
      ORDER BY name ASC
    `);

    res.json({
      status: 'success',
      data: employees
    });
  } catch (error) {
    console.error('获取简化员工列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取简化员工列表失败'
    });
  }
});

// 获取单个员工详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await db.get(`
      SELECT 
        e.*,
        d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = ?
    `, [id]);
    
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: '员工不存在'
      });
    }
    
    res.json({
      status: 'success',
      data: employee
    });
  } catch (error) {
    console.error('获取员工详情失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取员工详情失败'
    });
  }
});

// 创建员工
router.post('/', async (req, res) => {
  try {
    const { error, value } = employeeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    
    // 检查员工编号是否重复
    const existingEmployee = await db.get(
      'SELECT id FROM employees WHERE employee_number = ?',
      [value.employee_number]
    );
    
    if (existingEmployee) {
      return res.status(400).json({
        status: 'error',
        message: '员工编号已存在'
      });
    }
    
    const fields = Object.keys(value);
    const values = Object.values(value);
    const placeholders = fields.map(() => '?').join(', ');
    
    const result = await db.run(`
      INSERT INTO employees (${fields.join(', ')}, created_at, updated_at)
      VALUES (${placeholders}, datetime('now'), datetime('now'))
    `, values);
    
    res.status(201).json({
      status: 'success',
      message: '员工创建成功',
      data: { id: result.id }
    });
  } catch (error) {
    console.error('创建员工失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建员工失败'
    });
  }
});

// 更新员工
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = employeeSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    
    // 检查员工是否存在
    const existingEmployee = await db.get('SELECT id FROM employees WHERE id = ?', [id]);
    if (!existingEmployee) {
      return res.status(404).json({
        status: 'error',
        message: '员工不存在'
      });
    }
    
    // 检查员工编号是否重复（排除当前员工）
    if (value.employee_number) {
      const duplicateEmployee = await db.get(
        'SELECT id FROM employees WHERE employee_number = ? AND id != ?',
        [value.employee_number, id]
      );
      
      if (duplicateEmployee) {
        return res.status(400).json({
          status: 'error',
          message: '员工编号已存在'
        });
      }
    }
    
    const fields = Object.keys(value);
    const values = Object.values(value);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    await db.run(`
      UPDATE employees 
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
    `, [...values, id]);
    
    res.json({
      status: 'success',
      message: '员工更新成功'
    });
  } catch (error) {
    console.error('更新员工失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新员工失败'
    });
  }
});

// 删除员工
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.run('DELETE FROM employees WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        status: 'error',
        message: '员工不存在'
      });
    }
    
    res.json({
      status: 'success',
      message: '员工删除成功'
    });
  } catch (error) {
    console.error('删除员工失败:', error);
    res.status(500).json({
      status: 'error',
      message: '删除员工失败'
    });
  }
});

// 批量删除员工
router.delete('/', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '请提供要删除的员工ID列表'
      });
    }
    
    const placeholders = ids.map(() => '?').join(',');
    const result = await db.run(`DELETE FROM employees WHERE id IN (${placeholders})`, ids);
    
    res.json({
      status: 'success',
      message: `成功删除${result.changes}个员工`
    });
  } catch (error) {
    console.error('批量删除员工失败:', error);
    res.status(500).json({
      status: 'error',
      message: '批量删除员工失败'
    });
  }
});

// 导出员工信息
router.get('/export', async (req, res) => {
  try {
    const { name, employee_number, department_id, position, status } = req.query;
    
    let whereClause = '1=1';
    let params = [];
    
    if (name) {
      whereClause += ` AND e.name LIKE ?`;
      params.push(`%${name}%`);
    }
    
    if (employee_number) {
      whereClause += ` AND e.employee_number LIKE ?`;
      params.push(`%${employee_number}%`);
    }
    
    if (department_id) {
      whereClause += ` AND e.department_id = ?`;
      params.push(department_id);
    }
    
    if (position) {
      whereClause += ` AND e.position LIKE ?`;
      params.push(`%${position}%`);
    }
    
    if (status) {
      whereClause += ` AND e.status = ?`;
      params.push(status);
    }
    
    const dataQuery = `
      SELECT 
        e.employee_number as '工号',
        e.name as '姓名',
        e.gender as '性别',
        d.name as '部门',
        e.position as '职位',
        e.phone as '手机号',
        e.email as '邮箱',
        e.education as '学历',
        e.hire_date as '入职日期',
        CASE e.status 
          WHEN 'active' THEN '在职'
          WHEN 'inactive' THEN '离职'
          ELSE '其他'
        END as '状态',
        e.address as '地址'
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${whereClause}
      ORDER BY e.created_at DESC
    `;
    
    const employees = await db.query(dataQuery, params);
    
    // 生成CSV内容
    if (employees.length === 0) {
      return res.json({
        status: 'success',
        data: {
          url: null,
          message: '没有符合条件的员工数据'
        }
      });
    }
    
    // 获取表头
    const headers = Object.keys(employees[0]);
    let csvContent = headers.join(',') + '\n';
    
    // 添加数据行
    employees.forEach(employee => {
      const row = headers.map(header => {
        const value = employee[header] || '';
        // 处理包含逗号或换行的字段
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvContent += row.join(',') + '\n';
    });
    
    // 设置响应头
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
    
    // 添加BOM以支持中文
    res.write('\ufeff');
    res.end(csvContent);
    
  } catch (error) {
    console.error('导出员工信息失败:', error);
    res.status(500).json({
      status: 'error',
      message: '导出员工信息失败'
    });
  }
});

// 获取员工统计信息
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_employees,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_employees,
        COUNT(CASE WHEN status = 'resigned' THEN 1 END) as resigned_employees,
        COUNT(CASE WHEN gender = '男' THEN 1 END) as male_count,
        COUNT(CASE WHEN gender = '女' THEN 1 END) as female_count
      FROM employees
    `);
    
    // 按部门统计
    const departmentStats = await db.query(`
      SELECT 
        d.name as department_name,
        COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
      GROUP BY d.id, d.name
      ORDER BY employee_count DESC
    `);
    
    res.json({
      status: 'success',
      data: {
        overview: stats,
        department_distribution: departmentStats
      }
    });
  } catch (error) {
    console.error('获取员工统计失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取员工统计失败'
    });
  }
});

module.exports = router;