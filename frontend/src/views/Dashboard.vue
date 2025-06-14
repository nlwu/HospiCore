<template>
  <div class="dashboard">
    <!-- 欢迎卡片 -->
    <div class="welcome-card">
      <div class="welcome-content">
        <div class="welcome-text">
          <h2>欢迎回来，{{ userInfo.name }}！</h2>
          <p>今天是 {{ currentDate }}，祝您工作愉快</p>
        </div>
        <div class="welcome-stats">
          <div class="stat-item">
            <div class="stat-number">{{ todayData.visits }}</div>
            <div class="stat-label">今日访问</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ todayData.todos }}</div>
            <div class="stat-label">待办事项</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ todayData.messages }}</div>
            <div class="stat-label">未读消息</div>
          </div>
        </div>
      </div>
    </div>

    <el-row :gutter="24">
      <!-- 左侧 -->
      <el-col :span="16">
        <!-- 我的待办 -->
        <el-card class="todo-card" title="我的待办">
          <template #header>
            <div class="card-header">
              <span>我的待办</span>
              <el-button text @click="handleViewAllTodos">
                查看全部
              </el-button>
            </div>
          </template>
          <div class="todo-list">
            <div
              v-for="todo in todoList"
              :key="todo.id"
              class="todo-item"
            >
              <div class="todo-content">
                <div class="todo-title">{{ todo.title }}</div>
                <div class="todo-meta">
                  <span class="todo-type">{{ getTypeText(todo.type) }}</span>
                  <span class="todo-source">来源：{{ todo.source || '人力资源部' }}</span>
                  <span class="todo-time">{{ formatTime(todo.createTime) }}</span>
                </div>
                <div class="todo-description">{{ todo.description || '等待您的审批处理' }}</div>
              </div>
              <div class="todo-actions">
                <el-tag :type="getTagType(todo.priority)" size="small" class="todo-priority">
                  {{ getPriorityText(todo.priority) }}
                </el-tag>
                <div class="action-buttons">
                  <el-button type="primary" size="small" @click="handleTodoAction(todo, 'approve')">
                    处理
                  </el-button>
                  <el-button size="small" @click="handleTodoAction(todo, 'view')">
                    查看
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- HRP 快捷功能入口 -->
        <el-card class="quick-entry-card">
          <template #header>
            <span class="card-title">HRP快捷入口</span>
          </template>
          <el-row :gutter="16">
            <el-col :span="4" v-for="entry in hrpEntries" :key="entry.path">
              <div class="quick-entry-item" @click="goToPage(entry.path)" :style="{ borderColor: entry.color }">
                <div class="entry-icon" :style="{ backgroundColor: entry.color + '20' }">
                  <el-icon :size="28" :color="entry.color">
                    <component :is="entry.icon" />
                  </el-icon>
                </div>
                <div class="entry-title">{{ entry.title }}</div>
                <div class="entry-desc">{{ entry.desc }}</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <!-- 右侧 -->
      <el-col :span="8">
        <!-- 快捷功能 -->
        <el-card class="quick-actions" title="快捷功能">
          <template #header>
            <span>快捷功能</span>
          </template>
          <div class="action-grid">
            <div
              v-for="action in quickActions"
              :key="action.title"
              class="action-item"
              @click="handleQuickAction(action)"
              :style="{ borderColor: action.color }"
            >
              <div class="action-icon" :style="{ backgroundColor: action.color + '20' }">
                <el-icon :size="22" :color="action.color"><component :is="action.icon" /></el-icon>
              </div>
              <span>{{ action.title }}</span>
            </div>
          </div>
        </el-card>

        <!-- 消息通知 -->
        <el-card class="message-card" title="最新消息">
          <template #header>
            <div class="card-header">
              <span>最新消息</span>
              <el-button text @click="showAllMessages">查看全部</el-button>
            </div>
          </template>
          <div class="message-list">
            <div
              v-for="message in latestMessages"
              :key="message.id"
              class="message-item"
            >
              <div class="message-content">
                <div class="message-title">{{ message.title }}</div>
                <div class="message-time">{{ formatTime(message.time) }}</div>
              </div>
              <el-badge v-if="!message.read" is-dot />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- HRP数据概览 -->
    <el-row :gutter="20" class="hrp-overview-section">
      <el-col :span="12">
        <el-card class="overview-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">人力资源概览</span>
              <el-button type="text" @click="goToPage('/hrp/hr/employee')">查看详情</el-button>
            </div>
          </template>
          <div class="overview-content">
            <div class="overview-item">
              <div class="item-value">{{ hrpStats.totalEmployees }}</div>
              <div class="item-label">在职员工</div>
            </div>
            <div class="overview-item">
              <div class="item-value">{{ hrpStats.newEmployees }}</div>
              <div class="item-label">本月入职</div>
            </div>
            <div class="overview-item">
              <div class="item-value">{{ hrpStats.pendingLeaves }}</div>
              <div class="item-label">待审假期</div>
            </div>
            <div class="overview-item">
              <div class="item-value">{{ hrpStats.pendingRecruitment }}</div>
              <div class="item-label">在招岗位</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="overview-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">财务资产概览</span>
              <el-button type="text" @click="goToPage('/hrp/finance/budget')">查看详情</el-button>
            </div>
          </template>
          <div class="overview-content">
            <div class="overview-item">
              <div class="item-value">¥{{ hrpStats.monthlyBudget.toLocaleString() }}</div>
              <div class="item-label">月度预算</div>
            </div>
            <div class="overview-item">
              <div class="item-value">¥{{ hrpStats.monthlyExpense.toLocaleString() }}</div>
              <div class="item-label">本月支出</div>
            </div>
            <div class="overview-item">
              <div class="item-value">{{ hrpStats.totalAssets }}</div>
              <div class="item-label">资产总数</div>
            </div>
            <div class="overview-item">
              <div class="item-value">{{ hrpStats.pendingExpense }}</div>
              <div class="item-label">待审报销</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { dataManager } from '@/utils/mockData'

const router = useRouter()

const userInfo = ref({})
const stats = ref({})
const todoList = ref([])

const todayData = ref({
  visits: 128,
  todos: 0,
  messages: 3
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

// 快捷操作
const quickActions = ref([
  {
    title: '员工档案',
    icon: 'User',
    color: '#67c23a',
    route: '/hrp/hr/employee'
  },
  {
    title: '考勤排班',
    icon: 'Clock',
    color: '#e6a23c',
    route: '/hrp/hr/attendance'
  },
  {
    title: '预算管理',
    icon: 'Money',
    color: '#409eff',
    route: '/hrp/finance/budget'
  },
  {
    title: '用户管理',
    icon: 'Setting',
    color: '#f56c6c',
    route: '/system/users'
  }
])

const loadDashboardData = () => {
  // 获取用户信息
  const storedUserInfo = localStorage.getItem('userInfo')
  if (storedUserInfo) {
    userInfo.value = JSON.parse(storedUserInfo)
  }
  
  // 获取统计数据
  const dashboardStats = dataManager.getStats()
  stats.value = {
    totalTodos: dashboardStats.todo.total,
    urgentTodos: dashboardStats.todo.urgent,
    todayTodos: dashboardStats.todo.today,
    overdueTodos: dashboardStats.todo.overdue
  }
  
  // 更新今日数据
  todayData.value.todos = dashboardStats.todo.total
  
  // 获取待办事项（只显示前5个）
  const allTodos = dataManager.getData('todoList') || []
  todoList.value = allTodos.slice(0, 5)
  
  // 如果没有待办事项，确保显示数量为0
  if (todoList.value.length === 0) {
    todayData.value.todos = 0
  }
}

const handleQuickAction = (action) => {
  ElMessage.success(`快捷操作：${action.title}`)
  router.push(action.route)
}

const handleViewAllTodos = () => {
  router.push('/workflow/todo')
}

const handleTodoClick = (todo) => {
  ElMessage.info(`点击了待办: ${todo.title}`)
  router.push('/workflow/todo')
}

const handleTodoAction = (todo, action) => {
  if (action === 'approve') {
    ElMessage.success(`正在处理: ${todo.title}`)
    router.push('/workflow/todo')
  } else if (action === 'view') {
    ElMessage.info(`查看详情: ${todo.title}`)
    router.push('/workflow/todo')
  }
}

const showAllMessages = () => {
  ElMessage.info('查看全部消息')
}

const getTagType = (priority) => {
  switch (priority) {
    case '高': return 'danger'
    case '中': return 'warning'
    case '低': return ''
    default: return ''
  }
}

const formatTime = (time) => {
  const now = new Date()
  const timeDate = new Date(time) // 确保time是Date对象
  const diff = now - timeDate
  
  if (diff < 60 * 1000) {
    return '刚刚'
  } else if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`
  } else if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  } else {
    return timeDate.toLocaleDateString()
  }
}

const latestMessages = ref([
  {
    id: 1,
    title: '系统维护通知',
    time: new Date(Date.now() - 1 * 60 * 60 * 1000),
    read: false
  },
  {
    id: 2,
    title: '科室会议通知',
    time: new Date(Date.now() - 3 * 60 * 60 * 1000),
    read: false
  },
  {
    id: 3,
    title: '培训安排通知',
    time: new Date(Date.now() - 6 * 60 * 60 * 1000),
    read: true
  }
])

const commonLinks = ref([
  { name: 'HIS系统', url: '#', icon: 'Monitor', type: 'primary' },
  { name: 'EMR系统', url: '#', icon: 'Document', type: 'success' },
  { name: 'LIS系统', url: '#', icon: 'DataAnalysis', type: 'warning' },
  { name: 'PACS系统', url: '#', icon: 'Picture', type: 'info' }
])

const systemStatus = ref([
  { name: 'HIS系统', status: '正常' },
  { name: 'EMR系统', status: '正常' },
  { name: 'LIS系统', status: '正常' },
  { name: 'PACS系统', status: '维护中' }
])

const hrpEntries = ref([
  {
    title: '员工档案',
    icon: 'User',
    color: '#67c23a',
    path: '/hrp/hr/employee',
    desc: '管理员工信息'
  },
  {
    title: '考勤排班',
    icon: 'Clock',
    color: '#e6a23c',
    path: '/hrp/hr/attendance',
    desc: '排班考勤管理'
  },
  {
    title: '预算管理',
    icon: 'DataAnalysis',
    color: '#409eff',
    path: '/hrp/finance/budget',
    desc: '财务预算控制'
  },
  {
    title: '资产管理',
    icon: 'Box',
    color: '#f56c6c',
    path: '/hrp/asset/management',
    desc: '固定资产管理'
  },
  {
    title: '薪酬福利',
    icon: 'Money',
    color: '#909399',
    path: '/hrp/hr/salary',
    desc: '薪酬核算发放'
  },
  {
    title: '费用报销',
    icon: 'CreditCard',
    color: '#67c23a',
    path: '/hrp/finance/expense',
    desc: '报销审批支付'
  }
])

const hrpStats = ref({
  totalEmployees: 125,
  newEmployees: 8,
  pendingLeaves: 12,
  pendingRecruitment: 5,
  monthlyBudget: 1250000,
  monthlyExpense: 680000,
  totalAssets: 1250,
  pendingExpense: 15
})

const goToPage = (path) => {
  router.push(path)
}

const getTypeText = (type) => {
  const typeMap = {
    'leave': '请假审批',
    'recruitment': '招聘审批',
    'expense': '费用审批',
    'training': '培训申请',
    'asset': '资产申请',
    'budget': '预算审批'
  }
  return typeMap[type] || type
}

const getPriorityText = (priority) => {
  const priorityMap = {
    'high': '紧急',
    'medium': '普通',
    'low': '一般',
    '高': '紧急',
    '中': '普通', 
    '低': '一般'
  }
  return priorityMap[priority] || priority
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard {
  padding: 16px;
  min-height: calc(100vh - 120px);
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.welcome-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  pointer-events: none;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.welcome-text h2 {
  margin: 0 0 6px 0;
  font-size: 24px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.welcome-text p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
  font-weight: 400;
}

.welcome-stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  text-align: center;
  background: rgba(255, 255, 255, 0.15);
  padding: 16px 20px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 3px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
  font-weight: 500;
}

.quick-actions, .todo-card, .message-card, .quick-entry-card, .overview-card {
  margin-bottom: 16px;
  border-radius: 10px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.quick-actions:hover, .todo-card:hover, .message-card:hover, .quick-entry-card:hover, .overview-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-weight: 600;
  color: #1a202c;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  border: 2px solid #f1f5f9;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  position: relative;
  overflow: hidden;
}

.action-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.action-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.action-item:hover .action-icon {
  transform: scale(1.1);
}

.action-item span {
  font-size: 13px;
  color: #2d3748;
  font-weight: 500;
  transition: color 0.3s ease;
}

.action-item:hover span {
  color: #1a202c;
}

.todo-list {
  max-height: 280px;
  overflow-y: auto;
}

.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 14px;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
  background: #ffffff;
}

.todo-item:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.todo-item:last-child {
  margin-bottom: 0;
}

.todo-content {
  flex: 1;
  padding-right: 12px;
}

.todo-title {
  font-size: 14px;
  color: #2d3748;
  margin-bottom: 6px;
  font-weight: 600;
  line-height: 1.4;
}

.todo-meta {
  font-size: 12px;
  color: #718096;
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.todo-type {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.todo-source {
  background: #f3e5f5;
  color: #7b1fa2;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.todo-description {
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.3;
}

.todo-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.todo-priority {
  margin-bottom: 0;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.action-buttons .el-button {
  font-size: 12px;
  padding: 4px 8px;
  height: auto;
}

.message-list {
  max-height: 200px;
  overflow-y: auto;
}

.message-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.3s ease;
  border-radius: 6px;
  margin: 0 -6px;
  padding-left: 6px;
  padding-right: 6px;
}

.message-item:hover {
  background: #f8fafc;
}

.message-item:last-child {
  border-bottom: none;
}

.message-content {
  flex: 1;
}

.message-title {
  font-size: 13px;
  color: #2d3748;
  margin-bottom: 3px;
  font-weight: 500;
}

.message-time {
  font-size: 11px;
  color: #718096;
}

.quick-entry-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  border: 2px solid #f1f5f9;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  position: relative;
  overflow: hidden;
  height: 120px;
}

.quick-entry-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.entry-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.quick-entry-item:hover .entry-icon {
  transform: scale(1.1);
}

.entry-title {
  font-size: 13px;
  color: #2d3748;
  font-weight: 600;
  margin-bottom: 4px;
  transition: color 0.3s ease;
}

.entry-desc {
  font-size: 11px;
  color: #718096;
  transition: color 0.3s ease;
}

.quick-entry-item:hover .entry-title,
.quick-entry-item:hover .entry-desc {
  color: #1a202c;
}

.hrp-overview-section {
  margin-bottom: 16px;
}

.overview-content {
  padding: 16px;
}

.overview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.overview-item:last-child {
  border-bottom: none;
}

.item-value {
  font-size: 16px;
  font-weight: 700;
  color: #2d3748;
}

.item-label {
  font-size: 13px;
  color: #718096;
}
</style> 