<template>
  <div class="page-container">
    <div class="page-header">
      <h2>我的流程</h2>
      <p>查看我发起的申请和处理过的审批记录</p>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="我发起的" name="initiated">
        <div class="search-form">
          <el-form :model="searchForm" inline>
            <el-form-item label="流程状态">
              <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 150px">
                <el-option label="请选择状态" value="" />
                <el-option label="审批中" value="pending" />
                <el-option label="已通过" value="approved" />
                <el-option label="已驳回" value="rejected" />
                <el-option label="已撤回" value="withdrawn" />
              </el-select>
            </el-form-item>
            <el-form-item label="流程类型">
              <el-select v-model="searchForm.type" placeholder="请选择类型" clearable style="width: 150px">
                <el-option label="请选择类型" value="" />
                <el-option label="请假申请" value="leave" />
                <el-option label="采购申请" value="purchase" />
                <el-option label="报销申请" value="reimburse" />
                <el-option label="培训申请" value="training" />
              </el-select>
            </el-form-item>
            <el-form-item label="发起时间">
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

        <!-- 我发起的流程列表 -->
        <div class="process-list">
          <div
            v-for="process in initiatedList"
            :key="process.id"
            class="workflow-card"
            @click="handleProcessDetail(process)"
          >
            <div class="card-header">
              <div class="card-title">
                <el-tag :type="getTypeColor(process.type)" size="small">
                  {{ getTypeLabel(process.type) }}
                </el-tag>
                <span class="title">{{ process.title }}</span>
                <el-tag :type="getStatusColor(process.status)" size="small">
                  {{ getStatusLabel(process.status) }}
                </el-tag>
              </div>
              <div class="card-time">{{ formatTime(process.createTime) }}</div>
            </div>

            <div class="card-content">
              <div class="process-info">
                <div class="info-item">
                  <span class="label">申请内容：</span>
                  <span class="value">{{ process.description }}</span>
                </div>
                <div class="info-item" v-if="process.amount">
                  <span class="label">申请金额：</span>
                  <span class="value amount">¥{{ process.amount.toLocaleString() }}</span>
                </div>
                <div class="info-item">
                  <span class="label">当前处理人：</span>
                  <span class="value">{{ process.currentHandler || '已完成' }}</span>
                </div>
              </div>
              
              <div class="process-progress">
                <div class="progress-title">流程进度</div>
                <el-steps :active="process.currentStep" finish-status="success">
                  <el-step 
                    v-for="(step, index) in process.steps" 
                    :key="index"
                    :title="step.title"
                    :description="step.handler"
                  />
                </el-steps>
              </div>
            </div>

            <div class="card-actions">
              <el-button 
                v-if="process.status === 'pending'"
                type="warning" 
                size="small" 
                @click.stop="handleWithdraw(process)"
              >
                <el-icon><Remove /></el-icon>撤回
              </el-button>
              <el-button 
                size="small" 
                @click.stop="handleProcessDetail(process)"
              >
                <el-icon><View /></el-icon>查看详情
              </el-button>
              <el-button 
                size="small" 
                @click.stop="handleTrackProcess(process)"
              >
                <el-icon><Location /></el-icon>流程跟踪
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="我已处理" name="processed">
        <!-- 我已处理的流程列表 -->
        <div class="process-list">
          <div
            v-for="process in processedList"
            :key="process.id"
            class="workflow-card"
            @click="handleProcessDetail(process)"
          >
            <div class="card-header">
              <div class="card-title">
                <el-tag :type="getTypeColor(process.type)" size="small">
                  {{ getTypeLabel(process.type) }}
                </el-tag>
                <span class="title">{{ process.title }}</span>
                <el-tag :type="getApprovalColor(process.myAction)" size="small">
                  {{ process.myAction }}
                </el-tag>
              </div>
              <div class="card-time">{{ formatTime(process.processTime) }}</div>
            </div>

            <div class="card-content">
              <div class="applicant-info">
                <el-avatar :size="32" :src="process.applicant.avatar">
                  {{ process.applicant.name.charAt(0) }}
                </el-avatar>
                <div class="applicant-details">
                  <div class="name">{{ process.applicant.name }}</div>
                  <div class="dept">{{ process.applicant.department }}</div>
                </div>
              </div>

              <div class="process-info">
                <div class="info-item">
                  <span class="label">申请内容：</span>
                  <span class="value">{{ process.description }}</span>
                </div>
                <div class="info-item">
                  <span class="label">我的意见：</span>
                  <span class="value">{{ process.myComment || '无' }}</span>
                </div>
              </div>
            </div>

            <div class="card-actions">
              <el-button 
                size="small" 
                @click.stop="handleProcessDetail(process)"
              >
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
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('initiated')

const searchForm = reactive({
  status: '',
  type: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 20
})

// 我发起的流程
const initiatedList = ref([
  {
    id: 1,
    type: 'leave',
    title: '年假申请',
    description: '申请年假5天，用于家庭旅游',
    status: 'pending',
    currentHandler: '张主任',
    currentStep: 1,
    createTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    steps: [
      { title: '发起申请', handler: '本人' },
      { title: '科室主任审批', handler: '张主任' },
      { title: 'HR审批', handler: '人事部' },
      { title: '完成', handler: '' }
    ]
  },
  {
    id: 2,
    type: 'purchase',
    title: '医疗设备采购申请',
    description: '申请采购心电监护仪2台',
    status: 'approved',
    currentHandler: null,
    currentStep: 3,
    amount: 150000,
    createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    steps: [
      { title: '发起申请', handler: '本人' },
      { title: '科室审批', handler: '李主任' },
      { title: '财务审批', handler: '财务部' },
      { title: '完成', handler: '' }
    ]
  },
  {
    id: 3,
    type: 'reimburse',
    title: '差旅费报销申请',
    description: '参加学术会议差旅费报销',
    status: 'rejected',
    currentHandler: null,
    currentStep: 1,
    amount: 3500,
    createTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    steps: [
      { title: '发起申请', handler: '本人' },
      { title: '科室审批', handler: '张主任' },
      { title: '财务审批', handler: '财务部' },
      { title: '完成', handler: '' }
    ]
  }
])

// 我已处理的流程
const processedList = ref([
  {
    id: 4,
    type: 'leave',
    title: '病假申请',
    description: '因感冒申请病假2天',
    myAction: '同意',
    myComment: '同意请假，注意休息',
    processTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    applicant: {
      name: '李四',
      department: '护理部',
      avatar: ''
    }
  },
  {
    id: 5,
    type: 'training',
    title: '外出培训申请',
    description: '申请参加护理技能培训班',
    myAction: '驳回',
    myComment: '当前科室人员紧张，建议延期',
    processTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    applicant: {
      name: '王五',
      department: '内科',
      avatar: ''
    }
  }
])

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

const getStatusLabel = (status) => {
  const labels = {
    pending: '审批中',
    approved: '已通过',
    rejected: '已驳回',
    withdrawn: '已撤回'
  }
  return labels[status] || status
}

const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    withdrawn: 'info'
  }
  return colors[status] || ''
}

const getApprovalColor = (action) => {
  const colors = {
    '同意': 'success',
    '驳回': 'danger',
    '转办': 'warning'
  }
  return colors[action] || ''
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

const handleTabClick = (tab) => {
  ElMessage.info(`切换到：${tab.props.label}`)
}

const handleSearch = () => {
  ElMessage.info('查询功能')
}

const handleReset = () => {
  Object.assign(searchForm, {
    status: '',
    type: '',
    dateRange: []
  })
  ElMessage.info('重置成功')
}

const handleWithdraw = (process) => {
  ElMessageBox.confirm('确定要撤回此申请吗？', '确认撤回', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    process.status = 'withdrawn'
    ElMessage.success('申请已撤回')
  }).catch(() => {
    ElMessage.info('已取消')
  })
}

const handleProcessDetail = (process) => {
  ElMessage.info(`查看详情：${process.title}`)
}

const handleTrackProcess = (process) => {
  ElMessage.info(`流程跟踪：${process.title}`)
}

const handleSizeChange = (size) => {
  pagination.size = size
  ElMessage.info(`每页显示 ${size} 条`)
}

const handlePageChange = (page) => {
  pagination.page = page
  ElMessage.info(`切换到第 ${page} 页`)
}

onMounted(() => {
  // 可以在这里加载流程数据
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

.process-list {
  margin-bottom: 24px;
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.card-time {
  font-size: 12px;
  color: #999;
}

.card-content {
  margin-bottom: 16px;
}

.applicant-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.applicant-details .name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.applicant-details .dept {
  font-size: 12px;
  color: #666;
}

.process-info {
  margin-bottom: 16px;
}

.info-item {
  margin-bottom: 8px;
  font-size: 14px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #666;
  margin-right: 8px;
}

.value {
  color: #333;
}

.amount {
  font-weight: 600;
  color: #f56c6c;
}

.process-progress {
  margin-top: 16px;
}

.progress-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>