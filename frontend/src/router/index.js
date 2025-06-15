import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Layout from '../components/Layout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '工作台', icon: 'House' }
      },
      // HRP系统路由
      {
        path: '/hrp/hr/employee',
        name: 'EmployeeManagement',
        component: () => import('../views/hrp/hr/EmployeeManagement.vue'),
        meta: { title: '员工档案管理', icon: 'User', parent: 'HRP人力资源' }
      },
      {
        path: '/hrp/hr/recruitment',
        name: 'RecruitmentManagement',
        component: () => import('../views/hrp/hr/RecruitmentManagement.vue'),
        meta: { title: '招聘与入职', icon: 'UserFilled', parent: 'HRP人力资源' }
      },
      {
        path: '/hrp/hr/attendance',
        name: 'AttendanceManagement',
        component: () => import('../views/hrp/hr/AttendanceManagement.vue'),
        meta: { title: '考勤排班管理', icon: 'Clock', parent: 'HRP人力资源' }
      },
      {
        path: '/hrp/hr/leave',
        name: 'LeaveManagement',
        component: () => import('../views/hrp/hr/LeaveManagement.vue'),
        meta: { title: '假勤与调休', icon: 'Calendar', parent: 'HRP人力资源' }
      },
      {
        path: '/hrp/hr/performance',
        name: 'PerformanceManagement',
        component: () => import('../views/hrp/hr/PerformanceManagement.vue'),
        meta: { title: '绩效考核', icon: 'TrendCharts', parent: 'HRP人力资源' }
      },
      {
        path: '/hrp/hr/salary',
        name: 'SalaryManagement',
        component: () => import('../views/hrp/hr/SalaryManagement.vue'),
        meta: { title: '薪酬福利', icon: 'Money', parent: 'HRP人力资源' }
      },
      {
        path: '/hrp/finance/budget',
        name: 'BudgetManagement',
        component: () => import('../views/hrp/finance/BudgetManagement.vue'),
        meta: { title: '全面预算管理', icon: 'Wallet', parent: 'HRP财务管理' }
      },
      {
        path: '/hrp/finance/expense',
        name: 'ExpenseManagement',
        component: () => import('../views/hrp/finance/ExpenseManagement.vue'),
        meta: { title: '费用报销支付', icon: 'CreditCard', parent: 'HRP财务管理' }
      },
      {
        path: '/hrp/asset/management',
        name: 'AssetManagement',
        component: () => import('../views/hrp/asset/AssetManagement.vue'),
        meta: { title: '资产全生命周期', icon: 'Box', parent: 'HRP资产管理' }
      },
      // 系统管理路由
      {
        path: '/system/users',
        name: 'Users',
        component: () => import('../views/system/Users.vue'),
        meta: { title: '用户管理', icon: 'User', parent: '系统管理' }
      },
      {
        path: '/system/roles',
        name: 'Roles',
        component: () => import('../views/system/Roles.vue'),
        meta: { title: '角色管理', icon: 'UserFilled', parent: '系统管理' }
      },
      {
        path: '/system/departments',
        name: 'DepartmentManagement',
        component: () => import('../views/hrp/system/DepartmentManagement.vue'),
        meta: { title: '部门管理', icon: 'OfficeBuilding', parent: '系统管理' }
      },
      {
        path: '/profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue'),
        meta: { title: '个人中心', icon: 'User' }
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import('../views/system/Settings.vue'),
        meta: { title: '系统设置', icon: 'Setting' }
      },
      // 工作流中心路由
      {
        path: '/workflow/todo',
        name: 'TodoList',
        component: () => import('../views/workflow/TodoList.vue'),
        meta: { title: '待办事项', icon: 'Clock', parent: '工作流中心' }
      },
      {
        path: '/workflow/my-process',
        name: 'MyProcess',
        component: () => import('../views/workflow/MyProcess.vue'),
        meta: { title: '我的流程', icon: 'Finished', parent: '工作流中心' }
      }
      // 注释掉功能演示菜单
      // {
      //   path: '/demo/list',
      //   name: 'ListDemo',
      //   component: () => import('../views/demo/ListDemo.vue'),
      //   meta: { title: '列表功能', icon: 'List', parent: '功能演示' }
      // },
      // {
      //   path: '/demo/form',
      //   name: 'FormDemo',
      //   component: () => import('../views/demo/FormDemo.vue'),
      //   meta: { title: '表单功能', icon: 'Edit', parent: '功能演示' }
      // }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router 