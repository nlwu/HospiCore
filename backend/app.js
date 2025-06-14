const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// 设置默认环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '3001';
process.env.DB_PATH = process.env.DB_PATH || './data/hospital.db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

require('dotenv').config();

const db = require('./config/database');
const authMiddleware = require('./middleware/auth');

// 路由导入
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const menuRoutes = require('./routes/menus');
const systemRoutes = require('./routes/system');

// 人力资源模块路由
const employeeRoutes = require('./routes/employees');
const recruitmentRoutes = require('./routes/recruitment');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leave');
const performanceRoutes = require('./routes/performance');
const salaryRoutes = require('./routes/salary');

const app = express();

// 中间件配置
app.use(helmet());
app.use(cors({
  // origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  origin: '*', 
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/roles', authMiddleware, roleRoutes);
app.use('/api/menus', authMiddleware, menuRoutes);
app.use('/api/system', authMiddleware, systemRoutes);

// 人力资源模块路由
app.use('/api/hr/employees', authMiddleware, employeeRoutes);
app.use('/api/hr/recruitment', authMiddleware, recruitmentRoutes);
app.use('/api/hr/attendance', authMiddleware, attendanceRoutes);
app.use('/api/hr/leave', authMiddleware, leaveRoutes);
app.use('/api/hr/performance', authMiddleware, performanceRoutes);
app.use('/api/hr/salary', authMiddleware, salaryRoutes);

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: '服务器运行正常',
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: '接口不存在'
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV}`);
  console.log(`数据库路径: ${process.env.DB_PATH}`);
}); 