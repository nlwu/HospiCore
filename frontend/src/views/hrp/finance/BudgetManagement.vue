<template>
  <div class="budget-management">
    <div class="page-header">
      <div class="header-title">
        <h2>全面预算管理</h2>
        <p>管理医院各部门年度预算编制、执行控制和分析监控</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" icon="Plus" @click="showBudgetDialog">
          新增预算
        </el-button>
        <el-button icon="Document" @click="generateReport">
          生成报表
        </el-button>
      </div>
    </div>

    <!-- 预算概览卡片 -->
    <el-row :gutter="20" class="overview-cards">
      <el-col :span="6">
        <el-card class="overview-card">
          <div class="card-content">
            <div class="card-icon total">
              <el-icon><Money /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-title">总预算</div>
              <div class="card-value">{{ formatMoney(overviewData.totalBudget) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="overview-card">
          <div class="card-content">
            <div class="card-icon used">
              <el-icon><ShoppingCart /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-title">已使用</div>
              <div class="card-value">{{ formatMoney(overviewData.usedBudget) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="overview-card">
          <div class="card-content">
            <div class="card-icon remaining">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-title">剩余预算</div>
              <div class="card-value">{{ formatMoney(overviewData.remainingBudget) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="overview-card">
          <div class="card-content">
            <div class="card-icon rate">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-title">执行率</div>
              <div class="card-value">{{ overviewData.executionRate }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" type="card">
      <!-- 预算列表 -->
      <el-tab-pane label="预算管理" name="budget">
        <el-card shadow="never">
          <!-- 搜索筛选 -->
          <el-form :model="searchForm" inline label-width="80px">
            <el-form-item label="预算年度">
              <el-select v-model="searchForm.year" placeholder="选择年度" clearable>
                <el-option
                  v-for="year in yearOptions"
                  :key="year"
                  :label="year"
                  :value="year"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="部门">
              <el-select v-model="searchForm.departmentId" placeholder="选择部门" clearable>
                <el-option
                  v-for="dept in departments"
                  :key="dept.id"
                  :label="dept.name"
                  :value="dept.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="预算类别">
              <el-select v-model="searchForm.category" placeholder="选择类别" clearable>
                <el-option label="人员经费" value="人员经费" />
                <el-option label="设备采购" value="设备采购" />
                <el-option label="运营费用" value="运营费用" />
                <el-option label="基建投资" value="基建投资" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="选择状态" clearable>
                <el-option label="草稿" value="draft" />
                <el-option label="待审批" value="pending" />
                <el-option label="已批准" value="approved" />
                <el-option label="已驳回" value="rejected" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="searchBudgets">搜索</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 预算列表表格 -->
          <el-table
            :data="budgetList"
            v-loading="loading"
            stripe
            border
            @row-click="viewBudgetDetail"
          >
            <el-table-column type="expand">
              <template #default="{ row }">
                <div class="budget-detail">
                  <p><strong>备注：</strong>{{ row.remark }}</p>
                  <p><strong>创建时间：</strong>{{ row.createTime || '暂无' }}</p>
                  <p><strong>审批人：</strong>{{ row.approver || '暂无' }}</p>
                  <p><strong>审批时间：</strong>{{ row.approveTime || '暂无' }}</p>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="year" label="年度" width="80" />
            <el-table-column prop="departmentName" label="部门" width="120" />
            <el-table-column prop="category" label="预算类别" width="120" />
            <el-table-column prop="budgetAmount" label="预算金额" width="150">
              <template #default="{ row }">
                {{ formatMoney(row.budgetAmount) }}
              </template>
            </el-table-column>
            <el-table-column prop="usedAmount" label="已使用" width="150">
              <template #default="{ row }">
                {{ formatMoney(row.usedAmount) }}
              </template>
            </el-table-column>
            <el-table-column prop="remainingAmount" label="剩余金额" width="150">
              <template #default="{ row }">
                {{ formatMoney(row.remainingAmount) }}
              </template>
            </el-table-column>
            <el-table-column label="执行率" width="100">
              <template #default="{ row }">
                <el-progress
                  :percentage="Math.round((row.usedAmount / row.budgetAmount) * 100)"
                  :color="getProgressColor(row.usedAmount / row.budgetAmount)"
                  :stroke-width="15"
                />
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getBudgetStatusType(row.status)">
                  {{ getBudgetStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  @click.stop="viewBudgetDetail(row)"
                >
                  详情
                </el-button>
                <el-button
                  v-if="row.status === 'draft'"
                  type="warning"
                  size="small"
                  @click.stop="editBudget(row)"
                >
                  编辑
                </el-button>
                <el-button
                  v-if="row.status === 'pending'"
                  type="success"
                  size="small"
                  @click.stop="approveBudget(row)"
                >
                  审批
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click.stop="deleteBudget(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="pagination.currentPage"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 预算分析 -->
      <el-tab-pane label="预算分析" name="analysis">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>预算执行分析</span>
              <div>
                <el-date-picker
                  v-model="analysisYear"
                  type="year"
                  placeholder="选择年度"
                  @change="loadAnalysisData"
                />
              </div>
            </div>
          </template>

          <!-- 分析图表 -->
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="chart-container">
                <h4>部门预算执行情况</h4>
                <div id="departmentChart" style="height: 400px;"></div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="chart-container">
                <h4>预算类别分布</h4>
                <div id="categoryChart" style="height: 400px;"></div>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :span="24">
              <div class="chart-container">
                <h4>月度预算执行趋势</h4>
                <div id="trendChart" style="height: 400px;"></div>
              </div>
            </el-col>
          </el-row>

          <!-- 预算执行详情表 -->
          <el-table
            :data="analysisData"
            style="margin-top: 20px;"
            stripe
            border
          >
            <el-table-column prop="departmentName" label="部门" width="120" />
            <el-table-column prop="category" label="预算类别" width="120" />
            <el-table-column prop="budgetAmount" label="预算金额" width="150">
              <template #default="{ row }">
                {{ formatMoney(row.budgetAmount) }}
              </template>
            </el-table-column>
            <el-table-column prop="usedAmount" label="已使用" width="150">
              <template #default="{ row }">
                {{ formatMoney(row.usedAmount) }}
              </template>
            </el-table-column>
            <el-table-column label="执行率" width="100">
              <template #default="{ row }">
                {{ ((row.usedAmount / row.budgetAmount) * 100).toFixed(1) }}%
              </template>
            </el-table-column>
            <el-table-column label="预警状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getWarningType(row.usedAmount / row.budgetAmount)">
                  {{ getWarningText(row.usedAmount / row.budgetAmount) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="variance" label="预算差异" width="150">
              <template #default="{ row }">
                <span :class="row.budgetAmount - row.usedAmount >= 0 ? 'positive' : 'negative'">
                  {{ formatMoney(row.budgetAmount - row.usedAmount) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 新增/编辑预算弹窗 -->
    <el-dialog
      v-model="budgetDialogVisible"
      :title="isEdit ? '编辑预算' : '新增预算'"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="budgetFormRef"
        :model="budgetForm"
        :rules="budgetRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预算年度" prop="year">
              <el-select v-model="budgetForm.year" placeholder="选择年度" style="width: 100%">
                <el-option
                  v-for="year in yearOptions"
                  :key="year"
                  :label="year"
                  :value="year"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门" prop="departmentId">
              <el-select v-model="budgetForm.departmentId" placeholder="选择部门" style="width: 100%">
                <el-option
                  v-for="dept in departments"
                  :key="dept.id"
                  :label="dept.name"
                  :value="dept.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预算类别" prop="category">
              <el-select v-model="budgetForm.category" placeholder="选择类别" style="width: 100%">
                <el-option label="人员经费" value="人员经费" />
                <el-option label="设备采购" value="设备采购" />
                <el-option label="运营费用" value="运营费用" />
                <el-option label="基建投资" value="基建投资" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预算金额" prop="budgetAmount">
              <el-input
                v-model.number="budgetForm.budgetAmount"
                placeholder="请输入预算金额"
                type="number"
              >
                <template #append>元</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input
            v-model="budgetForm.remark"
            type="textarea"
            placeholder="请输入预算说明"
            :rows="3"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="budgetDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBudget">保存</el-button>
        <el-button v-if="!isEdit" type="success" @click="submitBudget">提交审批</el-button>
      </template>
    </el-dialog>

    <!-- 预算审批弹窗 -->
    <el-dialog
      v-model="approveDialogVisible"
      title="预算审批"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="approve-content">
        <h4>预算信息</h4>
        <p><strong>部门：</strong>{{ currentBudget.departmentName }}</p>
        <p><strong>类别：</strong>{{ currentBudget.category }}</p>
        <p><strong>金额：</strong>{{ formatMoney(currentBudget.budgetAmount) }}</p>
        <p><strong>说明：</strong>{{ currentBudget.remark }}</p>
      </div>

      <el-form label-width="100px">
        <el-form-item label="审批结果">
          <el-radio-group v-model="approveForm.result">
            <el-radio label="approved">批准</el-radio>
            <el-radio label="rejected">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input
            v-model="approveForm.comment"
            type="textarea"
            placeholder="请输入审批意见"
            :rows="3"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveApprove">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Money, ShoppingCart, Wallet, TrendCharts } from '@element-plus/icons-vue'
import { dataManager } from '@/utils/mockData'

// 响应式数据
const activeTab = ref('budget')
const loading = ref(false)
const budgetList = ref([])
const departments = ref([])
const analysisData = ref([])
const analysisYear = ref(new Date())

// 弹窗状态
const budgetDialogVisible = ref(false)
const approveDialogVisible = ref(false)
const isEdit = ref(false)
const budgetFormRef = ref()

// 搜索表单
const searchForm = reactive({
  year: new Date().getFullYear(),
  departmentId: '',
  category: '',
  status: ''
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 预算表单
const budgetForm = reactive({
  year: new Date().getFullYear(),
  departmentId: '',
  category: '',
  budgetAmount: '',
  remark: ''
})

// 审批表单
const approveForm = reactive({
  result: 'approved',
  comment: ''
})

const currentBudget = ref({})

// 年度选项
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return [currentYear - 1, currentYear, currentYear + 1]
})

// 概览数据
const overviewData = computed(() => {
  const budgets = budgetList.value.filter(b => b.year === searchForm.year)
  const totalBudget = budgets.reduce((sum, item) => sum + item.budgetAmount, 0)
  const usedBudget = budgets.reduce((sum, item) => sum + item.usedAmount, 0)
  const remainingBudget = totalBudget - usedBudget
  const executionRate = totalBudget > 0 ? ((usedBudget / totalBudget) * 100).toFixed(1) : 0

  return {
    totalBudget,
    usedBudget,
    remainingBudget,
    executionRate
  }
})

// 表单验证规则
const budgetRules = {
  year: [{ required: true, message: '请选择预算年度', trigger: 'change' }],
  departmentId: [{ required: true, message: '请选择部门', trigger: 'change' }],
  category: [{ required: true, message: '请选择预算类别', trigger: 'change' }],
  budgetAmount: [
    { required: true, message: '请输入预算金额', trigger: 'blur' },
    { type: 'number', min: 1, message: '预算金额必须大于0', trigger: 'blur' }
  ]
}

// 计算属性和方法
const formatMoney = (amount) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount)
}

const getProgressColor = (ratio) => {
  if (ratio < 0.5) return '#67C23A'
  if (ratio < 0.8) return '#E6A23C'
  return '#F56C6C'
}

const getBudgetStatusType = (status) => {
  const typeMap = {
    draft: '',
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return typeMap[status] || ''
}

const getBudgetStatusText = (status) => {
  const textMap = {
    draft: '草稿',
    pending: '待审批',
    approved: '已批准',
    rejected: '已驳回'
  }
  return textMap[status] || status
}

const getWarningType = (ratio) => {
  if (ratio < 0.8) return 'success'
  if (ratio < 0.95) return 'warning'
  return 'danger'
}

const getWarningText = (ratio) => {
  if (ratio < 0.8) return '正常'
  if (ratio < 0.95) return '预警'
  return '超支'
}

// 数据加载方法
const loadData = () => {
  loading.value = true
  setTimeout(() => {
    budgetList.value = dataManager.getData('budgets') || []
    departments.value = dataManager.getData('departments') || []
    pagination.total = budgetList.value.length
    loading.value = false
  }, 500)
}

const searchBudgets = () => {
  // 实现搜索逻辑
  loadData()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    if (key === 'year') {
      searchForm[key] = new Date().getFullYear()
    } else {
      searchForm[key] = ''
    }
  })
  loadData()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadData()
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadData()
}

// 预算操作方法
const showBudgetDialog = () => {
  isEdit.value = false
  resetBudgetForm()
  budgetDialogVisible.value = true
}

const resetBudgetForm = () => {
  Object.keys(budgetForm).forEach(key => {
    if (key === 'year') {
      budgetForm[key] = new Date().getFullYear()
    } else {
      budgetForm[key] = ''
    }
  })
  if (budgetFormRef.value) {
    budgetFormRef.value.clearValidate()
  }
}

const editBudget = (row) => {
  isEdit.value = true
  Object.keys(budgetForm).forEach(key => {
    budgetForm[key] = row[key] || ''
  })
  currentBudget.value = row
  budgetDialogVisible.value = true
}

const saveBudget = async () => {
  try {
    await budgetFormRef.value.validate()
    
    const budgets = dataManager.getData('budgets') || []
    const dept = departments.value.find(d => d.id === budgetForm.departmentId)
    
    if (isEdit.value) {
      const index = budgets.findIndex(b => b.id === currentBudget.value.id)
      if (index > -1) {
        budgets[index] = {
          ...budgets[index],
          ...budgetForm,
          departmentName: dept?.name,
          updateTime: new Date().toLocaleString()
        }
        ElMessage.success('预算更新成功')
      }
    } else {
      const newBudget = {
        id: Date.now(),
        ...budgetForm,
        departmentName: dept?.name,
        usedAmount: 0,
        remainingAmount: budgetForm.budgetAmount,
        status: 'draft',
        createTime: new Date().toLocaleString()
      }
      budgets.push(newBudget)
      ElMessage.success('预算创建成功')
    }
    
    dataManager.updateData('budgets', budgets)
    budgetDialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const submitBudget = async () => {
  try {
    await budgetFormRef.value.validate()
    // 提交审批逻辑
    ElMessage.success('预算已提交审批')
    budgetDialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const approveBudget = (row) => {
  currentBudget.value = row
  approveForm.result = 'approved'
  approveForm.comment = ''
  approveDialogVisible.value = true
}

const saveApprove = () => {
  const budgets = dataManager.getData('budgets') || []
  const index = budgets.findIndex(b => b.id === currentBudget.value.id)
  
  if (index > -1) {
    budgets[index].status = approveForm.result
    budgets[index].approver = '当前用户'
    budgets[index].approveTime = new Date().toLocaleString()
    budgets[index].approveComment = approveForm.comment
    
    dataManager.updateData('budgets', budgets)
    ElMessage.success('审批完成')
    approveDialogVisible.value = false
    loadData()
  }
}

const deleteBudget = (row) => {
  ElMessageBox.confirm(
    `确定要删除该预算吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const budgets = dataManager.getData('budgets') || []
    const index = budgets.findIndex(b => b.id === row.id)
    if (index > -1) {
      budgets.splice(index, 1)
      dataManager.updateData('budgets', budgets)
      ElMessage.success('删除成功')
      loadData()
    }
  }).catch(() => {
    // 用户取消删除
  })
}

const viewBudgetDetail = (row) => {
  // 查看预算详情
  console.log('查看预算详情:', row)
}

const loadAnalysisData = () => {
  analysisData.value = budgetList.value.filter(b => 
    b.year === analysisYear.value.getFullYear()
  )
  ElMessage.success('分析数据已更新')
}

const generateReport = () => {
  ElMessage.success('报表生成功能开发中...')
}

// 生命周期
onMounted(() => {
  loadData()
  loadAnalysisData()
})
</script>

<style scoped>
.budget-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-title h2 {
  margin: 0;
  color: #303133;
}

.header-title p {
  margin: 5px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.overview-cards {
  margin-bottom: 20px;
}

.overview-card {
  height: 100px;
}

.card-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.card-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-icon.used {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.card-icon.remaining {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.card-icon.rate {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.card-info {
  flex: 1;
}

.card-title {
  color: #909399;
  font-size: 14px;
  margin-bottom: 5px;
}

.card-value {
  color: #303133;
  font-size: 24px;
  font-weight: bold;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-detail {
  padding: 20px;
  background: #f5f7fa;
  margin: 10px 0;
}

.budget-detail p {
  margin: 8px 0;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.chart-container {
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: white;
}

.chart-container h4 {
  margin: 0 0 15px 0;
  text-align: center;
  color: #303133;
}

.approve-content {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 20px;
}

.approve-content h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.approve-content p {
  margin: 8px 0;
  color: #606266;
}

.positive {
  color: #67C23A;
}

.negative {
  color: #F56C6C;
}
</style> 