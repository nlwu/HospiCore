import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const { data } = response
    // 如果后端返回的状态是success，直接返回数据
    if (data.status === 'success') {
      return data
    }
    // 如果后端返回错误状态，抛出错误
    if (data.status === 'error') {
      ElMessage.error(data.message || '请求失败')
      throw new Error(data.message || '请求失败')
    }
    return data
  },
  (error) => {
    // 处理HTTP错误状态码
    if (error.response) {
      const { status, data } = error.response
      switch (status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          localStorage.removeItem('isLoggedIn')
          ElMessage.error(data.message || '登录已过期，请重新登录')
          // 如果不在登录页，则跳转到登录页
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
          break
        case 403:
          ElMessage.error(data.message || '权限不足')
          break
        case 404:
          ElMessage.error(data.message || '接口不存在')
          break
        case 500:
          ElMessage.error(data.message || '服务器内部错误')
          break
        default:
          ElMessage.error(data.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      ElMessage.error('请求失败')
    }
    return Promise.reject(error)
  }
)

// 认证相关API
export const authAPI = {
  // 登录
  login: (data) => api.post('/auth/login', data),
  
  // 退出登录
  logout: () => api.post('/auth/logout'),
  
  // 获取当前用户信息
  getProfile: () => api.get('/auth/profile'),
  
  // 获取用户菜单权限
  getMenus: () => api.get('/auth/menus'),
  
  // 修改密码
  changePassword: (data) => api.post('/auth/change-password', data)
}

// 用户管理API
export const userAPI = {
  // 获取用户列表
  getUsers: (params) => api.get('/users', { params }),
  
  // 获取用户详情
  getUser: (id) => api.get(`/users/${id}`),
  
  // 创建用户
  createUser: (data) => api.post('/users', data),
  
  // 更新用户
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  
  // 删除用户
  deleteUser: (id) => api.delete(`/users/${id}`),
  
  // 重置密码
  resetPassword: (id, data) => api.post(`/users/${id}/reset-password`, data)
}

// 角色管理API
export const roleAPI = {
  // 获取角色列表
  getRoles: (params) => api.get('/roles', { params }),
  
  // 获取所有角色（用于下拉选择）
  getAllRoles: () => api.get('/roles/all'),
  
  // 获取角色详情
  getRole: (id) => api.get(`/roles/${id}`),
  
  // 创建角色
  createRole: (data) => api.post('/roles', data),
  
  // 更新角色
  updateRole: (id, data) => api.put(`/roles/${id}`, data),
  
  // 删除角色
  deleteRole: (id) => api.delete(`/roles/${id}`)
}

// 菜单管理API
export const menuAPI = {
  // 获取菜单列表
  getMenus: () => api.get('/menus'),
  
  // 获取菜单详情
  getMenu: (id) => api.get(`/menus/${id}`),
  
  // 创建菜单
  createMenu: (data) => api.post('/menus', data),
  
  // 更新菜单
  updateMenu: (id, data) => api.put(`/menus/${id}`, data),
  
  // 删除菜单
  deleteMenu: (id) => api.delete(`/menus/${id}`)
}

// 系统管理API
export const systemAPI = {
  // 部门管理
  getDepartments: () => api.get('/system/departments'),
  getAllDepartments: () => api.get('/system/departments/all'),
  createDepartment: (data) => api.post('/system/departments', data),
  updateDepartment: (id, data) => api.put(`/system/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/system/departments/${id}`),
  getDepartment: (id) => api.get(`/system/departments/${id}`),
  
  // 系统配置
  getConfig: () => api.get('/system/config'),
  updateConfig: (key, data) => api.put(`/system/config/${key}`, data),
  
  // 操作日志
  getLogs: (params) => api.get('/system/logs', { params }),
  cleanupLogs: () => api.delete('/system/logs/cleanup'),
  
  // 系统信息
  getSystemInfo: () => api.get('/system/info'),
  
  // 获取员工列表（用于部门经理选择）
  getEmployees: () => api.get('/hr/employees/simple')
}

// HR人力资源管理API
export const hrAPI = {
  // 部门管理
  getDepartments: (params) => api.get('/system/departments/all', { params }),

  // 招聘管理 - 简化API
  getStats: () => api.get('/hr/recruitment/stats'),
  getJobPositions: (params) => api.get('/hr/recruitment/positions', { params }),
  createJobPosition: (data) => api.post('/hr/recruitment/positions', data),
  updateJobPosition: (id, data) => api.put(`/hr/recruitment/positions/${id}`, data),
  deleteJobPosition: (id) => api.delete(`/hr/recruitment/positions/${id}`),
  getJobPosition: (id) => api.get(`/hr/recruitment/positions/${id}`),
  
  getJobApplications: (params) => api.get('/hr/recruitment/applications', { params }),
  updateJobApplication: (id, data) => api.put(`/hr/recruitment/applications/${id}/status`, data),
  getJobApplication: (id) => api.get(`/hr/recruitment/applications/${id}`),

  // 员工管理 - 简化API
  employees: {
    getList: (params) => api.get('/hr/employees', { params }),
    getStats: () => api.get('/hr/employees/stats/summary'),
    create: (data) => api.post('/hr/employees', data),
    update: (id, data) => api.put(`/hr/employees/${id}`, data),
    delete: (id) => api.delete(`/hr/employees/${id}`),
    export: (params) => api.get('/hr/employees/export', { params })
  },

  // 招聘管理
  recruitment: {
    // 职位管理
    positions: {
      getList: (params) => api.get('/hr/recruitment/positions', { params }),
      getDetail: (id) => api.get(`/hr/recruitment/positions/${id}`),
      create: (data) => api.post('/hr/recruitment/positions', data),
      update: (id, data) => api.put(`/hr/recruitment/positions/${id}`, data),
      delete: (id) => api.delete(`/hr/recruitment/positions/${id}`),
      publish: (id) => api.post(`/hr/recruitment/positions/${id}/publish`),
      close: (id) => api.post(`/hr/recruitment/positions/${id}/close`)
    },
    
    // 应聘管理
    applications: {
      getList: (params) => api.get('/hr/recruitment/applications', { params }),
      getDetail: (id) => api.get(`/hr/recruitment/applications/${id}`),
      create: (data) => api.post('/hr/recruitment/applications', data),
      update: (id, data) => api.put(`/hr/recruitment/applications/${id}`, data),
      delete: (id) => api.delete(`/hr/recruitment/applications/${id}`),
      interview: (id, data) => api.post(`/hr/recruitment/applications/${id}/interview`, data),
      approve: (id) => api.post(`/hr/recruitment/applications/${id}/approve`),
      reject: (id, data) => api.post(`/hr/recruitment/applications/${id}/reject`, data)
    },
    
    // 获取招聘统计
    getStats: () => api.get('/hr/recruitment/stats')
  },

  // 考勤管理
  attendance: {
    // 考勤记录
    records: {
      getList: (params) => api.get('/hr/attendance/records', { params }),
      create: (data) => api.post('/hr/attendance/records', data),
      update: (id, data) => api.put(`/hr/attendance/records/${id}`, data),
      delete: (id) => api.delete(`/hr/attendance/records/${id}`),
      punchIn: (data) => api.post('/hr/attendance/records/punch-in', data),
      punchOut: (data) => api.post('/hr/attendance/records/punch-out', data),
      getMonthlyReport: (params) => api.get('/hr/attendance/records/monthly-report', { params })
    },
    
    // 排班管理
    schedules: {
      getList: (params) => api.get('/hr/attendance/schedules', { params }),
      create: (data) => api.post('/hr/attendance/schedules', data),
      update: (id, data) => api.put(`/hr/attendance/schedules/${id}`, data),
      delete: (id) => api.delete(`/hr/attendance/schedules/${id}`),
      batchCreate: (data) => api.post('/hr/attendance/schedules/batch', data),
      getByEmployee: (employeeId, params) => api.get(`/hr/attendance/schedules/employee/${employeeId}`, { params })
    },
    
    // 获取考勤统计
    getStats: (params) => api.get('/hr/attendance/stats', { params })
  },

  // 请假管理
  leave: {
    // 请假申请
    requests: {
      getList: (params) => api.get('/hr/leave/requests', { params }),
      getDetail: (id) => api.get(`/hr/leave/requests/${id}`),
      create: (data) => api.post('/hr/leave/requests', data),
      update: (id, data) => api.put(`/hr/leave/requests/${id}`, data),
      delete: (id) => api.delete(`/hr/leave/requests/${id}`),
      approve: (id, data) => api.post(`/hr/leave/requests/${id}/approve`, data),
      reject: (id, data) => api.post(`/hr/leave/requests/${id}/reject`, data),
      getByEmployee: (employeeId, params) => api.get(`/hr/leave/requests/employee/${employeeId}`, { params })
    },
    
    // 调休管理
    compensatory: {
      getList: (params) => api.get('/hr/leave/compensatory', { params }),
      create: (data) => api.post('/hr/leave/compensatory', data),
      update: (id, data) => api.put(`/hr/leave/compensatory/${id}`, data),
      delete: (id) => api.delete(`/hr/leave/compensatory/${id}`),
      use: (id, data) => api.post(`/hr/leave/compensatory/${id}/use`, data)
    },
    
    // 获取假期余额
    getBalance: (employeeId) => api.get(`/hr/leave/balance/${employeeId}`),
    
    // 获取请假统计
    getStats: (params) => api.get('/hr/leave/stats', { params })
  },

  // 绩效管理
  performance: {
    // 绩效评估
    evaluations: {
      getList: (params) => api.get('/hr/performance/evaluations', { params }),
      getDetail: (id) => api.get(`/hr/performance/evaluations/${id}`),
      create: (data) => api.post('/hr/performance/evaluations', data),
      update: (id, data) => api.put(`/hr/performance/evaluations/${id}`, data),
      delete: (id) => api.delete(`/hr/performance/evaluations/${id}`),
      submit: (id) => api.post(`/hr/performance/evaluations/${id}/submit`),
      approve: (id, data) => api.post(`/hr/performance/evaluations/${id}/approve`, data),
      batchCreate: (data) => api.post('/hr/performance/evaluations/batch', data),
      getByEmployee: (employeeId, params) => api.get(`/hr/performance/evaluations/employee/${employeeId}`, { params })
    },
    
    // 获取绩效统计和趋势
    getStats: (params) => api.get('/hr/performance/stats', { params }),
    getTrends: (params) => api.get('/hr/performance/trends', { params })
  },

  // 薪酬管理
  salary: {
    // 薪酬记录
    records: {
      getList: (params) => api.get('/hr/salary/records', { params }),
      getDetail: (id) => api.get(`/hr/salary/records/${id}`),
      create: (data) => api.post('/hr/salary/records', data),
      update: (id, data) => api.put(`/hr/salary/records/${id}`, data),
      delete: (id) => api.delete(`/hr/salary/records/${id}`),
      pay: (id) => api.post(`/hr/salary/records/${id}/pay`),
      batchPay: (data) => api.post('/hr/salary/records/batch-pay', data),
      getByEmployee: (employeeId, params) => api.get(`/hr/salary/records/employee/${employeeId}`, { params })
    },
    
    // 福利管理
    benefits: {
      getList: (params) => api.get('/hr/salary/benefits', { params }),
      create: (data) => api.post('/hr/salary/benefits', data),
      update: (id, data) => api.put(`/hr/salary/benefits/${id}`, data),
      delete: (id) => api.delete(`/hr/salary/benefits/${id}`)
    },
    
    // 员工福利
    employeeBenefits: {
      getList: (params) => api.get('/hr/salary/employee-benefits', { params }),
      create: (data) => api.post('/hr/salary/employee-benefits', data),
      update: (id, data) => api.put(`/hr/salary/employee-benefits/${id}`, data),
      delete: (id) => api.delete(`/hr/salary/employee-benefits/${id}`),
      getByEmployee: (employeeId) => api.get(`/hr/salary/employee-benefits/employee/${employeeId}`)
    },
    
    // 获取薪酬统计
    getStats: (params) => api.get('/hr/salary/stats', { params })
  }
}

export default api 