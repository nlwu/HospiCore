<template>
  <div class="page-container">
    <div class="page-header">
      <h2>表单功能演示</h2>
      <p>展示表单的校验、提交、保存草稿、重置等通用功能</p>
    </div>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      size="default"
      class="demo-form"
    >
      <div class="form-section">
        <h3 class="section-title">基本信息</h3>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="工号" prop="employeeId">
              <el-input 
                v-model="formData.employeeId" 
                placeholder="请输入工号"
                prefix-icon="User"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input 
                v-model="formData.name" 
                placeholder="请输入姓名"
                prefix-icon="UserFilled"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="formData.gender">
                <el-radio label="男">男</el-radio>
                <el-radio label="女">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phone">
              <el-input 
                v-model="formData.phone" 
                placeholder="请输入手机号码"
                prefix-icon="Phone"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="form-section">
        <h3 class="section-title">联系信息</h3>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="邮箱地址" prop="email">
              <el-input 
                v-model="formData.email" 
                placeholder="请输入邮箱地址"
                type="email"
                prefix-icon="Message"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属科室" prop="department">
              <el-select 
                v-model="formData.department" 
                placeholder="请选择科室"
                style="width: 100%"
              >
                <el-option label="内科" value="内科" />
                <el-option label="外科" value="外科" />
                <el-option label="儿科" value="儿科" />
                <el-option label="妇产科" value="妇产科" />
                <el-option label="急诊科" value="急诊科" />
                <el-option label="护理部" value="护理部" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="家庭住址" prop="address">
          <el-input 
            v-model="formData.address" 
            placeholder="请输入详细地址"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </div>

      <div class="form-actions">
        <el-button 
          type="primary" 
          @click="handleSubmit"
          :loading="submitLoading"
          size="large"
        >
          <el-icon><Check /></el-icon>提交表单
        </el-button>
        <el-button @click="handleReset" size="large">
          <el-icon><Refresh /></el-icon>重置表单
        </el-button>
        <el-button type="info" @click="handleSaveDraft" size="large">
          <el-icon><Document /></el-icon>保存草稿
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const formRef = ref()
const submitLoading = ref(false)

const formData = reactive({
  employeeId: '',
  name: '',
  gender: '',
  phone: '',
  email: '',
  department: '',
  address: ''
})

const formRules = reactive({
  employeeId: [
    { required: true, message: '请输入工号', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号码格式不正确', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  department: [
    { required: true, message: '请选择所属科室', trigger: 'change' }
  ]
})

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    submitLoading.value = true
    
    // 模拟提交API
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    ElMessage.success('表单提交成功！')
    
  } catch (error) {
    console.error('表单验证失败:', error)
    ElMessage.error('请检查必填项是否完整')
  } finally {
    submitLoading.value = false
  }
}

const handleReset = () => {
  formRef.value.resetFields()
  ElMessage.success('表单已重置')
}

const handleSaveDraft = () => {
  // 实现保存草稿的逻辑
  ElMessage.success('表单已保存为草稿')
}
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

.demo-form {
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

.form-section {
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  position: relative;
}

.form-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
  border-radius: 2px 0 0 2px;
}

.section-title {
  margin-bottom: 20px;
  color: #1a202c;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::after {
  content: '';
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, #409eff 0%, transparent 100%);
  border-radius: 1px;
}

.form-actions {
  margin-top: 32px;
  padding: 24px;
  text-align: center;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed #e2e8f0;
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.el-form-item__label {
  color: #4a5568 !important;
  font-weight: 600 !important;
}

.el-input__wrapper {
  transition: all 0.3s ease;
}

.el-input__wrapper:hover {
  box-shadow: 0 0 0 1px #409eff;
}

.el-input__wrapper.is-focus {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.el-select .el-input__wrapper {
  cursor: pointer;
}

.el-textarea__inner {
  transition: all 0.3s ease;
}

.el-textarea__inner:hover {
  border-color: #409eff;
}

.el-textarea__inner:focus {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.el-radio-group {
  display: flex;
  gap: 24px;
}

.el-radio {
  margin-right: 0;
}

.el-radio__input.is-checked .el-radio__inner {
  background-color: #409eff;
  border-color: #409eff;
}

.el-radio__input.is-checked + .el-radio__label {
  color: #409eff;
  font-weight: 600;
}

.el-button--large {
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.el-button--large:hover {
  transform: translateY(-1px);
}
</style> 