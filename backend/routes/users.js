const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const db = require('../config/database');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// 获取用户列表
router.get('/', checkPermission('user:view'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (search) {
      whereClause += ' AND (u.username LIKE ? OR u.real_name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status !== '') {
      whereClause += ' AND u.status = ?';
      params.push(status);
    }

    // 查询用户列表
    const users = await db.query(`
      SELECT u.id, u.username, u.email, u.phone, u.real_name, u.avatar, u.status,
             u.created_at, u.updated_at,
             r.name as role_name, d.name as department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // 查询总数
    const total = await db.get(`
      SELECT COUNT(*) as count
      FROM users u
      WHERE ${whereClause}
    `, params);

    res.json({
      status: 'success',
      data: {
        list: users,
        total: total.count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取用户列表失败'
    });
  }
});

// 获取用户详情
router.get('/:id', checkPermission('user:view'), async (req, res) => {
  try {
    const user = await db.get(`
      SELECT u.id, u.username, u.email, u.phone, u.real_name, u.avatar, u.status,
             u.role_id, u.department_id, u.created_at, u.updated_at,
             r.name as role_name, d.name as department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [req.params.id]);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }

    res.json({
      status: 'success',
      data: user
    });

  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取用户详情失败'
    });
  }
});

// 创建用户
router.post('/', checkPermission('user:create'), async (req, res) => {
  try {
    const schema = Joi.object({
      username: Joi.string().alphanum().min(3).max(50).required().messages({
        'any.required': '用户名不能为空',
        'string.alphanum': '用户名只能包含字母和数字',
        'string.min': '用户名至少3个字符',
        'string.max': '用户名最多50个字符'
      }),
      password: Joi.string().min(6).required().messages({
        'any.required': '密码不能为空',
        'string.min': '密码至少6个字符'
      }),
      email: Joi.string().email().allow('').messages({
        'string.email': '邮箱格式不正确'
      }),
      phone: Joi.string().pattern(/^1[3-9]\d{9}$/).allow('').messages({
        'string.pattern.base': '手机号格式不正确'
      }),
      real_name: Joi.string().max(50).allow(''),
      role_id: Joi.number().integer().required().messages({
        'any.required': '角色不能为空'
      }),
      department_id: Joi.number().integer().allow(null),
      status: Joi.number().integer().valid(0, 1).default(1)
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    // 检查用户名是否存在
    const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [value.username]);
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: '用户名已存在'
      });
    }

    // 检查邮箱是否存在
    if (value.email) {
      const existingEmail = await db.get('SELECT id FROM users WHERE email = ?', [value.email]);
      if (existingEmail) {
        return res.status(400).json({
          status: 'error',
          message: '邮箱已存在'
        });
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(value.password, 10);

    // 插入用户
    const result = await db.run(`
      INSERT INTO users (username, password, email, phone, real_name, role_id, department_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      value.username,
      hashedPassword,
      value.email || null,
      value.phone || null,
      value.real_name || null,
      value.role_id,
      value.department_id || null,
      value.status
    ]);

    // 记录操作日志
    await db.run(`
      INSERT INTO operation_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      '创建',
      '用户',
      result.id,
      `创建用户: ${value.username}`,
      req.ip,
      req.get('User-Agent')
    ]);

    res.status(201).json({
      status: 'success',
      message: '用户创建成功',
      data: { id: result.id }
    });

  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建用户失败'
    });
  }
});

// 更新用户
router.put('/:id', checkPermission('user:update'), async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().allow('').messages({
        'string.email': '邮箱格式不正确'
      }),
      phone: Joi.string().pattern(/^1[3-9]\d{9}$/).allow('').messages({
        'string.pattern.base': '手机号格式不正确'
      }),
      real_name: Joi.string().max(50).allow(''),
      role_id: Joi.number().integer(),
      department_id: Joi.number().integer().allow(null),
      status: Joi.number().integer().valid(0, 1)
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    // 检查用户是否存在
    const existingUser = await db.get('SELECT id, username FROM users WHERE id = ?', [req.params.id]);
    if (!existingUser) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }

    // 检查邮箱是否被其他用户使用
    if (value.email) {
      const existingEmail = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [value.email, req.params.id]);
      if (existingEmail) {
        return res.status(400).json({
          status: 'error',
          message: '邮箱已被其他用户使用'
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
      UPDATE users SET ${updates.join(', ')}
      WHERE id = ?
    `, params);

    // 记录操作日志
    await db.run(`
      INSERT INTO operation_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      '更新',
      '用户',
      req.params.id,
      `更新用户: ${existingUser.username}`,
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      status: 'success',
      message: '用户更新成功'
    });

  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新用户失败'
    });
  }
});

// 删除用户
router.delete('/:id', checkPermission('user:delete'), async (req, res) => {
  try {
    // 检查用户是否存在
    const existingUser = await db.get('SELECT id, username FROM users WHERE id = ?', [req.params.id]);
    if (!existingUser) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }

    // 不能删除自己
    if (req.params.id == req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: '不能删除自己'
      });
    }

    // 软删除：更新状态为禁用
    await db.run('UPDATE users SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);

    // 记录操作日志
    await db.run(`
      INSERT INTO operation_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      '删除',
      '用户',
      req.params.id,
      `删除用户: ${existingUser.username}`,
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      status: 'success',
      message: '用户删除成功'
    });

  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      status: 'error',
      message: '删除用户失败'
    });
  }
});

// 重置密码
router.post('/:id/reset-password', checkPermission('user:update'), async (req, res) => {
  try {
    const schema = Joi.object({
      newPassword: Joi.string().min(6).required().messages({
        'any.required': '新密码不能为空',
        'string.min': '新密码至少6个字符'
      })
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    // 检查用户是否存在
    const existingUser = await db.get('SELECT id, username FROM users WHERE id = ?', [req.params.id]);
    if (!existingUser) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(value.newPassword, 10);

    // 更新密码
    await db.run(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, req.params.id]
    );

    // 记录操作日志
    await db.run(`
      INSERT INTO operation_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      '重置密码',
      '用户',
      req.params.id,
      `重置用户密码: ${existingUser.username}`,
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      status: 'success',
      message: '密码重置成功'
    });

  } catch (error) {
    console.error('重置密码失败:', error);
    res.status(500).json({
      status: 'error',
      message: '重置密码失败'
    });
  }
});

module.exports = router; 