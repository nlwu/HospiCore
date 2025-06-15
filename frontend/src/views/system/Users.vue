<template>
  <div class="users-management">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增用户
      </el-button>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.search"
            placeholder="用户名、姓名、邮箱"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="userList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="real_name" label="姓名" width="120" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="role_name" label="角色" width="120" />
        <el-table-column prop="department_name" label="部门" width="120" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" fixed="right" width="240">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="warning" @click="handleResetPassword(row)">
                重置密码
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">
                删除
              </el-button>
            </div>
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

    <!-- 用户表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="80px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="userForm.username"
                :disabled="isEdit"
                placeholder="请输入用户名"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="real_name">
              <el-input v-model="userForm.real_name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="userForm.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="userForm.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色" prop="role_id">
              <el-select 
                v-model="userForm.role_id" 
                placeholder="请选择角色" 
                style="width: 100%"
                value-key="id"
              >
                <el-option
                  v-for="role in roleOptions"
                  :key="role.id"
                  :label="role.name"
                  :value="role.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门" prop="department_id">
              <el-select v-model="userForm.department_id" placeholder="请选择部门" style="width: 100%">
                <el-option
                  v-for="dept in departmentOptions"
                  :key="dept.id"
                  :label="dept.name"
                  :value="dept.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" v-if="!isEdit">
          <el-col :span="12">
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="userForm.password"
                type="password"
                placeholder="请输入密码"
                show-password
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="userForm.status">
                <el-radio :label="1">启用</el-radio>
                <el-radio :label="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" v-else>
          <el-col :span="24">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="userForm.status">
                <el-radio :label="1">启用</el-radio>
                <el-radio :label="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userAPI, roleAPI, systemAPI } from '@/utils/api'

const loading = ref(false)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)
const userFormRef = ref()

const searchForm = reactive({
  search: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const userList = ref([])
const roleOptions = ref([])
const departmentOptions = ref([])

const userForm = reactive({
  id: null,
  username: '',
  password: '',
  email: '',
  phone: '',
  real_name: '',
  role_id: null,
  department_id: null,
  status: 1
})

const userRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度为3-50位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  role_id: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
})

const dialogTitle = computed(() => isEdit.value ? '编辑用户' : '新增用户')

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchForm.search,
      status: searchForm.status
    }
    
    const response = await userAPI.getUsers(params)
    if (response.status === 'success') {
      userList.value = response.data.list || response.data.items || []
      pagination.total = response.data.total || 0
    } else {
      userList.value = response.data?.list || response.data?.items || []
      pagination.total = response.data?.total || 0
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 获取角色选项
const fetchRoles = async () => {
  try {
    const response = await roleAPI.getAllRoles()
    if (response.status === 'success') {
      roleOptions.value = response.data || []
    } else {
      roleOptions.value = response.data || []
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

// 获取部门选项
const fetchDepartments = async () => {
  try {
    const response = await systemAPI.getAllDepartments()
    if (response.status === 'success') {
      departmentOptions.value = response.data || []
    } else {
      departmentOptions.value = response.data || []
    }
  } catch (error) {
    console.error('获取部门列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchUsers()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    search: '',
    status: ''
  })
  pagination.page = 1
  fetchUsers()
}

// 分页
const handleSizeChange = (val) => {
  pagination.limit = val
  fetchUsers()
}

const handleCurrentChange = (val) => {
  pagination.page = val
  fetchUsers()
}

// 新增用户
const handleAdd = () => {
  isEdit.value = false
  dialogVisible.value = true
  Object.assign(userForm, {
    id: null,
    username: '',
    password: '',
    email: '',
    phone: '',
    real_name: '',
    role_id: null,
    department_id: null,
    status: 1
  })
}

// 编辑用户
const handleEdit = async (row) => {
  try {
    // 确保角色数据已加载
    if (roleOptions.value.length === 0) {
      await fetchRoles()
    }
    // 确保部门数据已加载
    if (departmentOptions.value.length === 0) {
      await fetchDepartments()
    }

    isEdit.value = true
    dialogVisible.value = true
    Object.assign(userForm, {
      id: row.id,
      username: row.username,
      password: '',
      email: row.email || '',
      phone: row.phone || '',
      real_name: row.real_name || '',
      role_id: row.role_id !== undefined && row.role_id !== null ? Number(row.role_id) : null,
      department_id: row.department_id !== undefined && row.department_id !== null ? Number(row.department_id) : null,
      status: Number(row.status)
    })
  } catch (error) {
    console.error('准备编辑用户数据失败:', error)
    ElMessage.error('准备编辑用户数据失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await userFormRef.value.validate()
    
    submitLoading.value = true
    
    if (isEdit.value) {
      // 编辑用户
      const updateData = {
        email: userForm.email,
        phone: userForm.phone,
        real_name: userForm.real_name,
        role_id: userForm.role_id,
        department_id: userForm.department_id,
        status: userForm.status
      }
      const response = await userAPI.updateUser(userForm.id, updateData)
      if (response.status === 'success') {
        ElMessage.success('用户更新成功')
      }
    } else {
      // 新增用户 - 过滤掉 id 字段
      const { id, ...userData } = userForm
      const response = await userAPI.createUser(userData)
      if (response.status === 'success') {
        ElMessage.success('用户创建成功')
      }
    }
    
    dialogVisible.value = false
    fetchUsers()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败，请重试')
  } finally {
    submitLoading.value = false
  }
}

// 重置密码
const handleResetPassword = async (row) => {
  ElMessageBox.prompt('请输入新密码', '重置密码', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'password',
    inputValidator: (value) => {
      if (!value || value.length < 6) {
        return '密码长度不能少于6位'
      }
      return true
    }
  }).then(async ({ value }) => {
    try {
      const response = await userAPI.resetPassword(row.id, { newPassword: value })
      if (response.status === 'success') {
        ElMessage.success('密码重置成功')
      } else {
        ElMessage.error(response.message || '重置密码失败')
      }
    } catch (error) {
      console.error('重置密码失败:', error)
      ElMessage.error('重置密码失败')
    }
  })
}

// 删除用户
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除用户 "${row.username}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await userAPI.deleteUser(row.id)
      if (response.status === 'success') {
        ElMessage.success('用户删除成功')
        // 如果当前页没有数据了，回到上一页
        if (userList.value.length === 1 && pagination.page > 1) {
          pagination.page--
        }
        fetchUsers()
      } else {
        ElMessage.error(response.message || '删除失败')
      }
    } catch (error) {
      console.error('删除用户失败:', error)
      ElMessage.error('删除用户失败')
    }
  })
}

onMounted(() => {
  fetchUsers()
  fetchRoles()
  fetchDepartments()
})
</script>

<style scoped>
.users-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.table-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.table-actions .el-button {
  margin: 0;
}
</style>
