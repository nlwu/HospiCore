/**
 * 表单处理工具函数
 */

/**
 * 过滤表单数据中的ID字段（用于创建操作）
 * @param {Object} formData - 表单数据
 * @param {Boolean} isEdit - 是否为编辑模式
 * @returns {Object} - 过滤后的表单数据
 */
export const filterFormData = (formData, isEdit = false) => {
  const data = { ...formData }
  
  // 如果不是编辑模式，删除id字段
  if (!isEdit && data.hasOwnProperty('id')) {
    delete data.id
  }
  
  return data
}

/**
 * 清理表单数据中的空值
 * @param {Object} formData - 表单数据
 * @returns {Object} - 清理后的表单数据
 */
export const cleanFormData = (formData) => {
  const data = { ...formData }
  
  // 删除空值、undefined和null
  Object.keys(data).forEach(key => {
    if (data[key] === '' || data[key] === null || data[key] === undefined) {
      delete data[key]
    }
  })
  
  return data
}

/**
 * 处理API响应中的数据结构差异
 * @param {Object} response - API响应
 * @param {String} dataKey - 数据字段名（如 'list', 'items', 'data'）
 * @returns {Array|Object} - 标准化后的数据
 */
export const normalizeResponseData = (response, dataKey = 'data') => {
  if (response.status === 'success') {
    return response.data?.[dataKey] || response.data || []
  }
  return response.data?.[dataKey] || response.data || []
}

/**
 * 处理表单提交的通用函数
 * @param {Function} apiCall - API调用函数
 * @param {Object} formData - 表单数据
 * @param {Boolean} isEdit - 是否为编辑模式
 * @param {String} successMessage - 成功消息
 * @returns {Promise} - Promise对象
 */
export const handleFormSubmit = async (apiCall, formData, isEdit, successMessage) => {
  const cleanData = filterFormData(formData, isEdit)
  const response = await apiCall(cleanData)
  
  if (response.status === 'success') {
    return {
      success: true,
      message: response.message || successMessage
    }
  }
  
  return {
    success: false,
    message: response.message || '操作失败'
  }
}

/**
 * 表单验证规则
 */
export const commonRules = {
  required: (message) => [
    { required: true, message: message || '此字段为必填项', trigger: 'blur' }
  ],
  
  email: () => [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  
  phone: () => [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  
  username: () => [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度为3-50位', trigger: 'blur' }
  ],
  
  password: () => [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
  ],
  
  name: (fieldName = '名称') => [
    { required: true, message: `请输入${fieldName}`, trigger: 'blur' },
    { min: 2, max: 50, message: `${fieldName}长度在 2 到 50 个字符`, trigger: 'blur' }
  ]
}

// 表单工具函数和规范

/**
 * 筛选框标准配置
 * 用于统一筛选框的样式和行为
 */
export const filterSelectConfig = {
  // 默认样式
  style: 'width: 150px',
  // 默认属性
  clearable: true,
  placeholder: '请选择',
  // 默认选项（第一个选项总是"请选择"）
  defaultOption: { label: '请选择', value: '' }
}

/**
 * 创建标准筛选框选项
 * @param {Array} options - 选项数组
 * @param {Object} config - 配置对象
 * @returns {Array} 包含"请选择"的完整选项数组
 */
export const createFilterOptions = (options = [], config = {}) => {
  const defaultOption = config.includeDefault !== false ? [filterSelectConfig.defaultOption] : []
  return [...defaultOption, ...options]
}

/**
 * 筛选框组件属性生成器
 * @param {Object} customConfig - 自定义配置
 * @returns {Object} 完整的组件属性对象
 */
export const getFilterSelectProps = (customConfig = {}) => {
  return {
    style: customConfig.style || filterSelectConfig.style,
    clearable: customConfig.clearable !== false,
    placeholder: customConfig.placeholder || filterSelectConfig.placeholder,
    ...customConfig
  }
}

/**
 * 常用筛选选项
 */
export const commonFilterOptions = {
  // 状态选项
  status: [
    { label: '启用', value: 'active' },
    { label: '禁用', value: 'inactive' }
  ],
  
  // 员工状态选项
  employeeStatus: [
    { label: '在职', value: 'active' },
    { label: '离职', value: 'inactive' }
  ],
  
  // 招聘状态选项
  recruitmentStatus: [
    { label: '招聘中', value: 'open' },
    { label: '已暂停', value: 'paused' },
    { label: '已关闭', value: 'closed' }
  ],
  
  // 应聘状态选项
  applicationStatus: [
    { label: '待筛选', value: 'pending' },
    { label: '已安排面试', value: 'scheduled' },
    { label: '已面试', value: 'interviewed' },
    { label: '已录用', value: 'hired' },
    { label: '已拒绝', value: 'rejected' }
  ],
  
  // 性别选项
  gender: [
    { label: '男', value: '男' },
    { label: '女', value: '女' }
  ],
  
  // 学历选项
  education: [
    { label: '博士', value: '博士' },
    { label: '硕士', value: '硕士' },
    { label: '本科', value: '本科' },
    { label: '专科', value: '专科' },
    { label: '高中', value: '高中' },
    { label: '中专', value: '中专' },
    { label: '其他', value: '其他' }
  ],
  
  // 婚姻状况选项
  maritalStatus: [
    { label: '未婚', value: '未婚' },
    { label: '已婚', value: '已婚' },
    { label: '离异', value: '离异' },
    { label: '丧偶', value: '丧偶' }
  ]
}

/**
 * 表单验证规则生成器
 */
export const createValidationRules = {
  // 必填字段
  required: (message, trigger = 'blur') => ({
    required: true,
    message,
    trigger
  }),
  
  // 字符串长度限制
  maxLength: (max, message, trigger = 'blur') => ({
    max,
    message: message || `长度不能超过${max}个字符`,
    trigger
  }),
  
  // 数字范围
  numberRange: (min, max, message, trigger = 'blur') => ({
    type: 'number',
    min,
    max,
    message: message || `数值必须在${min}-${max}之间`,
    trigger
  }),
  
  // 手机号验证
  phone: (required = false, trigger = 'blur') => {
    const rules = [{
      pattern: /^1[3-9]\d{9}$/,
      message: '手机号格式不正确',
      trigger
    }]
    
    if (required) {
      rules.unshift({
        required: true,
        message: '请输入手机号',
        trigger
      })
    }
    
    return rules
  },
  
  // 邮箱验证
  email: (required = false, trigger = 'blur') => {
    const rules = [{
      type: 'email',
      message: '邮箱格式不正确',
      trigger
    }]
    
    if (required) {
      rules.unshift({
        required: true,
        message: '请输入邮箱',
        trigger
      })
    }
    
    return rules
  },
  
  // 身份证号验证
  idCard: (required = false, trigger = 'blur') => {
    const rules = [{
      pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
      message: '身份证号格式不正确',
      trigger
    }]
    
    if (required) {
      rules.unshift({
        required: true,
        message: '请输入身份证号',
        trigger
      })
    }
    
    return rules
  }
}

/**
 * 表单数据处理工具
 */
export const formDataUtils = {
  // 过滤空值
  filterEmpty: (data) => {
    const result = {}
    Object.keys(data).forEach(key => {
      if (data[key] !== '' && data[key] !== null && data[key] !== undefined) {
        result[key] = data[key]
      }
    })
    return result
  },
  
  // 处理数字字段
  processNumberFields: (data, fields) => {
    const result = { ...data }
    fields.forEach(field => {
      if (result[field] === '' || result[field] === undefined) {
        result[field] = null
      } else if (result[field] !== null) {
        result[field] = Number(result[field])
      }
    })
    return result
  },
  
  // 重置表单
  resetForm: (formData, defaults = {}) => {
    Object.keys(formData).forEach(key => {
      formData[key] = defaults[key] || ''
    })
  }
}

/**
 * MCP 规则：筛选框开发规范
 * 
 * 1. 所有筛选框必须包含"请选择"选项作为第一个选项
 * 2. 筛选框默认宽度为150px，特殊情况可自定义
 * 3. 筛选框必须设置clearable属性为true
 * 4. 筛选框placeholder统一为"请选择"
 * 5. 使用commonFilterOptions中的标准选项，避免重复定义
 * 6. 表单验证规则使用createValidationRules生成，保持一致性
 * 
 * 使用示例：
 * 
 * <el-select
 *   v-model="searchForm.status"
 *   v-bind="getFilterSelectProps()"
 * >
 *   <el-option
 *     v-for="option in createFilterOptions(commonFilterOptions.status)"
 *     :key="option.value"
 *     :label="option.label"
 *     :value="option.value"
 *   />
 * </el-select>
 */

export default {
  filterSelectConfig,
  createFilterOptions,
  getFilterSelectProps,
  commonFilterOptions,
  createValidationRules,
  formDataUtils
} 