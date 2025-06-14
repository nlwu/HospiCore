# 医院综合管理平台 - 后端API

基于 Node.js + Express + SQLite 的后端API服务，实现系统管理模块的完整功能。

## 功能特性

### 🔐 认证授权
- JWT token 认证
- 基于角色的权限控制(RBAC)
- 密码加密存储
- 登录日志记录

### 👥 用户管理
- 用户列表查询（支持分页、搜索、筛选）
- 用户信息增删改查
- 密码重置功能
- 用户状态管理

### 🎭 角色管理
- 角色列表管理
- 权限分配
- 菜单权限关联
- 角色状态管理

### 📋 菜单管理
- 树形菜单结构
- 菜单权限控制
- 动态菜单生成
- 菜单排序功能

### 🏢 部门管理
- 树形部门结构
- 部门层级管理
- 用户部门关联

### ⚙️ 系统配置
- 系统参数配置
- 配置项动态管理
- 配置变更日志

### 📊 操作日志
- 用户操作记录
- 日志查询筛选
- 日志清理功能

## 技术栈

- **运行环境**: Node.js 16+
- **Web框架**: Express 4.x
- **数据库**: SQLite 3.x
- **认证**: JWT
- **参数验证**: Joi
- **密码加密**: bcryptjs
- **安全防护**: helmet + cors
- **日志记录**: morgan

## 项目结构

```
backend/
├── app.js                 # 应用入口文件
├── package.json          # 项目依赖配置
├── .env.example          # 环境变量示例
├── config/
│   └── database.js       # 数据库配置
├── middleware/
│   ├── auth.js          # JWT认证中间件
│   └── permission.js    # 权限验证中间件
├── routes/
│   ├── auth.js          # 认证相关路由
│   ├── users.js         # 用户管理路由
│   ├── roles.js         # 角色管理路由
│   ├── menus.js         # 菜单管理路由
│   └── system.js        # 系统管理路由
├── scripts/
│   └── init-database.js # 数据库初始化脚本
├── data/            # SQLite数据库文件目录
└── uploads/             # 文件上传目录
```

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 环境配置

复制环境变量示例文件并根据需要修改：

```bash
cp .env.example .env
```

环境变量说明：
- `PORT`: 服务器端口，默认3000
- `NODE_ENV`: 运行环境，development/production
- `DB_PATH`: SQLite数据库文件路径
- `JWT_SECRET`: JWT签名密钥
- `JWT_EXPIRES_IN`: JWT过期时间
- `CORS_ORIGIN`: 允许跨域的前端地址

### 3. 初始化数据库

```bash
npm run init-db
```

此命令会：
- 创建所有必要的数据表
- 插入基础数据（角色、部门、菜单等）
- 创建默认管理员账户

**默认管理员账户：**
- 用户名: `admin`
- 密码: `admin123`

### 4. 启动服务

```bash
# 开发环境（热重载）
npm run dev

# 生产环境
npm start
```

服务启动后访问: http://localhost:3000

### 5. 健康检查

访问 http://localhost:3000/api/health 检查服务状态

## API接口文档

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/profile | 获取当前用户信息 |
| POST | /api/auth/change-password | 修改密码 |
| GET | /api/auth/menus | 获取用户菜单权限 |
| POST | /api/auth/logout | 用户注销 |

### 用户管理接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/users | 获取用户列表 |
| GET | /api/users/:id | 获取用户详情 |
| POST | /api/users | 创建用户 |
| PUT | /api/users/:id | 更新用户 |
| DELETE | /api/users/:id | 删除用户 |
| POST | /api/users/:id/reset-password | 重置密码 |

### 角色管理接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/roles | 获取角色列表 |
| GET | /api/roles/all | 获取所有角色（下拉用） |
| GET | /api/roles/:id | 获取角色详情 |
| POST | /api/roles | 创建角色 |
| PUT | /api/roles/:id | 更新角色 |
| DELETE | /api/roles/:id | 删除角色 |

### 菜单管理接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/menus | 获取菜单列表 |
| GET | /api/menus/:id | 获取菜单详情 |
| POST | /api/menus | 创建菜单 |
| PUT | /api/menus/:id | 更新菜单 |
| DELETE | /api/menus/:id | 删除菜单 |

### 系统管理接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/system/departments | 获取部门列表 |
| GET | /api/system/departments/all | 获取所有部门（下拉用） |
| POST | /api/system/departments | 创建部门 |
| PUT | /api/system/departments/:id | 更新部门 |
| DELETE | /api/system/departments/:id | 删除部门 |
| GET | /api/system/config | 获取系统配置 |
| PUT | /api/system/config/:key | 更新系统配置 |
| GET | /api/system/logs | 获取操作日志 |
| DELETE | /api/system/logs/cleanup | 清理操作日志 |
| GET | /api/system/info | 获取系统信息 |

## 权限说明

系统采用基于角色的权限控制(RBAC)：

### 权限标识格式
- `模块:操作` 如 `user:view`、`user:create`
- `模块` 表示拥有该模块所有权限
- `*` 表示超级管理员权限

### 预置权限
- `user:view` - 查看用户
- `user:create` - 创建用户  
- `user:update` - 更新用户
- `user:delete` - 删除用户
- `role:view` - 查看角色
- `role:create` - 创建角色
- `role:update` - 更新角色
- `role:delete` - 删除角色
- `menu:view` - 查看菜单
- `menu:create` - 创建菜单
- `menu:update` - 更新菜单
- `menu:delete` - 删除菜单
- `department:view` - 查看部门
- `department:create` - 创建部门
- `department:update` - 更新部门
- `department:delete` - 删除部门
- `system:config` - 系统配置
- `system:log` - 系统日志
- `system:view` - 系统信息

## 数据库设计

### 核心表结构

- **users** - 用户表
- **roles** - 角色表  
- **menus** - 菜单表
- **role_menus** - 角色菜单关联表
- **departments** - 部门表
- **system_config** - 系统配置表
- **operation_logs** - 操作日志表

### 关系说明
- 用户与角色：多对一关系
- 用户与部门：多对一关系  
- 角色与菜单：多对多关系
- 部门支持树形结构（parent_id）
- 菜单支持树形结构（parent_id）

## 开发指南

### 添加新的权限控制

1. 在路由中使用权限中间件：
```javascript
router.get('/', checkPermission('module:action'), async (req, res) => {
  // 路由处理逻辑
});
```

2. 在角色权限中添加对应权限标识

### 添加新的API接口

1. 在对应的路由文件中添加新路由
2. 添加参数验证（使用Joi）
3. 添加权限验证
4. 记录操作日志
5. 更新API文档

### 扩展数据表

1. 在 `scripts/init-database.js` 中添加表结构
2. 在 `config/database.js` 中添加相应的操作方法
3. 创建对应的路由和控制器

## 部署说明

### 生产环境部署

1. 设置环境变量 `NODE_ENV=production`
2. 使用 PM2 等进程管理工具
3. 配置反向代理（Nginx）
4. 设置 HTTPS
5. 定期备份数据库文件

### Docker 部署

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 常见问题

### Q: 忘记管理员密码怎么办？
A: 重新运行 `npm run init-db` 重置数据库，或直接修改数据库中的密码字段

### Q: 如何修改默认端口？
A: 修改 `.env` 文件中的 `PORT` 配置

### Q: 如何备份数据？
A: 直接复制 SQLite 数据库文件即可

### Q: 如何清理日志？
A: 调用 `/api/system/logs/cleanup` 接口或直接操作数据库

## 更新日志

### v1.0.0 (2024-01-XX)
- ✨ 完整的系统管理模块
- 🔐 JWT认证和权限控制
- 📱 RESTful API设计
- 🗄️ SQLite数据库存储
- 📝 完整的操作日志
- 🛡️ 安全防护中间件

---

如有问题或建议，请提交 Issue 或 Pull Request。 