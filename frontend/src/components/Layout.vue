<template>
  <el-container class="layout-container">
    <!-- 顶部导航 -->
    <el-header class="layout-header">
      <div class="header-left">
        <el-button
          text
          @click="collapsed = !collapsed"
          :icon="collapsed ? 'Expand' : 'Fold'"
          class="menu-toggle-btn"
        />
        <img src="/hospital-logo.svg" alt="Logo" class="hospital-logo" />
        <div class="platform-info">
          <span class="platform-name">医院综合管理平台</span>
          <span class="platform-subtitle">Hospital Management System</span>
        </div>
      </div>

      <div class="header-center">
        <el-input
          v-model="searchKeyword"
          placeholder="全局搜索..."
          prefix-icon="Search"
          size="small"
          style="width: 300px"
          @keyup.enter="handleGlobalSearch"
        />
      </div>

      <div class="header-right">
        <!-- 通知和用户信息 -->
        <div class="header-actions">
          <el-badge :value="3" class="notification-badge">
            <el-button 
              circle 
              @click="handleNotificationClick"
              class="notification-btn"
            >
              <el-icon><Bell /></el-icon>
            </el-button>
          </el-badge>
          
          <el-dropdown @command="handleUserAction" class="user-dropdown">
            <div class="user-info">
              <el-avatar :size="32" :src="userInfo.avatar">
                {{ userInfo.name?.charAt(0) }}
              </el-avatar>
              <span class="username">{{ userInfo.name }}</span>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>系统设置
                </el-dropdown-item>
                <el-dropdown-item command="password">
                  <el-icon><Lock /></el-icon>修改密码
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <el-container>
      <!-- 左侧菜单 -->
      <el-aside :width="collapsed ? '64px' : '240px'" class="layout-aside">
        <el-menu
          :default-active="activeMenu"
          :collapse="collapsed"
          :unique-opened="true"
          router
          class="layout-menu"
        >
          <template v-for="route in menuRoutes" :key="route.path">
            <el-sub-menu v-if="route.children && route.children.length > 0" :index="`menu-${route.path}`">
              <template #title>
                <el-icon><component :is="route.meta?.icon" /></el-icon>
                <span>{{ route.meta?.title }}</span>
              </template>
              
              <!-- 处理二级菜单 -->
              <template v-for="child in route.children" :key="child.path">
                <el-sub-menu v-if="child.children && child.children.length > 0" :index="`submenu-${child.path}`">
                  <template #title>
                    <el-icon><component :is="child.meta?.icon" /></el-icon>
                    <span>{{ child.meta?.title }}</span>
                  </template>
                  <el-menu-item
                    v-for="grandChild in child.children"
                    :key="grandChild.path"
                    :index="grandChild.path"
                  >
                    <el-icon><component :is="grandChild.meta?.icon" /></el-icon>
                    <span>{{ grandChild.meta?.title }}</span>
                  </el-menu-item>
                </el-sub-menu>
                
                <el-menu-item v-else :index="child.path">
                  <el-icon><component :is="child.meta?.icon" /></el-icon>
                  <span>{{ child.meta?.title }}</span>
                </el-menu-item>
              </template>
            </el-sub-menu>
            
            <el-menu-item v-else :index="route.path">
              <el-icon><component :is="route.meta?.icon" /></el-icon>
              <span>{{ route.meta?.title }}</span>
            </el-menu-item>
          </template>
        </el-menu>
      </el-aside>

      <!-- 主工作区 -->
      <el-main class="layout-main">
        <!-- 面包屑导航 -->
        <el-breadcrumb class="breadcrumb" separator="/">
          <el-breadcrumb-item
            v-for="breadcrumb in breadcrumbs"
            :key="breadcrumb.path"
            :to="breadcrumb.path"
          >
            {{ breadcrumb.title }}
          </el-breadcrumb-item>
        </el-breadcrumb>

        <!-- 页面内容 -->
        <div class="page-content">
          <router-view />
        </div>
      </el-main>
    </el-container>

    <!-- 消息中心弹窗 -->
    <el-drawer v-model="messageDrawer" title="消息中心" size="400px">
      <div class="message-list">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-item"
          :class="{ unread: !message.read }"
        >
          <div class="message-header">
            <span class="message-title">{{ message.title }}</span>
            <span class="message-time">{{ formatTime(message.time) }}</span>
          </div>
          <div class="message-content">{{ message.content }}</div>
          <div class="message-actions">
            <el-button size="small" text @click="markAsRead(message)">
              标记已读
            </el-button>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="passwordDialog.visible" title="修改密码" width="400px">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="80px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleChangePassword" :loading="passwordDialog.loading">
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { authAPI } from '@/utils/api'

const router = useRouter()
const route = useRoute()

const collapsed = ref(false)
const searchKeyword = ref('')
const messageDrawer = ref(false)
const userInfo = ref({})
const passwordFormRef = ref()

const passwordDialog = reactive({
  visible: false,
  loading: false
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = reactive({
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

const messages = ref([
  {
    id: 1,
    title: '系统通知',
    content: '系统将于今晚22:00-23:00进行维护升级',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false
  },
  {
    id: 2,
    title: '审批提醒',
    content: '您有3个待审批的请假申请',
    time: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: false
  },
  {
    id: 3,
    title: '会议通知',
    content: '明天上午9:00召开科主任例会',
    time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    read: true
  }
])

// 计算未读消息数量
const messageCount = computed(() => {
  return messages.value.filter(m => !m.read).length
})

// 模拟待办数量
const todoCount = ref(5)

// 获取菜单路由
const menuRoutes = computed(() => {
  const menuData = [
    {
      path: '/dashboard',
      meta: { title: '工作台', icon: 'House' }
    },
    {
      path: '/hrp',
      meta: { title: 'HRP系统', icon: 'OfficeBuilding' },
      children: [
        {
          path: '/hrp/hr',
          meta: { title: '人力资源', icon: 'User' },
          children: [
            {
              path: '/hrp/hr/employee',
              meta: { title: '员工档案管理', icon: 'UserFilled' }
            },
            {
              path: '/hrp/hr/recruitment',
              meta: { title: '招聘与入职', icon: 'Plus' }
            },
            {
              path: '/hrp/hr/attendance',
              meta: { title: '考勤排班管理', icon: 'Clock' }
            },
            {
              path: '/hrp/hr/leave',
              meta: { title: '假勤与调休', icon: 'Calendar' }
            },
            {
              path: '/hrp/hr/performance',
              meta: { title: '绩效考核', icon: 'TrendCharts' }
            },
            {
              path: '/hrp/hr/salary',
              meta: { title: '薪酬福利', icon: 'Money' }
            }
          ]
        },
        {
          path: '/hrp/finance',
          meta: { title: '财务管理', icon: 'Money' },
          children: [
            {
              path: '/hrp/finance/budget',
              meta: { title: '全面预算管理', icon: 'DataAnalysis' }
            },
            {
              path: '/hrp/finance/expense',
              meta: { title: '费用报销支付', icon: 'CreditCard' }
            }
          ]
        },
        {
          path: '/hrp/asset',
          meta: { title: '资产管理', icon: 'Box' },
          children: [
            {
              path: '/hrp/asset/management',
              meta: { title: '资产全生命周期', icon: 'Setting' }
            }
          ]
        }
      ]
    },
    {
      path: '/system',
      meta: { title: '系统管理', icon: 'Setting' },
      children: [
        {
          path: '/system/users',
          meta: { title: '用户管理', icon: 'User' }
        },
        {
          path: '/system/roles',
          meta: { title: '角色管理', icon: 'UserFilled' }
        },
        {
          path: '/system/departments',
          meta: { title: '部门管理', icon: 'OfficeBuilding' }
        }
      ]
    },
    {
      path: '/workflow',
      meta: { title: '工作流中心', icon: 'Document' },
      children: [
        {
          path: '/workflow/todo',
          meta: { title: '待办事项', icon: 'Clock' }
        },
        {
          path: '/workflow/my-process',
          meta: { title: '我的流程', icon: 'Finished' }
        }
      ]
    }
  ]
  return menuData
})

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})

// 面包屑导航
const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  const breadcrumbs = []
  
  matched.forEach(item => {
    if (item.path !== '/') {
      breadcrumbs.push({
        path: item.path,
        title: item.meta.title
      })
    }
  })
  
  return breadcrumbs
})

// 格式化时间
const formatTime = (time) => {
  const now = new Date()
  const diff = now - time
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else {
    return `${days}天前`
  }
}

// 处理全局搜索
const handleGlobalSearch = () => {
  if (searchKeyword.value.trim()) {
    ElMessage.info(`搜索：${searchKeyword.value}`)
  }
}

// 处理通知点击
const handleNotificationClick = () => {
  messageDrawer.value = true
}

// 标记消息为已读
const markAsRead = (message) => {
  message.read = true
  ElMessage.success('已标记为已读')
}

// 处理用户操作
const handleUserAction = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'password':
      passwordDialog.visible = true
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 修改密码
const handleChangePassword = async () => {
  try {
    await passwordFormRef.value.validate()
    
    passwordDialog.loading = true
    
    // 调用后端修改密码接口
    await authAPI.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    
    ElMessage.success('密码修改成功')
    passwordDialog.visible = false
    
    // 清空表单
    Object.assign(passwordForm, {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  } catch (error) {
    console.error('密码修改失败:', error)
    // 错误信息已经在API拦截器中处理了
  } finally {
    passwordDialog.loading = false
  }
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // 调用后端退出登录接口
      await authAPI.logout()
      
      // 清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('isLoggedIn')
      
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch (error) {
      console.error('退出登录失败:', error)
      // 即使后端接口失败，也清除本地数据并跳转到登录页
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('isLoggedIn')
      router.push('/login')
    }
  })
}

// 获取用户信息
const fetchUserProfile = async () => {
  try {
    const response = await authAPI.getProfile()
    if (response.status === 'success') {
      userInfo.value = response.data
      // 更新localStorage中的用户信息
      localStorage.setItem('userInfo', JSON.stringify(response.data))
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    // 如果获取用户信息失败，可能是token过期，跳转到登录页
    // (这里已经在API拦截器中处理了)
  }
}

onMounted(() => {
  const storedUserInfo = localStorage.getItem('userInfo')
  if (storedUserInfo) {
    userInfo.value = JSON.parse(storedUserInfo)
  }
  
  // 如果有token，获取最新的用户信息
  const token = localStorage.getItem('token')
  if (token) {
    fetchUserProfile()
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-header {
  background: linear-gradient(90deg, #2c3e50 0%, #34495e 100%);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 1000;
  border-bottom: 1px solid #34495e;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.hospital-logo {
  height: 36px;
  vertical-align: middle;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1)) brightness(1.2);
}

.platform-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.platform-name {
  font-size: 18px;
  font-weight: 700;
  color: #ecf0f1;
  letter-spacing: -0.3px;
}

.platform-subtitle {
  font-size: 12px;
  color: #bdc3c7;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-item {
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px;
  border-radius: 8px;
}

.header-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.username {
  font-size: 14px;
  color: #ecf0f1;
  font-weight: 500;
}

.layout-aside {
  background: #1e3a5f !important;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  transition: width 0.3s ease;
  border-right: 1px solid #2c4a6b !important;
}

.layout-menu {
  border-right: none !important;
  height: calc(100vh - 60px);
  background: transparent !important;
}

/* 主菜单项样式 */
.layout-menu.el-menu .el-menu-item {
  border-radius: 0 !important;
  margin: 0 !important;
  transition: all 0.3s ease !important;
  color: #ffffff !important;
  border-bottom: none !important;
  padding: 0 20px !important;
  height: 48px !important;
  line-height: 48px !important;
  font-size: 14px !important;
  background: transparent !important;
}

.layout-menu.el-menu .el-menu-item:hover {
  background: rgba(64, 158, 255, 0.1) !important;
  color: #ffffff !important;
}

.layout-menu.el-menu .el-menu-item.is-active {
  background: #409eff !important;
  color: #ffffff !important;
  border-left: none !important;
  box-shadow: none !important;
}

/* 子菜单标题样式 */
.layout-menu.el-menu .el-sub-menu > .el-sub-menu__title {
  border-radius: 0 !important;
  margin: 0 !important;
  transition: all 0.3s ease !important;
  color: #ffffff !important;
  border-bottom: none !important;
  padding: 0 20px !important;
  height: 48px !important;
  line-height: 48px !important;
  font-size: 14px !important;
  background: transparent !important;
}

.layout-menu.el-menu .el-sub-menu > .el-sub-menu__title:hover {
  background: rgba(64, 158, 255, 0.1) !important;
  color: #ffffff !important;
}

.layout-menu.el-menu .el-sub-menu.is-active > .el-sub-menu__title {
  background: rgba(64, 158, 255, 0.1) !important;
  color: #ffffff !important;
}

/* 子菜单容器 */
.layout-menu.el-menu .el-sub-menu .el-menu {
  background: #1a3352 !important;
}

/* 子菜单项样式 */
.layout-menu.el-menu .el-sub-menu .el-menu .el-menu-item {
  color: #ffffff !important;
  background: transparent !important;
  padding-left: 40px !important;
  height: 44px !important;
  line-height: 44px !important;
  font-size: 13px !important;
  border-bottom: none !important;
}

.layout-menu.el-menu .el-sub-menu .el-menu .el-menu-item:hover {
  background: rgba(64, 158, 255, 0.1) !important;
  color: #ffffff !important;
}

.layout-menu.el-menu .el-sub-menu .el-menu .el-menu-item.is-active {
  background: #409eff !important;
  color: #ffffff !important;
  border-left: none !important;
  box-shadow: none !important;
}

/* 三级子菜单项样式 */
.layout-menu.el-menu .el-sub-menu .el-menu .el-sub-menu .el-menu .el-menu-item {
  color: #ffffff !important;
  background: transparent !important;
  padding-left: 60px !important;
  height: 40px !important;
  line-height: 40px !important;
  font-size: 12px !important;
}

.layout-menu.el-menu .el-sub-menu .el-menu .el-sub-menu .el-menu .el-menu-item:hover {
  background: rgba(64, 158, 255, 0.1) !important;
  color: #ffffff !important;
}

.layout-menu.el-menu .el-sub-menu .el-menu .el-sub-menu .el-menu .el-menu-item.is-active {
  background: #409eff !important;
  color: #ffffff !important;
}

/* 修复菜单图标颜色 */
.layout-menu.el-menu .el-menu-item .el-icon,
.layout-menu.el-menu .el-sub-menu__title .el-icon {
  color: #ffffff !important;
  margin-right: 8px !important;
}

.layout-menu.el-menu .el-menu-item:hover .el-icon,
.layout-menu.el-menu .el-sub-menu__title:hover .el-icon,
.layout-menu.el-menu .el-menu-item.is-active .el-icon,
.layout-menu.el-menu .el-sub-menu .el-menu-item.is-active .el-icon {
  color: #ffffff !important;
}

/* 子菜单箭头颜色 */
.layout-menu.el-menu .el-sub-menu__icon-arrow {
  color: #ffffff !important;
}

/* 折叠状态下的样式优化 */
.layout-menu.el-menu--collapse .el-menu-item,
.layout-menu.el-menu--collapse .el-sub-menu__title {
  text-align: center !important;
  padding: 0 20px !important;
}

.layout-menu.el-menu--collapse .el-menu-item.is-active,
.layout-menu.el-menu--collapse .el-sub-menu .el-menu-item.is-active {
  border-left: none !important;
  border-right: none !important;
}

/* 确保文字不会被截断 */
.layout-menu.el-menu .el-menu-item span,
.layout-menu.el-menu .el-sub-menu__title span {
  color: inherit !important;
}

/* 移除所有默认的边框和分割线 */
.layout-menu.el-menu .el-menu-item,
.layout-menu.el-menu .el-sub-menu__title,
.layout-menu.el-menu .el-sub-menu .el-menu-item {
  border-bottom: none !important;
  border-top: none !important;
  border-left: none !important;
  border-right: none !important;
}

/* 确保菜单文字颜色 */
.layout-menu.el-menu .el-menu-item span,
.layout-menu.el-menu .el-sub-menu__title span,
.layout-menu.el-menu .el-sub-menu .el-menu-item span {
  color: #ffffff !important;
}

.layout-main {
  background: #f5f7fa;
  padding: 0;
}

.breadcrumb {
  background: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.page-content {
  height: calc(100vh - 60px - 53px);
  overflow-y: auto;
}

.message-list {
  padding: 0;
}

.message-item {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.message-item:hover {
  background: #f8fafc;
}

.message-item.unread {
  background: linear-gradient(90deg, #e3f2fd 0%, #f0f9ff 100%);
  border-left: 4px solid #409eff;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-title {
  font-weight: 600;
  color: #1a202c;
  font-size: 14px;
}

.message-time {
  font-size: 12px;
  color: #718096;
}

.message-content {
  color: #4a5568;
  font-size: 13px;
  margin-bottom: 12px;
  line-height: 1.5;
}

.message-actions {
  text-align: right;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-badge {
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px;
  border-radius: 8px;
}

.notification-badge:hover {
  background: rgba(255, 255, 255, 0.1);
}

.notification-btn {
  background: transparent !important;
  border: none !important;
  color: #bdc3c7 !important;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px;
  border-radius: 8px;
}

.notification-btn:hover {
  color: #3498db !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

.user-dropdown {
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px;
  border-radius: 8px;
}

.dropdown-icon {
  margin-left: 8px;
  color: #bdc3c7;
}

.menu-toggle-btn {
  margin-right: 16px;
  color: #bdc3c7 !important;
  background: transparent !important;
  border: none !important;
  transition: all 0.3s ease;
}

.menu-toggle-btn:hover {
  color: #3498db !important;
  background: rgba(255, 255, 255, 0.1) !important;
}
</style> 