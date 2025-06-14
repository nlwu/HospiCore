<template>
  <div class="page-container">
    <div class="page-header">
      <h2>待办事项</h2>
      <p>处理需要审批的各类申请和任务</p>
    </div>

    <!-- 筛选条件 -->
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
          >
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select
            v-model="searchForm.priority"
            placeholder="请选择优先级"
            clearable
          >
            <el-option label="紧急" value="urgent" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="searchForm.type"
            placeholder="请选择类型"
            clearable
          >
            <el-option label="审批申请" value="approval" />
            <el-option label="请假申请" value="leave" />
            <el-option label="报销申请" value="expense" />
            <el-option label="采购申请" value="purchase" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 状态切换标签 -->
    <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="status-tabs">
      <el-tab-pane label="待办事项" name="pending">
        <!-- 统计信息 -->
        <div class="stats-row">
          <div class="stat-card" @click="handleStatClick('total')">
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">待办总数</div>
          </div>
          <div class="stat-card" @click="handleStatClick('urgent')">
            <div class="stat-number">{{ stats.urgent }}</div>
            <div class="stat-label">紧急任务</div>
          </div>
          <div class="stat-card" @click="handleStatClick('today')">
            <div class="stat-number">{{ stats.today }}</div>
            <div class="stat-label">今日新增</div>
          </div>
          <div class="stat-card" @click="handleStatClick('overdue')">
            <div class="stat-number">{{ stats.overdue }}</div>
            <div class="stat-label">超期任务</div>
          </div>
        </div>

        <!-- 待办列表 -->
        <div class="todo-list">
          <div
            v-for="todo in currentList"
            :key="todo.id"
            :class="getTodoCardClass(todo)"
            @click="handleTodoDetail(todo)"
          >
            <div class="card-header">
              <div class="card-title">
                <el-tag :type="getTypeColor(todo.type)" size="small">
                  {{ getTypeLabel(todo.type) }}
                </el-tag>
                <span class="title">{{ todo.title }}</span>
                <el-tag :type="getPriorityColor(todo.priority)" size="small">
                  {{ todo.priority }}
                </el-tag>
              </div>
              <div class="card-time">{{ formatTime(todo.createTime) }}</div>
            </div>

            <div class="card-content">
              <div class="applicant-info">
                <el-avatar :size="32" :src="todo.applicant.avatar">
                  {{ todo.applicant.name.charAt(0) }}
                </el-avatar>
                <div class="applicant-details">
                  <div class="name">{{ todo.applicant.name }}</div>
                  <div class="dept">{{ todo.applicant.department }}</div>
                </div>
              </div>

              <div class="todo-info">
                <div class="info-item">
                  <span class="label">申请内容：</span>
                  <span class="value">{{ todo.description }}</span>
                </div>
                <div class="info-item" v-if="todo.amount">
                  <span class="label">申请金额：</span>
                  <span class="value amount">¥{{ todo.amount.toLocaleString() }}</span>
                </div>
                <div class="info-item" v-if="todo.duration">
                  <span class="label">申请时长：</span>
                  <span class="value">{{ todo.duration }}</span>
                </div>
              </div>
            </div>

            <div class="card-actions">
              <el-button 
                type="success" 
                size="small" 
                @click.stop="handleApprove(todo)"
                :loading="todo.processing"
              >
                <el-icon><Check /></el-icon>同意
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click.stop="handleReject(todo)"
                :loading="todo.processing"
              >
                <el-icon><Close /></el-icon>驳回
              </el-button>
              <el-button 
                type="info" 
                size="small" 
                @click.stop="handleTransfer(todo)"
              >
                <el-icon><Switch /></el-icon>转办
              </el-button>
              <el-button 
                size="small" 
                @click.stop="handleTodoDetail(todo)"
              >
                <el-icon><View /></el-icon>详情
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="已办事项" name="completed">
        <!-- 已办列表 -->
        <div class="todo-list">
          <div
            v-for="todo in completedList"
            :key="todo.id"
            class="workflow-card completed-card"
          >
            <div class="card-header">
              <div class="card-title">
                <el-tag :type="getTypeColor(todo.type)" size="small">
                  {{ getTypeLabel(todo.type) }}
                </el-tag>
                <span class="title">{{ todo.title }}</span>
                <el-tag :type="todo.result === 'approved' ? 'success' : 'danger'" size="small">
                  {{ todo.result === 'approved' ? '已同意' : '已驳回' }}
                </el-tag>
              </div>
              <div class="card-time">{{ formatTime(todo.processTime) }}</div>
            </div>

            <div class="card-content">
              <div class="applicant-info">
                <el-avatar :size="32" :src="todo.applicant.avatar">
                  {{ todo.applicant.name.charAt(0) }}
                </el-avatar>
                <div class="applicant-details">
                  <div class="name">{{ todo.applicant.name }}</div>
                  <div class="dept">{{ todo.applicant.department }}</div>
                </div>
              </div>

              <div class="todo-info">
                <div class="info-item">
                  <span class="label">申请内容：</span>
                  <span class="value">{{ todo.description }}</span>
                </div>
                <div class="info-item">
                  <span class="label">处理意见：</span>
                  <span class="value">{{ todo.comment || '无' }}</span>
                </div>
              </div>
            </div>

            <div class="card-actions">
              <el-button size="small" @click="handleTodoDetail(todo)">
                <el-icon><View /></el-icon>查看详情
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 审批对话框 -->
    <el-dialog
      v-model="approvalDialog.visible"
      :title="approvalDialog.title"
      width="500px"
    >
      <el-form ref="approvalFormRef" :model="approvalForm" :rules="approvalRules">
        <el-form-item label="审批意见" prop="comment">
          <el-input
            v-model="approvalForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入审批意见..."
          />
        </el-form-item>
        <el-form-item v-if="approvalDialog.type === 'reject'" label="驳回理由" prop="reason">
          <el-input
            v-model="approvalForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入驳回理由..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approvalDialog.visible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmApproval"
          :loading="approvalDialog.loading"
        >
          确认{{ approvalDialog.type === 'approve' ? '同意' : '驳回' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { dataManager } from '@/utils/mockData'

const searchForm = reactive({
  status: '',
  priority: '',
  type: '',
  dateRange: []
})

const activeTab = ref('pending')
const currentFilterType = ref('') // 当前筛选类型：urgent, today, overdue

const stats = ref({
  total: 0,
  urgent: 0,
  today: 0,
  overdue: 0
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const approvalDialog = reactive({
  visible: false,
  title: '',
  type: '', // approve, reject
  loading: false,
  currentTodo: null
})

const approvalForm = reactive({
  comment: '',
  reason: ''
})

const approvalFormRef = ref()

const approvalRules = reactive({
  comment: [
    { required: true, message: '请输入审批意见', trigger: 'blur' }
  ],
  reason: [
    { required: true, message: '请输入驳回理由', trigger: 'blur' }
  ]
})

const currentList = ref([])
const completedList = ref([])

const loading = ref(false)
const todoList = ref([])
const selectedTodos = ref([])

const loadData = () => {
  loading.value = true
  setTimeout(() => {
    // 模拟待办事项数据
    todoList.value = [
      {
        id: 1,
        title: '张三的请假申请',
        type: 'leave',
        typeName: '请假申请',
        applicant: '张三',
        department: '内科',
        applyDate: '2024-01-15',
        priority: 'medium',
        priorityName: '中',
        status: 'pending',
        statusName: '待处理',
        description: '因个人事务请假2天'
      },
      {
        id: 2,
        title: '李四的报销申请',
        type: 'expense',
        typeName: '报销申请',
        applicant: '李四',
        department: '外科',
        applyDate: '2024-01-14',
        priority: 'high',
        priorityName: '高',
        status: 'pending',
        statusName: '待处理',
        description: '差旅费报销申请'
      },
      {
        id: 3,
        title: '王五的采购申请',
        type: 'purchase',
        typeName: '采购申请',
        applicant: '王五',
        department: '设备科',
        applyDate: '2024-01-13',
        priority: 'urgent',
        priorityName: '紧急',
        status: 'in_progress',
        statusName: '处理中',
        description: '医疗设备采购申请'
      }
    ]
    pagination.total = todoList.value.length
    loading.value = false
  }, 500)
}

const handleStatClick = (type) => {
  if (type === 'total') {
    currentFilterType.value = ''
    pagination.currentPage = 1
    loadData()
    ElMessage.info('显示全部任务')
    return
  }
  
  currentFilterType.value = currentFilterType.value === type ? '' : type
  pagination.currentPage = 1
  loadData()
  
  const messages = {
    urgent: currentFilterType.value === 'urgent' ? '显示紧急任务' : '显示全部任务',
    today: currentFilterType.value === 'today' ? '显示今日新增' : '显示全部任务',
    overdue: currentFilterType.value === 'overdue' ? '显示超期任务' : '显示全部任务'
  }
  ElMessage.info(messages[type])
}

const handleTabClick = () => {
  currentFilterType.value = ''
  pagination.currentPage = 1
  loadData()
}

const getTypeLabel = (type) => {
  const labels = {
    leave: '请假申请',
    purchase: '采购申请',
    reimburse: '报销申请',
    training: '培训申请'
  }
  return labels[type] || type
}

const getTypeColor = (type) => {
  const colors = {
    leave: 'success',
    purchase: 'warning',
    reimburse: 'info',
    training: 'primary'
  }
  return colors[type] || ''
}

const getPriorityColor = (priority) => {
  const colors = {
    '高': 'danger',
    '中': 'warning',
    '低': ''
  }
  return colors[priority] || ''
}

const formatTime = (time) => {
  const now = new Date()
  const diff = now - time
  
  if (diff < 60 * 1000) {
    return '刚刚'
  } else if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`
  } else if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  } else {
    return time.toLocaleDateString()
  }
}

const handleSearch = () => {
  loadData()
}

const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  pagination.currentPage = 1
  loadData()
}

const handleApprove = (todo) => {
  approvalDialog.visible = true
  approvalDialog.title = '审批同意'
  approvalDialog.type = 'approve'
  approvalDialog.currentTodo = todo
  approvalForm.comment = ''
  approvalForm.reason = ''
}

const handleReject = (todo) => {
  approvalDialog.visible = true
  approvalDialog.title = '审批驳回'
  approvalDialog.type = 'reject'
  approvalDialog.currentTodo = todo
  approvalForm.comment = ''
  approvalForm.reason = ''
}

const handleTransfer = (todo) => {
  ElMessageBox.prompt('请选择转办人', '转办申请', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPlaceholder: '输入转办人姓名'
  }).then(({ value }) => {
    ElMessage.success(`已转办给：${value}`)
    // 这里可以实现转办逻辑
  }).catch(() => {
    ElMessage.info('已取消转办')
  })
}

const handleTodoDetail = (todo) => {
  ElMessage.info(`查看详情：${todo.title}`)
  // 这里可以跳转到详情页面
}

const confirmApproval = async () => {
  if (!approvalFormRef.value) return

  try {
    await approvalFormRef.value.validate()
    
    approvalDialog.loading = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const action = approvalDialog.type === 'approve' ? '同意' : '驳回'
    ElMessage.success(`审批${action}成功`)
    
    // 更新数据
    const data = dataManager.getData()
    const todoList = data.todoList || []
    const completedList = data.completedList || []
    
    const todoIndex = todoList.findIndex(t => t.id === approvalDialog.currentTodo.id)
    if (todoIndex !== -1) {
      // 移动到已办列表
      const processedTodo = {
        ...todoList[todoIndex],
        result: approvalDialog.type === 'approve' ? 'approved' : 'rejected',
        comment: approvalForm.comment,
        processTime: new Date()
      }
      completedList.unshift(processedTodo)
      todoList.splice(todoIndex, 1)
      
      // 更新数据
      dataManager.updateData('todoList', todoList)
      dataManager.updateData('completedList', completedList)
      
      loadData()
    }
    
    approvalDialog.visible = false
  } catch (error) {
    console.error('审批失败:', error)
  } finally {
    approvalDialog.loading = false
  }
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  loadData()
}

const handlePageChange = (page) => {
  pagination.currentPage = page
  loadData()
}

// 获取待办卡片的样式类
const getTodoCardClass = (todo) => {
  const classes = ['workflow-card']
  if (todo.isOverdue) {
    classes.push('overdue-card')
  }
  return classes.join(' ')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #333;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  text-align: center;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #409eff 0%, #1890ff 100%);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

.stat-number {
  font-size: 36px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 14px;
  color: #718096;
  font-weight: 500;
}

.todo-list {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f1f5f9;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  flex-wrap: wrap;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
  line-height: 1.4;
}

.card-time {
  font-size: 12px;
  color: #718096;
  background: #f8fafc;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.card-content {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.applicant-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 160px;
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.applicant-details .name {
  font-size: 14px;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 4px;
}

.applicant-details .dept {
  font-size: 12px;
  color: #718096;
  background: #e3f2fd;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}

.todo-info {
  flex: 1;
  min-width: 300px;
}

.info-item {
  margin-bottom: 10px;
  font-size: 14px;
  display: flex;
  align-items: flex-start;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #4a5568;
  margin-right: 8px;
  font-weight: 500;
  min-width: 80px;
  flex-shrink: 0;
}

.value {
  color: #2d3748;
  line-height: 1.5;
  flex: 1;
}

.amount {
  font-weight: 700;
  color: #e53e3e;
  background: #fed7d7;
  padding: 2px 8px;
  border-radius: 4px;
}

.card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding: 24px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.status-tabs {
  margin-bottom: 24px;
}

.completed-card {
  opacity: 0.85;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.completed-card:hover {
  opacity: 1;
}

.workflow-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.workflow-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.overdue-card {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-color: #fca5a5;
  position: relative;
}

.overdue-card::before {
  content: '超期';
  position: absolute;
  top: 10px;
  right: 10px;
  background: #dc2626;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  z-index: 1;
}

.overdue-card:hover {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}
</style> 