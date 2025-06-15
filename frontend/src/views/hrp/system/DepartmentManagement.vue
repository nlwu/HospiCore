<template>
  <div class="department-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-title">
          <el-icon size="24" color="#409EFF">
            <OfficeBuilding />
          </el-icon>
          <div class="title-content">
            <h2>部门管理</h2>
            <p>管理组织架构，维护部门信息</p>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新增部门
        </el-button>
      </div>
    </div>

    <!-- 部门树 -->
    <el-card class="tree-card">
      <div class="card-header">
        <span class="card-title">部门结构</span>
      </div>
      
      <el-tree
        ref="departmentTree"
        :data="departmentTree"
        :props="treeProps"
        :default-expand-all="true"
        :expand-on-click-node="false"
        node-key="id"
        class="department-tree"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <div class="node-content">
              <el-icon class="dept-icon">
                <OfficeBuilding />
              </el-icon>
              <span class="node-label">{{ data.name }}</span>
            </div>
            <div class="node-actions">
              <el-button
                type="primary"
                size="small"
                text
                @click.stop="showCreateDialog(data)"
              >
                添加子部门
              </el-button>
              <el-button
                type="primary"
                size="small"
                text
                @click.stop="editDepartment(data)"
              >
                编辑
              </el-button>
              <el-button
                type="danger"
                size="small"
                text
                @click.stop="deleteDepartment(data)"
              >
                删除
              </el-button>
            </div>
          </div>
        </template>
      </el-tree>
    </el-card>

    <!-- 新增/编辑部门对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑部门' : '新增部门'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="departmentFormRef"
        :model="departmentForm"
        :rules="departmentRules"
        label-width="80px"
      >
        <el-form-item label="部门名称" prop="name">
          <el-input
            v-model="departmentForm.name"
            placeholder="请输入部门名称"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="上级部门" prop="parent_id">
          <el-tree-select
            v-model="departmentForm.parent_id"
            :data="departmentOptions"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            placeholder="请选择上级部门"
            clearable
            check-strictly
            :render-after-expand="false"
          />
        </el-form-item>
        
        <el-form-item label="部门经理">
          <el-select
            v-model="departmentForm.manager_id"
            placeholder="请选择部门经理"
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
        
        <el-form-item label="部门描述">
          <el-input
            v-model="departmentForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入部门描述"
          />
        </el-form-item>
        
        <el-form-item label="排序">
          <el-input-number
            v-model="departmentForm.sort_order"
            :min="0"
            :max="999"
            placeholder="排序号"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveDepartment">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { OfficeBuilding, Plus, Refresh } from '@element-plus/icons-vue'
import { systemAPI } from '@/utils/api'

// 响应式数据
const departmentTree = ref([])
const departmentOptions = ref([])
const employees = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const departmentFormRef = ref()

// 树形组件配置
const treeProps = {
  children: 'children',
  label: 'name'
}

// 表单数据
const departmentForm = reactive({
  id: null,
  name: '',
  parent_id: null,
  manager_id: null,
  description: '',
  sort_order: 0
})

// 表单验证规则
const departmentRules = {
  name: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 2, max: 50, message: '部门名称长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 加载部门数据
const loadDepartments = async () => {
  try {
    const response = await systemAPI.getDepartments()
    if (response.status === 'success') {
      departmentTree.value = response.data
      // 构建选择器选项（排除自身）
      buildDepartmentOptions(response.data)
    }
  } catch (error) {
    console.error('加载部门数据失败:', error)
    ElMessage.error('加载部门数据失败')
  }
}

// 构建部门选择器选项
const buildDepartmentOptions = (data, options = []) => {
  data.forEach(dept => {
    if (!isEdit.value || dept.id !== departmentForm.id) {
      options.push({
        id: dept.id,
        name: dept.name,
        children: dept.children ? buildDepartmentOptions(dept.children, []) : []
      })
    }
  })
  departmentOptions.value = options
  return options
}

// 加载员工列表
const loadEmployees = async () => {
  try {
    const response = await systemAPI.getEmployees()
    if (response.status === 'success') {
      employees.value = response.data || []
    }
  } catch (error) {
    console.error('加载员工列表失败:', error)
  }
}

// 显示新增对话框
const showCreateDialog = (parentDept = null) => {
  isEdit.value = false
  resetForm()
  if (parentDept) {
    departmentForm.parent_id = parentDept.id
  }
  loadEmployees()
  dialogVisible.value = true
}

// 编辑部门
const editDepartment = (dept) => {
  isEdit.value = true
  Object.keys(departmentForm).forEach(key => {
    departmentForm[key] = dept[key] || (key === 'sort_order' ? 0 : '')
  })
  loadEmployees()
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  Object.keys(departmentForm).forEach(key => {
    departmentForm[key] = key === 'sort_order' ? 0 : ''
  })
  if (departmentFormRef.value) {
    departmentFormRef.value.clearValidate()
  }
}

// 保存部门
const saveDepartment = async () => {
  try {
    await departmentFormRef.value.validate()
    saving.value = true
    
    // 准备提交数据，创建时过滤掉 id 字段
    const submitData = { ...departmentForm }
    if (!isEdit.value) {
      delete submitData.id
    }
    let response
    if (isEdit.value) {
      console.log('updateDepartment', departmentForm.id, submitData)
      response = await systemAPI.updateDepartment(departmentForm.id, submitData)
    } else {
      response = await systemAPI.createDepartment(submitData)
    }
    
    if (response.status === 'success') {
      ElMessage.success(response.message || (isEdit.value ? '更新成功' : '创建成功'))
      dialogVisible.value = false
      loadDepartments()
    }
  } catch (error) {
    console.error('保存部门失败:', error)
    ElMessage.error('保存失败，请重试')
  }
  saving.value = false
}

// 删除部门
const deleteDepartment = (dept) => {
  if (dept.children && dept.children.length > 0) {
    ElMessage.warning('该部门包含子部门，请先删除子部门')
    return
  }
  
  if (dept.employee_count > 0) {
    ElMessage.warning('该部门还有员工，请先转移员工')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除部门 "${dept.name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await systemAPI.deleteDepartment(dept.id)
      if (response.status === 'success') {
        ElMessage.success('删除成功')
        loadDepartments()
      } else {
        ElMessage.error(response.message || '删除失败')
      }
    } catch (error) {
      console.error('删除部门失败:', error)
      if (error.response?.data?.message?.includes('FOREIGN KEY constraint failed')) {
        ElMessage.error('无法删除该部门，可能存在关联数据。请先处理相关员工或数据。')
      } else {
        ElMessage.error('删除失败，请重试')
      }
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 组件挂载时加载数据
onMounted(() => {
  loadDepartments()
})
</script>

<style scoped>
.department-management {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 120px);
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

/* 树形卡片样式 */
.tree-card {
  border-radius: 8px;
}

.card-header {
  margin-bottom: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* 部门树样式 */
.department-tree {
  background: transparent;
}

.tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 0;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dept-icon {
  color: #409EFF;
}

.node-label {
  font-weight: 500;
  color: #333;
}

.node-info {
  color: #666;
  font-size: 12px;
}

.node-actions {
  display: flex;
  gap: 8px;
  transition: opacity 0.3s;
}

.node-actions button {
  padding: 4px 8px;
  background: #f5f7fa;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 12px;
}

.node-actions button:hover {
  background: #409EFF;
  color: white;
  border-color: #409EFF;
}

.tree-node:hover .node-actions {
  opacity: 1;
}

/* 对话框样式 */
.dialog-footer {
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .tree-node {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .node-actions {
    opacity: 1;
  }
}
</style>