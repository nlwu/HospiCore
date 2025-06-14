const express = require('express');
const router = express.Router();
const db = require('../config/database');
const Joi = require('joi');

// 请假申请验证规则
const leaveRequestSchema = Joi.object({
  employee_id: Joi.number().integer().required(),
  leave_type: Joi.string().valid('sick', 'annual', 'personal', 'maternity', 'paternity', 'compassionate', 'other').required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().required(),
  days_count: Joi.number().precision(1).min(0.5).required(),
  reason: Joi.string().required()
});

// 审批验证规则
const approvalSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
  approval_notes: Joi.string().optional()
});

// 调休验证规则
const compLeaveSchema = Joi.object({
  employee_id: Joi.number().integer().required(),
  overtime_date: Joi.date().required(),
  overtime_hours: Joi.number().precision(2).min(0.5).required()
});

// ============= 请假申请管理 =============

// 获取请假申请列表
router.get('/requests', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, employee_id, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (search) {
      whereClause += ` AND (e.name LIKE ? OR e.employee_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (employee_id) {
      whereClause += ` AND lr.employee_id = ?`;
      params.push(employee_id);
    }
    
    if (status) {
      whereClause += ` AND lr.status = ?`;
      params.push(status);
    }
    
    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM leave_requests lr
      LEFT JOIN employees e ON lr.employee_id = e.id
      WHERE ${whereClause}
    `;
    const countResult = await db.get(countQuery, params);
    
    // 查询数据
    const dataQuery = `
      SELECT 
        lr.*,
        e.name as employee_name,
        e.employee_number,
        d.name as department_name
      FROM leave_requests lr
      LEFT JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${whereClause}
      ORDER BY lr.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const requests = await db.query(dataQuery, [...params, parseInt(limit), offset]);
    
    res.json({
      status: 'success',
      data: {
        items: requests,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取请假申请失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取请假申请失败'
    });
  }
});

// 获取单个请假申请详情
router.get('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await db.get(`
      SELECT 
        lr.*,
        e.name as employee_name,
        e.employee_number,
        e.phone as employee_phone,
        d.name as department_name,
        approver.real_name as approver_name
      FROM leave_requests lr
      LEFT JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN users approver ON lr.approved_by = approver.id
      WHERE lr.id = ?
    `, [id]);
    
    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: '请假申请不存在'
      });
    }
    
    res.json({
      status: 'success',
      data: request
    });
  } catch (error) {
    console.error('获取请假申请详情失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取请假申请详情失败'
    });
  }
});

// 创建请假申请
router.post('/requests', async (req, res) => {
  try {
    const { error, value } = leaveRequestSchema.validate(req.body);
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
      INSERT INTO leave_requests (${fields.join(', ')}, created_at, updated_at)
      VALUES (${placeholders}, datetime('now'), datetime('now'))
    `, values);
    
    res.status(201).json({
      status: 'success',
      message: '请假申请创建成功',
      data: { id: result.id }
    });
  } catch (error) {
    console.error('创建请假申请失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建请假申请失败'
    });
  }
});

// 更新请假申请
router.put('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = leaveRequestSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    
    // 检查申请是否存在且可以修改
    const existingRequest = await db.get(
      'SELECT id, status FROM leave_requests WHERE id = ?',
      [id]
    );
    
    if (!existingRequest) {
      return res.status(404).json({
        status: 'error',
        message: '请假申请不存在'
      });
    }
    
    if (existingRequest.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: '只能修改待审批的申请'
      });
    }
    
    const fields = Object.keys(value);
    const values = Object.values(value);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    await db.run(`
      UPDATE leave_requests 
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
    `, [...values, id]);
    
    res.json({
      status: 'success',
      message: '请假申请更新成功'
    });
  } catch (error) {
    console.error('更新请假申请失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新请假申请失败'
    });
  }
});

// 撤销请假申请
router.delete('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingRequest = await db.get(
      'SELECT id, status FROM leave_requests WHERE id = ?',
      [id]
    );
    
    if (!existingRequest) {
      return res.status(404).json({
        status: 'error',
        message: '请假申请不存在'
      });
    }
    
    if (existingRequest.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: '只能撤销待审批的申请'
      });
    }
    
    await db.run('DELETE FROM leave_requests WHERE id = ?', [id]);
    
    res.json({
      status: 'success',
      message: '请假申请撤销成功'
    });
  } catch (error) {
    console.error('撤销请假申请失败:', error);
    res.status(500).json({
      status: 'error',
      message: '撤销请假申请失败'
    });
  }
});

// 审批请假申请
router.put('/requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approval_notes } = req.body;
    
    await db.run(`
      UPDATE leave_requests 
      SET status = ?, approved_by = ?, approved_at = datetime('now'), 
          approval_notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [status, req.user.id, approval_notes, id]);
    
    res.json({
      status: 'success',
      message: status === 'approved' ? '请假申请已通过' : '请假申请已拒绝'
    });
  } catch (error) {
    console.error('审批请假申请失败:', error);
    res.status(500).json({
      status: 'error',
      message: '审批请假申请失败'
    });
  }
});

// ============= 调休管理 =============

// 获取调休记录列表
router.get('/compensatory', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, employee_id, department_id, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (search) {
      whereClause += ` AND (e.name LIKE ? OR e.employee_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (employee_id) {
      whereClause += ` AND cl.employee_id = ?`;
      params.push(employee_id);
    }
    
    if (department_id) {
      whereClause += ` AND e.department_id = ?`;
      params.push(department_id);
    }
    
    if (status) {
      whereClause += ` AND cl.status = ?`;
      params.push(status);
    }
    
    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM compensatory_leaves cl
      LEFT JOIN employees e ON cl.employee_id = e.id
      WHERE ${whereClause}
    `;
    const countResult = await db.get(countQuery, params);
    
    // 查询数据
    const dataQuery = `
      SELECT 
        cl.*,
        e.name as employee_name,
        e.employee_number,
        d.name as department_name
      FROM compensatory_leaves cl
      LEFT JOIN employees e ON cl.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${whereClause}
      ORDER BY cl.created_at DESC
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
    console.error('获取调休记录失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取调休记录失败'
    });
  }
});

// 创建调休记录
router.post('/compensatory', async (req, res) => {
  try {
    const { error, value } = compLeaveSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    
    // 检查员工是否存在
    const employee = await db.get('SELECT id FROM employees WHERE id = ?', [value.employee_id]);
    if (!employee) {
      return res.status(400).json({
        status: 'error',
        message: '员工不存在'
      });
    }
    
    // 检查是否已有该日期的调休记录
    const existingRecord = await db.get(
      'SELECT id FROM compensatory_leaves WHERE employee_id = ? AND overtime_date = ?',
      [value.employee_id, value.overtime_date]
    );
    
    if (existingRecord) {
      return res.status(400).json({
        status: 'error',
        message: '该日期已有调休记录'
      });
    }
    
    // 计算可调休时间（按8小时工作日计算）
    value.comp_leave_hours = Math.min(value.overtime_hours, 8); // 最多一天
    
    const fields = Object.keys(value);
    const values = Object.values(value);
    const placeholders = fields.map(() => '?').join(', ');
    
    const result = await db.run(`
      INSERT INTO compensatory_leaves (${fields.join(', ')}, created_at, updated_at)
      VALUES (${placeholders}, datetime('now'), datetime('now'))
    `, values);
    
    res.status(201).json({
      status: 'success',
      message: '调休记录创建成功',
      data: { id: result.id }
    });
  } catch (error) {
    console.error('创建调休记录失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建调休记录失败'
    });
  }
});

// 使用调休
router.put('/compensatory/:id/use', async (req, res) => {
  try {
    const { id } = req.params;
    const { comp_leave_date } = req.body;
    
    if (!comp_leave_date) {
      return res.status(400).json({
        status: 'error',
        message: '请提供调休日期'
      });
    }
    
    const record = await db.get(
      'SELECT * FROM compensatory_leaves WHERE id = ? AND status = "earned"',
      [id]
    );
    
    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: '调休记录不存在或已使用'
      });
    }
    
    await db.run(`
      UPDATE compensatory_leaves 
      SET status = 'used', comp_leave_date = ?, used_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `, [comp_leave_date, id]);
    
    res.json({
      status: 'success',
      message: '调休使用成功'
    });
  } catch (error) {
    console.error('使用调休失败:', error);
    res.status(500).json({
      status: 'error',
      message: '使用调休失败'
    });
  }
});

// ============= 统计分析 =============

// 获取请假统计
router.get('/stats', async (req, res) => {
  try {
    const { date_start, date_end, department_id } = req.query;
    
    let whereClause = '1=1';
    let params = [];
    
    if (date_start) {
      whereClause += ` AND lr.start_date >= ?`;
      params.push(date_start);
    }
    
    if (date_end) {
      whereClause += ` AND lr.end_date <= ?`;
      params.push(date_end);
    }
    
    if (department_id) {
      whereClause += ` AND e.department_id = ?`;
      params.push(department_id);
    }
    
    // 请假统计
    const leaveStats = await db.get(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN lr.status = 'pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN lr.status = 'approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN lr.status = 'rejected' THEN 1 END) as rejected_requests,
        SUM(CASE WHEN lr.status = 'approved' THEN lr.days_count ELSE 0 END) as total_leave_days
      FROM leave_requests lr
      LEFT JOIN employees e ON lr.employee_id = e.id
      WHERE ${whereClause}
    `, params);
    
    // 按请假类型统计
    const leaveTypeStats = await db.query(`
      SELECT 
        lr.leave_type,
        COUNT(*) as request_count,
        SUM(CASE WHEN lr.status = 'approved' THEN lr.days_count ELSE 0 END) as approved_days
      FROM leave_requests lr
      LEFT JOIN employees e ON lr.employee_id = e.id
      WHERE ${whereClause}
      GROUP BY lr.leave_type
      ORDER BY request_count DESC
    `, params);
    
    // 调休统计
    const compStats = await db.get(`
      SELECT 
        COUNT(*) as total_comp_records,
        COUNT(CASE WHEN status = 'earned' THEN 1 END) as available_comp,
        COUNT(CASE WHEN status = 'used' THEN 1 END) as used_comp,
        SUM(CASE WHEN status = 'earned' THEN comp_leave_hours ELSE 0 END) as available_hours,
        SUM(CASE WHEN status = 'used' THEN comp_leave_hours ELSE 0 END) as used_hours
      FROM compensatory_leaves cl
      LEFT JOIN employees e ON cl.employee_id = e.id
      WHERE ${whereClause.replace('lr.', 'cl.')}
    `, params);
    
    res.json({
      status: 'success',
      data: {
        leave_overview: leaveStats,
        leave_type_distribution: leaveTypeStats,
        compensatory_overview: compStats
      }
    });
  } catch (error) {
    console.error('获取请假统计失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取请假统计失败'
    });
  }
});

// 获取员工请假余额
router.get('/balance/:employee_id', async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { year = new Date().getFullYear() } = req.query;
    
    // 查询该员工本年度的请假记录
    const leaveRecords = await db.query(`
      SELECT leave_type, SUM(days_count) as used_days
      FROM leave_requests 
      WHERE employee_id = ? AND status = 'approved' 
        AND strftime('%Y', start_date) = ?
      GROUP BY leave_type
    `, [employee_id, year.toString()]);
    
    // 查询调休余额
    const compBalance = await db.get(`
      SELECT 
        SUM(CASE WHEN status = 'earned' THEN comp_leave_hours ELSE 0 END) -
        SUM(CASE WHEN status = 'used' THEN comp_leave_hours ELSE 0 END) as balance_hours
      FROM compensatory_leaves
      WHERE employee_id = ?
    `, [employee_id]);
    
    // 设置各类假期的年度限额（可配置）
    const leaveQuotas = {
      annual: 10,      // 年假
      sick: 15,        // 病假
      personal: 5,     // 事假
      maternity: 90,   // 产假
      paternity: 15,   // 陪产假
      compassionate: 3, // 丧假
      other: 0         // 其他
    };
    
    // 计算余额
    const balances = {};
    for (const [type, quota] of Object.entries(leaveQuotas)) {
      const used = leaveRecords.find(r => r.leave_type === type)?.used_days || 0;
      balances[type] = {
        quota: quota,
        used: used,
        remaining: quota - used
      };
    }
    
    res.json({
      status: 'success',
      data: {
        year: parseInt(year),
        leave_balances: balances,
        compensatory_balance: compBalance?.balance_hours || 0
      }
    });
  } catch (error) {
    console.error('获取请假余额失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取请假余额失败'
    });
  }
});

module.exports = router; 