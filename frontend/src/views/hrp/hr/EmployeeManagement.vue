<template>
  <div class="employee-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-title">
          <el-icon size="24" color="#409EFF"><User /></el-icon>
          <div class="title-content">
            <h2>员工档案管理</h2>
            <p>管理医院全体员工的基本信息和档案资料</p>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" icon="Plus" @click="showAddDialog" size="large">
          新增员工
        </el-button>
        <el-button icon="Download" @click="exportEmployees" size="large">
          导出员工信息
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon size="28"><User /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.total || 0 }}</div>
                <div class="stat-label">员工总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon active">
                <el-icon size="28"><UserFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.active || 0 }}</div>
                <div class="stat-label">在职员工</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon new">
                <el-icon size="28"><Plus /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.thisMonth || 0 }}</div>
                <div class="stat-label">本月新入职</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
                             <div class="stat-icon departments">
                 <el-icon size="28"><OfficeBuilding /></el-icon>
               </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.departments || 0 }}</div>
                <div class="stat-label">部门总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card" shadow="hover">
      <div class="search-header">
        <el-icon><Search /></el-icon>
        <span>筛选条件</span>
      </div>
      <el-form :model="searchForm" inline label-width="80px" class="search-form">
        <el-form-item label="员工姓名">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入员工姓名"
            prefix-icon="User"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="工号">
          <el-input
            v-model="searchForm.employee_number"
            placeholder="请输入工号"
            prefix-icon="Key"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="部门">
          <el-select
            v-model="searchForm.department_id"
            v-bind="getFilterSelectProps({ style: 'width: 200px' })"
          >
            <el-option
              v-for="option in createFilterOptions(departments.map(d => ({label: d.name, value: d.id})))"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="职位">
          <el-input
            v-model="searchForm.position"
            placeholder="请输入职位"
            prefix-icon="Briefcase"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="在职状态">
          <el-select
            v-model="searchForm.status"
            v-bind="getFilterSelectProps()"
          >
            <el-option
              v-for="option in createFilterOptions(commonFilterOptions.employeeStatus)"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchEmployees" icon="Search">
            搜索
          </el-button>
          <el-button @click="resetSearch" icon="Refresh">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 员工列表 -->
    <el-card class="table-card" shadow="hover">
      <div class="table-header">
        <span class="table-title">员工列表</span>
      </div>
      <el-table
        :data="employeeList"
        v-loading="loading"
        stripe
        border
        height="500"
        @row-click="viewEmployee"
        row-key="id"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="employee_number" label="工号" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="80" align="center" />
        <el-table-column prop="department_name" label="部门" width="120" />
        <el-table-column prop="position" label="职位" width="120" />
        <el-table-column prop="education" label="学历" width="80" align="center" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="hire_date" label="入职日期" width="120" />
        <el-table-column prop="status" label="在职状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'active' ? 'success' : 
                     row.status === 'inactive' ? 'danger' : 'warning'"
            >
              {{ row.status === 'active' ? '在职' : row.status === 'inactive' ? '离职' : '其他' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click.stop="viewEmployee(row)"
              icon="View"
            >
              查看
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click.stop="editEmployee(row)"
              icon="Edit"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click.stop="deleteEmployee(row)"
              icon="Delete"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 员工详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`员工详情 - ${currentEmployee.name}`"
      width="1000px"
      :close-on-click-modal="false"
    >
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="基本信息" name="basic">
          <div class="employee-detail">
            <div class="detail-section">
              <h4>个人信息</h4>
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="detail-item">
                    <label>工号：</label>
                    <span>{{ currentEmployee.employee_number }}</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-item">
                    <label>姓名：</label>
                    <span>{{ currentEmployee.name }}</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-item">
                    <label>性别：</label>
                    <span>{{ currentEmployee.gender }}</span>
                  </div>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="detail-item">
                    <label>出生日期：</label>
                    <span>{{ currentEmployee.birth_date }}</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-item">
                    <label>身份证号：</label>
                    <span>{{ currentEmployee.id_card }}</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-item">
                    <label>手机号：</label>
                    <span>{{ currentEmployee.phone }}</span>
                  </div>
                </el-col>
              </el-row>
            </div>

            <div class="detail-section">
              <h4>工作信息</h4>
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="detail-item">
                    <label>部门：</label>
                    <span>{{ currentEmployee.department }}</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-item">
                    <label>职位：</label>
                    <span>{{ currentEmployee.position }}</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-item">
                    <label>职称：</label>
                    <span>{{ currentEmployee.title }}</span>
                  </div>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="detail-item">
                    <label>入职日期：</label>
                    <span>{{ currentEmployee.hire_date }}</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-item">
                    <label>员工类型：</label>
                    <span>{{ currentEmployee.employee_type }}</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-item">
                    <label>在职状态：</label>
                    <el-tag
                      :type="currentEmployee.work_status === '在职' ? 'success' : 'danger'"
                    >
                      {{ currentEmployee.work_status }}
                    </el-tag>
                  </div>
                </el-col>
              </el-row>
            </div>

            <div class="detail-section">
              <h4>教育背景</h4>
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="detail-item">
                    <label>学历：</label>
                    <span>{{ currentEmployee.education }}</span>
                  </div>
                </el-col>
                <el-col :span="16">
                  <div class="detail-item">
                    <label>地址：</label>
                    <span>{{ currentEmployee.address }}</span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 新增/编辑员工弹窗 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑员工' : '新增员工'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="employeeFormRef"
        :model="employeeForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工号" prop="employee_number">
              <el-input v-model="employeeForm.employee_number" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="employeeForm.name" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="employeeForm.gender">
                <el-radio label="男">男</el-radio>
                <el-radio label="女">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出生日期" prop="birth_date">
              <el-date-picker
                v-model="employeeForm.birth_date"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="身份证号" prop="id_card">
              <el-input v-model="employeeForm.id_card" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="employeeForm.phone" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门" prop="department_id">
              <el-select
                v-model="employeeForm.department_id"
                v-bind="getFilterSelectProps({ style: 'width: 100%' })"
              >
                <el-option
                  v-for="option in createFilterOptions(departments.map(d => ({label: d.name, value: d.id})))"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职位" prop="position">
              <el-input v-model="employeeForm.position" placeholder="请输入职位" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学历" prop="education">
              <el-select
                v-model="employeeForm.education"
                v-bind="getFilterSelectProps({ style: 'width: 100%' })"
              >
                <el-option
                  v-for="option in createFilterOptions(commonFilterOptions.education)"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入职日期" prop="hire_date">
              <el-date-picker
                v-model="employeeForm.hire_date"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="地址" prop="address">
          <el-input
            v-model="employeeForm.address"
            type="textarea"
            :rows="2"
            placeholder="请输入地址"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEmployee" :loading="saving">
          {{ isEdit ? '更新' : '保存' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  User, UserFilled, Plus, Search, Refresh, 
  Edit, Delete, View, Download, Key, Briefcase, OfficeBuilding
} from '@element-plus/icons-vue'
import { systemAPI,hrAPI } from '@/utils/api'
import { 
  getFilterSelectProps, 
  createFilterOptions, 
  commonFilterOptions,
  createValidationRules,
  formDataUtils
} from '@/utils/formUtils'
export default {
  name: 'EmployeeManagement',
  components: {
    User, UserFilled, Plus, OfficeBuilding, Search, Refresh,
    Edit, Delete, View, Download, Key, Briefcase
  },
  setup() {
    // 响应式数据
    const loading = ref(false)
    const saving = ref(false)
    const employeeList = ref([])
    const departments = ref([])
    const stats = ref({})
    
    // 弹窗控制
    const detailDialogVisible = ref(false)
    const formDialogVisible = ref(false)
    const isEdit = ref(false)
    const activeTab = ref('basic')
    
    // 当前选中员工和表单引用
    const currentEmployee = ref({})
    const employeeFormRef = ref()

    // 搜索表单
    const searchForm = reactive({
      name: '',
      employee_number: '',
      department_id: '',
      position: '',
      status: ''
    })

    // 分页
    const pagination = reactive({
      page: 1,
      limit: 20,
      total: 0
    })

    // 员工表单
    const employeeForm = reactive({
      employee_number: '',
      name: '',
      gender: '',
      birth_date: '',
      id_card: '',
      phone: '',
      email: '',
      department_id: '',
      position: '',
      education: '',
      marital_status: '',
      hire_date: '',
      status: 'active',
      salary: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      notes: ''
    })

    // 表单验证规则
    const formRules = {
      employee_number: [
        { required: true, message: '请输入工号', trigger: 'blur' },
        { max: 20, message: '工号长度不能超过20个字符', trigger: 'blur' }
      ],
      name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { max: 50, message: '姓名长度不能超过50个字符', trigger: 'blur' }
      ],
      phone: [
        { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
      ],
      email: [
        { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
        { max: 100, message: '邮箱长度不能超过100个字符', trigger: 'blur' }
      ],
      id_card: [
        { max: 18, message: '身份证号长度不能超过18个字符', trigger: 'blur' }
      ],
      position: [
        { max: 50, message: '职位长度不能超过50个字符', trigger: 'blur' }
      ],
      education: [
        { max: 20, message: '学历长度不能超过20个字符', trigger: 'blur' }
      ],
      salary: [
        { type: 'number', min: 0, message: '薪资不能为负数', trigger: 'blur' }
      ],
      emergency_contact_name: [
        { max: 50, message: '紧急联系人姓名长度不能超过50个字符', trigger: 'blur' }
      ],
      emergency_contact_phone: [
        { pattern: /^1[3-9]\d{9}$/, message: '紧急联系人手机号格式不正确', trigger: 'blur' }
      ]
    }

    // 获取员工列表
    const loadEmployees = async () => {
      try {
        loading.value = true
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...searchForm
        }
        
        // 移除空值参数
        Object.keys(params).forEach(key => {
          if (!params[key]) delete params[key]
        })

        const response = await hrAPI.employees.getList(params)
        if (response.status === 'success') {
          employeeList.value = response.data.items || response.data.employees || []
          pagination.total = response.data.total || 0
          pagination.page = response.data.page || pagination.page
          pagination.limit = response.data.limit || pagination.limit
          
 
          // if (employeeList.value) {
          //   employeeList.value.forEach(emp => {
          //     if (emp.department) deptSet.add(emp.department)
          //   })
          // }
          // departments.value = Array.from(deptSet)

       

          // 不再从员工数据中提取部门，直接使用API加载的部门数据
        }
      } catch (error) {
        console.error('加载员工列表失败:', error)
        ElMessage.error('加载员工列表失败')
      } finally {
        loading.value = false
      }
    }

    // 加载部门列表
    const loadDepartments = async () => {
      try {
        const response = await systemAPI.getAllDepartments()
        if (response.status === 'success') {
          departments.value = response.data.items || response.data || []
        }
      } catch (error) {
        console.error('加载部门列表失败:', error)
      }
    }

    // 获取统计数据
    const loadStats = async () => {
      try {
        const response = await hrAPI.employees.getStats()
        if (response.status === 'success') {
          stats.value = response.data
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
      }
    }

    // 搜索员工
    const searchEmployees = () => {
      pagination.page = 1
      loadEmployees()
    }

    // 重置搜索
    const resetSearch = () => {
      Object.keys(searchForm).forEach(key => {
        searchForm[key] = ''
      })
      searchEmployees()
    }

    // 刷新数据
    const refreshData = () => {
      loadEmployees()
      loadStats()
    }

    // 分页处理
    const handleSizeChange = (size) => {
      pagination.limit = size
      pagination.page = 1
      loadEmployees()
    }

    const handleCurrentChange = (page) => {
      pagination.page = page
      loadEmployees()
    }

    // 查看员工详情
    const viewEmployee = (row) => {
      currentEmployee.value = { ...row }
      detailDialogVisible.value = true
      activeTab.value = 'basic'
    }

    // 显示新增对话框
    const showAddDialog = () => {
      isEdit.value = false
      resetForm()
      formDialogVisible.value = true
    }

    // 编辑员工
    const editEmployee = (row) => {
      isEdit.value = true
      currentEmployee.value = { ...row }
      Object.keys(employeeForm).forEach(key => {
        employeeForm[key] = row[key] || ''
      })
      formDialogVisible.value = true
    }

    // 重置表单
    const resetForm = () => {
      Object.keys(employeeForm).forEach(key => {
        if (key === 'employee_type') {
          employeeForm[key] = '正式员工'
        } else if (key === 'work_status') {
          employeeForm[key] = '在职'
        } else {
          employeeForm[key] = ''
        }
      })
      if (employeeFormRef.value) {
        employeeFormRef.value.clearValidate()
      }
    }

    // 保存员工
    const saveEmployee = async () => {
      try {
        await employeeFormRef.value.validate()
        saving.value = true
        
        // 准备提交数据，创建时过滤掉 id 字段
        const submitData = { ...employeeForm }
        if (!isEdit.value) {
          delete submitData.id
        }
        
        // 处理数字字段，确保为数字类型或null
        const numberFields = ['department_id', 'salary']
        numberFields.forEach(field => {
          if (submitData[field] === '' || submitData[field] === undefined) {
            submitData[field] = null
          } else if (submitData[field] !== null) {
            submitData[field] = Number(submitData[field])
          }
        })
        
        // 确保工号不为空
        if (!submitData.employee_number || submitData.employee_number.trim() === '') {
          ElMessage.error('工号不能为空')
          return
        }
        
        let response
        if (isEdit.value) {
          response = await hrAPI.employees.update(currentEmployee.value.id, submitData)
          if (response.status === 'success') {
            ElMessage.success('员工信息更新成功')
          }
        } else {
          response = await hrAPI.employees.create(submitData)
          if (response.status === 'success') {
            ElMessage.success('员工添加成功')
          }
        }
        
        if (response.status === 'success') {
          formDialogVisible.value = false
          loadEmployees()
          loadStats()
        }
      } catch (error) {
        console.error('保存员工失败:', error)
        ElMessage.error(error.response?.data?.message || '保存失败，请重试')
      } finally {
        saving.value = false
      }
    }

    // 删除员工
    const deleteEmployee = (row) => {
      ElMessageBox.confirm(
        `确定要删除员工 ${row.name} 吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const response = await hrAPI.employees.delete(row.id)
          if (response.status === 'success') {
            ElMessage.success('删除成功')
            loadEmployees()
            loadStats()
          }
        } catch (error) {
          console.error('删除员工失败:', error)
          ElMessage.error('删除失败，请重试')
        }
      }).catch(() => {
        // 用户取消删除
      })
    }

    // 导出员工信息
    const exportEmployees = async () => {
      try {
        ElMessage.info('正在导出员工信息...')
        
        // 构建导出URL
        const params = new URLSearchParams()
        Object.keys(searchForm).forEach(key => {
          if (searchForm[key]) {
            params.append(key, searchForm[key])
          }
        })
        
        const exportUrl = `/api/hr/employees/export?${params.toString()}`
        
        // 创建下载链接
        const link = document.createElement('a')
        link.href = `http://localhost:3001${exportUrl}`
        link.download = `员工信息_${new Date().toISOString().split('T')[0]}.csv`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        ElMessage.success('导出成功')
      } catch (error) {
        console.error('导出失败:', error)
        ElMessage.error('导出失败，请重试')
      }
    }

    // 生命周期
    onMounted(() => {
      loadDepartments()
      loadEmployees()
      loadStats()
    })

    return {
      // 响应式数据
      loading,
      saving,
      employeeList,
      departments,
      stats,
      
      // 弹窗控制
      detailDialogVisible,
      formDialogVisible,
      isEdit,
      activeTab,
      
      // 表单和当前数据
      currentEmployee,
      employeeFormRef,
      searchForm,
      pagination,
      employeeForm,
      formRules,
      
      // 方法
      loadEmployees,
      loadStats,
      searchEmployees,
      resetSearch,
      refreshData,
      handleSizeChange,
      handleCurrentChange,
      viewEmployee,
      showAddDialog,
      editEmployee,
      resetForm,
      saveEmployee,
      deleteEmployee,
      exportEmployees,
      
      // 工具函数
      getFilterSelectProps,
      createFilterOptions,
      commonFilterOptions
    }
  }
}
</script>

<style scoped>
.employee-management {
  padding: 20px;
  background: #f5f5f5;
  min-height: calc(100vh - 60px);
}

/* 页面头部样式 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-content h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.title-content p {
  margin: 4px 0 0 0;
  color: #666;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 统计卡片样式 */
.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.active {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.new {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-icon.departments {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

/* 搜索卡片样式 */
.search-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-weight: 600;
  color: #333;
}

.search-form .el-form-item {
  margin-bottom: 16px;
}

/* 表格卡片样式 */
.table-card {
  border-radius: 8px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.table-actions {
  display: flex;
  gap: 8px;
}

/* 分页样式 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 员工详情样式 */
.employee-detail {
  padding: 0 20px;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 2px solid #409EFF;
  padding-bottom: 8px;
}

.detail-item {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.detail-item label {
  font-weight: 600;
  color: #666;
  min-width: 80px;
  margin-right: 8px;
}

.detail-item span {
  color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .search-form {
    display: block;
  }
  
  .search-form .el-form-item {
    display: block;
    margin-right: 0;
  }
}
</style> 