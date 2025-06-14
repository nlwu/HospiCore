const db = require('../config/database');
const bcrypt = require('bcryptjs');

// 创建表的SQL语句
const createTables = {
  // 用户表
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(100),
      phone VARCHAR(20),
      real_name VARCHAR(50),
      avatar VARCHAR(255),
      status INTEGER DEFAULT 1,
      role_id INTEGER,
      department_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    )
  `,

  // 角色表
  roles: `
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      permissions TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // 菜单表
  menus: `
    CREATE TABLE IF NOT EXISTS menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(50) NOT NULL,
      path VARCHAR(100),
      component VARCHAR(100),
      icon VARCHAR(50),
      parent_id INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      menu_type INTEGER DEFAULT 1,
      status INTEGER DEFAULT 1,
      permissions VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // 角色菜单关联表
  role_menus: `
    CREATE TABLE IF NOT EXISTS role_menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL,
      menu_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id),
      FOREIGN KEY (menu_id) REFERENCES menus(id),
      UNIQUE(role_id, menu_id)
    )
  `,

  // 部门表
  departments: `
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(50) NOT NULL,
      description TEXT,
      parent_id INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // 系统配置表
  system_config: `
    CREATE TABLE IF NOT EXISTS system_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_key VARCHAR(100) UNIQUE NOT NULL,
      config_value TEXT,
      config_type VARCHAR(20) DEFAULT 'string',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // 操作日志表
  operation_logs: `
    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action VARCHAR(50),
      resource VARCHAR(50),
      resource_id INTEGER,
      details TEXT,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `
};

// 初始化基础数据
async function initializeData() {
  try {
    console.log('开始初始化数据库...');

    // 创建所有表
    for (const [tableName, sql] of Object.entries(createTables)) {
      await db.run(sql);
      console.log(`✅ 创建表 ${tableName} 成功`);
    }

    // 插入默认角色
    const roles = [
      { name: '超级管理员', description: '系统超级管理员，拥有所有权限', permissions: '*' },
      { name: '管理员', description: '系统管理员', permissions: 'user,role,menu,department,system' },
      { name: '普通用户', description: '普通用户', permissions: 'user:view' }
    ];

    for (const role of roles) {
      await db.run(
        'INSERT OR IGNORE INTO roles (name, description, permissions) VALUES (?, ?, ?)',
        [role.name, role.description, role.permissions]
      );
    }
    console.log('✅ 初始化角色数据成功');

    // 插入默认部门
    const departments = [
      { name: '总部', description: '公司总部', parent_id: 0, sort_order: 1 },
      { name: '信息科', description: '信息技术部门', parent_id: 1, sort_order: 1 },
      { name: '医务科', description: '医务管理部门', parent_id: 1, sort_order: 2 },
      { name: '护理部', description: '护理管理部门', parent_id: 1, sort_order: 3 }
    ];

    for (const dept of departments) {
      await db.run(
        'INSERT OR IGNORE INTO departments (name, description, parent_id, sort_order) VALUES (?, ?, ?, ?)',
        [dept.name, dept.description, dept.parent_id, dept.sort_order]
      );
    }
    console.log('✅ 初始化部门数据成功');

    // 插入默认菜单
    const menus = [
      { name: '系统管理', path: '/system', icon: 'Setting', parent_id: 0, sort_order: 1, menu_type: 1 },
      { name: '用户管理', path: '/system/users', component: 'system/users/index', icon: 'User', parent_id: 1, sort_order: 1, menu_type: 2, permissions: 'user:view' },
      { name: '角色管理', path: '/system/roles', component: 'system/roles/index', icon: 'UserFilled', parent_id: 1, sort_order: 2, menu_type: 2, permissions: 'role:view' },
      { name: '菜单管理', path: '/system/menus', component: 'system/menus/index', icon: 'Menu', parent_id: 1, sort_order: 3, menu_type: 2, permissions: 'menu:view' },
      { name: '部门管理', path: '/system/departments', component: 'system/departments/index', icon: 'OfficeBuilding', parent_id: 1, sort_order: 4, menu_type: 2, permissions: 'department:view' },
      { name: '系统配置', path: '/system/config', component: 'system/config/index', icon: 'Tools', parent_id: 1, sort_order: 5, menu_type: 2, permissions: 'system:config' },
      { name: '操作日志', path: '/system/logs', component: 'system/logs/index', icon: 'Document', parent_id: 1, sort_order: 6, menu_type: 2, permissions: 'system:log' }
    ];

    for (const menu of menus) {
      await db.run(
        'INSERT OR IGNORE INTO menus (name, path, component, icon, parent_id, sort_order, menu_type, permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [menu.name, menu.path, menu.component || null, menu.icon, menu.parent_id, menu.sort_order, menu.menu_type, menu.permissions || null]
      );
    }
    console.log('✅ 初始化菜单数据成功');

    // 为超级管理员角色分配所有菜单权限
    const superAdminRole = await db.get('SELECT id FROM roles WHERE name = ?', ['超级管理员']);
    if (superAdminRole) {
      const allMenus = await db.query('SELECT id FROM menus');
      
      for (const menu of allMenus) {
        await db.run(
          'INSERT OR IGNORE INTO role_menus (role_id, menu_id) VALUES (?, ?)',
          [superAdminRole.id, menu.id]
        );
      }
      console.log('✅ 分配菜单权限成功');
    } else {
      console.log('❌ 未找到超级管理员角色');
    }

    // 创建默认管理员用户
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.run(
      'INSERT OR IGNORE INTO users (username, password, email, real_name, role_id, department_id) VALUES (?, ?, ?, ?, ?, ?)',
      ['admin', hashedPassword, 'admin@hospital.com', '系统管理员', superAdminRole.id, 1]
    );
    console.log('✅ 创建默认管理员用户成功');

    // 插入系统配置
    const configs = [
      { key: 'site_name', value: '医院综合管理平台', type: 'string', description: '网站名称' },
      { key: 'site_logo', value: '/uploads/logo.png', type: 'string', description: '网站Logo' },
      { key: 'max_login_attempts', value: '5', type: 'number', description: '最大登录尝试次数' },
      { key: 'session_timeout', value: '24', type: 'number', description: '会话超时时间(小时)' },
      { key: 'upload_max_size', value: '10', type: 'number', description: '上传文件最大大小(MB)' }
    ];

    for (const config of configs) {
      await db.run(
        'INSERT OR IGNORE INTO system_config (config_key, config_value, config_type, description) VALUES (?, ?, ?, ?)',
        [config.key, config.value, config.type, config.description]
      );
    }
    console.log('✅ 初始化系统配置成功');

    console.log('🎉 数据库初始化完成！');
    console.log('默认管理员账号: admin');
    console.log('默认管理员密码: admin123');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 执行初始化
if (require.main === module) {
  initializeData().then(() => {
    process.exit(0);
  });
}

module.exports = { initializeData }; 