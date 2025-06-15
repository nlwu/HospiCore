<template>
  <div class="settings-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-title">
          <el-icon size="24" color="#409EFF">
            <Setting />
          </el-icon>
          <div class="title-content">
            <h2>系统设置</h2>
            <p>系统配置和参数管理</p>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-content">
      <!-- 左侧菜单 -->
      <div class="settings-menu">
        <el-menu
          v-model="activeMenu"
          mode="vertical"
          @select="handleMenuSelect"
          class="settings-nav"
        >
          <el-menu-item index="basic">
            <el-icon><Setting /></el-icon>
            <span>基本设置</span>
          </el-menu-item>
          <el-menu-item index="security">
            <el-icon><Lock /></el-icon>
            <span>安全设置</span>
          </el-menu-item>
          <el-menu-item index="notification">
            <el-icon><Bell /></el-icon>
            <span>通知设置</span>
          </el-menu-item>
          <el-menu-item index="backup">
            <el-icon><FolderOpened /></el-icon>
            <span>备份恢复</span>
          </el-menu-item>
          <el-menu-item index="logs">
            <el-icon><Document /></el-icon>
            <span>系统日志</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 右侧内容 -->
      <div class="settings-main">
        <!-- 基本设置 -->
        <el-card v-if="activeMenu === 'basic'" class="settings-card">
          <template #header>
            <span class="card-title">基本设置</span>
          </template>
          
          <el-form :model="basicSettings" label-width="120px">
            <el-form-item label="系统名称">
              <el-input v-model="basicSettings.systemName" placeholder="请输入系统名称" />
            </el-form-item>
            
            <el-form-item label="系统版本">
              <el-input v-model="basicSettings.version" placeholder="请输入系统版本" readonly />
            </el-form-item>
            
            <el-form-item label="公司名称">
              <el-input v-model="basicSettings.companyName" placeholder="请输入公司名称" />
            </el-form-item>
            
            <el-form-item label="系统描述">
              <el-input
                v-model="basicSettings.description"
                type="textarea"
                :rows="3"
                placeholder="请输入系统描述"
              />
            </el-form-item>
            
            <el-form-item label="时区设置">
              <el-select v-model="basicSettings.timezone" placeholder="请选择时区">
                <el-option label="北京时间 (UTC+8)" value="Asia/Shanghai" />
                <el-option label="纽约时间 (UTC-5)" value="America/New_York" />
                <el-option label="伦敦时间 (UTC+0)" value="Europe/London" />
              </el-select>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveBasicSettings">保存设置</el-button>
              <el-button @click="resetBasicSettings">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 安全设置 -->
        <el-card v-if="activeMenu === 'security'" class="settings-card">
          <template #header>
            <span class="card-title">安全设置</span>
          </template>
          
          <el-form :model="securitySettings" label-width="120px">
            <el-form-item label="密码策略">
              <el-switch
                v-model="securitySettings.passwordPolicy"
                active-text="启用强密码策略"
                inactive-text="禁用强密码策略"
              />
            </el-form-item>
            
            <el-form-item label="登录失败限制">
              <el-input-number
                v-model="securitySettings.maxLoginAttempts"
                :min="3"
                :max="10"
                controls-position="right"
              />
              <span class="form-help">次失败后锁定账户</span>
            </el-form-item>
            
            <el-form-item label="会话超时">
              <el-input-number
                v-model="securitySettings.sessionTimeout"
                :min="30"
                :max="480"
                controls-position="right"
              />
              <span class="form-help">分钟后自动退出</span>
            </el-form-item>
            
            <el-form-item label="IP访问控制">
              <el-switch
                v-model="securitySettings.ipWhitelist"
                active-text="启用IP白名单"
                inactive-text="允许所有IP访问"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveSecuritySettings">保存设置</el-button>
              <el-button @click="resetSecuritySettings">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 通知设置 -->
        <el-card v-if="activeMenu === 'notification'" class="settings-card">
          <template #header>
            <span class="card-title">通知设置</span>
          </template>
          
          <el-form :model="notificationSettings" label-width="120px">
            <el-form-item label="邮件通知">
              <el-switch
                v-model="notificationSettings.emailEnabled"
                active-text="启用邮件通知"
                inactive-text="禁用邮件通知"
              />
            </el-form-item>
            
            <el-form-item label="短信通知">
              <el-switch
                v-model="notificationSettings.smsEnabled"
                active-text="启用短信通知"
                inactive-text="禁用短信通知"
              />
            </el-form-item>
            
            <el-form-item label="系统消息">
              <el-switch
                v-model="notificationSettings.systemMessage"
                active-text="启用系统消息"
                inactive-text="禁用系统消息"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveNotificationSettings">保存设置</el-button>
              <el-button @click="resetNotificationSettings">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 备份恢复 -->
        <el-card v-if="activeMenu === 'backup'" class="settings-card">
          <template #header>
            <span class="card-title">备份恢复</span>
          </template>
          
          <div class="backup-section">
            <h4>数据备份</h4>
            <p>定期备份系统数据，确保数据安全</p>
            <el-button type="primary" @click="createBackup">立即备份</el-button>
            <el-button @click="loadBackupList">查看备份历史</el-button>
            
            <el-divider />
            
            <h4>数据恢复</h4>
            <p>从备份文件恢复系统数据</p>
            <el-upload
              action="/api/system/restore"
              :before-upload="beforeRestoreUpload"
              :on-success="onRestoreSuccess"
              :show-file-list="false"
            >
              <el-button type="warning">选择备份文件恢复</el-button>
            </el-upload>
          </div>
        </el-card>

        <!-- 系统日志 -->
        <el-card v-if="activeMenu === 'logs'" class="settings-card">
          <template #header>
            <span class="card-title">系统日志</span>
          </template>
          
          <div class="logs-section">
            <el-button type="primary" @click="loadSystemLogs">刷新日志</el-button>
            <el-button type="danger" @click="clearLogs">清空日志</el-button>
            
            <el-table :data="systemLogs" style="margin-top: 20px;" max-height="400">
              <el-table-column prop="timestamp" label="时间" width="180" />
              <el-table-column prop="level" label="级别" width="100">
                <template #default="{ row }">
                  <el-tag :type="getLogLevelType(row.level)">{{ row.level }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="message" label="消息" />
              <el-table-column prop="source" label="来源" width="120" />
            </el-table>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting, Lock, Bell, FolderOpened, Document } from '@element-plus/icons-vue'

// 响应式数据
const activeMenu = ref('basic')
const systemLogs = ref([])

// 基本设置
const basicSettings = reactive({
  systemName: '综合管理平台',
  version: '1.0.0',
  companyName: '',
  description: '',
  timezone: 'Asia/Shanghai'
})

// 安全设置
const securitySettings = reactive({
  passwordPolicy: true,
  maxLoginAttempts: 5,
  sessionTimeout: 120,
  ipWhitelist: false
})

// 通知设置
const notificationSettings = reactive({
  emailEnabled: true,
  smsEnabled: false,
  systemMessage: true
})

// 菜单选择
const handleMenuSelect = (index) => {
  activeMenu.value = index
}

// 保存基本设置
const saveBasicSettings = () => {
  try {
    // 这里应该调用API保存设置
    ElMessage.success('基本设置保存成功')
  } catch (error) {
    ElMessage.error('保存失败，请重试')
  }
}

// 重置基本设置
const resetBasicSettings = () => {
  Object.assign(basicSettings, {
    systemName: '综合管理平台',
    version: '1.0.0',
    companyName: '',
    description: '',
    timezone: 'Asia/Shanghai'
  })
  ElMessage.info('已重置为默认设置')
}

// 保存安全设置
const saveSecuritySettings = () => {
  try {
    ElMessage.success('安全设置保存成功')
  } catch (error) {
    ElMessage.error('保存失败，请重试')
  }
}

// 重置安全设置
const resetSecuritySettings = () => {
  Object.assign(securitySettings, {
    passwordPolicy: true,
    maxLoginAttempts: 5,
    sessionTimeout: 120,
    ipWhitelist: false
  })
  ElMessage.info('已重置为默认设置')
}

// 保存通知设置
const saveNotificationSettings = () => {
  try {
    ElMessage.success('通知设置保存成功')
  } catch (error) {
    ElMessage.error('保存失败，请重试')
  }
}

// 重置通知设置
const resetNotificationSettings = () => {
  Object.assign(notificationSettings, {
    emailEnabled: true,
    smsEnabled: false,
    systemMessage: true
  })
  ElMessage.info('已重置为默认设置')
}

// 创建备份
const createBackup = () => {
  ElMessage.info('正在创建备份...')
  // 模拟备份过程
  setTimeout(() => {
    ElMessage.success('备份创建成功')
  }, 2000)
}

// 加载备份列表
const loadBackupList = () => {
  ElMessage.info('备份功能开发中...')
}

// 备份文件上传前检查
const beforeRestoreUpload = (file) => {
  const isValidType = file.type === 'application/sql' || file.name.endsWith('.sql')
  if (!isValidType) {
    ElMessage.error('只能上传SQL备份文件')
    return false
  }
  return true
}

// 恢复成功回调
const onRestoreSuccess = () => {
  ElMessage.success('数据恢复成功')
}

// 加载系统日志
const loadSystemLogs = () => {
  // 模拟日志数据
  systemLogs.value = [
    {
      timestamp: '2024-06-15 10:30:00',
      level: 'INFO',
      message: '用户admin登录系统',
      source: 'Auth'
    },
    {
      timestamp: '2024-06-15 10:25:00',
      level: 'WARN',
      message: '数据库连接缓慢',
      source: 'Database'
    },
    {
      timestamp: '2024-06-15 10:20:00',
      level: 'ERROR',
      message: '文件上传失败',
      source: 'Upload'
    }
  ]
  ElMessage.success('日志加载完成')
}

// 清空日志
const clearLogs = () => {
  systemLogs.value = []
  ElMessage.success('日志已清空')
}

// 获取日志级别颜色
const getLogLevelType = (level) => {
  const typeMap = {
    INFO: 'success',
    WARN: 'warning',
    ERROR: 'danger',
    DEBUG: 'info'
  }
  return typeMap[level] || 'info'
}

// 组件挂载时加载数据
onMounted(() => {
  // 加载系统设置
})
</script>

<style scoped>
.settings-container {
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

/* 设置内容布局 */
.settings-content {
  display: flex;
  gap: 20px;
}

.settings-menu {
  width: 200px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.settings-nav {
  border: none;
}

.settings-main {
  flex: 1;
}

.settings-card {
  border-radius: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* 表单样式 */
.form-help {
  margin-left: 8px;
  color: #999;
  font-size: 12px;
}

/* 备份恢复样式 */
.backup-section h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.backup-section p {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 13px;
}

/* 日志样式 */
.logs-section {
  /* 日志区域样式 */
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-content {
    flex-direction: column;
  }
  
  .settings-menu {
    width: 100%;
  }
}
</style> 