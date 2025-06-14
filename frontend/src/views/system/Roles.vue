<template>
  <div class="roles-management">
    <div class="page-header">
      <h2>角色管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增角色
      </el-button>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.search"
            placeholder="角色名称、描述"
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

    <!-- 角色列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="roleList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" width="150" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="permissions" label="权限标识" width="200">
          <template #default="{ row }">
            <el-tag v-if="row.permissions === '*'" type="danger">
              超级管理员
            </el-tag>
            <el-tag v-else type="success">
              {{ row.permissions || '无' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" fixed="right" width="220">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="warning" @click="handlePermissions(row)">
                权限配置
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

    <!-- 角色表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="roleRules"
        label-width="80px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input
            v-model="roleForm.name"
            placeholder="请输入角色名称"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="roleForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
        </el-form-item>
        <el-form-item label="权限标识" prop="permissions">
          <el-input
            v-model="roleForm.permissions"
            placeholder="如：user,role,menu 或 * (超级管理员)"
          />
          <div class="form-tips">
            权限标识说明：使用逗号分隔多个权限，如 user,role,menu；使用 * 表示超级管理员权限
          </div>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="roleForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 权限配置对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="权限配置"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="permission-config">
        <div class="role-info">
          <el-tag type="primary">{{ currentRole?.name }}</el-tag>
          <span class="role-desc">{{ currentRole?.description }}</span>
        </div>
        
        <el-divider>菜单权限</el-divider>
        
        <el-tree
          ref="menuTreeRef"
          :data="menuTreeData"
          :props="treeProps"
          show-checkbox
          node-key="id"
          default-expand-all
          class="menu-tree"
        >
          <template #default="{ data }">
            <div class="tree-node">
              <el-icon v-if="data.icon"><component :is="data.icon" /></el-icon>
              <span>{{ data.name }}</span>
              <el-tag v-if="data.permissions" size="small" type="info">
                {{ data.permissions }}
              </el-tag>
            </div>
          </template>
        </el-tree>
      </div>
      
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSavePermissions" :loading="permissionLoading">
          保存权限
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { roleAPI, menuAPI } from '@/utils/api'

const loading = ref(false)
const dialogVisible = ref(false)
const permissionDialogVisible = ref(false)
const submitLoading = ref(false)
const permissionLoading = ref(false)
const isEdit = ref(false)
const roleFormRef = ref()
const menuTreeRef = ref()

const searchForm = reactive({
  search: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const roleList = ref([])
const menuTreeData = ref([])
const currentRole = ref(null)

const roleForm = reactive({
  id: null,
  name: '',
  description: '',
  permissions: '',
  status: 1
})

const roleRules = reactive({
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '角色名称长度为2-50位', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过200个字符', trigger: 'blur' }
  ]
})

const treeProps = {
  children: 'children',
  label: 'name'
}

const dialogTitle = computed(() => isEdit.value ? '编辑角色' : '新增角色')

// 获取角色列表
const fetchRoles = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchForm.search,
      status: searchForm.status
    }
    
    const response = await roleAPI.getRoles(params)
    roleList.value = response.data.list
    pagination.total = response.data.total
  } catch (error) {
    console.error('获取角色列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取菜单树
const fetchMenuTree = async () => {
  try {
    const response = await menuAPI.getMenus()
    menuTreeData.value = response.data
  } catch (error) {
    console.error('获取菜单列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchRoles()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    search: '',
    status: ''
  })
  pagination.page = 1
  fetchRoles()
}

// 分页
const handleSizeChange = (val) => {
  pagination.limit = val
  fetchRoles()
}

const handleCurrentChange = (val) => {
  pagination.page = val
  fetchRoles()
}

// 新增角色
const handleAdd = () => {
  isEdit.value = false
  dialogVisible.value = true
  Object.assign(roleForm, {
    id: null,
    name: '',
    description: '',
    permissions: '',
    status: 1
  })
}

// 编辑角色
const handleEdit = (row) => {
  isEdit.value = true
  dialogVisible.value = true
  Object.assign(roleForm, {
    id: row.id,
    name: row.name,
    description: row.description || '',
    permissions: row.permissions || '',
    status: row.status
  })
}

// 提交表单
const handleSubmit = async () => {
  try {
    await roleFormRef.value.validate()
    
    submitLoading.value = true
    
    if (isEdit.value) {
      // 编辑角色
      await roleAPI.updateRole(roleForm.id, {
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions,
        status: roleForm.status
      })
      ElMessage.success('角色更新成功')
    } else {
      // 新增角色
      await roleAPI.createRole(roleForm)
      ElMessage.success('角色创建成功')
    }
    
    dialogVisible.value = false
    fetchRoles()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 权限配置
const handlePermissions = async (row) => {
  try {
    currentRole.value = row
    permissionDialogVisible.value = true
    
    // 获取角色详情，包含菜单权限
    const response = await roleAPI.getRole(row.id)
    const roleDetail = response.data
    
    // 等待下一个tick，确保树组件已渲染
    await nextTick()
    
    // 设置选中的菜单
    if (roleDetail.menu_ids && roleDetail.menu_ids.length > 0) {
      menuTreeRef.value.setCheckedKeys(roleDetail.menu_ids)
    }
  } catch (error) {
    console.error('获取角色权限失败:', error)
  }
}

// 保存权限配置
const handleSavePermissions = async () => {
  try {
    permissionLoading.value = true
    
    // 获取选中的菜单ID
    const checkedKeys = menuTreeRef.value.getCheckedKeys()
    const halfCheckedKeys = menuTreeRef.value.getHalfCheckedKeys()
    const allCheckedKeys = [...checkedKeys, ...halfCheckedKeys]
    
    // 更新角色权限
    await roleAPI.updateRole(currentRole.value.id, {
      menu_ids: allCheckedKeys
    })
    
    ElMessage.success('权限配置保存成功')
    permissionDialogVisible.value = false
    fetchRoles()
  } catch (error) {
    console.error('保存权限失败:', error)
  } finally {
    permissionLoading.value = false
  }
}

// 删除角色
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除角色 "${row.name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await roleAPI.deleteRole(row.id)
      ElMessage.success('角色删除成功')
      fetchRoles()
    } catch (error) {
      console.error('删除角色失败:', error)
    }
  })
}

onMounted(() => {
  fetchRoles()
  fetchMenuTree()
})
</script>

<style scoped>
.roles-management {
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

.form-tips {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.permission-config {
  max-height: 500px;
  overflow-y: auto;
}

.role-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.role-desc {
  color: #606266;
  font-size: 14px;
}

.menu-tree {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
}

.table-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.table-actions .el-button {
  margin: 0;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.tree-node .el-icon {
  color: #409eff;
}
</style> 