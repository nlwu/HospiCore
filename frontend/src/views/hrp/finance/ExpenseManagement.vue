<template>
  <div class="expense-management">
    <div class="page-header">
      <div class="header-title">
        <h2>费用报销与支付</h2>
        <p>管理员工费用报销申请、审批流程和支付处理</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" icon="Plus" @click="showExpenseDialog">
          新增报销
        </el-button>
        <el-button icon="Upload" @click="showBatchImportDialog">
          批量导入
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="card">
      <!-- 报销申请 -->
      <el-tab-pane label="报销申请" name="applications">
        <el-card shadow="never">
          <!-- 搜索筛选 -->
          <el-form :model="searchForm" inline>
            <el-form-item label="申请人">
              <el-input
                v-model="searchForm.applicantName"
                placeholder="请输入申请人姓名"
                clearable
              />
            </el-form-item>
            <el-form-item label="费用类型">
              <el-select
                v-model="searchForm.expenseType"
                placeholder="请选择费用类型"
                clearable
              >
                <el-option label="差旅费" value="travel" />
                <el-option label="办公用品" value="office" />
                <el-option label="培训费" value="training" />
                <el-option label="招待费" value="entertainment" />
                <el-option label="医疗费" value="medical" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select
                v-model="searchForm.status"
                placeholder="请选择状态"
                clearable
              >
                <el-option label="待审批" value="pending" />
                <el-option label="审批中" value="reviewing" />
                <el-option label="已通过" value="approved" />
                <el-option label="已驳回" value="rejected" />
                <el-option label="已支付" value="paid" />
              </el-select>
            </el-form-item>
            <el-form-item label="申请时间">
              <el-date-picker
                v-model="searchForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadExpenseData">查询</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 报销申请表格 -->
          <el-table :data="expenseList" v-loading="loading" stripe border>
            <el-table-column type="selection" width="55" />
            <el-table-column prop="applicationNo" label="申请单号" width="140" />
            <el-table-column prop="applicantName" label="申请人" width="100" />
            <el-table-column prop="department" label="部门" width="100" />
            <el-table-column prop="expenseTypeName" label="费用类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getExpenseTypeColor(row.expenseType)">
                  {{ row.expenseTypeName }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="报销金额" width="120" align="right">
              <template #default="{ row }">
                ¥{{ row.amount.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="budgetSubject" label="预算科目" width="120" />
            <el-table-column prop="description" label="费用说明" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="applyDate" label="申请日期" width="120" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="viewExpenseDetail(row)">
                  详情
                </el-button>
                <el-button
                  v-if="row.status === 'pending'"
                  type="success"
                  size="small"
                  @click="approveExpense(row)"
                >
                  审批
                </el-button>
                <el-button
                  v-if="row.status === 'approved'"
                  type="warning"
                  size="small"
                  @click="payExpense(row)"
                >
                  支付
                </el-button>
                <el-button
                  v-if="row.status === 'pending'"
                  type="info"
                  size="small"
                  @click="editExpense(row)"
                >
                  编辑
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
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 审批流程 -->
      <el-tab-pane label="审批流程" name="approval">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>待我审批</span>
              <el-button type="primary" @click="batchApproval">
                批量审批
              </el-button>
            </div>
          </template>

          <!-- 待审批列表 -->
          <el-table :data="pendingApprovals" v-loading="approvalLoading" stripe border>
            <el-table-column type="selection" width="55" />
            <el-table-column prop="applicationNo" label="申请单号" width="140" />
            <el-table-column prop="applicantName" label="申请人" width="100" />
            <el-table-column prop="expenseTypeName" label="费用类型" width="100" />
            <el-table-column prop="amount" label="报销金额" width="120" align="right">
              <template #default="{ row }">
                ¥{{ row.amount.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="applyDate" label="申请日期" width="120" />
            <el-table-column prop="currentApprover" label="当前审批人" width="120" />
            <el-table-column prop="priority" label="优先级" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getPriorityType(row.priority)">
                  {{ row.priority }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="success" size="small" @click="handleApprove(row)">
                  同意
                </el-button>
                <el-button type="danger" size="small" @click="handleReject(row)">
                  驳回
                </el-button>
                <el-button size="small" @click="viewApprovalDetail(row)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 支付管理 -->
      <el-tab-pane label="支付管理" name="payment">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>支付处理</span>
              <el-button type="primary" @click="batchPayment">
                批量支付
              </el-button>
            </div>
          </template>

          <!-- 支付记录表格 -->
          <el-table :data="paymentRecords" v-loading="paymentLoading" stripe border>
            <el-table-column type="selection" width="55" />
            <el-table-column prop="paymentBatch" label="支付批次" width="140" />
            <el-table-column prop="applicationNo" label="申请单号" width="140" />
            <el-table-column prop="applicantName" label="申请人" width="100" />
            <el-table-column prop="amount" label="支付金额" width="120" align="right">
              <template #default="{ row }">
                ¥{{ row.amount.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="paymentMethod" label="支付方式" width="120">
              <template #default="{ row }">
                <el-tag :type="getPaymentMethodType(row.paymentMethod)">
                  {{ getPaymentMethodText(row.paymentMethod) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="paymentDate" label="支付日期" width="120" />
            <el-table-column prop="status" label="支付状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getPaymentStatusType(row.status)">
                  {{ getPaymentStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="viewPaymentDetail(row)">
                  详情
                </el-button>
                <el-button type="info" size="small" @click="downloadVoucher(row)">
                  凭证
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 统计分析 -->
      <el-tab-pane label="统计分析" name="statistics">
        <el-card shadow="never">
          <!-- 统计卡片 -->
          <el-row :gutter="20" class="stats-row">
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value">{{ statistics.totalAmount.toLocaleString() }}</div>
                <div class="stat-label">本月报销总额（元）</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value">{{ statistics.totalCount }}</div>
                <div class="stat-label">本月报销笔数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value">{{ statistics.pendingCount }}</div>
                <div class="stat-label">待审批数量</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value">{{ statistics.avgAmount.toLocaleString() }}</div>
                <div class="stat-label">平均报销金额（元）</div>
              </div>
            </el-col>
          </el-row>

          <!-- 图表展示 -->
          <el-row :gutter="20" class="charts-row">
            <el-col :span="12">
              <div class="chart-container">
                <h4>费用类型分布</h4>
                <div class="chart-placeholder">费用类型饼图</div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="chart-container">
                <h4>月度趋势</h4>
                <div class="chart-placeholder">月度趋势折线图</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 报销申请弹窗 -->
    <el-dialog
      v-model="expenseDialogVisible"
      :title="isEdit ? '编辑报销申请' : '新增报销申请'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="expenseFormRef"
        :model="expenseForm"
        :rules="expenseRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="申请人" prop="applicantId">
              <el-select v-model="expenseForm.applicantId" placeholder="请选择申请人" style="width: 100%">
                <el-option
                  v-for="emp in employees"
                  :key="emp.id"
                  :label="emp.name"
                  :value="emp.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="费用类型" prop="expenseType">
              <el-select v-model="expenseForm.expenseType" placeholder="请选择费用类型" style="width: 100%">
                <el-option label="差旅费" value="travel" />
                <el-option label="办公用品" value="office" />
                <el-option label="培训费" value="training" />
                <el-option label="招待费" value="entertainment" />
                <el-option label="医疗费" value="medical" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报销金额" prop="amount">
              <el-input-number
                v-model="expenseForm.amount"
                :precision="2"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预算科目" prop="budgetSubject">
              <el-select v-model="expenseForm.budgetSubject" placeholder="请选择预算科目" style="width: 100%">
                <el-option label="管理费用" value="management" />
                <el-option label="营业费用" value="operating" />
                <el-option label="培训费用" value="training" />
                <el-option label="差旅费用" value="travel" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="费用说明" prop="description">
          <el-input
            v-model="expenseForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入费用说明"
          />
        </el-form-item>

        <el-form-item label="发票附件">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :file-list="expenseForm.invoices"
            multiple
          >
            <el-button size="small" type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持上传发票、收据等附件，支持OCR识别
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="expenseDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveExpenseApplication">确定</el-button>
      </template>
    </el-dialog>

    <!-- 审批弹窗 -->
    <el-dialog
      v-model="approvalDialogVisible"
      title="费用审批"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="approval-content">
        <h4>申请信息</h4>
        <p><strong>申请单号：</strong>{{ currentApplication.applicationNo }}</p>
        <p><strong>申请人：</strong>{{ currentApplication.applicantName }}</p>
        <p><strong>费用类型：</strong>{{ currentApplication.expenseTypeName }}</p>
        <p><strong>报销金额：</strong>¥{{ currentApplication.amount?.toLocaleString() }}</p>
        <p><strong>费用说明：</strong>{{ currentApplication.description }}</p>
      </div>

      <el-form label-width="100px">
        <el-form-item label="审批结果">
          <el-radio-group v-model="approvalForm.result">
            <el-radio label="approved">通过</el-radio>
            <el-radio label="rejected">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input
            v-model="approvalForm.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入审批意见"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="approvalDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveApproval">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { dataManager } from '@/utils/mockData'

// 响应式数据
const activeTab = ref('applications')
const loading = ref(false)
const approvalLoading = ref(false)
const paymentLoading = ref(false)
const expenseList = ref([])
const pendingApprovals = ref([])
const paymentRecords = ref([])
const employees = ref([])
const isEdit = ref(false)

// 弹窗状态
const expenseDialogVisible = ref(false)
const approvalDialogVisible = ref(false)
const expenseFormRef = ref()

// 搜索表单
const searchForm = reactive({
  applicantName: '',
  expenseType: '',
  status: '',
  dateRange: []
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 报销表单
const expenseForm = reactive({
  applicantId: '',
  expenseType: '',
  amount: 0,
  budgetSubject: '',
  description: '',
  invoices: []
})

// 审批表单
const approvalForm = reactive({
  result: 'approved',
  comment: ''
})

const currentApplication = ref({})

// 统计数据
const statistics = ref({
  totalAmount: 128500,
  totalCount: 56,
  pendingCount: 8,
  avgAmount: 2294
})

// 表单验证规则
const expenseRules = {
  applicantId: [{ required: true, message: '请选择申请人', trigger: 'change' }],
  expenseType: [{ required: true, message: '请选择费用类型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入报销金额', trigger: 'blur' }],
  budgetSubject: [{ required: true, message: '请选择预算科目', trigger: 'change' }],
  description: [{ required: true, message: '请输入费用说明', trigger: 'blur' }]
}

// 方法
const loadData = () => {
  employees.value = dataManager.getData('employees') || []
  loadExpenseData()
  loadPendingApprovals()
  loadPaymentRecords()
}

const loadExpenseData = () => {
  loading.value = true
  setTimeout(() => {
    // 模拟费用报销数据
    expenseList.value = [
      {
        applicationNo: 'EXP202401001',
        applicantName: '张三',
        department: '内科',
        expenseType: 'travel',
        expenseTypeName: '差旅费',
        amount: 1500,
        budgetSubject: '差旅费用',
        description: '北京出差住宿费',
        status: 'pending',
        applyDate: '2024-01-15'
      },
      {
        applicationNo: 'EXP202401002',
        applicantName: '李四',
        department: '外科',
        expenseType: 'office',
        expenseTypeName: '办公用品',
        amount: 800,
        budgetSubject: '管理费用',
        description: '购买办公文具',
        status: 'approved',
        applyDate: '2024-01-14'
      }
    ]
    pagination.total = expenseList.value.length
    loading.value = false
  }, 500)
}

const loadPendingApprovals = () => {
  approvalLoading.value = true
  setTimeout(() => {
    pendingApprovals.value = [
      {
        applicationNo: 'EXP202401001',
        applicantName: '张三',
        expenseTypeName: '差旅费',
        amount: 1500,
        applyDate: '2024-01-15',
        currentApprover: '当前用户',
        priority: '普通'
      }
    ]
    approvalLoading.value = false
  }, 300)
}

const loadPaymentRecords = () => {
  paymentLoading.value = true
  setTimeout(() => {
    paymentRecords.value = [
      {
        paymentBatch: 'PAY202401001',
        applicationNo: 'EXP202312020',
        applicantName: '王五',
        amount: 2000,
        paymentMethod: 'bank',
        paymentDate: '2024-01-10',
        status: 'completed',
        operator: '财务部'
      }
    ]
    paymentLoading.value = false
  }, 300)
}

const getExpenseTypeColor = (type) => {
  const colors = {
    travel: 'primary',
    office: 'success',
    training: 'warning',
    entertainment: 'info',
    medical: 'danger'
  }
  return colors[type] || ''
}

const getStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    reviewing: 'primary',
    approved: 'success',
    rejected: 'danger',
    paid: 'info'
  }
  return typeMap[status] || ''
}

const getStatusText = (status) => {
  const textMap = {
    pending: '待审批',
    reviewing: '审批中',
    approved: '已通过',
    rejected: '已驳回',
    paid: '已支付'
  }
  return textMap[status] || status
}

const getPriorityType = (priority) => {
  return priority === '紧急' ? 'danger' : ''
}

const getPaymentMethodType = (method) => {
  return method === 'bank' ? 'success' : 'primary'
}

const getPaymentMethodText = (method) => {
  const textMap = {
    bank: '银行转账',
    cash: '现金支付',
    card: '刷卡支付'
  }
  return textMap[method] || method
}

const getPaymentStatusType = (status) => {
  return status === 'completed' ? 'success' : 'warning'
}

const getPaymentStatusText = (status) => {
  return status === 'completed' ? '已完成' : '处理中'
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    if (key === 'dateRange') {
      searchForm[key] = []
    } else {
      searchForm[key] = ''
    }
  })
  loadExpenseData()
}

const showExpenseDialog = () => {
  isEdit.value = false
  resetExpenseForm()
  expenseDialogVisible.value = true
}

const showBatchImportDialog = () => {
  ElMessage.info('批量导入功能')
}

const resetExpenseForm = () => {
  Object.keys(expenseForm).forEach(key => {
    if (key === 'amount') {
      expenseForm[key] = 0
    } else if (key === 'invoices') {
      expenseForm[key] = []
    } else {
      expenseForm[key] = ''
    }
  })
  if (expenseFormRef.value) {
    expenseFormRef.value.clearValidate()
  }
}

const saveExpenseApplication = async () => {
  try {
    await expenseFormRef.value.validate()
    
    const employee = employees.value.find(e => e.id === expenseForm.applicantId)
    const newApplication = {
      applicationNo: `EXP${Date.now()}`,
      applicantName: employee?.name,
      department: employee?.departmentName,
      ...expenseForm,
      status: 'pending',
      applyDate: new Date().toLocaleDateString()
    }
    
    expenseList.value.unshift(newApplication)
    ElMessage.success('报销申请提交成功')
    expenseDialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const viewExpenseDetail = (row) => {
  ElMessage.info(`查看申请详情: ${row.applicationNo}`)
}

const approveExpense = (row) => {
  currentApplication.value = row
  approvalForm.result = 'approved'
  approvalForm.comment = ''
  approvalDialogVisible.value = true
}

const payExpense = (row) => {
  ElMessage.success(`${row.applicationNo} 支付成功`)
  row.status = 'paid'
}

const editExpense = (row) => {
  ElMessage.info(`编辑申请: ${row.applicationNo}`)
}

const batchApproval = () => {
  ElMessage.success('批量审批完成')
}

const handleApprove = (row) => {
  ElMessage.success(`${row.applicationNo} 审批通过`)
}

const handleReject = (row) => {
  ElMessage.warning(`${row.applicationNo} 已驳回`)
}

const viewApprovalDetail = (row) => {
  ElMessage.info(`查看审批详情: ${row.applicationNo}`)
}

const batchPayment = () => {
  ElMessage.success('批量支付完成')
}

const viewPaymentDetail = (row) => {
  ElMessage.info(`查看支付详情: ${row.paymentBatch}`)
}

const downloadVoucher = (row) => {
  ElMessage.success(`下载支付凭证: ${row.paymentBatch}`)
}

const saveApproval = () => {
  ElMessage.success('审批完成')
  approvalDialogVisible.value = false
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.expense-management {
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.stats-row {
  margin-bottom: 30px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.charts-row {
  margin-top: 20px;
}

.chart-container {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 20px;
}

.chart-container h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.chart-placeholder {
  height: 200px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.approval-content {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 20px;
}

.approval-content h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.approval-content p {
  margin: 8px 0;
  color: #606266;
}

.upload-demo .el-upload__tip {
  color: #909399;
  font-size: 12px;
}
</style> 