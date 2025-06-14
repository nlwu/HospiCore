const express = require('express');
const router = express.Router();
const db = require('../config/database');
const Joi = require('joi');

// 考勤记录验证规则
const attendanceSchema = Joi.object({
  employee_id: Joi.number().integer().required(),
  date: Joi.date().required(),
  check_in_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  check_out_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  work_hours: Joi.number().precision(2).min(0).max(24).optional(),
  overtime_hours: Joi.number().precision(2).min(0).max(24).optional(),
  status: Joi.string().valid('normal', 'late', 'early_leave', 'absent', 'sick_leave', 'annual_leave').default('normal'),
  notes: Joi.string().optional()
});

// 排班验证规则
const scheduleSchema = Joi.object({
  employee_id: Joi.number().integer().required(),
  date: Joi.date().required(),
  shift_type: Joi.string().valid('day', 'night', 'morning', 'afternoon', 'off').required(),
  start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
});

// ============= 考勤记录管理 =============

// 获取考勤记录列表
router.get('/records', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, employee_id, department_id, date_start, date_end, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (search) {
      whereClause += ` AND (e.name LIKE ? OR e.employee_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (employee_id) {
      whereClause += ` AND ar.employee_id = ?`;
      params.push(employee_id);
    }
    
    if (department_id) {
      whereClause += ` AND e.department_id = ?`;
      params.push(department_id);
    }
    
    if (date_start) {
      whereClause += ` AND ar.date >= ?`;
      params.push(date_start);
    }
    
    if (date_end) {
      whereClause += ` AND ar.date <= ?`;
      params.push(date_end);
    }
    
    if (status) {
      whereClause += ` AND ar.status = ?`;
      params.push(status);
    }
    
    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM attendance_records ar
      LEFT JOIN employees e ON ar.employee_id = e.id
      WHERE ${whereClause}
    `;
    const countResult = await db.get(countQuery, params);
    
    // 查询数据
    const dataQuery = `
      SELECT 
        ar.*,
        e.name as employee_name,
        e.employee_number,
        d.name as department_name
      FROM attendance_records ar
      LEFT JOIN employees e ON ar.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${whereClause}
      ORDER BY ar.date DESC, ar.check_in_time DESC
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
    console.error('获取考勤记录失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取考勤记录失败'
    });
  }
});

// 获取单个考勤记录
router.get('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const record = await db.get(`
      SELECT 
        ar.*,
        e.name as employee_name,
        e.employee_number,
        d.name as department_name
      FROM attendance_records ar
      LEFT JOIN employees e ON ar.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ar.id = ?
    `, [id]);
    
    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: '考勤记录不存在'
      });
    }
    
    res.json({
      status: 'success',
      data: record
    });
  } catch (error) {
    console.error('获取考勤记录失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取考勤记录失败'
    });
  }
});

// 创建或更新考勤记录
router.post('/records', async (req, res) => {
  try {
    const { error, value } = attendanceSchema.validate(req.body);
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
    
    // 计算工作时间
    if (value.check_in_time && value.check_out_time && !value.work_hours) {
      const checkIn = new Date(`2000-01-01T${value.check_in_time}:00`);
      const checkOut = new Date(`2000-01-01T${value.check_out_time}:00`);
      const diffMs = checkOut.getTime() - checkIn.getTime();
      value.work_hours = Math.max(0, diffMs / (1000 * 60 * 60)); // 转换为小时
    }
    
    // 检查当天是否已有记录
    const existingRecord = await db.get(
      'SELECT id FROM attendance_records WHERE employee_id = ? AND date = ?',
      [value.employee_id, value.date]
    );
    
    if (existingRecord) {
      // 更新现有记录
      const fields = Object.keys(value);
      const values = Object.values(value);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      await db.run(`
        UPDATE attendance_records 
        SET ${setClause}, updated_at = datetime('now')
        WHERE id = ?
      `, [...values, existingRecord.id]);
      
      res.json({
        status: 'success',
        message: '考勤记录更新成功',
        data: { id: existingRecord.id }
      });
    } else {
      // 创建新记录
      const fields = Object.keys(value);
      const values = Object.values(value);
      const placeholders = fields.map(() => '?').join(', ');
      
      const result = await db.run(`
        INSERT INTO attendance_records (${fields.join(', ')}, created_at, updated_at)
        VALUES (${placeholders}, datetime('now'), datetime('now'))
      `, values);
      
      res.status(201).json({
        status: 'success',
        message: '考勤记录创建成功',
        data: { id: result.id }
      });
    }
  } catch (error) {
    console.error('处理考勤记录失败:', error);
    res.status(500).json({
      status: 'error',
      message: '处理考勤记录失败'
    });
  }
});

// 打卡
router.post('/punch', async (req, res) => {
  try {
    const { employee_id, type } = req.body; // type: 'in' | 'out'
    
    if (!employee_id || !['in', 'out'].includes(type)) {
      return res.status(400).json({
        status: 'error',
        message: '参数错误'
      });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);
    
    // 检查今日是否已有记录
    let record = await db.get(
      'SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?',
      [employee_id, today]
    );
    
    if (type === 'in') {
      if (record && record.check_in_time) {
        return res.status(400).json({
          status: 'error',
          message: '今日已打卡上班'
        });
      }
      
      if (record) {
        // 更新签到时间
        await db.run(
          'UPDATE attendance_records SET check_in_time = ?, updated_at = datetime("now") WHERE id = ?',
          [currentTime, record.id]
        );
      } else {
        // 创建新记录
        const result = await db.run(`
          INSERT INTO attendance_records (employee_id, date, check_in_time, created_at, updated_at)
          VALUES (?, ?, ?, datetime('now'), datetime('now'))
        `, [employee_id, today, currentTime]);
        record = { id: result.id };
      }
      
      res.json({
        status: 'success',
        message: '上班打卡成功',
        data: { time: currentTime }
      });
    } else {
      if (!record || !record.check_in_time) {
        return res.status(400).json({
          status: 'error',
          message: '请先打卡上班'
        });
      }
      
      if (record.check_out_time) {
        return res.status(400).json({
          status: 'error',
          message: '今日已打卡下班'
        });
      }
      
      // 计算工作时间
      const checkIn = new Date(`2000-01-01T${record.check_in_time}:00`);
      const checkOut = new Date(`2000-01-01T${currentTime}:00`);
      const workHours = Math.max(0, (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60));
      
      await db.run(`
        UPDATE attendance_records 
        SET check_out_time = ?, work_hours = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [currentTime, workHours, record.id]);
      
      res.json({
        status: 'success',
        message: '下班打卡成功',
        data: { time: currentTime, work_hours: workHours }
      });
    }
  } catch (error) {
    console.error('打卡失败:', error);
    res.status(500).json({
      status: 'error',
      message: '打卡失败'
    });
  }
});

// ============= 排班管理 =============

// 获取排班列表
router.get('/schedules', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, employee_id, department_id, date_start, date_end, shift_type } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (search) {
      whereClause += ` AND (e.name LIKE ? OR e.employee_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (employee_id) {
      whereClause += ` AND ws.employee_id = ?`;
      params.push(employee_id);
    }
    
    if (department_id) {
      whereClause += ` AND e.department_id = ?`;
      params.push(department_id);
    }
    
    if (date_start) {
      whereClause += ` AND ws.date >= ?`;
      params.push(date_start);
    }
    
    if (date_end) {
      whereClause += ` AND ws.date <= ?`;
      params.push(date_end);
    }
    
    if (shift_type) {
      whereClause += ` AND ws.shift_type = ?`;
      params.push(shift_type);
    }
    
    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM work_schedules ws
      LEFT JOIN employees e ON ws.employee_id = e.id
      WHERE ${whereClause}
    `;
    const countResult = await db.get(countQuery, params);
    
    // 查询数据
    const dataQuery = `
      SELECT 
        ws.*,
        e.name as employee_name,
        e.employee_number,
        d.name as department_name,
        u.real_name as creator_name
      FROM work_schedules ws
      LEFT JOIN employees e ON ws.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN users u ON ws.created_by = u.id
      WHERE ${whereClause}
      ORDER BY ws.date DESC
      LIMIT ? OFFSET ?
    `;
    
    const schedules = await db.query(dataQuery, [...params, parseInt(limit), offset]);
    
    res.json({
      status: 'success',
      data: {
        items: schedules,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取排班列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取排班列表失败'
    });
  }
});

// 创建排班
router.post('/schedules', async (req, res) => {
  try {
    const { error, value } = scheduleSchema.validate(req.body);
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
    
    // 检查当天是否已有排班
    const existingSchedule = await db.get(
      'SELECT id FROM work_schedules WHERE employee_id = ? AND date = ?',
      [value.employee_id, value.date]
    );
    
    if (existingSchedule) {
      return res.status(400).json({
        status: 'error',
        message: '该员工当天已有排班'
      });
    }
    
    value.created_by = req.user.id;
    
    const fields = Object.keys(value);
    const values = Object.values(value);
    const placeholders = fields.map(() => '?').join(', ');
    
    const result = await db.run(`
      INSERT INTO work_schedules (${fields.join(', ')}, created_at, updated_at)
      VALUES (${placeholders}, datetime('now'), datetime('now'))
    `, values);
    
    res.status(201).json({
      status: 'success',
      message: '排班创建成功',
      data: { id: result.id }
    });
  } catch (error) {
    console.error('创建排班失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建排班失败'
    });
  }
});

// 批量创建排班
router.post('/schedules/batch', async (req, res) => {
  try {
    const { schedules } = req.body;
    
    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '请提供排班数据'
      });
    }
    
    const operations = [];
    const created_by = req.user.id;
    
    for (const schedule of schedules) {
      const { error, value } = scheduleSchema.validate(schedule);
      if (error) {
        return res.status(400).json({
          status: 'error',
          message: `第${schedules.indexOf(schedule) + 1}条数据：${error.details[0].message}`
        });
      }
      
      value.created_by = created_by;
      
      const fields = Object.keys(value);
      const values = Object.values(value);
      const placeholders = fields.map(() => '?').join(', ');
      
      operations.push({
        sql: `INSERT OR REPLACE INTO work_schedules (${fields.join(', ')}, created_at, updated_at) VALUES (${placeholders}, datetime('now'), datetime('now'))`,
        params: values
      });
    }
    
    await db.batch(operations);
    
    res.json({
      status: 'success',
      message: `成功创建${schedules.length}条排班记录`
    });
  } catch (error) {
    console.error('批量创建排班失败:', error);
    res.status(500).json({
      status: 'error',
      message: '批量创建排班失败'
    });
  }
});

// 更新排班
router.put('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = scheduleSchema.validate(req.body);
    
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
      UPDATE work_schedules 
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
    `, [...values, id]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        status: 'error',
        message: '排班记录不存在'
      });
    }
    
    res.json({
      status: 'success',
      message: '排班更新成功'
    });
  } catch (error) {
    console.error('更新排班失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新排班失败'
    });
  }
});

// 删除排班
router.delete('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.run('DELETE FROM work_schedules WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        status: 'error',
        message: '排班记录不存在'
      });
    }
    
    res.json({
      status: 'success',
      message: '排班删除成功'
    });
  } catch (error) {
    console.error('删除排班失败:', error);
    res.status(500).json({
      status: 'error',
      message: '删除排班失败'
    });
  }
});

// ============= 统计分析 =============

// 获取考勤统计
router.get('/stats', async (req, res) => {
  try {
    const { date_start, date_end, department_id } = req.query;
    
    let whereClause = '1=1';
    let params = [];
    
    if (date_start) {
      whereClause += ` AND ar.date >= ?`;
      params.push(date_start);
    }
    
    if (date_end) {
      whereClause += ` AND ar.date <= ?`;
      params.push(date_end);
    }
    
    if (department_id) {
      whereClause += ` AND e.department_id = ?`;
      params.push(department_id);
    }
    
    // 整体统计
    const overallStats = await db.get(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN ar.status = 'normal' THEN 1 END) as normal_count,
        COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN ar.status = 'early_leave' THEN 1 END) as early_leave_count,
        COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_count,
        AVG(ar.work_hours) as avg_work_hours,
        SUM(ar.overtime_hours) as total_overtime_hours
      FROM attendance_records ar
      LEFT JOIN employees e ON ar.employee_id = e.id
      WHERE ${whereClause}
    `, params);
    
    // 按部门统计
    const departmentStats = await db.query(`
      SELECT 
        d.name as department_name,
        COUNT(ar.id) as record_count,
        AVG(ar.work_hours) as avg_work_hours,
        SUM(ar.overtime_hours) as total_overtime_hours,
        COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id
      LEFT JOIN attendance_records ar ON e.id = ar.employee_id
      WHERE ar.id IS NOT NULL ${date_start ? 'AND ar.date >= ?' : ''} ${date_end ? 'AND ar.date <= ?' : ''}
      GROUP BY d.id, d.name
      ORDER BY record_count DESC
    `, params.slice(date_start ? 1 : 0, date_end ? 2 : 1));
    
    res.json({
      status: 'success',
      data: {
        overall: overallStats,
        department_distribution: departmentStats
      }
    });
  } catch (error) {
    console.error('获取考勤统计失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取考勤统计失败'
    });
  }
});

// 获取员工考勤月报
router.get('/monthly-report/:employee_id', async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({
        status: 'error',
        message: '请提供年份和月份'
      });
    }
    
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
    
    // 获取该月考勤记录
    const records = await db.query(`
      SELECT * FROM attendance_records 
      WHERE employee_id = ? AND date >= ? AND date <= ?
      ORDER BY date
    `, [employee_id, startDate, endDate]);
    
    // 获取该月排班记录
    const schedules = await db.query(`
      SELECT * FROM work_schedules 
      WHERE employee_id = ? AND date >= ? AND date <= ?
      ORDER BY date
    `, [employee_id, startDate, endDate]);
    
    // 统计数据
    const totalDays = records.length;
    const normalDays = records.filter(r => r.status === 'normal').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    const absences = records.filter(r => r.status === 'absent').length;
    const totalWorkHours = records.reduce((sum, r) => sum + (r.work_hours || 0), 0);
    const totalOvertimeHours = records.reduce((sum, r) => sum + (r.overtime_hours || 0), 0);
    
    res.json({
      status: 'success',
      data: {
        summary: {
          total_days: totalDays,
          normal_days: normalDays,
          late_days: lateDays,
          absences: absences,
          total_work_hours: totalWorkHours,
          total_overtime_hours: totalOvertimeHours
        },
        records: records,
        schedules: schedules
      }
    });
  } catch (error) {
    console.error('获取月报失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取月报失败'
    });
  }
});

module.exports = router; 