const db = require('../config/database');

async function cleanDatabase() {
  try {
    console.log('🧹 开始清理数据库...');

    // 删除所有表的数据
    await db.run('DELETE FROM operation_logs');
    await db.run('DELETE FROM role_menus');
    await db.run('DELETE FROM users');
    await db.run('DELETE FROM menus');
    await db.run('DELETE FROM roles');
    await db.run('DELETE FROM departments');
    await db.run('DELETE FROM system_config');

    // 重置自增ID
    await db.run('DELETE FROM sqlite_sequence');

    console.log('✅ 数据库清理完成！');
    console.log('💡 请运行 node scripts/init-database.js 重新初始化数据');

  } catch (error) {
    console.error('❌ 清理数据库失败:', error);
  }
}

cleanDatabase(); 