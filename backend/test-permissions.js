const db = require('./config/database');

async function testPermissions() {
  try {
    console.log('🔍 检查数据库权限配置...\n');

    // 检查角色数据
    console.log('📋 角色列表:');
    const roles = await db.query('SELECT * FROM roles ORDER BY id');
    roles.forEach(role => {
      console.log(`  ID: ${role.id}, 名称: ${role.name}, 权限: ${role.permissions}, 状态: ${role.status}`);
    });

    // 检查用户数据
    console.log('\n👥 用户列表:');
    const users = await db.query(`
      SELECT u.id, u.username, u.real_name, u.status, r.name as role_name, r.permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id
    `);
    users.forEach(user => {
      console.log(`  ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.real_name}, 角色: ${user.role_name}, 权限: ${user.permissions}, 状态: ${user.status}`);
    });

    // 检查菜单数据
    console.log('\n📁 菜单列表:');
    const menus = await db.query('SELECT * FROM menus ORDER BY parent_id, sort_order');
    menus.forEach(menu => {
      const indent = '  '.repeat(menu.parent_id > 0 ? 2 : 1);
      console.log(`${indent}ID: ${menu.id}, 名称: ${menu.name}, 路径: ${menu.path || '无'}, 权限: ${menu.permissions || '无'}, 状态: ${menu.status}`);
    });

    // 检查角色菜单关联
    console.log('\n🔗 角色菜单关联:');
    const roleMenus = await db.query(`
      SELECT rm.role_id, r.name as role_name, rm.menu_id, m.name as menu_name
      FROM role_menus rm
      LEFT JOIN roles r ON rm.role_id = r.id
      LEFT JOIN menus m ON rm.menu_id = m.id
      ORDER BY rm.role_id, rm.menu_id
    `);
    
    const roleMenuMap = {};
    roleMenus.forEach(rm => {
      if (!roleMenuMap[rm.role_name]) {
        roleMenuMap[rm.role_name] = [];
      }
      roleMenuMap[rm.role_name].push(rm.menu_name);
    });

    Object.keys(roleMenuMap).forEach(roleName => {
      console.log(`  ${roleName}: ${roleMenuMap[roleName].join(', ')}`);
    });

    console.log('\n✅ 权限配置检查完成！');

  } catch (error) {
    console.error('❌ 检查权限配置失败:', error);
  }
}

testPermissions(); 