const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// 获取菜单列表（树形结构）
router.get('/', checkPermission('menu:view'), async (req, res) => {
  try {
    const menus = await db.query(`
      SELECT * FROM menus
      ORDER BY parent_id, sort_order, id
    `);

    // 构建树形结构
    const buildMenuTree = (menus, parentId = 0) => {
      return menus
        .filter(menu => menu.parent_id === parentId)
        .map(menu => ({
          ...menu,
          children: buildMenuTree(menus, menu.id)
        }));
    };

    const menuTree = buildMenuTree(menus);

    res.json({
      status: 'success',
      data: menuTree
    });

  } catch (error) {
    console.error('获取菜单列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取菜单列表失败'
    });
  }
});

// 获取菜单详情
router.get('/:id', checkPermission('menu:view'), async (req, res) => {
  try {
    const menu = await db.get('SELECT * FROM menus WHERE id = ?', [req.params.id]);

    if (!menu) {
      return res.status(404).json({
        status: 'error',
        message: '菜单不存在'
      });
    }

    res.json({
      status: 'success',
      data: menu
    });

  } catch (error) {
    console.error('获取菜单详情失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取菜单详情失败'
    });
  }
});

// 创建菜单
router.post('/', checkPermission('menu:create'), async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().max(50).required().messages({
        'any.required': '菜单名称不能为空',
        'string.max': '菜单名称最多50个字符'
      }),
      path: Joi.string().max(100).allow(''),
      component: Joi.string().max(100).allow(''),
      icon: Joi.string().max(50).allow(''),
      parent_id: Joi.number().integer().default(0),
      sort_order: Joi.number().integer().default(0),
      menu_type: Joi.number().integer().valid(1, 2).default(1).messages({
        'any.only': '菜单类型必须是1(目录)或2(页面)'
      }),
      status: Joi.number().integer().valid(0, 1).default(1),
      permissions: Joi.string().allow('')
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    // 如果是子菜单，检查父菜单是否存在
    if (value.parent_id > 0) {
      const parentMenu = await db.get('SELECT id FROM menus WHERE id = ?', [value.parent_id]);
      if (!parentMenu) {
        return res.status(400).json({
          status: 'error',
          message: '父菜单不存在'
        });
      }
    }

    // 插入菜单
    const result = await db.run(`
      INSERT INTO menus (name, path, component, icon, parent_id, sort_order, menu_type, status, permissions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      value.name,
      value.path || null,
      value.component || null,
      value.icon || null,
      value.parent_id,
      value.sort_order,
      value.menu_type,
      value.status,
      value.permissions || null
    ]);

    // 记录操作日志
    await db.run(`
      INSERT INTO operation_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      '创建',
      '菜单',
      result.id,
      `创建菜单: ${value.name}`,
      req.ip,
      req.get('User-Agent')
    ]);

    res.status(201).json({
      status: 'success',
      message: '菜单创建成功',
      data: { id: result.id }
    });

  } catch (error) {
    console.error('创建菜单失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建菜单失败'
    });
  }
});

// 更新菜单
router.put('/:id', checkPermission('menu:update'), async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().max(50),
      path: Joi.string().max(100).allow(''),
      component: Joi.string().max(100).allow(''),
      icon: Joi.string().max(50).allow(''),
      parent_id: Joi.number().integer(),
      sort_order: Joi.number().integer(),
      menu_type: Joi.number().integer().valid(1, 2),
      status: Joi.number().integer().valid(0, 1),
      permissions: Joi.string().allow('')
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    // 检查菜单是否存在
    const existingMenu = await db.get('SELECT id, name FROM menus WHERE id = ?', [req.params.id]);
    if (!existingMenu) {
      return res.status(404).json({
        status: 'error',
        message: '菜单不存在'
      });
    }

    // 如果修改了父菜单，检查是否会形成循环引用
    if (value.parent_id !== undefined && value.parent_id > 0) {
      // 不能将父菜单设置为自己
      if (value.parent_id == req.params.id) {
        return res.status(400).json({
          status: 'error',
          message: '不能将父菜单设置为自己'
        });
      }

      // 检查父菜单是否存在
      const parentMenu = await db.get('SELECT id FROM menus WHERE id = ?', [value.parent_id]);
      if (!parentMenu) {
        return res.status(400).json({
          status: 'error',
          message: '父菜单不存在'
        });
      }

      // 检查是否会形成循环引用（简单检查：父菜单的父菜单不能是当前菜单）
      const grandParent = await db.get('SELECT parent_id FROM menus WHERE id = ?', [value.parent_id]);
      if (grandParent && grandParent.parent_id == req.params.id) {
        return res.status(400).json({
          status: 'error',
          message: '不能形成循环引用'
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
      UPDATE menus SET ${updates.join(', ')}
      WHERE id = ?
    `, params);

    // 记录操作日志
    await db.run(`
      INSERT INTO operation_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      '更新',
      '菜单',
      req.params.id,
      `更新菜单: ${existingMenu.name}`,
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      status: 'success',
      message: '菜单更新成功'
    });

  } catch (error) {
    console.error('更新菜单失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新菜单失败'
    });
  }
});

// 删除菜单
router.delete('/:id', checkPermission('menu:delete'), async (req, res) => {
  try {
    // 检查菜单是否存在
    const existingMenu = await db.get('SELECT id, name FROM menus WHERE id = ?', [req.params.id]);
    if (!existingMenu) {
      return res.status(404).json({
        status: 'error',
        message: '菜单不存在'
      });
    }

    // 检查是否有子菜单
    const childCount = await db.get('SELECT COUNT(*) as count FROM menus WHERE parent_id = ?', [req.params.id]);
    if (childCount.count > 0) {
      return res.status(400).json({
        status: 'error',
        message: '该菜单下还有子菜单，不能删除'
      });
    }

    // 删除角色菜单关联
    await db.run('DELETE FROM role_menus WHERE menu_id = ?', [req.params.id]);
    
    // 删除菜单
    await db.run('DELETE FROM menus WHERE id = ?', [req.params.id]);

    // 记录操作日志
    await db.run(`
      INSERT INTO operation_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      '删除',
      '菜单',
      req.params.id,
      `删除菜单: ${existingMenu.name}`,
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      status: 'success',
      message: '菜单删除成功'
    });

  } catch (error) {
    console.error('删除菜单失败:', error);
    res.status(500).json({
      status: 'error',
      message: '删除菜单失败'
    });
  }
});

module.exports = router; 