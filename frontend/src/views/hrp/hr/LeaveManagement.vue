<template>
  <div class="leave-management">
    <div class="page-header">
      <div class="header-title">
        <h2>假勤与调休管理</h2>
        <p>管理员工假期额度、请假申请和审批流程</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" icon="Plus" @click="showLeaveDialog">
          申请请假
        </el-button>
        <el-button icon="Setting" @click="showLeaveTypeDialog">
          假期设置
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="card">
      <!-- 请假申请 -->
      <el-tab-pane label="请假申请" name="applications">
        <el-card shadow="never">
          <!-- 搜索筛选 -->
          <el-form :model="searchForm" inline>
            <el-form-item label="申请人">
              <el-input
                v-model="searchForm.employeeName"
                placeholder="请输入申请人姓名"
                clearable
              />
            </el-form-item>
            <el-form-item label="假期类型">
              <el-select
                v-model="searchForm.leaveTypeId"
                placeholder="请选择假期类型"
                clearable
              >
                <el-option
                  v-for="type in leaveTypes"
                  :key="type.id"
                  :label="type.name"
                  :value="type.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select
                v-model="searchForm.status"
                placeholder="请选择状态"
                clearable
              >
                <el-option label="待审批" value="pending" />
                <el-option label="已批准" value="approved" />
                <el-option label="已驳回" value="rejected" />
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
              <el-button type="primary" @click="loadApplications">查询</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 请假申请表格 -->
          <el-table :data="leaveApplications" v-loading="loading" stripe border>
            <el-table-column prop="employeeName" label="申请人" width="120" />
            <el-table-column prop="leaveTypeName" label="假期类型" width="100">
              <template #default="{ row }">
                <el-tag :color="getLeaveTypeColor(row.leaveTypeId)" style="color: white;">
                  {{ row.leaveTypeName }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="请假时间" width="200">
              <template #default="{ row }">
                {{ row.startDate }} 至 {{ row.endDate }}
              </template>
            </el-table-column>
            <el-table-column prop="days" label="请假天数" width="100" align="center">
              <template #default="{ row }">
                {{ row.days }}天
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="请假事由" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="applyTime" label="申请时间" width="150" />
            <el-table-column prop="approver" label="审批人" width="120" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="viewApplication(row)">
                  详情
                </el-button>
                <el-button
                  v-if="row.status === 'pending'"
                  type="success"
                  size="small"
                  @click="approveApplication(row)"
                >
                  审批
                </el-button>
                <el-button
                  v-if="row.status === 'pending'"
                  type="warning"
                  size="small"
                  @click="editApplication(row)"
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

      <!-- 假期额度 -->
      <el-tab-pane label="假期额度" name="quotas">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>假期额度管理</span>
              <el-button type="primary" @click="refreshQuotas">
                刷新额度
              </el-button>
            </div>
          </template>

          <!-- 员工假期额度表格 -->
          <el-table :data="employeeQuotas" v-loading="quotasLoading" stripe border>
            <el-table-column prop="employeeName" label="员工姓名" width="120" />
            <el-table-column prop="department" label="部门" width="120" />
            <el-table-column
              v-for="type in leaveTypes"
              :key="type.id"
              :label="type.name"
              width="120"
              align="center"
            >
              <template #default="{ row }">
                <div class="quota-info">
                  <div class="quota-available">{{ getAvailableQuota(row.employeeId, type.id) }}</div>
                  <div class="quota-total">/ {{ type.maxDays }}天</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="viewQuotaDetail(row)">
                  详情
                </el-button>
                <el-button type="warning" size="small" @click="adjustQuota(row)">
                  调整
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 假期类型 -->
      <el-tab-pane label="假期类型" name="types">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>假期类型设置</span>
              <el-button type="primary" @click="showLeaveTypeDialog">
                新增类型
              </el-button>
            </div>
          </template>

          <!-- 假期类型表格 -->
          <el-table :data="leaveTypes" stripe border>
            <el-table-column prop="name" label="假期名称" width="120" />
            <el-table-column prop="code" label="假期代码" width="120" />
            <el-table-column prop="maxDays" label="最大天数" width="100" align="center" />
            <el-table-column prop="needApproval" label="需要审批" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.needApproval ? 'success' : 'info'">
                  {{ row.needApproval ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="isDeductSalary" label="是否扣薪" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.isDeductSalary ? 'danger' : 'success'">
                  {{ row.isDeductSalary ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="warning" size="small" @click="editLeaveType(row)">
                  编辑
                </el-button>
                <el-button type="danger" size="small" @click="deleteLeaveType(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 请假申请弹窗 -->
    <el-dialog
      v-model="leaveDialogVisible"
      :title="isEdit ? '编辑请假申请' : '新增请假申请'"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="leaveFormRef"
        :model="leaveForm"
        :rules="leaveRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="申请人" prop="employeeId">
              <el-select v-model="leaveForm.employeeId" placeholder="请选择申请人" style="width: 100%">
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
            <el-form-item label="假期类型" prop="leaveTypeId">
              <el-select
                v-model="leaveForm.leaveTypeId"
                placeholder="请选择假期类型"
                style="width: 100%"
                @change="handleLeaveTypeChange"
              >
                <el-option
                  v-for="type in leaveTypes"
                  :key="type.id"
                  :label="type.name"
                  :value="type.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期" prop="startDate">
              <el-date-picker
                v-model="leaveForm.startDate"
                type="date"
                placeholder="选择开始日期"
                style="width: 100%"
                @change="calculateDays"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期" prop="endDate">
              <el-date-picker
                v-model="leaveForm.endDate"
                type="date"
                placeholder="选择结束日期"
                style="width: 100%"
                @change="calculateDays"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="请假天数">
              <el-input v-model="leaveForm.days" readonly>
                <template #append>天</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="可用余额">
              <el-input :value="availableQuota" readonly>
                <template #append>天</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="请假事由" prop="reason">
          <el-input
            v-model="leaveForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入请假事由"
          />
        </el-form-item>

        <el-form-item label="附件">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :file-list="leaveForm.attachments"
          >
            <el-button size="small" type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持上传病假条、证明材料等
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="leaveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveLeaveApplication">确定</el-button>
      </template>
    </el-dialog>

    <!-- 审批弹窗 -->
    <el-dialog
      v-model="approveDialogVisible"
      title="请假审批"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="approve-content">
        <h4>申请信息</h4>
        <p><strong>申请人：</strong>{{ currentApplication.employeeName }}</p>
        <p><strong>假期类型：</strong>{{ currentApplication.leaveTypeName }}</p>
        <p><strong>请假时间：</strong>{{ currentApplication.startDate }} 至 {{ currentApplication.endDate }}</p>
        <p><strong>请假天数：</strong>{{ currentApplication.days }}天</p>
        <p><strong>请假事由：</strong>{{ currentApplication.reason }}</p>
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
            v-model="approveForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入审批意见"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveApproval">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { dataManager } from '@/utils/mockData'

// 响应式数据
const activeTab = ref('applications')
const loading = ref(false)
const quotasLoading = ref(false)
const leaveApplications = ref([])
const leaveTypes = ref([])
const employees = ref([])
const employeeQuotas = ref([])

// 弹窗状态
const leaveDialogVisible = ref(false)
const approveDialogVisible = ref(false)
const leaveTypeDialogVisible = ref(false)
const isEdit = ref(false)
const leaveFormRef = ref()

// 搜索表单
const searchForm = reactive({
  employeeName: '',
  leaveTypeId: '',
  status: '',
  dateRange: []
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 请假表单
const leaveForm = reactive({
  employeeId: '',
  leaveTypeId: '',
  startDate: '',
  endDate: '',
  days: 0,
  reason: '',
  attachments: []
})

// 审批表单
const approveForm = reactive({
  result: 'approved',
  remark: ''
})

const currentApplication = ref({})

// 表单验证规则
const leaveRules = {
  employeeId: [{ required: true, message: '请选择申请人', trigger: 'change' }],
  leaveTypeId: [{ required: true, message: '请选择假期类型', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
  reason: [{ required: true, message: '请输入请假事由', trigger: 'blur' }]
}

// 计算属性
const availableQuota = computed(() => {
  if (!leaveForm.employeeId || !leaveForm.leaveTypeId) return 0
  return getAvailableQuota(leaveForm.employeeId, leaveForm.leaveTypeId)
})

// 方法
const loadData = () => {
  employees.value = dataManager.getData('employees') || []
  leaveTypes.value = dataManager.getData('leaveTypes') || []
  loadApplications()
  loadEmployeeQuotas()
}

const loadApplications = () => {
  loading.value = true
  setTimeout(() => {
    leaveApplications.value = dataManager.getData('leaveApplications') || []
    pagination.total = leaveApplications.value.length
    loading.value = false
  }, 500)
}

const loadEmployeeQuotas = () => {
  quotasLoading.value = true
  setTimeout(() => {
    // 模拟员工假期额度数据
    employeeQuotas.value = employees.value.map(emp => ({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.departmentName
    }))
    quotasLoading.value = false
  }, 500)
}

const getLeaveTypeColor = (leaveTypeId) => {
  const type = leaveTypes.value.find(t => t.id === leaveTypeId)
  return type ? type.color : '#409EFF'
}

const getStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return typeMap[status] || ''
}

const getStatusText = (status) => {
  const textMap = {
    pending: '待审批',
    approved: '已批准',
    rejected: '已驳回'
  }
  return textMap[status] || status
}

const getAvailableQuota = (employeeId, leaveTypeId) => {
  // 模拟计算可用假期余额
  const type = leaveTypes.value.find(t => t.id === leaveTypeId)
  if (!type) return 0
  
  // 计算已使用的假期天数
  const usedDays = leaveApplications.value
    .filter(app => app.employeeId === employeeId && app.leaveTypeId === leaveTypeId && app.status === 'approved')
    .reduce((sum, app) => sum + app.days, 0)
  
  return Math.max(0, type.maxDays - usedDays)
}

const calculateDays = () => {
  if (leaveForm.startDate && leaveForm.endDate) {
    const start = new Date(leaveForm.startDate)
    const end = new Date(leaveForm.endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    leaveForm.days = diffDays
  }
}

const handleLeaveTypeChange = () => {
  // 当选择假期类型时，更新可用余额
}

const showLeaveDialog = () => {
  isEdit.value = false
  resetLeaveForm()
  leaveDialogVisible.value = true
}

const resetLeaveForm = () => {
  Object.keys(leaveForm).forEach(key => {
    if (key === 'days') {
      leaveForm[key] = 0
    } else if (key === 'attachments') {
      leaveForm[key] = []
    } else {
      leaveForm[key] = ''
    }
  })
  if (leaveFormRef.value) {
    leaveFormRef.value.clearValidate()
  }
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    if (key === 'dateRange') {
      searchForm[key] = []
    } else {
      searchForm[key] = ''
    }
  })
  loadApplications()
}

const saveLeaveApplication = async () => {
  try {
    await leaveFormRef.value.validate()
    
    // 检查假期余额
    if (leaveForm.days > availableQuota.value) {
      ElMessage.error('请假天数超过可用余额')
      return
    }
    
    const applications = dataManager.getData('leaveApplications') || []
    const employee = employees.value.find(e => e.id === leaveForm.employeeId)
    const leaveType = leaveTypes.value.find(t => t.id === leaveForm.leaveTypeId)
    
    const newApplication = {
      id: Date.now(),
      ...leaveForm,
      employeeName: employee?.name,
      leaveTypeName: leaveType?.name,
      status: 'pending',
      applyTime: new Date().toLocaleString(),
      approver: '',
      approveTime: null,
      approveRemark: ''
    }
    
    applications.push(newApplication)
    dataManager.updateData('leaveApplications', applications)
    
    ElMessage.success('请假申请提交成功')
    leaveDialogVisible.value = false
    loadApplications()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const approveApplication = (row) => {
  currentApplication.value = row
  approveForm.result = 'approved'
  approveForm.remark = ''
  approveDialogVisible.value = true
}

const saveApproval = () => {
  const applications = dataManager.getData('leaveApplications') || []
  const index = applications.findIndex(app => app.id === currentApplication.value.id)
  
  if (index > -1) {
    applications[index].status = approveForm.result
    applications[index].approver = '当前用户'
    applications[index].approveTime = new Date().toLocaleString()
    applications[index].approveRemark = approveForm.remark
    
    dataManager.updateData('leaveApplications', applications)
    ElMessage.success('审批完成')
    approveDialogVisible.value = false
    loadApplications()
  }
}

const viewApplication = (row) => {
  ElMessage.info(`查看申请详情: ${row.employeeName}`)
}

const editApplication = (row) => {
  ElMessage.info(`编辑申请: ${row.employeeName}`)
}

const refreshQuotas = () => {
  ElMessage.success('假期额度已刷新')
  loadEmployeeQuotas()
}

const viewQuotaDetail = (row) => {
  ElMessage.info(`查看 ${row.employeeName} 的假期详情`)
}

const adjustQuota = (row) => {
  ElMessage.info(`调整 ${row.employeeName} 的假期额度`)
}

const showLeaveTypeDialog = () => {
  ElMessage.info('配置假期类型')
}

const editLeaveType = (row) => {
  ElMessage.info(`编辑假期类型: ${row.name}`)
}

const deleteLeaveType = (row) => {
  ElMessageBox.confirm(`确定删除假期类型"${row.name}"吗？`, '删除确认').then(() => {
    ElMessage.success('删除成功')
  })
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.leave-management {
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

.quota-info {
  text-align: center;
}

.quota-available {
  font-size: 16px;
  font-weight: bold;
  color: #409EFF;
}

.quota-total {
  font-size: 12px;
  color: #909399;
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

.upload-demo .el-upload__tip {
  color: #909399;
  font-size: 12px;
}
</style>