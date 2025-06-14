<template>
  <div class="salary-management">
    <div class="page-header">
      <div class="header-title">
        <h2>薪酬福利管理</h2>
        <p>管理员工薪酬核算、工资发放和社保公积金等福利</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" icon="Calculator" @click="showSalaryCalculationDialog">
          薪酬核算
        </el-button>
        <el-button icon="Money" @click="showSalaryPaymentDialog">
          工资发放
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="card">
      <!-- 薪酬核算 -->
      <el-tab-pane label="薪酬核算" name="calculation">
        <el-card shadow="never">
          <!-- 搜索筛选 -->
          <el-form :model="searchForm" inline>
            <el-form-item label="员工姓名">
              <el-input
                v-model="searchForm.employeeName"
                placeholder="请输入员工姓名"
                clearable
              />
            </el-form-item>
            <el-form-item label="部门">
              <el-select
                v-model="searchForm.department"
                placeholder="请选择部门"
                clearable
              >
                <el-option label="内科" value="内科" />
                <el-option label="外科" value="外科" />
                <el-option label="儿科" value="儿科" />
                <el-option label="护理部" value="护理部" />
              </el-select>
            </el-form-item>
            <el-form-item label="核算月份">
              <el-date-picker
                v-model="searchForm.month"
                type="month"
                placeholder="选择月份"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadSalaryData">查询</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 薪酬表格 -->
          <el-table :data="salaryList" v-loading="loading" stripe border>
            <el-table-column prop="employeeName" label="员工姓名" width="120" />
            <el-table-column prop="employeeId" label="工号" width="100" />
            <el-table-column prop="department" label="部门" width="100" />
            <el-table-column prop="position" label="岗位" width="120" />
            <el-table-column prop="baseSalary" label="基本工资" width="100" align="right">
              <template #default="{ row }">
                ¥{{ row.baseSalary.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="positionSalary" label="岗位工资" width="100" align="right">
              <template #default="{ row }">
                ¥{{ row.positionSalary.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="performanceBonus" label="绩效奖金" width="100" align="right">
              <template #default="{ row }">
                ¥{{ row.performanceBonus.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="allowance" label="津贴补贴" width="100" align="right">
              <template #default="{ row }">
                ¥{{ row.allowance.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="attendanceDeduction" label="考勤扣款" width="100" align="right">
              <template #default="{ row }">
                <span style="color: #f56c6c;">-¥{{ row.attendanceDeduction.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="socialInsurance" label="社保扣款" width="100" align="right">
              <template #default="{ row }">
                <span style="color: #f56c6c;">-¥{{ row.socialInsurance.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="tax" label="个人所得税" width="110" align="right">
              <template #default="{ row }">
                <span style="color: #f56c6c;">-¥{{ row.tax.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="netSalary" label="实发工资" width="120" align="right">
              <template #default="{ row }">
                <strong style="color: #67c23a;">¥{{ row.netSalary.toLocaleString() }}</strong>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="viewSalaryDetail(row)">
                  详情
                </el-button>
                <el-button
                  v-if="row.status === 'calculated'"
                  type="success"
                  size="small"
                  @click="approveSalary(row)"
                >
                  审核
                </el-button>
                <el-button
                  v-if="row.status === 'approved'"
                  type="warning"
                  size="small"
                  @click="paySalary(row)"
                >
                  发放
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

      <!-- 工资发放 -->
      <el-tab-pane label="工资发放" name="payment">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>工资发放记录</span>
              <el-button type="primary" @click="batchPayment">
                批量发放
              </el-button>
            </div>
          </template>

          <!-- 发放记录表格 -->
          <el-table :data="paymentRecords" v-loading="paymentLoading" stripe border>
            <el-table-column type="selection" width="55" />
            <el-table-column prop="batchNo" label="批次号" width="120" />
            <el-table-column prop="month" label="发放月份" width="120" />
            <el-table-column prop="totalAmount" label="发放总额" width="120" align="right">
              <template #default="{ row }">
                ¥{{ row.totalAmount.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="employeeCount" label="发放人数" width="100" align="center" />
            <el-table-column prop="paymentDate" label="发放日期" width="150" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getPaymentStatusType(row.status)">
                  {{ getPaymentStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" width="120" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="viewPaymentDetail(row)">
                  详情
                </el-button>
                <el-button type="info" size="small" @click="downloadPaymentFile(row)">
                  下载
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 电子工资条 -->
      <el-tab-pane label="电子工资条" name="payslip">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>电子工资条查询</span>
              <el-button type="primary" @click="sendPayslips">
                批量发送
              </el-button>
            </div>
          </template>

          <!-- 工资条查询 -->
          <el-form :model="payslipForm" inline>
            <el-form-item label="员工">
              <el-select
                v-model="payslipForm.employeeId"
                placeholder="请选择员工"
                clearable
                filterable
              >
                <el-option
                  v-for="emp in employees"
                  :key="emp.id"
                  :label="emp.name"
                  :value="emp.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="月份">
              <el-date-picker
                v-model="payslipForm.month"
                type="month"
                placeholder="选择月份"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="queryPayslip">查询工资条</el-button>
            </el-form-item>
          </el-form>

          <!-- 工资条展示 -->
          <div v-if="currentPayslip" class="payslip-container">
            <div class="payslip-header">
              <h3>{{ currentPayslip.employeeName }} {{ currentPayslip.month }}月工资条</h3>
              <div class="payslip-actions">
                <el-button @click="printPayslip">打印</el-button>
                <el-button type="primary" @click="sendPayslipEmail">发送邮件</el-button>
              </div>
            </div>
            
            <div class="payslip-content">
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="payslip-section">
                    <h4>应发项目</h4>
                    <div class="payslip-item">
                      <span>基本工资：</span>
                      <span>¥{{ currentPayslip.baseSalary.toLocaleString() }}</span>
                    </div>
                    <div class="payslip-item">
                      <span>岗位工资：</span>
                      <span>¥{{ currentPayslip.positionSalary.toLocaleString() }}</span>
                    </div>
                    <div class="payslip-item">
                      <span>绩效奖金：</span>
                      <span>¥{{ currentPayslip.performanceBonus.toLocaleString() }}</span>
                    </div>
                    <div class="payslip-item">
                      <span>津贴补贴：</span>
                      <span>¥{{ currentPayslip.allowance.toLocaleString() }}</span>
                    </div>
                    <div class="payslip-total">
                      <span>应发合计：</span>
                      <span>¥{{ currentPayslip.grossSalary.toLocaleString() }}</span>
                    </div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="payslip-section">
                    <h4>扣款项目</h4>
                    <div class="payslip-item">
                      <span>考勤扣款：</span>
                      <span>¥{{ currentPayslip.attendanceDeduction.toLocaleString() }}</span>
                    </div>
                    <div class="payslip-item">
                      <span>社会保险：</span>
                      <span>¥{{ currentPayslip.socialInsurance.toLocaleString() }}</span>
                    </div>
                    <div class="payslip-item">
                      <span>住房公积金：</span>
                      <span>¥{{ currentPayslip.housingFund.toLocaleString() }}</span>
                    </div>
                    <div class="payslip-item">
                      <span>个人所得税：</span>
                      <span>¥{{ currentPayslip.tax.toLocaleString() }}</span>
                    </div>
                    <div class="payslip-total">
                      <span>扣款合计：</span>
                      <span>¥{{ currentPayslip.totalDeduction.toLocaleString() }}</span>
                    </div>
                  </div>
                </el-col>
              </el-row>
              
              <div class="payslip-net">
                <span>实发工资：</span>
                <span class="net-amount">¥{{ currentPayslip.netSalary.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 社保公积金 -->
      <el-tab-pane label="社保公积金" name="insurance">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>社保公积金管理</span>
              <el-button type="primary" @click="showInsuranceDialog">
                新增参保
              </el-button>
            </div>
          </template>

          <!-- 社保记录表格 -->
          <el-table :data="insuranceRecords" v-loading="insuranceLoading" stripe border>
            <el-table-column prop="employeeName" label="员工姓名" width="120" />
            <el-table-column prop="employeeId" label="工号" width="100" />
            <el-table-column prop="socialSecurityBase" label="社保基数" width="120" align="right">
              <template #default="{ row }">
                ¥{{ row.socialSecurityBase.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="housingFundBase" label="公积金基数" width="120" align="right">
              <template #default="{ row }">
                ¥{{ row.housingFundBase.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="personalTotal" label="个人缴费" width="120" align="right">
              <template #default="{ row }">
                ¥{{ row.personalTotal.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="companyTotal" label="单位缴费" width="120" align="right">
              <template #default="{ row }">
                ¥{{ row.companyTotal.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="参保状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                  {{ row.status === 'active' ? '正常' : '停保' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="warning" size="small" @click="editInsurance(row)">
                  编辑
                </el-button>
                <el-button type="info" size="small" @click="viewInsuranceDetail(row)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { dataManager } from '@/utils/mockData'

// 响应式数据
const activeTab = ref('calculation')
const loading = ref(false)
const paymentLoading = ref(false)
const insuranceLoading = ref(false)
const salaryList = ref([])
const paymentRecords = ref([])
const insuranceRecords = ref([])
const employees = ref([])
const currentPayslip = ref(null)

// 搜索表单
const searchForm = reactive({
  employeeName: '',
  department: '',
  month: ''
})

// 工资条查询表单
const payslipForm = reactive({
  employeeId: '',
  month: ''
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 方法
const loadData = () => {
  employees.value = dataManager.getData('employees') || []
  loadSalaryData()
  loadPaymentRecords()
  loadInsuranceRecords()
}

const loadSalaryData = () => {
  loading.value = true
  setTimeout(() => {
    // 模拟薪酬数据
    salaryList.value = employees.value.map(emp => ({
      employeeName: emp.name,
      employeeId: emp.id,
      department: emp.departmentName,
      position: emp.position,
      baseSalary: 5000 + Math.floor(Math.random() * 3000),
      positionSalary: 2000 + Math.floor(Math.random() * 2000),
      performanceBonus: Math.floor(Math.random() * 3000),
      allowance: 500 + Math.floor(Math.random() * 1000),
      attendanceDeduction: Math.floor(Math.random() * 500),
      socialInsurance: 800 + Math.floor(Math.random() * 200),
      tax: Math.floor(Math.random() * 1000),
      netSalary: 0,
      status: ['calculated', 'approved', 'paid'][Math.floor(Math.random() * 3)]
    }))
    
    // 计算实发工资
    salaryList.value.forEach(item => {
      const gross = item.baseSalary + item.positionSalary + item.performanceBonus + item.allowance
      const deduction = item.attendanceDeduction + item.socialInsurance + item.tax
      item.netSalary = gross - deduction
    })
    
    pagination.total = salaryList.value.length
    loading.value = false
  }, 500)
}

const loadPaymentRecords = () => {
  paymentLoading.value = true
  setTimeout(() => {
    paymentRecords.value = [
      {
        batchNo: 'PAY202401001',
        month: '2024年1月',
        totalAmount: 1250000,
        employeeCount: 125,
        paymentDate: '2024-02-05',
        status: 'completed',
        operator: '财务部'
      },
      {
        batchNo: 'PAY202312001',
        month: '2023年12月',
        totalAmount: 1350000,
        employeeCount: 130,
        paymentDate: '2024-01-05',
        status: 'completed',
        operator: '财务部'
      }
    ]
    paymentLoading.value = false
  }, 300)
}

const loadInsuranceRecords = () => {
  insuranceLoading.value = true
  setTimeout(() => {
    insuranceRecords.value = employees.value.slice(0, 10).map(emp => ({
      employeeName: emp.name,
      employeeId: emp.id,
      socialSecurityBase: 8000 + Math.floor(Math.random() * 4000),
      housingFundBase: 6000 + Math.floor(Math.random() * 3000),
      personalTotal: 800 + Math.floor(Math.random() * 400),
      companyTotal: 1200 + Math.floor(Math.random() * 600),
      status: 'active'
    }))
    insuranceLoading.value = false
  }, 300)
}

const getStatusType = (status) => {
  const typeMap = {
    calculated: 'warning',
    approved: 'primary',
    paid: 'success'
  }
  return typeMap[status] || ''
}

const getStatusText = (status) => {
  const textMap = {
    calculated: '已核算',
    approved: '已审核',
    paid: '已发放'
  }
  return textMap[status] || status
}

const getPaymentStatusType = (status) => {
  return status === 'completed' ? 'success' : 'warning'
}

const getPaymentStatusText = (status) => {
  return status === 'completed' ? '已完成' : '处理中'
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  loadSalaryData()
}

const showSalaryCalculationDialog = () => {
  ElMessage.info('打开薪酬核算对话框')
}

const showSalaryPaymentDialog = () => {
  ElMessage.info('打开工资发放对话框')
}

const viewSalaryDetail = (row) => {
  ElMessage.info(`查看 ${row.employeeName} 的薪酬详情`)
}

const approveSalary = (row) => {
  ElMessage.success(`${row.employeeName} 的薪酬审核通过`)
  row.status = 'approved'
}

const paySalary = (row) => {
  ElMessage.success(`${row.employeeName} 的工资发放成功`)
  row.status = 'paid'
}

const batchPayment = () => {
  ElMessage.success('批量发放工资成功')
}

const viewPaymentDetail = (row) => {
  ElMessage.info(`查看批次 ${row.batchNo} 的发放详情`)
}

const downloadPaymentFile = (row) => {
  ElMessage.success(`下载批次 ${row.batchNo} 的发放文件`)
}

const sendPayslips = () => {
  ElMessage.success('批量发送工资条成功')
}

const queryPayslip = () => {
  if (!payslipForm.employeeId || !payslipForm.month) {
    ElMessage.warning('请选择员工和月份')
    return
  }
  
  const employee = employees.value.find(emp => emp.id === payslipForm.employeeId)
  const salary = salaryList.value.find(s => s.employeeId === payslipForm.employeeId)
  
  if (employee && salary) {
    currentPayslip.value = {
      employeeName: employee.name,
      month: new Date(payslipForm.month).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' }),
      ...salary,
      grossSalary: salary.baseSalary + salary.positionSalary + salary.performanceBonus + salary.allowance,
      totalDeduction: salary.attendanceDeduction + salary.socialInsurance + salary.tax,
      housingFund: 500
    }
  }
}

const printPayslip = () => {
  ElMessage.info('打印工资条')
}

const sendPayslipEmail = () => {
  ElMessage.success('工资条邮件发送成功')
}

const showInsuranceDialog = () => {
  ElMessage.info('新增参保对话框')
}

const editInsurance = (row) => {
  ElMessage.info(`编辑 ${row.employeeName} 的社保信息`)
}

const viewInsuranceDetail = (row) => {
  ElMessage.info(`查看 ${row.employeeName} 的社保详情`)
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.salary-management {
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

.payslip-container {
  margin-top: 20px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
}

.payslip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
}

.payslip-header h3 {
  margin: 0;
  color: #303133;
}

.payslip-content {
  padding: 20px;
}

.payslip-section {
  margin-bottom: 20px;
}

.payslip-section h4 {
  margin: 0 0 15px 0;
  color: #409eff;
  border-bottom: 1px solid #dcdfe6;
  padding-bottom: 5px;
}

.payslip-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed #e4e7ed;
}

.payslip-total {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  font-weight: bold;
  color: #e6a23c;
  border-top: 2px solid #e6a23c;
  margin-top: 10px;
}

.payslip-net {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f0f9ff;
  border-radius: 8px;
  margin-top: 20px;
  font-size: 18px;
  font-weight: bold;
}

.net-amount {
  color: #67c23a;
  font-size: 24px;
}
</style> 