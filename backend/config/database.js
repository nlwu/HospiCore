const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// 确保数据库目录存在
const dbDir = path.dirname(process.env.DB_PATH || './data/hospital.db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || './data/hospital.db';

let db = null;

// 初始化数据库
const initDatabase = async () => {
  if (db) return db;
  
  const SQL = await initSqlJs();
  
  // 尝试从文件加载现有数据库
  let dbData = null;
  if (fs.existsSync(dbPath)) {
    dbData = fs.readFileSync(dbPath);
  }
  
  db = new SQL.Database(dbData);
  
  console.log('SQLite数据库连接成功');
  
  // 启用外键约束
  db.run('PRAGMA foreign_keys = ON');
  
  return db;
};

// 保存数据库到文件
const saveDatabase = () => {
  if (db) {
    const data = db.export();
    fs.writeFileSync(dbPath, data);
  }
};

// 数据库操作封装
const dbOperations = {
  // 初始化数据库连接
  init: async () => {
    await initDatabase();
  },

  // 执行查询
  query: async (sql, params = []) => {
    try {
      await initDatabase();
      const stmt = db.prepare(sql);
      const results = [];
      
      stmt.bind(params);
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      
      return results;
    } catch (error) {
      console.error('查询失败:', error);
      throw error;
    }
  },

  // 执行单条查询
  get: async (sql, params = []) => {
    try {
      await initDatabase();
      const stmt = db.prepare(sql);
      stmt.bind(params);
      
      let result = null;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();
      
      return result;
    } catch (error) {
      console.error('查询失败:', error);
      throw error;
    }
  },

  // 执行插入/更新/删除
  run: async (sql, params = []) => {
    try {
      await initDatabase();
      const stmt = db.prepare(sql);
      stmt.bind(params);
      stmt.step();
      
      const result = {
        id: db.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0] || null,
        changes: db.getRowsModified()
      };
      
      stmt.free();
      
      // 保存到文件
      saveDatabase();
      
      return result;
    } catch (error) {
      console.error('执行失败:', error);
      throw error;
    }
  },

  // 批量执行（事务）
  batch: async (operations) => {
    try {
      await initDatabase();
      
      db.run('BEGIN TRANSACTION');
      
      const results = [];
      for (const op of operations) {
        const stmt = db.prepare(op.sql);
        stmt.bind(op.params);
        stmt.step();
        
        results.push({
          id: db.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0] || null,
          changes: db.getRowsModified()
        });
        
        stmt.free();
      }
      
      db.run('COMMIT');
      
      // 保存到文件
      saveDatabase();
      
      return results;
    } catch (error) {
      db.run('ROLLBACK');
      console.error('批量执行失败:', error);
      throw error;
    }
  }
};

module.exports = dbOperations; 