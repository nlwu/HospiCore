const express = require('express');
const router = express.Router();
const db = require('../config/database');
const Joi = require('joi');

// 绩效考核验证规则
const performanceSchema = Joi.object({
  employee_id: Joi.number().integer().required(),
  evaluation_period: Joi.string().valid('monthly', 'quarterly', 'yearly').required(),
  year: Joi.number().integer().min(2020).max(2030).required(),
  quarter: Joi.number().integer().min(1).max(4).optional(),
  month: Joi.number().integer().min(1).max(12).optional(),
  work_quality_score: Joi.number().integer().min(0).max(100).required(),
  work_efficiency_score: Joi.number().integer().min(0).max(100).required(),
  teamwork_score: Joi.number().integer().min(0).max(100).required(),
  innovation_score: Joi.number().integer().min(0).max(100).required(),
  comments: Joi.string().optional()
});

// 获取绩效考核列表
router.get('/evaluations', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, employee_id, department_id, evaluation_period, year, quarter, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (search) {
      whereClause += ` AND (e.name LIKE ? OR e.employee_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (employee_id) {
      whereClause += ` AND pe.employee_id = ?`;
      params.push(employee_id);
    }
    
    if (department_id) {
      whereClause += ` AND e.department_id = ?`;
      params.push(department_id);
    }
    
    if (evaluation_period) {
      whereClause += ` AND pe.evaluation_period = ?`;
      params.push(evaluation_period);
    }
    
    if (year) {
      whereClause += ` AND pe.year = ?`;
      params.push(year);
    }
    
    if (quarter) {
      whereClause += ` AND pe.quarter = ?`;
      params.push(quarter);
    }
    
    if (status) {
      whereClause += ` AND pe.status = ?`;
      params.push(status);
    }
    
    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM performance_evaluations pe
      LEFT JOIN employees e ON pe.employee_id = e.id
      WHERE ${whereClause}
    `;
    const countResult = await db.get(countQuery, params);
    
    // 查询数据
    const dataQuery = `
      SELECT 
        pe.*,
        e.name as employee_name,
        e.employee_number,
        e.position,
        d.name as department_name,
        evaluator.real_name as evaluator_name
      FROM performance_evaluations pe
      LEFT JOIN employees e ON pe.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN users evaluator ON pe.evaluator_id = evaluator.id
      WHERE ${whereClause}
      ORDER BY pe.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const evaluations = await db.query(dataQuery, [...params, parseInt(limit), offset]);
    
    res.json({
      status: 'success',
      data: {
        items: evaluations,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取绩效考核列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取绩效考核列表失败'
    });
  }
});

// 获取单个绩效考核详情
router.get('/evaluations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const evaluation = await db.get(`
      SELECT 
        pe.*,
        e.name as employee_name,
        e.employee_number,
        e.position,
        e.hire_date,
        d.name as department_name,
        evaluator.real_name as evaluator_name
      FROM performance_evaluations pe
      LEFT JOIN employees e ON pe.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN users evaluator ON pe.evaluator_id = evaluator.id
      WHERE pe.id = ?
    `, [id]);
    
    if (!evaluation) {
      return res.status(404).json({
        status: 'error',
        message: '绩效考核不存在'
      });
    }
    
    res.json({
      status: 'success',
      data: evaluation
    });
  } catch (error) {
    console.error('获取绩效考核详情失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取绩效考核详情失败'
    });
  }
});

// 创建绩效考核
router.post('/evaluations', async (req, res) => {
  try {
    const { error, value } = performanceSchema.validate(req.body);
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
    
    // 检查是否已有相同周期的考核记录
    let duplicateQuery = 'SELECT id FROM performance_evaluations WHERE employee_id = ? AND evaluation_period = ? AND year = ?';
    let duplicateParams = [value.employee_id, value.evaluation_period, value.year];
    
    if (value.evaluation_period === 'quarterly' && value.quarter) {
      duplicateQuery += ' AND quarter = ?';
      duplicateParams.push(value.quarter);
    } else if (value.evaluation_period === 'monthly' && value.month) {
      duplicateQuery += ' AND month = ?';
      duplicateParams.push(value.month);
    }
    
    const existing = await db.get(duplicateQuery, duplicateParams);
    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: '该员工在此考核周期已有考核记录'
      });
    }
    
    // 计算总分和等级
    const totalScore = value.work_quality_score + value.work_efficiency_score + 
                      value.teamwork_score + value.innovation_score;
    value.total_score = totalScore;
    
    // 根据总分计算等级
    if (totalScore >= 360) {
      value.rating = 'A';
    } else if (totalScore >= 320) {
      value.rating = 'B';
    } else if (totalScore >= 280) {
      value.rating = 'C';
    } else if (totalScore >= 240) {
      value.rating = 'D';
    } else {
      value.rating = 'E';
    }
    
    value.evaluator_id = req.user.id;
    
    const fields = Object.keys(value);
    const values = Object.values(value);
    const placeholders = fields.map(() => '?').join(', ');
    
    const result = await db.run(`
      INSERT INTO performance_evaluations (${fields.join(', ')}, created_at, updated_at)
      VALUES (${placeholders}, datetime('now'), datetime('now'))
    `, values);
    
    res.status(201).json({
      status: 'success',
      message: '绩效考核创建成功',
      data: { id: result.id, total_score: totalScore, rating: value.rating }
    });
  } catch (error) {
    console.error('创建绩效考核失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建绩效考核失败'
    });
  }
});

// 更新绩效考核
router.put('/evaluations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = performanceSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    
    // 检查考核记录是否存在
    const existingEvaluation = await db.get('SELECT id, status FROM performance_evaluations WHERE id = ?', [id]);
    if (!existingEvaluation) {
      return res.status(404).json({
        status: 'error',
        message: '绩效考核不存在'
      });
    }
    
    // 重新计算总分和等级
    const totalScore = value.work_quality_score + value.work_efficiency_score + 
                      value.teamwork_score + value.innovation_score;
    value.total_score = totalScore;
    
    if (totalScore >= 360) {
      value.rating = 'A';
    } else if (totalScore >= 320) {
      value.rating = 'B';
    } else if (totalScore >= 280) {
      value.rating = 'C';
    } else if (totalScore >= 240) {
      value.rating = 'D';
    } else {
      value.rating = 'E';
    }
    
    const fields = Object.keys(value);
    const values = Object.values(value);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    await db.run(`
      UPDATE performance_evaluations 
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
    `, [...values, id]);
    
    res.json({
      status: 'success',
      message: '绩效考核更新成功'
    });
  } catch (error) {
    console.error('更新绩效考核失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新绩效考核失败'
    });
  }
});

// 提交绩效考核
router.put('/evaluations/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.run(`
      UPDATE performance_evaluations 
      SET status = 'submitted', updated_at = datetime('now')
      WHERE id = ? AND status = 'draft'
    `, [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        status: 'error',
        message: '绩效考核不存在或已提交'
      });
    }
    
    res.json({
      status: 'success',
      message: '绩效考核提交成功'
    });
  } catch (error) {
    console.error('提交绩效考核失败:', error);
    res.status(500).json({
      status: 'error',
      message: '提交绩效考核失败'
    });
  }
});

// 删除绩效考核
router.delete('/evaluations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 只能删除草稿状态的考核
    const result = await db.run(
      'DELETE FROM performance_evaluations WHERE id = ? AND status = "draft"',
      [id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({
        status: 'error',
        message: '绩效考核不存在或无法删除'
      });
    }
    
    res.json({
      status: 'success',
      message: '绩效考核删除成功'
    });
  } catch (error) {
    console.error('删除绩效考核失败:', error);
    res.status(500).json({
      status: 'error',
      message: '删除绩效考核失败'
    });
  }
});

// 获取绩效统计
router.get('/stats', async (req, res) => {
  try {
    const { year, quarter, department_id } = req.query;
    
    let whereClause = '1=1';
    let params = [];
    
    if (year) {
      whereClause += ` AND pe.year = ?`;
      params.push(year);
    }
    
    if (quarter) {
      whereClause += ` AND pe.quarter = ?`;
      params.push(quarter);
    }
    
    if (department_id) {
      whereClause += ` AND e.department_id = ?`;
      params.push(department_id);
    }
    
    // 整体统计
    const overallStats = await db.get(`
      SELECT 
        COUNT(*) as total_evaluations,
        COUNT(CASE WHEN pe.status = 'draft' THEN 1 END) as draft_count,
        COUNT(CASE WHEN pe.status = 'submitted' THEN 1 END) as submitted_count,
        AVG(pe.total_score) as avg_score,
        COUNT(CASE WHEN pe.rating = 'A' THEN 1 END) as rating_a_count,
        COUNT(CASE WHEN pe.rating = 'B' THEN 1 END) as rating_b_count,
        COUNT(CASE WHEN pe.rating = 'C' THEN 1 END) as rating_c_count,
        COUNT(CASE WHEN pe.rating = 'D' THEN 1 END) as rating_d_count,
        COUNT(CASE WHEN pe.rating = 'E' THEN 1 END) as rating_e_count
      FROM performance_evaluations pe
      LEFT JOIN employees e ON pe.employee_id = e.id
      WHERE ${whereClause}
    `, params);
    
    // 按部门统计
    const departmentStats = await db.query(`
      SELECT 
        d.name as department_name,
        COUNT(pe.id) as evaluation_count,
        AVG(pe.total_score) as avg_score,
        COUNT(CASE WHEN pe.rating = 'A' THEN 1 END) as rating_a_count,
        COUNT(CASE WHEN pe.rating = 'B' THEN 1 END) as rating_b_count,
        COUNT(CASE WHEN pe.rating = 'C' THEN 1 END) as rating_c_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id
      LEFT JOIN performance_evaluations pe ON e.id = pe.employee_id
      WHERE pe.id IS NOT NULL ${year ? 'AND pe.year = ?' : ''} ${quarter ? 'AND pe.quarter = ?' : ''}
      GROUP BY d.id, d.name
      ORDER BY avg_score DESC
    `, params.slice(0, year ? (quarter ? 2 : 1) : 0));
    
    // 各项评分统计
    const scoreStats = await db.get(`
      SELECT 
        AVG(pe.work_quality_score) as avg_work_quality,
        AVG(pe.work_efficiency_score) as avg_work_efficiency,
        AVG(pe.teamwork_score) as avg_teamwork,
        AVG(pe.innovation_score) as avg_innovation
      FROM performance_evaluations pe
      LEFT JOIN employees e ON pe.employee_id = e.id
      WHERE ${whereClause}
    `, params);
    
    res.json({
      status: 'success',
      data: {
        overall: overallStats,
        department_distribution: departmentStats,
        score_breakdown: scoreStats
      }
    });
  } catch (error) {
    console.error('获取绩效统计失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取绩效统计失败'
    });
  }
});

// 获取员工绩效历史
router.get('/history/:employee_id', async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { limit = 10 } = req.query;
    
    const history = await db.query(`
      SELECT 
        pe.*,
        evaluator.real_name as evaluator_name
      FROM performance_evaluations pe
      LEFT JOIN users evaluator ON pe.evaluator_id = evaluator.id
      WHERE pe.employee_id = ?
      ORDER BY pe.year DESC, pe.quarter DESC, pe.month DESC
      LIMIT ?
    `, [employee_id, parseInt(limit)]);
    
    // 计算趋势
    const avgScores = history.map(h => h.total_score).filter(s => s !== null);
    const trend = avgScores.length > 1 ? 
      (avgScores[0] - avgScores[avgScores.length - 1]) / avgScores.length : 0;
    
    res.json({
      status: 'success',
      data: {
        history: history,
        trend: trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable',
        trend_value: trend
      }
    });
  } catch (error) {
    console.error('获取员工绩效历史失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取员工绩效历史失败'
    });
  }
});

// 批量创建绩效考核
router.post('/evaluations/batch', async (req, res) => {
  try {
    const { employee_ids, evaluation_data } = req.body;
    
    if (!Array.isArray(employee_ids) || employee_ids.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '请提供员工ID列表'
      });
    }
    
    const { error, value } = Joi.object({
      evaluation_period: Joi.string().valid('monthly', 'quarterly', 'yearly').required(),
      year: Joi.number().integer().min(2020).max(2030).required(),
      quarter: Joi.number().integer().min(1).max(4).optional(),
      month: Joi.number().integer().min(1).max(12).optional()
    }).validate(evaluation_data);
    
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    
    const operations = [];
    const evaluator_id = req.user.id;
    
    for (const employee_id of employee_ids) {
      const evaluationData = {
        employee_id: employee_id,
        evaluator_id: evaluator_id,
        ...value,
        work_quality_score: 0,
        work_efficiency_score: 0,
        teamwork_score: 0,
        innovation_score: 0,
        total_score: 0,
        rating: 'E',
        status: 'draft'
      };
      
      const fields = Object.keys(evaluationData);
      const values = Object.values(evaluationData);
      const placeholders = fields.map(() => '?').join(', ');
      
      operations.push({
        sql: `INSERT OR IGNORE INTO performance_evaluations (${fields.join(', ')}, created_at, updated_at) VALUES (${placeholders}, datetime('now'), datetime('now'))`,
        params: values
      });
    }
    
    await db.batch(operations);
    
    res.json({
      status: 'success',
      message: `成功为${employee_ids.length}名员工创建绩效考核模板`
    });
  } catch (error) {
    console.error('批量创建绩效考核失败:', error);
    res.status(500).json({
      status: 'error',
      message: '批量创建绩效考核失败'
    });
  }
});

module.exports = router; 