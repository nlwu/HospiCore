<template>
  <div class="page-container">
    <div class="page-header">
      <h2>列表功能演示</h2>
      <p>展示列表页面的查询、筛选、分页、排序、导出、批量操作等通用功能</p>
    </div>

    <!-- 查询筛选区域 -->
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="员工姓名">
          <el-input 
            v-model="searchForm.name" 
            placeholder="请输入姓名" 
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="所属科室">
          <el-select 
            v-model="searchForm.department" 
            placeholder="请选择科室" 
            clearable
            style="width: 200px"
          >
            <el-option label="内科" value="内科" />
            <el-option label="外科" value="外科" />
            <el-option label="儿科" value="儿科" />
            <el-option label="妇产科" value="妇产科" />
            <el-option label="急诊科" value="急诊科" />
          </el-select>
        </el-form-item>
        <el-form-item label="职称">
          <el-select 
            v-model="searchForm.title" 
            placeholder="请选择职称" 
            clearable
            style="width: 150px"
          >
            <el-option label="主任医师" value="主任医师" />
            <el-option label="副主任医师" value="副主任医师" />
            <el-option label="主治医师" value="主治医师" />
            <el-option label="住院医师" value="住院医师" />
            <el-option label="护士长" value="护士长" />
            <el-option label="护师" value="护师" />
          </el-select>
        </el-form-item>
        <el-form-item label="在职状态">
          <el-select 
            v-model="searchForm.status" 
            placeholder="请选择状态" 
            clearable
            style="width: 120px"
          >
            <el-option label="在职" value="在职" />
            <el-option label="离职" value="离职" />
            <el-option label="休假" value="休假" />
          </el-select>
        </el-form-item>
        <el-form-item label="入职时间">
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

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增员工
        </el-button>
        <el-button 
          type="danger" 
          :disabled="selectedRows.length === 0"
          @click="handleBatchDelete"
        >
          <el-icon><Delete /></el-icon>批量删除
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>导出Excel
        </el-button>
        <el-button @click="handleImport">
          <el-icon><Upload /></el-icon>批量导入
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-tooltip content="刷新数据">
          <el-button circle @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="列设置">
          <el-button circle @click="showColumnSettings = true">
            <el-icon><Setting /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table
      ref="tableRef"
      :data="tableData"
      :loading="loading"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      stripe
      border
    >
      <el-table-column type="selection" width="55" />
      <el-table-column 
        prop="id" 
        label="工号" 
        width="80"
        sortable="custom"
      />
      <el-table-column 
        prop="name" 
        label="姓名" 
        width="100"
        sortable="custom"
      />
      <el-table-column prop="avatar" label="头像" width="80">
        <template #default="scope">
          <el-avatar :size="40" :src="scope.row.avatar">
            {{ scope.row.name.charAt(0) }}
          </el-avatar>
        </template>
      </el-table-column>
      <el-table-column 
        prop="department" 
        label="科室" 
        width="120"
        sortable="custom"
      />
      <el-table-column 
        prop="position" 
        label="岗位" 
        width="120"
      />
      <el-table-column 
        prop="title" 
        label="职称" 
        width="120"
        sortable="custom"
      />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="scope">
          <el-tag 
            :type="getStatusType(scope.row.status)"
            size="small"
          >
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column 
        prop="phone" 
        label="联系电话" 
        width="130"
      />
      <el-table-column 
        prop="joinDate" 
        label="入职时间" 
        width="120"
        sortable="custom"
      />
      <el-table-column 
        prop="salary" 
        label="基本工资" 
        width="100"
        sortable="custom"
      >
        <template #default="scope">
          ¥{{ scope.row.salary.toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button 
            type="primary" 
            size="small" 
            @click="handleEdit(scope.row)"
          >
            编辑
          </el-button>
          <el-button 
            type="info" 
            size="small" 
            @click="handleView(scope.row)"
          >
            查看
          </el-button>
          <el-button 
            type="danger" 
            size="small" 
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

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

    <!-- 列设置对话框 -->
    <el-drawer v-model="showColumnSettings" title="列设置" size="300px">
      <div class="column-settings">
        <div class="setting-item" v-for="column in columnSettings" :key="column.prop">
          <el-checkbox v-model="column.visible">{{ column.label }}</el-checkbox>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const tableRef = ref()
const loading = ref(false)
const selectedRows = ref([])
const showColumnSettings = ref(false)

const searchForm = reactive({
  name: '',
  department: '',
  title: '',
  status: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 100
})

const sortParams = reactive({
  sortBy: '',
  order: ''
})

const columnSettings = ref([
  { prop: 'id', label: '工号', visible: true },
  { prop: 'name', label: '姓名', visible: true },
  { prop: 'avatar', label: '头像', visible: true },
  { prop: 'department', label: '科室', visible: true },
  { prop: 'position', label: '岗位', visible: true },
  { prop: 'title', label: '职称', visible: true },
  { prop: 'status', label: '状态', visible: true },
  { prop: 'phone', label: '联系电话', visible: true },
  { prop: 'joinDate', label: '入职时间', visible: true },
  { prop: 'salary', label: '基本工资', visible: true }
])

// 模拟员工数据
const generateMockData = () => {
  const departments = ['内科', '外科', '儿科', '妇产科', '急诊科', '护理部']
  const positions = ['医生', '护士', '主管', '技师', '行政']
  const titles = ['主任医师', '副主任医师', '主治医师', '住院医师', '护士长', '护师']
  const statuses = ['在职', '离职', '休假']
  
  const data = []
  for (let i = 1; i <= 100; i++) {
    data.push({
      id: `HOS${String(i).padStart(4, '0')}`,
      name: `员工${i}`,
      avatar: '',
      department: departments[Math.floor(Math.random() * departments.length)],
      position: positions[Math.floor(Math.random() * positions.length)],
      title: titles[Math.floor(Math.random() * titles.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      joinDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString(),
      salary: Math.floor(Math.random() * 10000) + 5000
    })
  }
  return data
}

const allData = ref(generateMockData())
const tableData = ref([])

const getStatusType = (status) => {
  const types = {
    '在职': 'success',
    '离职': 'danger',
    '休假': 'warning'
  }
  return types[status] || ''
}

const loadTableData = () => {
  loading.value = true
  
  // 模拟API调用
  setTimeout(() => {
    let filteredData = [...allData.value]
    
    // 应用搜索条件
    if (searchForm.name) {
      filteredData = filteredData.filter(item => 
        item.name.includes(searchForm.name)
      )
    }
    if (searchForm.department) {
      filteredData = filteredData.filter(item => 
        item.department === searchForm.department
      )
    }
    if (searchForm.title) {
      filteredData = filteredData.filter(item => 
        item.title === searchForm.title
      )
    }
    if (searchForm.status) {
      filteredData = filteredData.filter(item => 
        item.status === searchForm.status
      )
    }
    
    // 应用排序
    if (sortParams.sortBy) {
      filteredData.sort((a, b) => {
        const aVal = a[sortParams.sortBy]
        const bVal = b[sortParams.sortBy]
        
        if (sortParams.order === 'ascending') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
    }
    
    // 更新总数
    pagination.total = filteredData.length
    
    // 分页
    const start = (pagination.page - 1) * pagination.size
    const end = start + pagination.size
    tableData.value = filteredData.slice(start, end)
    
    loading.value = false
  }, 500)
}

const handleSearch = () => {
  pagination.page = 1
  loadTableData()
  ElMessage.success('查询完成')
}

const handleReset = () => {
  Object.assign(searchForm, {
    name: '',
    department: '',
    title: '',
    status: '',
    dateRange: []
  })
  pagination.page = 1
  loadTableData()
  ElMessage.info('已重置搜索条件')
}

const handleAdd = () => {
  ElMessage.info('新增员工功能')
}

const handleEdit = (row) => {
  ElMessage.info(`编辑员工：${row.name}`)
}

const handleView = (row) => {
  ElMessage.info(`查看员工详情：${row.name}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除员工 ${row.name} 吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
    loadTableData()
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条记录吗？`, '批量删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    loadTableData()
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleExport = () => {
  ElMessage.success('正在导出Excel文件...')
  // 这里可以实现真正的导出逻辑
  setTimeout(() => {
    ElMessage.success('导出完成')
  }, 2000)
}

const handleImport = () => {
  ElMessage.info('批量导入功能')
}

const handleRefresh = () => {
  loadTableData()
  ElMessage.success('数据已刷新')
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleSortChange = ({ prop, order }) => {
  sortParams.sortBy = prop
  sortParams.order = order
  loadTableData()
}

const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  loadTableData()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadTableData()
}

onMounted(() => {
  loadTableData()
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

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.column-settings {
  padding: 16px;
}

.setting-item {
  margin-bottom: 12px;
}
</style> 