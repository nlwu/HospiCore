<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <img src="/hospital-logo.svg" alt="医院Logo" class="logo" />
        <h1>医院综合管理平台</h1>
        <p>Hospital Integrated Management Platform</p>
        <div class="system-info">
          <span class="version">v1.0.0</span>
          <span class="separator">|</span>
          <span class="feature">智慧医疗 • 数字化管理</span>
        </div>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        size="large"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item v-if="showCaptcha" prop="captcha">
          <div style="display: flex; gap: 12px;">
            <el-input
              v-model="loginForm.captcha"
              placeholder="验证码"
              prefix-icon="Picture"
              style="flex: 1"
            />
            <div class="captcha-box" @click="refreshCaptcha">
              <span>{{ captchaText }}</span>
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
          <el-link type="primary" style="float: right;">忘记密码？</el-link>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            style="width: 100%"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p>登录失败次数过多将触发验证码和账户锁定</p>
        <p>支持统一身份认证 (SSO) | 双因素认证</p>
        <p>默认账号：admin，密码：admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authAPI } from '@/utils/api'

const router = useRouter()
const loginFormRef = ref()
const loading = ref(false)
const showCaptcha = ref(false)
const captchaText = ref('AB3C')
const rememberMe = ref(false)
const failedAttempts = ref(0)

const loginForm = reactive({
  username: 'admin',
  password: 'admin123',
  captcha: ''
})

const loginRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度为3-50位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
})

const refreshCaptcha = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  captchaText.value = result
}

const handleLogin = async () => {
  // 表单验证
  try {
    await loginFormRef.value.validate()
  } catch (error) {
    return
  }

  // 如果显示验证码，验证验证码
  if (showCaptcha.value && loginForm.captcha.toUpperCase() !== captchaText.value) {
    ElMessage.error('验证码错误')
    refreshCaptcha()
    return
  }

  loading.value = true

  try {
    // 调用后端登录接口
    const response = await authAPI.login({
      username: loginForm.username,
      password: loginForm.password
    })

    if (response.status === 'success') {
      const { token, user } = response.data

      // 保存token和用户信息到localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('userInfo', JSON.stringify(user))
      localStorage.setItem('isLoggedIn', 'true')

      // 如果选择记住密码，保存密码
      if (rememberMe.value) {
        localStorage.setItem('rememberedUsername', loginForm.username)
        localStorage.setItem('rememberedPassword', loginForm.password)
      } else {
        localStorage.removeItem('rememberedUsername')
        localStorage.removeItem('rememberedPassword')
      }

      ElMessage.success(`欢迎回来，${user.real_name || user.username}！`)

      // 跳转到仪表板
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('登录失败:', error)
    
    // 增加失败次数
    failedAttempts.value++
    
    // 失败3次后显示验证码
    if (failedAttempts.value >= 3) {
      showCaptcha.value = true
      refreshCaptcha()
    }
    
    // 错误信息已经在API拦截器中处理了
  } finally {
    loading.value = false
  }
}

// 初始化时从localStorage获取记住的密码
onMounted(() => {
  refreshCaptcha()
  
  const rememberedUsername = localStorage.getItem('rememberedUsername')
  const rememberedPassword = localStorage.getItem('rememberedPassword')
  
  if (rememberedUsername && rememberedPassword) {
    loginForm.username = rememberedUsername
    loginForm.password = rememberedPassword
    rememberMe.value = true
  }
})
</script>

<style scoped>
.login-container {
  height: 100vh;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" stroke-width="0.1" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
  pointer-events: none;
}

.login-box {
  width: 420px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  padding: 40px 30px 30px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e2e8f0;
}

.logo {
  width: 72px;
  height: 72px;
  margin-bottom: 20px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.login-header h1 {
  color: #1a202c;
  margin-bottom: 8px;
  font-weight: 700;
  font-size: 24px;
  letter-spacing: -0.5px;
}

.login-header p {
  color: #4a5568;
  font-size: 14px;
  margin-bottom: 12px;
  font-weight: 500;
}

.system-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: #718096;
}

.version {
  background: #409eff;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.separator {
  color: #cbd5e0;
}

.feature {
  font-weight: 500;
}

.login-form {
  padding: 30px;
}

.captcha-box {
  width: 80px;
  height: 40px;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
  color: #4a5568;
  user-select: none;
  transition: all 0.3s ease;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
}

.captcha-box:hover {
  background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
  border-color: #409eff;
  transform: scale(1.02);
}

.login-footer {
  text-align: center;
  padding: 20px 30px 30px;
  color: #718096;
  font-size: 12px;
  line-height: 1.6;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.login-footer p {
  margin: 4px 0;
}

.login-footer p:first-child {
  color: #e53e3e;
  font-weight: 500;
}
</style>