const express = require('express');
const router = express.Router();
const db = require('../config/database');
const Joi = require('joi');

// 职位验证规则
const jobPositionSchema = Joi.object({
  title: Joi.string().max(100).required(),
  department_id: Joi.number().integer().optional(),
  description: Joi.string().optional(),
  requirements: Joi.string().optional(),
  salary_min: Joi.number().precision(2).min(0).optional(),
  salary_max: Joi.number().precision(2).min(0).optional(),
  positions_count: Joi.number().integer().min(1).default(1),
  status: Joi.string().valid('open', 'closed', 'paused').default('open'),
  publish_date: Joi.date().optional(),
  deadline: Joi.date().optional()
}).custom((value, helpers) => {
  // 验证薪资范围
  if (value.salary_min && value.salary_max && value.salary_min > value.salary_max) {
    return helpers.error('custom.salaryRange');
  }
  return value;
}).messages({
  'custom.salaryRange': '最低薪资不能大于最高薪资'
});

// 应聘者验证规则
const applicationSchema = Joi.object({
  position_id: Joi.number().integer().required(),
  name: Joi.string().max(50).required(),
  gender: Joi.string().valid('男', '女').optional(),
  birth_date: Joi.date().optional(),
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional().messages({
    'string.pattern.base': '手机号格式不正确'
  }),
  email: Joi.string().email().max(100).optional(),
  education: Joi.string().max(20).optional(),
  work_experience: Joi.string().optional(),
  resume_file: Joi.string().max(255).optional()
});

// ============= 职位管理 =============

// 获取招聘职位列表
router.get('/positions', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, department_id, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (search) {
      whereClause += ` AND jp.title LIKE ?`;
      params.push(`%${search}%`);
    }
    
    if (department_id) {
      whereClause += ` AND jp.department_id = ?`;
      params.push(department_id);
    }
    
    if (status) {
      whereClause += ` AND jp.status = ?`;
      params.push(status);
    }
    
    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM job_positions jp 
      WHERE ${whereClause}
    `;
    const countResult = await db.get(countQuery, params);
    
    // 查询数据
    const dataQuery = `
      SELECT 
        jp.*,
        d.name as department_name,
        u.real_name as creator_name,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.position_id = jp.id) as application_count
      FROM job_positions jp
      LEFT JOIN departments d ON jp.department_id = d.id
      LEFT JOIN users u ON jp.created_by = u.id
      WHERE ${whereClause}
      ORDER BY jp.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const positions = await db.query(dataQuery, [...params, parseInt(limit), offset]);
    
    res.json({
      status: 'success',
      data: {
        items: positions,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取招聘职位失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取招聘职位失败'
    });
  }
});

// 获取单个职位详情
router.get('/positions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const position = await db.get(`
      SELECT 
        jp.*,
        d.name as department_name,
        u.real_name as creator_name
      FROM job_positions jp
      LEFT JOIN departments d ON jp.department_id = d.id
      LEFT JOIN users u ON jp.created_by = u.id
      WHERE jp.id = ?
    `, [id]);
    
    if (!position) {
      return res.status(404).json({
        status: 'error',
        message: '职位不存在'
      });
    }
    
    res.json({
      status: 'success',
      data: position
    });
  } catch (error) {
    console.error('获取职位详情失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取职位详情失败'
    });
  }
});

// 创建招聘职位
router.post('/positions', async (req, res) => {
  try {
    const { error, value } = jobPositionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    
    value.created_by = req.user.id;
    
    const fields = Object.keys(value);
    const values = Object.values(value);
    const placeholders = fields.map(() => '?').join(', ');
    
    const result = await db.run(`
      INSERT INTO job_positions (${fields.join(', ')}, created_at, updated_at)
      VALUES (${placeholders}, datetime('now'), datetime('now'))
    `, values);
    
    res.status(201).json({
      status: 'success',
      message: '职位创建成功',
      data: { id: result.id }
    });
  } catch (error) {
    console.error('创建职位失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建职位失败'
    });
  }
});

// 更新招聘职位
router.put('/positions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = jobPositionSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    
    // 检查职位是否存在
    const existingPosition = await db.get('SELECT id FROM job_positions WHERE id = ?', [id]);
    if (!existingPosition) {
      return res.status(404).json({
        status: 'error',
        message: '职位不存在'
      });
    }
    
    const fields = Object.keys(value);
    const values = Object.values(value);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    await db.run(`
      UPDATE job_positions 
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
    `, [...values, id]);
    
    res.json({
      status: 'success',
      message: '职位更新成功'
    });
  } catch (error) {
    console.error('更新职位失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新职位失败'
    });
  }
});

// 删除招聘职位
router.delete('/positions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查是否有应聘者
    const applicationCount = await db.get(
      'SELECT COUNT(*) as count FROM job_applications WHERE position_id = ?',
      [id]
    );
    
    if (applicationCount.count > 0) {
      return res.status(400).json({
        status: 'error',
        message: '该职位已有应聘者，无法删除'
      });
    }
    
    const result = await db.run('DELETE FROM job_positions WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        status: 'error',
        message: '职位不存在'
      });
    }
    
    res.json({
      status: 'success',
      message: '职位删除成功'
    });
  } catch (error) {
    console.error('删除职位失败:', error);
    res.status(500).json({
      status: 'error',
      message: '删除职位失败'
    });
  }
});

// ============= 应聘管理 =============

// 获取应聘者列表
router.get('/applications', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, position_id, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (search) {
      whereClause += ` AND (ja.name LIKE ? OR ja.phone LIKE ? OR ja.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (position_id) {
      whereClause += ` AND ja.position_id = ?`;
      params.push(position_id);
    }
    
    if (status) {
      whereClause += ` AND ja.status = ?`;
      params.push(status);
    }
    
    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM job_applications ja 
      WHERE ${whereClause}
    `;
    const countResult = await db.get(countQuery, params);
    
    // 查询数据
    const dataQuery = `
      SELECT 
        ja.*,
        jp.title as position_title,
        d.name as department_name
      FROM job_applications ja
      LEFT JOIN job_positions jp ON ja.position_id = jp.id
      LEFT JOIN departments d ON jp.department_id = d.id
      WHERE ${whereClause}
      ORDER BY ja.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const applications = await db.query(dataQuery, [...params, parseInt(limit), offset]);
    
    res.json({
      status: 'success',
      data: {
        items: applications,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取应聘者列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取应聘者列表失败'
    });
  }
});

// 获取单个应聘者详情
router.get('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const application = await db.get(`
      SELECT 
        ja.*,
        jp.title as position_title,
        jp.description as position_description,
        jp.requirements as position_requirements,
        d.name as department_name
      FROM job_applications ja
      LEFT JOIN job_positions jp ON ja.position_id = jp.id
      LEFT JOIN departments d ON jp.department_id = d.id
      WHERE ja.id = ?
    `, [id]);
    
    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: '应聘者不存在'
      });
    }
    
    res.json({
      status: 'success',
      data: application
    });
  } catch (error) {
    console.error('获取应聘者详情失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取应聘者详情失败'
    });
  }
});

// 创建应聘记录
router.post('/applications', async (req, res) => {
  try {
    const { error, value } = applicationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    
    // 检查职位是否存在且开放
    const position = await db.get(
      'SELECT id, status FROM job_positions WHERE id = ?',
      [value.position_id]
    );
    
    if (!position) {
      return res.status(400).json({
        status: 'error',
        message: '职位不存在'
      });
    }
    
    if (position.status !== 'open') {
      return res.status(400).json({
        status: 'error',
        message: '职位未开放招聘'
      });
    }
    
    const fields = Object.keys(value);
    const values = Object.values(value);
    const placeholders = fields.map(() => '?').join(', ');
    
    const result = await db.run(`
      INSERT INTO job_applications (${fields.join(', ')}, created_at, updated_at)
      VALUES (${placeholders}, datetime('now'), datetime('now'))
    `, values);
    
    res.status(201).json({
      status: 'success',
      message: '应聘记录创建成功',
      data: { id: result.id }
    });
  } catch (error) {
    console.error('创建应聘记录失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建应聘记录失败'
    });
  }
});

// 更新应聘状态
router.put('/applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, interview_date, interview_notes, result } = req.body;
    
    if (!['pending', 'scheduled', 'interviewed', 'hired', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: '无效的状态值'
      });
    }
    
    const updateFields = ['status = ?', 'updated_at = datetime("now")'];
    const updateValues = [status];
    
    if (interview_date) {
      updateFields.push('interview_date = ?');
      updateValues.push(interview_date);
    }
    
    if (interview_notes) {
      updateFields.push('interview_notes = ?');
      updateValues.push(interview_notes);
    }
    
    if (result) {
      updateFields.push('result = ?');
      updateValues.push(result);
    }
    
    const result_db = await db.run(`
      UPDATE job_applications 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, [...updateValues, id]);
    
    if (result_db.changes === 0) {
      return res.status(404).json({
        status: 'error',
        message: '应聘记录不存在'
      });
    }
    
    res.json({
      status: 'success',
      message: '状态更新成功'
    });
  } catch (error) {
    console.error('更新应聘状态失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新应聘状态失败'
    });
  }
});

// 获取招聘统计信息
router.get('/stats', async (req, res) => {
  try {
    // 职位统计
    const positionStats = await db.get(`
      SELECT 
        COUNT(*) as total_positions,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_positions,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_positions,
        COUNT(CASE WHEN status = 'paused' THEN 1 END) as paused_positions
      FROM job_positions
    `);
    
    // 应聘统计
    const applicationStats = await db.get(`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_applications,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_applications,
        COUNT(CASE WHEN status = 'interviewed' THEN 1 END) as interviewed_applications,
        COUNT(CASE WHEN status = 'hired' THEN 1 END) as hired_applications,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_applications
      FROM job_applications
    `);
    
    // 按部门统计招聘情况
    const departmentStats = await db.query(`
      SELECT 
        d.name as department_name,
        COUNT(jp.id) as position_count,
        COUNT(ja.id) as application_count
      FROM departments d
      LEFT JOIN job_positions jp ON d.id = jp.department_id
      LEFT JOIN job_applications ja ON jp.id = ja.position_id
      GROUP BY d.id, d.name
      HAVING position_count > 0
      ORDER BY position_count DESC
    `);
    
    res.json({
      status: 'success',
      data: {
        positions: positionStats,
        applications: applicationStats,
        department_distribution: departmentStats
      }
    });
  } catch (error) {
    console.error('获取招聘统计失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取招聘统计失败'
    });
  }
});

module.exports = router; 