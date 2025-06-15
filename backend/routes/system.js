const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// ============ 部门管理 ============

// 获取部门列表（树形结构）
router.get('/departments', checkPermission('department:view'), async (req, res) => {
  try {
    const departments = await db.query(`
      SELECT * FROM departments
      ORDER BY parent_id, sort_order, id
    `);

    // 构建树形结构
    const buildDeptTree = (departments, parentId = 0) => {
      return departments
        .filter(dept => dept.parent_id === parentId)
        .map(dept => ({
          ...dept,
          children: buildDeptTree(departments, dept.id)
        }));
    };

    const deptTree = buildDeptTree(departments);

    res.json({
      status: 'success',
      data: deptTree
    });

  } catch (error) {
    console.error('获取部门列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取部门列表失败'
    });
  }
});

// 获取所有部门（不分页，用于下拉选择）
router.get('/departments/all', checkPermission('department:view'), async (req, res) => {
  try {
    const departments = await db.query(`
      SELECT id, name, description, parent_id
      FROM departments
      WHERE status = 1
      ORDER BY sort_order, name
    `);

    res.json({
      status: 'success',
      data: departments
    });

  } catch (error) {
    console.error('获取部门列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取部门列表失败'
    });
  }
});

// 创建部门
router.post('/departments', checkPermission('department:create'), async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().max(50).required().messages({
        'any.required': '部门名称不能为空',
        'string.max': '部门名称最多50个字符'
      }),
      description: Joi.string().allow(''),
      parent_id: Joi.number().integer().default(0),
      sort_order: Joi.number().integer().default(0),
      status: Joi.number().integer().valid(0, 1).default(1)
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    // 如果是子部门，检查父部门是否存在
    if (value.parent_id > 0) {
      const parentDept = await db.get('SELECT id FROM departments WHERE id = ?', [value.parent_id]);
      if (!parentDept) {
        return res.status(400).json({
          status: 'error',
          message: '父部门不存在'
        });
      }
    }

    // 插入部门
    const result = await db.run(`
      INSERT INTO departments (name, description, parent_id, sort_order, status)
      VALUES (?, ?, ?, ?, ?)
    `, [value.name, value.description || null, value.parent_id, value.sort_order, value.status]);

    // 记录操作日志
    await db.run(`
      INSERT INTO operation_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      '创建',
      '部门',
      result.id,
      `创建部门: ${value.name}`,
      req.ip,
      req.get('User-Agent')
    ]);

    res.status(201).json({
      status: 'success',
      message: '部门创建成功',
      data: { id: result.id }
    });

  } catch (error) {
    console.error('创建部门失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建部门失败'
    });
  }
});

// 更新部门
router.put('/departments/:id', checkPermission('department:update'), async (req, res) => {
  try {
    //{id: 2, name: "信息科", parent_id: 1, manager_id: "", description: "信息技术部门", sort_order: 1}

    const schema = Joi.object({
      id: Joi.number().integer().required(),
      name: Joi.string().max(50).required(),
      description: Joi.string().allow(''),
      parent_id: Joi.number().integer().required(),
      manager_id: Joi.number().integer(),
      sort_order: Joi.number().integer(),
      status: Joi.number().integer().valid(0, 1)
    });

    const { error, value } = schema.validate(req.body);
    console.log('updateDepartment', error, value)
    
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    // 检查部门是否存在
    const existingDept = await db.get('SELECT id, name FROM departments WHERE id = ?', [req.params.id]);
    if (!existingDept) {
      return res.status(404).json({
        status: 'error',
        message: '部门不存在'
      });
    }

    // 如果修改了父部门，检查是否会形成循环引用
    if (value.parent_id !== undefined && value.parent_id > 0) {
      if (value.parent_id == req.params.id) {
        return res.status(400).json({
          status: 'error',
          message: '不能将父部门设置为自己'
        });
      }

      const parentDept = await db.get('SELECT id FROM departments WHERE id = ?', [value.parent_id]);
      if (!parentDept) {
        return res.status(400).json({
          status: 'error',
          message: '父部门不存在'
        });
      }
    }

    // 构建更新语句
    const updates = [];
    const params = [];
    
    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(value[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '没有要更新的字段'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    await db.run(`
      UPDATE departments SET ${updates.join(', ')}
      WHERE id = ?
    `, params);

    // 记录操作日志
    await db.run(`
      INSERT INTO operation_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      '更新',
      '部门',
      req.params.id,
      `更新部门: ${existingDept.name}`,
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      status: 'success',
      message: '部门更新成功'
    });

  } catch (error) {
    console.error('更新部门失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新部门失败'
    });
  }
});

// 删除部门
router.delete('/departments/:id', checkPermission('department:delete'), async (req, res) => {
  try {
    // 检查部门是否存在
    const existingDept = await db.get('SELECT id, name FROM departments WHERE id = ?', [req.params.id]);
    if (!existingDept) {
      return res.status(404).json({
        status: 'error',
        message: '部门不存在'
      });
    }

    // 检查是否有子部门
    const childCount = await db.get('SELECT COUNT(*) as count FROM departments WHERE parent_id = ?', [req.params.id]);
    if (childCount.count > 0) {
      return res.status(400).json({
        status: 'error',
        message: '该部门下还有子部门，不能删除'
      });
    }

    // 检查是否有用户
    const userCount = await db.get('SELECT COUNT(*) as count FROM users WHERE department_id = ?', [req.params.id]);
    if (userCount.count > 0) {
      return res.status(400).json({
        status: 'error',
        message: '该部门下还有用户，不能删除'
      });
    }

    // 删除部门
    await db.run('DELETE FROM departments WHERE id = ?', [req.params.id]);

    // 记录操作日志
    await db.run(`
      INSERT INTO operation_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      '删除',
      '部门',
      req.params.id,
      `删除部门: ${existingDept.name}`,
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      status: 'success',
      message: '部门删除成功'
    });

  } catch (error) {
    console.error('删除部门失败:', error);
    res.status(500).json({
      status: 'error',
      message: '删除部门失败'
    });
  }
});

// ============ 系统配置 ============

// 获取系统配置列表
router.get('/config', checkPermission('system:config'), async (req, res) => {
  try {
    const configs = await db.query(`
      SELECT * FROM system_config
      ORDER BY id
    `);

    res.json({
      status: 'success',
      data: configs
    });

  } catch (error) {
    console.error('获取系统配置失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取系统配置失败'
    });
  }
});

// 更新系统配置
router.put('/config/:key', checkPermission('system:config'), async (req, res) => {
  try {
    const schema = Joi.object({
      config_value: Joi.string().required().messages({
        'any.required': '配置值不能为空'
      })
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    // 检查配置是否存在
    const existingConfig = await db.get('SELECT * FROM system_config WHERE config_key = ?', [req.params.key]);
    if (!existingConfig) {
      return res.status(404).json({
        status: 'error',
        message: '配置项不存在'
      });
    }

    // 更新配置值
    await db.run(`
      UPDATE system_config 
      SET config_value = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE config_key = ?
    `, [value.config_value, req.params.key]);

    // 记录操作日志
    await db.run(`
      INSERT INTO operation_logs (user_id, action, resource, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      '更新',
      '系统配置',
      `更新配置: ${req.params.key} = ${value.config_value}`,
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      status: 'success',
      message: '配置更新成功'
    });

  } catch (error) {
    console.error('更新系统配置失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新系统配置失败'
    });
  }
});

// ============ 操作日志 ============

// 获取操作日志列表
router.get('/logs', checkPermission('system:log'), async (req, res) => {
  try {
    const { page = 1, limit = 10, action = '', resource = '', user_id = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (action) {
      whereClause += ' AND ol.action LIKE ?';
      params.push(`%${action}%`);
    }
    
    if (resource) {
      whereClause += ' AND ol.resource LIKE ?';
      params.push(`%${resource}%`);
    }
    
    if (user_id) {
      whereClause += ' AND ol.user_id = ?';
      params.push(user_id);
    }

    // 查询日志列表
    const logs = await db.query(`
      SELECT ol.*, u.username, u.real_name
      FROM operation_logs ol
      LEFT JOIN users u ON ol.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ol.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // 查询总数
    const total = await db.get(`
      SELECT COUNT(*) as count
      FROM operation_logs ol
      WHERE ${whereClause}
    `, params);

    res.json({
      status: 'success',
      data: {
        list: logs,
        total: total.count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('获取操作日志失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取操作日志失败'
    });
  }
});

// 清理操作日志（删除30天前的日志）
router.delete('/logs/cleanup', checkPermission('system:log'), async (req, res) => {
  try {
    const result = await db.run(`
      DELETE FROM operation_logs 
      WHERE created_at < datetime('now', '-30 days')
    `);

    // 记录操作日志
    await db.run(`
      INSERT INTO operation_logs (user_id, action, resource, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      '清理',
      '操作日志',
      `清理了 ${result.changes} 条30天前的日志`,
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      status: 'success',
      message: `成功清理了 ${result.changes} 条日志记录`
    });

  } catch (error) {
    console.error('清理操作日志失败:', error);
    res.status(500).json({
      status: 'error',
      message: '清理操作日志失败'
    });
  }
});

// ============ 系统信息 ============

// 获取系统信息
router.get('/info', checkPermission('system:view'), async (req, res) => {
  try {
    // 获取用户统计
    const userStats = await db.get(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 1 THEN 1 END) as active,
        COUNT(CASE WHEN status = 0 THEN 1 END) as inactive
      FROM users
    `);

    // 获取角色统计
    const roleStats = await db.get(`
      SELECT COUNT(*) as total FROM roles WHERE status = 1
    `);

    // 获取部门统计
    const deptStats = await db.get(`
      SELECT COUNT(*) as total FROM departments WHERE status = 1
    `);

    // 获取菜单统计
    const menuStats = await db.get(`
      SELECT COUNT(*) as total FROM menus WHERE status = 1
    `);

    // 获取今日登录统计
    const todayLogins = await db.get(`
      SELECT COUNT(*) as count FROM operation_logs 
      WHERE action = '登录' AND date(created_at) = date('now')
    `);

    res.json({
      status: 'success',
      data: {
        users: userStats,
        roles: roleStats.total,
        departments: deptStats.total,
        menus: menuStats.total,
        todayLogins: todayLogins.count,
        serverTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('获取系统信息失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取系统信息失败'
    });
  }
});

module.exports = router; 