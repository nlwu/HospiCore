<template>
  <div class="asset-management">
    <div class="page-header">
      <div class="header-title">
        <h2>资产全生命周期管理</h2>
        <p>管理医院固定资产从采购、使用到报废的全生命周期</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" icon="Plus" @click="showAssetDialog">
          新增资产
        </el-button>
        <el-button icon="DocumentAdd" @click="showPurchaseDialog">
          采购入库
        </el-button>
        <el-button icon="Search" @click="showInventoryDialog">
          盘点管理
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="card">
      <!-- 资产台账 -->
      <el-tab-pane label="资产台账" name="assets">
        <el-card shadow="never">
          <!-- 搜索筛选 -->
          <el-form :model="searchForm" inline>
            <el-form-item label="资产编码">
              <el-input
                v-model="searchForm.assetCode"
                placeholder="请输入资产编码"
                clearable
              />
            </el-form-item>
            <el-form-item label="资产名称">
              <el-input
                v-model="searchForm.assetName"
                placeholder="请输入资产名称"
                clearable
              />
            </el-form-item>
            <el-form-item label="资产类别">
              <el-select
                v-model="searchForm.category"
                placeholder="请选择资产类别"
                clearable
              >
                <el-option label="医疗设备" value="medical" />
                <el-option label="办公设备" value="office" />
                <el-option label="运输设备" value="transport" />
                <el-option label="电子设备" value="electronic" />
                <el-option label="其他设备" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="使用状态">
              <el-select
                v-model="searchForm.status"
                placeholder="请选择使用状态"
                clearable
              >
                <el-option label="在用" value="in_use" />
                <el-option label="闲置" value="idle" />
                <el-option label="维修" value="maintenance" />
                <el-option label="报废" value="disposed" />
              </el-select>
            </el-form-item>
            <el-form-item label="使用部门">
              <el-select
                v-model="searchForm.department"
                placeholder="请选择使用部门"
                clearable
              >
                <el-option label="内科" value="内科" />
                <el-option label="外科" value="外科" />
                <el-option label="儿科" value="儿科" />
                <el-option label="护理部" value="护理部" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadAssetData">查询</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 资产表格 -->
          <el-table :data="assetList" v-loading="loading" stripe border>
            <el-table-column type="selection" width="55" />
            <el-table-column prop="assetCode" label="资产编码" width="120" />
            <el-table-column prop="assetName" label="资产名称" width="150" />
            <el-table-column prop="categoryName" label="资产类别" width="100">
              <template #default="{ row }">
                <el-tag :type="getCategoryType(row.category)">
                  {{ row.categoryName }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="specification" label="规格型号" width="120" />
            <el-table-column prop="originalValue" label="原值" width="100" align="right">
              <template #default="{ row }">
                ¥{{ row.originalValue.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="currentValue" label="现值" width="100" align="right">
              <template #default="{ row }">
                ¥{{ row.currentValue.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="purchaseDate" label="购置日期" width="120" />
            <el-table-column prop="department" label="使用部门" width="100" />
            <el-table-column prop="responsible" label="责任人" width="100" />
            <el-table-column prop="status" label="使用状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="viewAssetDetail(row)">
                  详情
                </el-button>
                <el-button type="warning" size="small" @click="editAsset(row)">
                  编辑
                </el-button>
                <el-button type="info" size="small" @click="transferAsset(row)">
                  转移
                </el-button>
                <el-button 
                  v-if="row.status === 'in_use'"
                  type="danger" 
                  size="small" 
                  @click="maintenanceAsset(row)"
                >
                  维修
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

      <!-- 采购入库 -->
      <el-tab-pane label="采购入库" name="purchase">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>采购入库管理</span>
              <el-button type="primary" @click="showPurchaseOrderDialog">
                新增采购单
              </el-button>
            </div>
          </template>

          <!-- 采购单表格 -->
          <el-table :data="purchaseOrders" v-loading="purchaseLoading" stripe border>
            <el-table-column prop="orderNo" label="采购单号" width="140" />
            <el-table-column prop="supplier" label="供应商" width="150" />
            <el-table-column prop="totalAmount" label="采购金额" width="120" align="right">
              <template #default="{ row }">
                ¥{{ row.totalAmount.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="orderDate" label="采购日期" width="120" />
            <el-table-column prop="expectedDate" label="预计到货" width="120" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getPurchaseStatusType(row.status)">
                  {{ getPurchaseStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="approver" label="审批人" width="100" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="viewPurchaseDetail(row)">
                  详情
                </el-button>
                <el-button
                  v-if="row.status === 'pending'"
                  type="success"
                  size="small"
                  @click="approvePurchase(row)"
                >
                  审批
                </el-button>
                <el-button
                  v-if="row.status === 'approved'"
                  type="warning"
                  size="small"
                  @click="receiveGoods(row)"
                >
                  入库
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 维修保养 -->
      <el-tab-pane label="维修保养" name="maintenance">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>维修保养记录</span>
              <el-button type="primary" @click="showMaintenanceDialog">
                新增维修
              </el-button>
            </div>
          </template>

          <!-- 维修记录表格 -->
          <el-table :data="maintenanceRecords" v-loading="maintenanceLoading" stripe border>
            <el-table-column prop="workOrderNo" label="工单号" width="120" />
            <el-table-column prop="assetCode" label="资产编码" width="120" />
            <el-table-column prop="assetName" label="资产名称" width="150" />
            <el-table-column prop="faultDescription" label="故障描述" width="200" />
            <el-table-column prop="maintenanceType" label="维修类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getMaintenanceType(row.maintenanceType)">
                  {{ getMaintenanceTypeText(row.maintenanceType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reportDate" label="报修日期" width="120" />
            <el-table-column prop="repairDate" label="维修日期" width="120" />
            <el-table-column prop="cost" label="维修费用" width="100" align="right">
              <template #default="{ row }">
                ¥{{ row.cost.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getMaintenanceStatusType(row.status)">
                  {{ getMaintenanceStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="viewMaintenanceDetail(row)">
                  详情
                </el-button>
                <el-button
                  v-if="row.status === 'in_progress'"
                  type="success"
                  size="small"
                  @click="completeMaintenance(row)"
                >
                  完成
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 盘点清查 -->
      <el-tab-pane label="盘点清查" name="inventory">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>盘点任务管理</span>
              <el-button type="primary" @click="createInventoryTask">
                创建盘点任务
              </el-button>
            </div>
          </template>

          <!-- 盘点任务表格 -->
          <el-table :data="inventoryTasks" v-loading="inventoryLoading" stripe border>
            <el-table-column prop="taskNo" label="任务编号" width="140" />
            <el-table-column prop="taskName" label="任务名称" width="150" />
            <el-table-column prop="department" label="盘点部门" width="120" />
            <el-table-column prop="startDate" label="开始日期" width="120" />
            <el-table-column prop="endDate" label="结束日期" width="120" />
            <el-table-column prop="totalAssets" label="资产总数" width="100" align="center" />
            <el-table-column prop="checkedAssets" label="已盘点" width="100" align="center" />
            <el-table-column prop="progress" label="进度" width="120">
              <template #default="{ row }">
                <el-progress 
                  :percentage="Math.round((row.checkedAssets / row.totalAssets) * 100)" 
                  :stroke-width="8"
                />
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getInventoryStatusType(row.status)">
                  {{ getInventoryStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="viewInventoryDetail(row)">
                  详情
                </el-button>
                <el-button
                  v-if="row.status === 'in_progress'"
                  type="success"
                  size="small"
                  @click="completeInventory(row)"
                >
                  完成
                </el-button>
                <el-button type="info" size="small" @click="downloadInventoryReport(row)">
                  报告
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
                <div class="stat-value">{{ statistics.totalAssets }}</div>
                <div class="stat-label">资产总数（台/套）</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value">{{ statistics.totalValue.toLocaleString() }}</div>
                <div class="stat-label">资产总值（万元）</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value">{{ statistics.inUseCount }}</div>
                <div class="stat-label">在用资产</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value">{{ statistics.maintenanceCount }}</div>
                <div class="stat-label">维修中资产</div>
              </div>
            </el-col>
          </el-row>

          <!-- 图表展示 -->
          <el-row :gutter="20" class="charts-row">
            <el-col :span="12">
              <div class="chart-container">
                <h4>资产类别分布</h4>
                <div class="chart-placeholder">资产类别饼图</div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="chart-container">
                <h4>资产状态分布</h4>
                <div class="chart-placeholder">资产状态柱状图</div>
              </div>
            </el-col>
          </el-row>

          <!-- 资产价值趋势 -->
          <div class="chart-container full-width">
            <h4>资产价值趋势</h4>
            <div class="chart-placeholder">价值趋势折线图</div>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 资产弹窗 -->
    <el-dialog
      v-model="assetDialogVisible"
      :title="isEdit ? '编辑资产' : '新增资产'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="assetFormRef"
        :model="assetForm"
        :rules="assetRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="资产编码" prop="assetCode">
              <el-input v-model="assetForm.assetCode" placeholder="自动生成" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资产名称" prop="assetName">
              <el-input v-model="assetForm.assetName" placeholder="请输入资产名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="资产类别" prop="category">
              <el-select v-model="assetForm.category" placeholder="请选择资产类别" style="width: 100%">
                <el-option label="医疗设备" value="medical" />
                <el-option label="办公设备" value="office" />
                <el-option label="运输设备" value="transport" />
                <el-option label="电子设备" value="electronic" />
                <el-option label="其他设备" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格型号" prop="specification">
              <el-input v-model="assetForm.specification" placeholder="请输入规格型号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="原值" prop="originalValue">
              <el-input-number
                v-model="assetForm.originalValue"
                :precision="2"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="购置日期" prop="purchaseDate">
              <el-date-picker
                v-model="assetForm.purchaseDate"
                type="date"
                placeholder="选择购置日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="使用部门" prop="department">
              <el-select v-model="assetForm.department" placeholder="请选择使用部门" style="width: 100%">
                <el-option label="内科" value="内科" />
                <el-option label="外科" value="外科" />
                <el-option label="儿科" value="儿科" />
                <el-option label="护理部" value="护理部" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="责任人" prop="responsible">
              <el-select v-model="assetForm.responsible" placeholder="请选择责任人" style="width: 100%" filterable>
                <el-option
                  v-for="emp in employees"
                  :key="emp.id"
                  :label="emp.name"
                  :value="emp.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="供应商" prop="supplier">
          <el-input v-model="assetForm.supplier" placeholder="请输入供应商名称" />
        </el-form-item>

        <el-form-item label="资产说明">
          <el-input
            v-model="assetForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入资产说明"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="assetDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAsset">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { dataManager } from '@/utils/mockData'

// 响应式数据
const activeTab = ref('assets')
const loading = ref(false)
const purchaseLoading = ref(false)
const maintenanceLoading = ref(false)
const inventoryLoading = ref(false)
const assetList = ref([])
const purchaseOrders = ref([])
const maintenanceRecords = ref([])
const inventoryTasks = ref([])
const employees = ref([])
const isEdit = ref(false)

// 弹窗状态
const assetDialogVisible = ref(false)
const assetFormRef = ref()

// 搜索表单
const searchForm = reactive({
  assetCode: '',
  assetName: '',
  category: '',
  status: '',
  department: ''
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 资产表单
const assetForm = reactive({
  assetCode: '',
  assetName: '',
  category: '',
  specification: '',
  originalValue: 0,
  purchaseDate: '',
  department: '',
  responsible: '',
  supplier: '',
  description: ''
})

// 统计数据
const statistics = ref({
  totalAssets: 1250,
  totalValue: 8650,
  inUseCount: 1100,
  maintenanceCount: 35
})

// 表单验证规则
const assetRules = {
  assetName: [{ required: true, message: '请输入资产名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择资产类别', trigger: 'change' }],
  specification: [{ required: true, message: '请输入规格型号', trigger: 'blur' }],
  originalValue: [{ required: true, message: '请输入原值', trigger: 'blur' }],
  purchaseDate: [{ required: true, message: '请选择购置日期', trigger: 'change' }],
  department: [{ required: true, message: '请选择使用部门', trigger: 'change' }],
  responsible: [{ required: true, message: '请选择责任人', trigger: 'change' }]
}

// 方法
const loadData = () => {
  employees.value = dataManager.getData('employees') || []
  loadAssetData()
  loadPurchaseOrders()
  loadMaintenanceRecords()
  loadInventoryTasks()
}

const loadAssetData = () => {
  loading.value = true
  setTimeout(() => {
    // 模拟资产数据
    assetList.value = [
      {
        assetCode: 'AST202401001',
        assetName: 'CT扫描仪',
        category: 'medical',
        categoryName: '医疗设备',
        specification: 'GE Discovery CT750 HD',
        originalValue: 2500000,
        currentValue: 1800000,
        purchaseDate: '2020-03-15',
        department: '影像科',
        responsible: '张医生',
        status: 'in_use'
      },
      {
        assetCode: 'AST202401002',
        assetName: '办公电脑',
        category: 'office',
        categoryName: '办公设备',
        specification: 'Dell OptiPlex 7080',
        originalValue: 6000,
        currentValue: 3000,
        purchaseDate: '2022-01-10',
        department: '行政部',
        responsible: '李主任',
        status: 'in_use'
      }
    ]
    pagination.total = assetList.value.length
    loading.value = false
  }, 500)
}

const loadPurchaseOrders = () => {
  purchaseLoading.value = true
  setTimeout(() => {
    purchaseOrders.value = [
      {
        orderNo: 'PO202401001',
        supplier: '西门子医疗器械公司',
        totalAmount: 1500000,
        orderDate: '2024-01-10',
        expectedDate: '2024-02-15',
        status: 'approved',
        approver: '院长'
      }
    ]
    purchaseLoading.value = false
  }, 300)
}

const loadMaintenanceRecords = () => {
  maintenanceLoading.value = true
  setTimeout(() => {
    maintenanceRecords.value = [
      {
        workOrderNo: 'MO202401001',
        assetCode: 'AST202401001',
        assetName: 'CT扫描仪',
        faultDescription: '图像质量下降',
        maintenanceType: 'corrective',
        reportDate: '2024-01-12',
        repairDate: '2024-01-15',
        cost: 15000,
        status: 'completed'
      }
    ]
    maintenanceLoading.value = false
  }, 300)
}

const loadInventoryTasks = () => {
  inventoryLoading.value = true
  setTimeout(() => {
    inventoryTasks.value = [
      {
        taskNo: 'INV202401001',
        taskName: '2024年第一季度盘点',
        department: '全院',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        totalAssets: 1250,
        checkedAssets: 980,
        status: 'in_progress'
      }
    ]
    inventoryLoading.value = false
  }, 300)
}

const getCategoryType = (category) => {
  const types = {
    medical: 'danger',
    office: 'primary',
    transport: 'warning',
    electronic: 'success',
    other: 'info'
  }
  return types[category] || ''
}

const getStatusType = (status) => {
  const types = {
    in_use: 'success',
    idle: 'warning',
    maintenance: 'danger',
    disposed: 'info'
  }
  return types[status] || ''
}

const getStatusText = (status) => {
  const texts = {
    in_use: '在用',
    idle: '闲置',
    maintenance: '维修',
    disposed: '报废'
  }
  return texts[status] || status
}

const getPurchaseStatusType = (status) => {
  const types = {
    pending: 'warning',
    approved: 'success',
    received: 'primary',
    cancelled: 'danger'
  }
  return types[status] || ''
}

const getPurchaseStatusText = (status) => {
  const texts = {
    pending: '待审批',
    approved: '已审批',
    received: '已入库',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const getMaintenanceType = (type) => {
  return type === 'preventive' ? 'success' : 'warning'
}

const getMaintenanceTypeText = (type) => {
  const texts = {
    preventive: '预防性',
    corrective: '修复性'
  }
  return texts[type] || type
}

const getMaintenanceStatusType = (status) => {
  const types = {
    pending: 'warning',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return types[status] || ''
}

const getMaintenanceStatusText = (status) => {
  const texts = {
    pending: '待处理',
    in_progress: '维修中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const getInventoryStatusType = (status) => {
  const types = {
    pending: 'warning',
    in_progress: 'primary',
    completed: 'success'
  }
  return types[status] || ''
}

const getInventoryStatusText = (status) => {
  const texts = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成'
  }
  return texts[status] || status
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  loadAssetData()
}

const showAssetDialog = () => {
  isEdit.value = false
  resetAssetForm()
  assetForm.assetCode = `AST${Date.now()}`
  assetDialogVisible.value = true
}

const showPurchaseDialog = () => {
  ElMessage.info('采购入库功能')
}

const showInventoryDialog = () => {
  ElMessage.info('盘点管理功能')
}

const resetAssetForm = () => {
  Object.keys(assetForm).forEach(key => {
    if (key === 'originalValue') {
      assetForm[key] = 0
    } else {
      assetForm[key] = ''
    }
  })
  if (assetFormRef.value) {
    assetFormRef.value.clearValidate()
  }
}

const saveAsset = async () => {
  try {
    await assetFormRef.value.validate()
    
    const newAsset = {
      ...assetForm,
      currentValue: assetForm.originalValue * 0.8, // 简单折旧计算
      status: 'in_use'
    }
    
    assetList.value.unshift(newAsset)
    ElMessage.success('资产信息保存成功')
    assetDialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const viewAssetDetail = (row) => {
  ElMessage.info(`查看资产详情: ${row.assetCode}`)
}

const editAsset = (row) => {
  ElMessage.info(`编辑资产: ${row.assetCode}`)
}

const transferAsset = (row) => {
  ElMessage.info(`转移资产: ${row.assetCode}`)
}

const maintenanceAsset = (row) => {
  ElMessage.info(`维修资产: ${row.assetCode}`)
}

const showPurchaseOrderDialog = () => {
  ElMessage.info('新增采购单')
}

const viewPurchaseDetail = (row) => {
  ElMessage.info(`查看采购详情: ${row.orderNo}`)
}

const approvePurchase = (row) => {
  ElMessage.success(`采购单 ${row.orderNo} 审批通过`)
  row.status = 'approved'
}

const receiveGoods = (row) => {
  ElMessage.success(`采购单 ${row.orderNo} 入库成功`)
  row.status = 'received'
}

const showMaintenanceDialog = () => {
  ElMessage.info('新增维修单')
}

const viewMaintenanceDetail = (row) => {
  ElMessage.info(`查看维修详情: ${row.workOrderNo}`)
}

const completeMaintenance = (row) => {
  ElMessage.success(`维修单 ${row.workOrderNo} 已完成`)
  row.status = 'completed'
}

const createInventoryTask = () => {
  ElMessage.info('创建盘点任务')
}

const viewInventoryDetail = (row) => {
  ElMessage.info(`查看盘点详情: ${row.taskNo}`)
}

const completeInventory = (row) => {
  ElMessage.success(`盘点任务 ${row.taskNo} 已完成`)
  row.status = 'completed'
}

const downloadInventoryReport = (row) => {
  ElMessage.success(`下载盘点报告: ${row.taskNo}`)
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.asset-management {
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
  margin-bottom: 20px;
}

.chart-container {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.chart-container.full-width {
  width: 100%;
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
</style> 