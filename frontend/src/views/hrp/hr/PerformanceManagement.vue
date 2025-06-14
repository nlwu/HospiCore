<template>
  <div class="performance-management">
    <div class="page-header">
      <div class="header-title">
        <h2>绩效考核管理</h2>
        <p>管理绩效考核方案、执行考核流程和结果分析</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" icon="Plus" @click="showSchemeDialog">
          新增方案
        </el-button>
        <el-button icon="TrendCharts" @click="viewStatistics">
          绩效统计
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="card">
      <!-- 考核方案 -->
      <el-tab-pane label="考核方案" name="schemes">
        <el-card shadow="never">
          <el-table :data="performanceSchemes" v-loading="schemesLoading" stripe border>
            <el-table-column prop="name" label="方案名称" width="200" />
            <el-table-column prop="category" label="适用人员" width="120" />
            <el-table-column prop="cycle" label="考核周期" width="120">
              <template #default="{ row }">
                {{ getCycleText(row.cycle) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'warning'">
                  {{ row.status === 'active' ? '启用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" />
            <el-table-column prop="createTime" label="创建时间" width="150" />
            <el-table-column label="操作" width="250" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="viewScheme(row)">
                  详情
                </el-button>
                <el-button type="warning" size="small" @click="editScheme(row)">
                  编辑
                </el-button>
                <el-button type="success" size="small" @click="startEvaluation(row)">
                  发起考核
                </el-button>
                <el-button
                  :type="row.status === 'active' ? 'danger' : 'success'"
                  size="small"
                  @click="toggleSchemeStatus(row)"
                >
                  {{ row.status === 'active' ? '停用' : '启用' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 绩效评估 -->
      <el-tab-pane label="绩效评估" name="evaluations">
        <el-card shadow="never">
          <!-- 搜索筛选 -->
          <el-form :model="evaluationSearchForm" inline>
            <el-form-item label="员工">
              <el-select
                v-model="evaluationSearchForm.employeeId"
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
            <el-form-item label="考核方案">
              <el-select
                v-model="evaluationSearchForm.schemeId"
                placeholder="请选择方案"
                clearable
              >
                <el-option
                  v-for="scheme in performanceSchemes"
                  :key="scheme.id"
                  :label="scheme.name"
                  :value="scheme.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="考核期间">
              <el-input
                v-model="evaluationSearchForm.period"
                placeholder="如：2024Q1"
                clearable
              />
            </el-form-item>
            <el-form-item label="状态">
              <el-select
                v-model="evaluationSearchForm.status"
                placeholder="请选择状态"
                clearable
              >
                <el-option label="进行中" value="ongoing" />
                <el-option label="已完成" value="completed" />
                <el-option label="已归档" value="archived" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadEvaluations">查询</el-button>
              <el-button @click="resetEvaluationSearch">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 绩效评估表格 -->
          <el-table :data="performanceEvaluations" v-loading="evaluationsLoading" stripe border>
            <el-table-column prop="employeeName" label="员工姓名" width="120" />
            <el-table-column prop="schemeName" label="考核方案" width="150">
              <template #default="{ row }">
                {{ getSchemeName(row.schemeId) }}
              </template>
            </el-table-column>
            <el-table-column prop="period" label="考核期间" width="100" />
            <el-table-column prop="selfScore" label="自评分数" width="100" align="center">
              <template #default="{ row }">
                <span :class="getScoreClass(row.selfScore)">{{ row.selfScore }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="managerScore" label="主管评分" width="100" align="center">
              <template #default="{ row }">
                <span :class="getScoreClass(row.managerScore)">{{ row.managerScore }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="finalScore" label="最终得分" width="100" align="center">
              <template #default="{ row }">
                <span :class="getScoreClass(row.finalScore)" style="font-weight: bold;">
                  {{ row.finalScore }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="level" label="绩效等级" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getLevelType(row.level)">
                  {{ row.level }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getEvaluationStatusType(row.status)">
                  {{ getEvaluationStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="evaluateTime" label="评估时间" width="150" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="viewEvaluation(row)">
                  详情
                </el-button>
                <el-button
                  v-if="row.status === 'ongoing'"
                  type="warning"
                  size="small"
                  @click="editEvaluation(row)"
                >
                  评分
                </el-button>
                <el-button type="success" size="small" @click="exportEvaluation(row)">
                  导出
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 考核指标 -->
      <el-tab-pane label="考核指标" name="indicators">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>考核指标库</span>
              <el-button type="primary" @click="showIndicatorDialog">
                新增指标
              </el-button>
            </div>
          </template>

          <!-- 指标展示 -->
          <div v-for="scheme in performanceSchemes" :key="scheme.id" class="scheme-indicators">
            <h4>{{ scheme.name }}</h4>
            <el-table :data="scheme.indicators" stripe border>
              <el-table-column prop="name" label="指标名称" width="200" />
              <el-table-column prop="weight" label="权重" width="100" align="center">
                <template #default="{ row }">
                  {{ row.weight }}%
                </template>
              </el-table-column>
              <el-table-column prop="type" label="类型" width="100" />
              <el-table-column prop="description" label="指标说明" />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button type="warning" size="small" @click="editIndicator(row)">
                    编辑
                  </el-button>
                  <el-button type="danger" size="small" @click="deleteIndicator(row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 绩效统计 -->
      <el-tab-pane label="绩效统计" name="statistics">
        <el-card shadow="never">
          <!-- 统计图表 -->
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="chart-container">
                <h4>绩效等级分布</h4>
                <div id="levelChart" style="height: 300px;"></div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="chart-container">
                <h4>平均分趋势</h4>
                <div id="trendChart" style="height: 300px;"></div>
              </div>
            </el-col>
          </el-row>

          <!-- 统计数据 -->
          <el-table :data="performanceStatistics" stripe border style="margin-top: 20px;">
            <el-table-column prop="department" label="部门" width="120" />
            <el-table-column prop="totalEmployees" label="总人数" width="100" align="center" />
            <el-table-column prop="evaluatedEmployees" label="已评估" width="100" align="center" />
            <el-table-column prop="averageScore" label="平均分" width="100" align="center">
              <template #default="{ row }">
                <span :class="getScoreClass(row.averageScore)">{{ row.averageScore }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="aLevel" label="A级人数" width="100" align="center" />
            <el-table-column prop="bLevel" label="B级人数" width="100" align="center" />
            <el-table-column prop="cLevel" label="C级人数" width="100" align="center" />
            <el-table-column prop="dLevel" label="D级人数" width="100" align="center" />
            <el-table-column label="完成率" width="100" align="center">
              <template #default="{ row }">
                {{ ((row.evaluatedEmployees / row.totalEmployees) * 100).toFixed(1) }}%
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 考核方案弹窗 -->
    <el-dialog
      v-model="schemeDialogVisible"
      :title="isEditScheme ? '编辑考核方案' : '新增考核方案'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="schemeFormRef"
        :model="schemeForm"
        :rules="schemeRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="方案名称" prop="name">
              <el-input v-model="schemeForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="适用人员" prop="category">
              <el-select v-model="schemeForm.category" placeholder="请选择" style="width: 100%">
                <el-option label="医疗人员" value="医疗人员" />
                <el-option label="护理人员" value="护理人员" />
                <el-option label="管理人员" value="管理人员" />
                <el-option label="后勤人员" value="后勤人员" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="考核周期" prop="cycle">
              <el-select v-model="schemeForm.cycle" placeholder="请选择" style="width: 100%">
                <el-option label="月度" value="monthly" />
                <el-option label="季度" value="quarterly" />
                <el-option label="半年度" value="semiannual" />
                <el-option label="年度" value="annual" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="schemeForm.status">
                <el-radio label="active">启用</el-radio>
                <el-radio label="inactive">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="方案说明" prop="description">
          <el-input
            v-model="schemeForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入方案说明"
          />
        </el-form-item>

        <!-- 考核指标配置 -->
        <el-form-item label="考核指标">
          <el-table :data="schemeForm.indicators" border>
            <el-table-column prop="name" label="指标名称" width="200">
              <template #default="{ row, $index }">
                <el-input v-model="row.name" placeholder="请输入指标名称" />
              </template>
            </el-table-column>
            <el-table-column prop="weight" label="权重%" width="120">
              <template #default="{ row, $index }">
                <el-input-number v-model="row.weight" :min="0" :max="100" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="120">
              <template #default="{ row, $index }">
                <el-select v-model="row.type" placeholder="选择类型" style="width: 100%">
                  <el-option label="评分" value="score" />
                  <el-option label="数据" value="data" />
                  <el-option label="等级" value="level" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明">
              <template #default="{ row, $index }">
                <el-input v-model="row.description" placeholder="请输入说明" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row, $index }">
                <el-button type="danger" size="small" @click="removeIndicator($index)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="primary" @click="addIndicator" style="margin-top: 10px;">
            添加指标
          </el-button>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="schemeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveScheme">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { dataManager } from '@/utils/mockData'

// 响应式数据
const activeTab = ref('schemes')
const schemesLoading = ref(false)
const evaluationsLoading = ref(false)
const performanceSchemes = ref([])
const performanceEvaluations = ref([])
const employees = ref([])
const performanceStatistics = ref([])

// 弹窗状态
const schemeDialogVisible = ref(false)
const isEditScheme = ref(false)
const schemeFormRef = ref()

// 搜索表单
const evaluationSearchForm = reactive({
  employeeId: '',
  schemeId: '',
  period: '',
  status: ''
})

// 方案表单
const schemeForm = reactive({
  name: '',
  category: '',
  cycle: '',
  status: 'active',
  description: '',
  indicators: []
})

// 表单验证规则
const schemeRules = {
  name: [{ required: true, message: '请输入方案名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择适用人员', trigger: 'change' }],
  cycle: [{ required: true, message: '请选择考核周期', trigger: 'change' }],
  description: [{ required: true, message: '请输入方案说明', trigger: 'blur' }]
}

// 方法
const loadData = () => {
  employees.value = dataManager.getData('employees') || []
  loadSchemes()
  loadEvaluations()
  loadStatistics()
}

const loadSchemes = () => {
  schemesLoading.value = true
  setTimeout(() => {
    performanceSchemes.value = dataManager.getData('performanceSchemes') || []
    schemesLoading.value = false
  }, 500)
}

const loadEvaluations = () => {
  evaluationsLoading.value = true
  setTimeout(() => {
    performanceEvaluations.value = dataManager.getData('performanceEvaluations') || []
    evaluationsLoading.value = false
  }, 500)
}

const loadStatistics = () => {
  // 模拟统计数据
  performanceStatistics.value = [
    {
      department: '内科',
      totalEmployees: 25,
      evaluatedEmployees: 20,
      averageScore: 85.2,
      aLevel: 8,
      bLevel: 10,
      cLevel: 2,
      dLevel: 0
    },
    {
      department: '外科',
      totalEmployees: 30,
      evaluatedEmployees: 25,
      averageScore: 82.8,
      aLevel: 6,
      bLevel: 15,
      cLevel: 4,
      dLevel: 0
    }
  ]
}

const getCycleText = (cycle) => {
  const textMap = {
    monthly: '月度',
    quarterly: '季度',
    semiannual: '半年度',
    annual: '年度'
  }
  return textMap[cycle] || cycle
}

const getSchemeName = (schemeId) => {
  const scheme = performanceSchemes.value.find(s => s.id === schemeId)
  return scheme ? scheme.name : ''
}

const getScoreClass = (score) => {
  if (score >= 90) return 'score-excellent'
  if (score >= 80) return 'score-good'
  if (score >= 70) return 'score-average'
  return 'score-poor'
}

const getLevelType = (level) => {
  const typeMap = {
    'A': 'success',
    'B': 'primary',
    'C': 'warning',
    'D': 'danger'
  }
  return typeMap[level] || ''
}

const getEvaluationStatusType = (status) => {
  const typeMap = {
    ongoing: 'warning',
    completed: 'success',
    archived: 'info'
  }
  return typeMap[status] || ''
}

const getEvaluationStatusText = (status) => {
  const textMap = {
    ongoing: '进行中',
    completed: '已完成',
    archived: '已归档'
  }
  return textMap[status] || status
}

const showSchemeDialog = () => {
  isEditScheme.value = false
  resetSchemeForm()
  schemeDialogVisible.value = true
}

const resetSchemeForm = () => {
  Object.keys(schemeForm).forEach(key => {
    if (key === 'indicators') {
      schemeForm[key] = []
    } else if (key === 'status') {
      schemeForm[key] = 'active'
    } else {
      schemeForm[key] = ''
    }
  })
  if (schemeFormRef.value) {
    schemeFormRef.value.clearValidate()
  }
}

const resetEvaluationSearch = () => {
  Object.keys(evaluationSearchForm).forEach(key => {
    evaluationSearchForm[key] = ''
  })
  loadEvaluations()
}

const addIndicator = () => {
  schemeForm.indicators.push({
    id: Date.now(),
    name: '',
    weight: 0,
    type: 'score',
    description: ''
  })
}

const removeIndicator = (index) => {
  schemeForm.indicators.splice(index, 1)
}

const saveScheme = async () => {
  try {
    await schemeFormRef.value.validate()
    
    // 验证权重总和
    const totalWeight = schemeForm.indicators.reduce((sum, item) => sum + item.weight, 0)
    if (totalWeight !== 100) {
      ElMessage.error('指标权重总和必须为100%')
      return
    }
    
    const schemes = dataManager.getData('performanceSchemes') || []
    
    const newScheme = {
      id: Date.now(),
      ...schemeForm,
      createTime: new Date().toLocaleString()
    }
    
    schemes.push(newScheme)
    dataManager.updateData('performanceSchemes', schemes)
    
    ElMessage.success('考核方案创建成功')
    schemeDialogVisible.value = false
    loadSchemes()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const viewScheme = (row) => {
  ElMessage.info(`查看方案详情: ${row.name}`)
}

const editScheme = (row) => {
  ElMessage.info(`编辑方案: ${row.name}`)
}

const startEvaluation = (row) => {
  ElMessageBox.confirm(`确定要基于方案"${row.name}"发起考核吗？`, '发起考核').then(() => {
    ElMessage.success('考核已发起')
  })
}

const toggleSchemeStatus = (row) => {
  const action = row.status === 'active' ? '停用' : '启用'
  ElMessageBox.confirm(`确定要${action}该方案吗？`, '状态变更').then(() => {
    row.status = row.status === 'active' ? 'inactive' : 'active'
    ElMessage.success(`方案已${action}`)
  })
}

const viewEvaluation = (row) => {
  ElMessage.info(`查看评估详情: ${row.employeeName}`)
}

const editEvaluation = (row) => {
  ElMessage.info(`编辑评估: ${row.employeeName}`)
}

const exportEvaluation = (row) => {
  ElMessage.success(`导出 ${row.employeeName} 的评估报告`)
}

const viewStatistics = () => {
  activeTab.value = 'statistics'
}

const showIndicatorDialog = () => {
  ElMessage.info('配置考核指标')
}

const editIndicator = (row) => {
  ElMessage.info(`编辑指标: ${row.name}`)
}

const deleteIndicator = (row) => {
  ElMessageBox.confirm(`确定删除指标"${row.name}"吗？`, '删除确认').then(() => {
    ElMessage.success('删除成功')
  })
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.performance-management {
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

.scheme-indicators {
  margin-bottom: 30px;
}

.scheme-indicators h4 {
  margin: 0 0 15px 0;
  color: #303133;
  border-bottom: 2px solid #409EFF;
  padding-bottom: 8px;
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

.score-excellent {
  color: #67C23A;
  font-weight: bold;
}

.score-good {
  color: #409EFF;
  font-weight: bold;
}

.score-average {
  color: #E6A23C;
  font-weight: bold;
}

.score-poor {
  color: #F56C6C;
  font-weight: bold;
}
</style> 