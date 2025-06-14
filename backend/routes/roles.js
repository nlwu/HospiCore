const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// 获取角色列表
router.get('/', checkPermission('role:view'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (search) {
      whereClause += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (status !== '') {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // 查询角色列表
    const roles = await db.query(`
      SELECT * FROM roles
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // 查询总数
    const total = await db.get(`
      SELECT COUNT(*) as count
      FROM roles
      WHERE ${whereClause}
    `, params);

    res.json({
      status: 'success',
      data: {
        list: roles,
        total: total.count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('获取角色列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取角色列表失败'
    });
  }
});

// 获取所有角色（不分页，用于下拉选择）
router.get('/all', checkPermission('role:view'), async (req, res) => {
  try {
    const roles = await db.query(`
      SELECT id, name, description
      FROM roles
      WHERE status = 1
      ORDER BY name
    `);

    res.json({
      status: 'success',
      data: roles
    });

  } catch (error) {
    console.error('获取角色列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取角色列表失败'
    });
  }
});

// 获取角色详情
router.get('/:id', checkPermission('role:view'), async (req, res) => {
  try {
    const role = await db.get('SELECT * FROM roles WHERE id = ?', [req.params.id]);

    if (!role) {
      return res.status(404).json({
        status: 'error',
        message: '角色不存在'
      });
    }

    // 获取角色关联的菜单
    const menus = await db.query(`
      SELECT menu_id FROM role_menus WHERE role_id = ?
    `, [req.params.id]);

    role.menu_ids = menus.map(m => m.menu_id);

    res.json({
      status: 'success',
      data: role
    });

  } catch (error) {
    console.error('获取角色详情失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取角色详情失败'
    });
  }
});

// 创建角色
router.post('/', checkPermission('role:create'), async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().max(50).required().messages({
        'any.required': '角色名称不能为空',
        'string.max': '角色名称最多50个字符'
      }),
      description: Joi.string().allow(''),
      permissions: Joi.string().allow(''),
      status: Joi.number().integer().valid(0, 1).default(1),
      menu_ids: Joi.array().items(Joi.number().integer()).default([])
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    // 检查角色名是否存在
    const existingRole = await db.get('SELECT id FROM roles WHERE name = ?', [value.name]);
    if (existingRole) {
      return res.status(400).json({
        status: 'error',
        message: '角色名称已存在'
      });
    }

    // 插入角色
    const result = await db.run(`
      INSERT INTO roles (name, description, permissions, status)
      VALUES (?, ?, ?, ?)
    `, [value.name, value.description || null, value.permissions || null, value.status]);

    // 插入角色菜单关联
    if (value.menu_ids.length > 0) {
      const operations = value.menu_ids.map(menuId => ({
        sql: 'INSERT INTO role_menus (role_id, menu_id) VALUES (?, ?)',
        params: [result.id, menuId]
      }));
      await db.batch(operations);
    }

    // 记录操作日志
    await db.run(`
      INSERT INTO operation_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      '创建',
      '角色',
      result.id,
      `创建角色: ${value.name}`,
      req.ip,
      req.get('User-Agent')
    ]);

    res.status(201).json({
      status: 'success',
      message: '角色创建成功',
      data: { id: result.id }
    });

  } catch (error) {
    console.error('创建角色失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建角色失败'
    });
  }
});

// 更新角色
router.put('/:id', checkPermission('role:update'), async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().max(50),
      description: Joi.string().allow(''),
      permissions: Joi.string().allow(''),
      status: Joi.number().integer().valid(0, 1),
      menu_ids: Joi.array().items(Joi.number().integer())
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    // 检查角色是否存在
    const existingRole = await db.get('SELECT id, name FROM roles WHERE id = ?', [req.params.id]);
    if (!existingRole) {
      return res.status(404).json({
        status: 'error',
        message: '角色不存在'
      });
    }

    // 检查角色名是否被其他角色使用
    if (value.name && value.name !== existingRole.name) {
      const duplicateRole = await db.get('SELECT id FROM roles WHERE name = ? AND id != ?', [value.name, req.params.id]);
      if (duplicateRole) {
        return res.status(400).json({
          status: 'error',
          message: '角色名称已存在'
        });
      }
    }

    // 构建更新语句
    const updates = [];
    const params = [];
    
    ['name', 'description', 'permissions', 'status'].forEach(key => {
      if (value[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(value[key]);
      }
    });

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(req.params.id);

      await db.run(`
        UPDATE roles SET ${updates.join(', ')}
        WHERE id = ?
      `, params);
    }

    // 更新角色菜单关联
    if (value.menu_ids !== undefined) {
      // 删除原有关联
      await db.run('DELETE FROM role_menus WHERE role_id = ?', [req.params.id]);
      
      // 插入新的关联
      if (value.menu_ids.length > 0) {
        const operations = value.menu_ids.map(menuId => ({
          sql: 'INSERT INTO role_menus (role_id, menu_id) VALUES (?, ?)',
          params: [req.params.id, menuId]
        }));
        await db.batch(operations);
      }
    }

    // 记录操作日志
    await db.run(`
      INSERT INTO operation_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      '更新',
      '角色',
      req.params.id,
      `更新角色: ${existingRole.name}`,
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      status: 'success',
      message: '角色更新成功'
    });

  } catch (error) {
    console.error('更新角色失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新角色失败'
    });
  }
});

// 删除角色
router.delete('/:id', checkPermission('role:delete'), async (req, res) => {
  try {
    // 检查角色是否存在
    const existingRole = await db.get('SELECT id, name FROM roles WHERE id = ?', [req.params.id]);
    if (!existingRole) {
      return res.status(404).json({
        status: 'error',
        message: '角色不存在'
      });
    }

    // 检查是否有用户使用该角色
    const userCount = await db.get('SELECT COUNT(*) as count FROM users WHERE role_id = ?', [req.params.id]);
    if (userCount.count > 0) {
      return res.status(400).json({
        status: 'error',
        message: '该角色下还有用户，不能删除'
      });
    }

    // 删除角色菜单关联
    await db.run('DELETE FROM role_menus WHERE role_id = ?', [req.params.id]);
    
    // 删除角色
    await db.run('DELETE FROM roles WHERE id = ?', [req.params.id]);

    // 记录操作日志
    await db.run(`
      INSERT INTO operation_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      '删除',
      '角色',
      req.params.id,
      `删除角色: ${existingRole.name}`,
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      status: 'success',
      message: '角色删除成功'
    });

  } catch (error) {
    console.error('删除角色失败:', error);
    res.status(500).json({
      status: 'error',
      message: '删除角色失败'
    });
  }
});

module.exports = router; 