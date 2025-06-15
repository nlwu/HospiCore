<template>
  <div class="profile-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-title">
          <el-icon size="24" color="#409EFF">
            <User />
          </el-icon>
          <div class="title-content">
            <h2>个人中心</h2>
            <p>查看和管理您的个人信息</p>
          </div>
        </div>
      </div>
    </div>

    <div class="profile-content">
      <!-- 左侧：用户信息卡片 -->
      <div class="user-info-card">
        <el-card>
          <div class="user-info">
            <div class="avatar-section">
              <el-avatar :size="80" :src="userInfo.avatar" class="user-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <el-button type="primary" size="small" class="change-avatar-btn">
                更换头像
              </el-button>
            </div>
            <div class="info-section">
              <h3>{{ userInfo.username || '用户' }}</h3>
              <p class="user-role">{{ userInfo.role || '普通用户' }}</p>
              <p class="user-email">{{ userInfo.email || 'user@example.com' }}</p>
              <div class="user-stats">
                <div class="stat-item">
                  <span class="stat-label">部门</span>
                  <span class="stat-value">{{ userInfo.department || '未设置' }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">职位</span>
                  <span class="stat-value">{{ userInfo.position || '未设置' }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧：设置选项 -->
      <div class="settings-section">
        <el-card>
          <template #header>
            <span>基本设置</span>
          </template>
          
          <el-form :model="profileForm" label-width="80px">
            <el-form-item label="用户名">
              <el-input v-model="profileForm.username" placeholder="请输入用户名" />
            </el-form-item>
            
            <el-form-item label="邮箱">
              <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
            </el-form-item>
            
            <el-form-item label="手机号">
              <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            
            <el-form-item label="部门">
              <el-select v-model="profileForm.department_id" placeholder="请选择部门">
                <el-option
                  v-for="dept in departments"
                  :key="dept.id"
                  :label="dept.name"
                  :value="dept.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="updateProfile">保存修改</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 密码修改 -->
        <el-card class="password-card">
          <template #header>
            <span>密码修改</span>
          </template>
          
          <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                placeholder="请输入当前密码"
                show-password
              />
            </el-form-item>
            
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="请输入新密码"
                show-password
              />
            </el-form-item>
            
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="请确认新密码"
                show-password
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="changePassword">修改密码</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User } from '@element-plus/icons-vue'
import { systemAPI, hrAPI } from '@/utils/api'

// 响应式数据
const userInfo = ref({
  username: localStorage.getItem('username') || '用户',
  email: '',
  phone: '',
  role: localStorage.getItem('userRole') || '普通用户',
  department: '',
  position: '',
  avatar: ''
})

const departments = ref([])
const passwordFormRef = ref()

// 个人信息表单
const profileForm = reactive({
  username: '',
  email: '',
  phone: '',
  department_id: ''
})

// 密码修改表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码验证规则
const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 加载用户信息
const loadUserInfo = async () => {
  try {
    // 这里应该调用真实的用户信息API
    // const response = await systemAPI.getUserProfile()
    // 暂时使用模拟数据
    Object.keys(profileForm).forEach(key => {
      profileForm[key] = userInfo.value[key] || ''
    })
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
}

// 加载部门列表
const loadDepartments = async () => {
  try {
    const response = await hrAPI.getDepartments()
    if (response.status === 'success') {
      departments.value = response.data || []
    }
  } catch (error) {
    console.error('加载部门列表失败:', error)
  }
}

// 更新个人信息
const updateProfile = async () => {
  try {
    // 这里应该调用真实的更新API
    // const response = await systemAPI.updateUserProfile(profileForm)
    ElMessage.success('个人信息更新成功')
    
    // 更新本地存储
    localStorage.setItem('username', profileForm.username)
    userInfo.value.username = profileForm.username
  } catch (error) {
    console.error('更新个人信息失败:', error)
    ElMessage.error('更新失败，请重试')
  }
}

// 重置表单
const resetForm = () => {
  loadUserInfo()
}

// 修改密码
const changePassword = async () => {
  try {
    await passwordFormRef.value.validate()
    
    // 这里应该调用真实的密码修改API
    // const response = await systemAPI.changePassword(passwordForm)
    ElMessage.success('密码修改成功')
    
    // 清空密码表单
    Object.keys(passwordForm).forEach(key => {
      passwordForm[key] = ''
    })
  } catch (error) {
    console.error('修改密码失败:', error)
    ElMessage.error('修改密码失败，请重试')
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadUserInfo()
  loadDepartments()
})
</script>

<style scoped>
.profile-container {
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

/* 内容布局 */
.profile-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
}

/* 用户信息卡片 */
.user-info-card {
  height: fit-content;
}

.user-info {
  text-align: center;
}

.avatar-section {
  margin-bottom: 20px;
}

.user-avatar {
  margin-bottom: 10px;
}

.change-avatar-btn {
  display: block;
  margin: 0 auto;
}

.info-section h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 20px;
}

.user-role {
  color: #409EFF;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.user-email {
  color: #666;
  font-size: 14px;
  margin: 0 0 20px 0;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  color: #999;
  font-size: 12px;
  margin-bottom: 4px;
}

.stat-value {
  color: #333;
  font-weight: 500;
}

/* 设置区域 */
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.password-card {
  /* 密码卡片样式 */
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-content {
    grid-template-columns: 1fr;
  }
}
</style> 