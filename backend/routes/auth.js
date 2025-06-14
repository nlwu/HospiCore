const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 登录
router.post('/login', async (req, res) => {
  try {
    // 参数验证
    const schema = Joi.object({
      username: Joi.string().required().messages({
        'any.required': '用户名不能为空'
      }),
      password: Joi.string().required().messages({
        'any.required': '密码不能为空'
      })
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    const { username, password } = value;

    // 查询用户
    const user = await db.get(`
      SELECT u.*, r.name as role_name, r.permissions, d.name as department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.username = ? AND u.status = 1
    `, [username]);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: '用户名或密码错误'
      });
    }

    // 生成token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // 记录登录日志
    await db.run(`
      INSERT INTO operation_logs (user_id, action, resource, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      user.id,
      '登录',
      '系统',
      '用户登录成功',
      req.ip,
      req.get('User-Agent')
    ]);

    // 返回用户信息（不包含密码）
    const { password: _, ...userInfo } = user;

    res.json({
      status: 'success',
      message: '登录成功',
      data: {
        token,
        user: userInfo
      }
    });

  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      status: 'error',
      message: '登录失败'
    });
  }
});

// 获取当前用户信息
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const { password, ...userInfo } = req.user;
    
    res.json({
      status: 'success',
      data: userInfo
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取用户信息失败'
    });
  }
});

// 修改密码
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const schema = Joi.object({
      oldPassword: Joi.string().required().messages({
        'any.required': '旧密码不能为空'
      }),
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

    const { oldPassword, newPassword } = value;

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, req.user.password);
    if (!isOldPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: '旧密码错误'
      });
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await db.run(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, req.user.id]
    );

    // 记录操作日志
    await db.run(`
      INSERT INTO operation_logs (user_id, action, resource, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      '修改',
      '密码',
      '用户修改密码',
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      status: 'success',
      message: '密码修改成功'
    });

  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      status: 'error',
      message: '修改密码失败'
    });
  }
});

// 获取用户菜单权限
router.get('/menus', authMiddleware, async (req, res) => {
  try {
    let menus;
    
    if (req.user.permissions === '*') {
      // 超级管理员获取所有菜单
      menus = await db.query(`
        SELECT * FROM menus 
        WHERE status = 1 
        ORDER BY parent_id, sort_order
      `);
    } else {
      // 根据角色获取菜单
      menus = await db.query(`
        SELECT DISTINCT m.* FROM menus m
        INNER JOIN role_menus rm ON m.id = rm.menu_id
        WHERE rm.role_id = ? AND m.status = 1
        ORDER BY m.parent_id, m.sort_order
      `, [req.user.role_id]);
    }

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
    console.error('获取菜单失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取菜单失败'
    });
  }
});

// 注销
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // 记录注销日志
    await db.run(`
      INSERT INTO operation_logs (user_id, action, resource, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      '注销',
      '系统',
      '用户注销',
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      status: 'success',
      message: '注销成功'
    });

  } catch (error) {
    console.error('注销失败:', error);
    res.status(500).json({
      status: 'error',
      message: '注销失败'
    });
  }
});

module.exports = router; 