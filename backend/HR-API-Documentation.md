# 人力资源管理模块 API 文档

## 概述

本文档描述了医院综合管理平台人力资源模块的后端API接口。该模块包含了完整的人力资源管理功能，包括员工档案、招聘管理、考勤管理、请假管理、绩效考核和薪酬福利管理。

## 基础信息

- **API基础URL**: `http://localhost:3001/api/hr`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON
- **数据库**: SQLite

## 模块功能

### 1. 员工档案管理 (`/employees`)

#### 1.1 获取员工列表
- **接口**: `GET /api/hr/employees`
- **参数**: 
  - `page`: 页码
  - `limit`: 每页条数
  - `search`: 搜索关键词
  - `department_id`: 部门ID
  - `status`: 员工状态

#### 1.2 获取员工详情
- **接口**: `GET /api/hr/employees/:id`

#### 1.3 创建员工
- **接口**: `POST /api/hr/employees`
- **参数**: 员工信息（姓名、工号、部门、职位等）

#### 1.4 更新员工信息
- **接口**: `PUT /api/hr/employees/:id`

#### 1.5 删除员工
- **接口**: `DELETE /api/hr/employees/:id`

#### 1.6 员工统计信息
- **接口**: `GET /api/hr/employees/stats/summary`

### 2. 招聘管理 (`/recruitment`)

#### 2.1 职位管理
- **获取职位列表**: `GET /api/hr/recruitment/positions`
- **创建职位**: `POST /api/hr/recruitment/positions`
- **更新职位**: `PUT /api/hr/recruitment/positions/:id`
- **删除职位**: `DELETE /api/hr/recruitment/positions/:id`

#### 2.2 应聘者管理
- **获取应聘者列表**: `GET /api/hr/recruitment/applications`
- **创建应聘记录**: `POST /api/hr/recruitment/applications`
- **更新应聘状态**: `PUT /api/hr/recruitment/applications/:id/status`

#### 2.3 招聘统计
- **接口**: `GET /api/hr/recruitment/stats`

### 3. 考勤管理 (`/attendance`)

#### 3.1 考勤记录
- **获取考勤列表**: `GET /api/hr/attendance/records`
- **创建考勤记录**: `POST /api/hr/attendance/records`
- **打卡接口**: `POST /api/hr/attendance/punch`

#### 3.2 排班管理
- **获取排班列表**: `GET /api/hr/attendance/schedules`
- **创建排班**: `POST /api/hr/attendance/schedules`
- **批量排班**: `POST /api/hr/attendance/schedules/batch`
- **更新排班**: `PUT /api/hr/attendance/schedules/:id`

#### 3.3 考勤统计
- **统计信息**: `GET /api/hr/attendance/stats`
- **月度报告**: `GET /api/hr/attendance/monthly-report/:employee_id`

### 4. 请假管理 (`/leave`)

#### 4.1 请假申请
- **获取请假列表**: `GET /api/hr/leave/requests`
- **创建请假申请**: `POST /api/hr/leave/requests`
- **审批请假**: `PUT /api/hr/leave/requests/:id/approve`

#### 4.2 请假统计
- **统计信息**: `GET /api/hr/leave/stats`
- **请假余额**: `GET /api/hr/leave/balance/:employee_id`

### 5. 绩效考核 (`/performance`)

#### 5.1 绩效评估
- **获取考核列表**: `GET /api/hr/performance/evaluations`
- **创建绩效考核**: `POST /api/hr/performance/evaluations`
- **更新绩效考核**: `PUT /api/hr/performance/evaluations/:id`
- **提交考核**: `PUT /api/hr/performance/evaluations/:id/submit`
- **批量创建**: `POST /api/hr/performance/evaluations/batch`

#### 5.2 绩效分析
- **统计信息**: `GET /api/hr/performance/stats`
- **员工绩效历史**: `GET /api/hr/performance/history/:employee_id`

### 6. 薪酬福利 (`/salary`)

#### 6.1 薪酬管理
- **获取薪酬记录**: `GET /api/hr/salary/records`
- **创建薪酬记录**: `POST /api/hr/salary/records`
- **发放薪酬**: `PUT /api/hr/salary/records/:id/pay`
- **批量发放**: `PUT /api/hr/salary/records/batch-pay`

#### 6.2 薪酬统计
- **统计信息**: `GET /api/hr/salary/stats`

## 数据库结构

### 主要数据表

1. **employees** - 员工档案表
2. **job_positions** - 招聘职位表
3. **job_applications** - 应聘者表
4. **attendance_records** - 考勤记录表
5. **work_schedules** - 排班表
6. **leave_requests** - 请假申请表
7. **compensatory_leaves** - 调休记录表
8. **performance_evaluations** - 绩效考核表
9. **salary_records** - 薪酬记录表
10. **benefits** - 福利管理表
11. **employee_benefits** - 员工福利关联表

## 安装和初始化

### 1. 安装依赖
```bash
cd backend
npm install
```

### 2. 初始化数据库
```bash
# 初始化基础数据库
npm run init-db

# 初始化人力资源模块数据库
npm run init-hr
```

### 3. 启动服务
```bash
npm start
# 或开发模式
npm run dev
```

## 认证说明

所有API接口都需要通过身份认证，需要在请求头中包含JWT令牌：

```http
Authorization: Bearer <token>
```

默认管理员账号：
- 用户名: `admin`
- 密码: `admin123`

## 错误处理

API统一返回格式：

成功响应：
```json
{
  "status": "success",
  "data": {...},
  "message": "操作成功"
}
```

错误响应：
```json
{
  "status": "error",
  "message": "错误描述"
}
```

## 数据验证

所有接口都包含完整的数据验证，使用Joi库进行参数校验，确保数据的完整性和安全性。

## 特色功能

1. **完整的权限控制** - 所有接口都集成了JWT认证
2. **数据关联查询** - 支持跨表查询，返回关联数据
3. **分页和搜索** - 所有列表接口都支持分页和搜索功能
4. **批量操作** - 支持批量创建、更新和删除操作
5. **统计分析** - 提供丰富的统计分析接口
6. **数据完整性** - 包含完整的数据验证和约束

## 下一步开发

1. **前端界面开发** - 基于这些API开发前端管理界面
2. **报表功能** - 添加更多的报表和图表功能
3. **消息通知** - 添加邮件和短信通知功能
4. **文件上传** - 添加简历、头像等文件上传功能
5. **导入导出** - 添加Excel导入导出功能

---

**注意**: 本模块是医院综合管理平台的人力资源子模块，与现有的用户管理、角色管理等基础模块完全集成。 