<template>
  <div class="recruitment-management">
    <div class="page-header">
      <div class="header-title">
        <h2>招聘与入职管理</h2>
        <p>管理招聘流程、简历筛选、面试安排和入职办理</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" icon="Plus" @click="showCreatePositionDialog">
          发布招聘
        </el-button>
        <el-button icon="Download" @click="exportData">
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid" style="margin-bottom: 20px;">
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-icon positions">
            <el-icon size="28"><Briefcase /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.positions?.total_positions || 0 }}</div>
            <div class="stat-label">招聘职位</div>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-icon applications">
            <el-icon size="28"><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.applications?.total_applications || 0 }}</div>
            <div class="stat-label">应聘申请</div>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-icon pending">
            <el-icon size="28"><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.applications?.pending_applications || 0 }}</div>
            <div class="stat-label">待筛选</div>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-icon hired">
            <el-icon size="28"><Select /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.applications?.hired_applications || 0 }}</div>
            <div class="stat-label">已录用</div>
          </div>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="card">
      <!-- 招聘计划 -->
      <el-tab-pane label="招聘计划" name="positions">
        <el-card shadow="never">
          <!-- 搜索筛选 -->
          <el-form :model="positionSearchForm" inline>
            <el-form-item label="职位">
              <el-input
                v-model="positionSearchForm.search"
                placeholder="请输入职位名称"
                clearable
                @change="loadPositions"
              />
            </el-form-item>
            <el-form-item label="部门">
                              <el-select
                  v-model="positionSearchForm.department_id"
                  v-bind="getFilterSelectProps({ style: 'width: 150px' })"
                  @change="loadPositions"
                >
                  <el-option
                    v-for="option in createFilterOptions(departments.map(d => ({label: d.name, value: d.id})))"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select
                v-model="positionSearchForm.status"
                style="width: 100px"
                placeholder="请选择状态"
                clearable
                @change="loadPositions"
              >
                <el-option label="请选择" value="" />
                <el-option label="招聘中" value="open" />
                <el-option label="已暂停" value="paused" />
                <el-option label="已关闭" value="closed" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadPositions">查询</el-button>
              <el-button @click="resetPositionSearch">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 招聘计划表格 -->
          <el-table :data="positions" v-loading="positionsLoading" stripe border>
            <el-table-column prop="title" label="职位名称" width="200" />
            <el-table-column prop="department_name" label="部门" width="120" />
            <el-table-column prop="positions_count" label="需求人数" width="100" align="center" />
            <el-table-column label="薪资范围" width="150">
              <template #default="{ row }">
                {{ row.salary_min ? `${row.salary_min}-${row.salary_max}` : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="publish_date" label="发布日期" width="120" />
            <el-table-column prop="deadline" label="截止日期" width="120" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getPositionStatusType(row.status)">
                  {{ getPositionStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="viewPosition(row)">
                  详情
                </el-button>
                <el-button type="warning" size="small" @click="editPosition(row)">
                  编辑
                </el-button>
                <el-button type="success" size="small" @click="viewPositionApplications(row)">
                  简历({{ row.application_count || 0 }})
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <el-pagination
            v-if="positionTotal > 0"
            v-model:current-page="positionPage"
            v-model:page-size="positionLimit"
            :total="positionTotal"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadPositions"
            @current-change="loadPositions"
            style="margin-top: 20px; text-align: right"
          />
        </el-card>
      </el-tab-pane>

      <!-- 简历管理 -->
      <el-tab-pane label="简历管理" name="applications">
        <el-card shadow="never">
          <!-- 搜索筛选 -->
          <el-form :model="applicationSearchForm" inline>
            <el-form-item label="候选人">
              <el-input
                v-model="applicationSearchForm.search"
                placeholder="请输入候选人姓名"
                clearable
                @change="loadApplications"
              />
            </el-form-item>
            <el-form-item label="应聘职位">
              <el-select
                v-model="applicationSearchForm.position_id"
                 style="width: 100px"
                placeholder="请选择职位"
                clearable
                @change="loadApplications"
              >
                <el-option label="请选择" value="" />
                <el-option
                  v-for="pos in positions"
                  :key="pos.id"
                  :label="pos.title"
                  :value="pos.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select
               style="width: 100px"
                v-model="applicationSearchForm.status"
                placeholder="请选择状态"
                clearable
                @change="loadApplications"
              >
                <el-option label="请选择" value="" />
                <el-option label="待筛选" value="pending" />
                <el-option label="已安排面试" value="scheduled" />
                <el-option label="已面试" value="interviewed" />
                <el-option label="已录用" value="hired" />
                <el-option label="已拒绝" value="rejected" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadApplications">查询</el-button>
              <el-button @click="resetApplicationSearch">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 简历表格 -->
          <el-table :data="applications" v-loading="applicationsLoading" stripe border>
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="gender" label="性别" width="80" align="center" />
            <el-table-column label="年龄" width="80" align="center">
              <template #default="{ row }">
                {{ calculateAge(row.birth_date) }}
              </template>
            </el-table-column>
            <el-table-column prop="phone" label="联系电话" width="130" />
            <el-table-column prop="email" label="邮箱" width="180" />
            <el-table-column prop="education" label="学历" width="100" />
            <el-table-column prop="position_title" label="应聘职位" width="150" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getApplicationStatusType(row.status)">
                  {{ getApplicationStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="申请时间" width="150" />
            <el-table-column label="操作" width="320" fixed="right">
              <template #default="{ row }">
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                  <el-button type="primary" size="small" @click="viewApplication(row)">
                    查看
                  </el-button>
                  <el-button
                    v-if="row.status === 'pending'"
                    type="success"
                    size="small"
                    @click="updateApplicationStatus(row, 'scheduled')"
                  >
                    安排面试
                  </el-button>
                  <el-button
                    v-if="row.status === 'scheduled'"
                    type="warning"
                    size="small"
                    @click="updateApplicationStatus(row, 'interviewed')"
                  >
                    已面试
                  </el-button>
                  <el-button
                    v-if="['scheduled', 'interviewed'].includes(row.status)"
                    type="info"
                    size="small"
                    @click="updateApplicationStatus(row, 'hired')"
                  >
                    录用
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    @click="updateApplicationStatus(row, 'rejected')"
                  >
                    拒绝
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <el-pagination
            v-if="applicationTotal > 0"
            v-model:current-page="applicationPage"
            v-model:page-size="applicationLimit"
            :total="applicationTotal"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadApplications"
            @current-change="loadApplications"
            style="margin-top: 20px; text-align: right"
          />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 职位创建/编辑对话框 -->
    <el-dialog
      v-model="positionDialogVisible"
      :title="isEditPosition ? '编辑职位' : '发布招聘职位'"
      width="600px"
    >
      <el-form
        ref="positionFormRef"
        :model="positionForm"
        :rules="positionRules"
        label-width="100px"
      >
        <el-form-item label="职位名称" prop="title">
          <el-input v-model="positionForm.title" placeholder="请输入职位名称" />
        </el-form-item>
        <el-form-item label="所属部门" prop="department_id">
          <el-select v-model="positionForm.department_id" placeholder="请选择部门" style="width: 100%">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="职位描述">
          <el-input
            v-model="positionForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入职位描述"
          />
        </el-form-item>
        <el-form-item label="任职要求">
          <el-input
            v-model="positionForm.requirements"
            type="textarea"
            :rows="3"
            placeholder="请输入任职要求"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最低薪资">
              <el-input-number
                v-model="positionForm.salary_min"
                :min="0"
                placeholder="最低薪资"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最高薪资">
              <el-input-number
                v-model="positionForm.salary_max"
                :min="0"
                placeholder="最高薪资"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="招聘人数" prop="positions_count">
              <el-input-number
                v-model="positionForm.positions_count"
                :min="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="positionForm.status" style="width: 100%">
                <el-option label="招聘中" value="open" />
                <el-option label="已暂停" value="paused" />
                <el-option label="已关闭" value="closed" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发布日期">
              <el-date-picker
                v-model="positionForm.publish_date"
                type="date"
                placeholder="选择发布日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止日期">
              <el-date-picker
                v-model="positionForm.deadline"
                type="date"
                placeholder="选择截止日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="positionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePosition" :loading="saving">
          {{ isEditPosition ? '更新' : '发布' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 简历详情对话框 -->
    <el-dialog v-model="applicationDetailVisible" title="简历详情" width="900px" :close-on-click-modal="false">
      <div v-if="currentApplication" class="application-detail">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h3 class="section-title">
            <el-icon><User /></el-icon>
            基本信息
          </h3>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="姓名">
              <span class="detail-value">{{ currentApplication.name }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="性别">
              <el-tag :type="currentApplication.gender === '男' ? 'primary' : 'success'" size="small">
                {{ currentApplication.gender }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="年龄">
              {{ calculateAge(currentApplication.birth_date) }}岁
            </el-descriptions-item>
            <el-descriptions-item label="联系电话">
              <el-link :href="`tel:${currentApplication.phone}`" type="primary">
                {{ currentApplication.phone }}
              </el-link>
            </el-descriptions-item>
            <el-descriptions-item label="邮箱">
              <el-link :href="`mailto:${currentApplication.email}`" type="primary">
                {{ currentApplication.email }}
              </el-link>
            </el-descriptions-item>
            <el-descriptions-item label="学历">
              <el-tag type="info" size="small">{{ currentApplication.education }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 应聘信息 -->
        <div class="detail-section">
          <h3 class="section-title">
            <el-icon><Briefcase /></el-icon>
            应聘信息
          </h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="应聘职位">
              <span class="detail-value">{{ currentApplication.position_title }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="getApplicationStatusType(currentApplication.status)">
                {{ getApplicationStatusText(currentApplication.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="申请时间">
              {{ currentApplication.created_at }}
            </el-descriptions-item>
            <el-descriptions-item label="期望薪资">
              {{ currentApplication.expected_salary ? `${currentApplication.expected_salary}元` : '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 个人简介 -->
        <div class="detail-section" v-if="currentApplication.work_experience">
          <h3 class="section-title">
            <el-icon><Document /></el-icon>
            工作经验
          </h3>
          <div class="detail-content">
            {{ currentApplication.work_experience }}
          </div>
        </div>

        <!-- 面试信息 -->
        <div class="detail-section" v-if="currentApplication.interview_date || currentApplication.interview_notes">
          <h3 class="section-title">
            <el-icon><Clock /></el-icon>
            面试信息
          </h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="面试时间" v-if="currentApplication.interview_date">
              <el-tag type="warning">{{ currentApplication.interview_date }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="面试备注" v-if="currentApplication.interview_notes">
              <div class="detail-content">{{ currentApplication.interview_notes }}</div>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 操作按钮 -->
        <div class="detail-actions" v-if="currentApplication.status !== 'hired' && currentApplication.status !== 'rejected'">
          <el-button
            v-if="currentApplication.status === 'pending'"
            type="success"
            @click="updateApplicationStatus(currentApplication, 'scheduled')"
          >
            <el-icon><Select /></el-icon>
            安排面试
          </el-button>
          <el-button
            v-if="currentApplication.status === 'scheduled'"
            type="warning"
            @click="updateApplicationStatus(currentApplication, 'interviewed')"
          >
            <el-icon><Clock /></el-icon>
            标记已面试
          </el-button>
          <el-button
            v-if="['scheduled', 'interviewed'].includes(currentApplication.status)"
            type="primary"
            @click="updateApplicationStatus(currentApplication, 'hired')"
          >
            <el-icon><Check /></el-icon>
            录用
          </el-button>
          <el-button
            type="danger"
            @click="updateApplicationStatus(currentApplication, 'rejected')"
          >
            <el-icon><Close /></el-icon>
            拒绝
          </el-button>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="applicationDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Download, Briefcase, User, Clock, Select, Search, Refresh, Document, Check, Close
} from '@element-plus/icons-vue'
import { hrAPI,systemAPI } from '@/utils/api.js'
import { 
  getFilterSelectProps, 
  createFilterOptions, 
  commonFilterOptions,
  createValidationRules,
  formDataUtils
} from '@/utils/formUtils'

export default {
  name: 'RecruitmentManagement',
  components: {
    Plus, Download, Briefcase, User, Clock, Select, Search, Refresh, Document, Check, Close
  },
  setup() {
    // 响应式数据
    const activeTab = ref('positions')
    const stats = ref({})
    const departments = ref([])
    
    // 职位相关
    const positions = ref([])
    const positionsLoading = ref(false)
    const positionPage = ref(1)
    const positionLimit = ref(10)
    const positionTotal = ref(0)
    const positionSearchForm = reactive({
      search: '',
      department_id: '',
      status: ''
    })
    
    // 应聘相关
    const applications = ref([])
    const applicationsLoading = ref(false)
    const applicationPage = ref(1)
    const applicationLimit = ref(10)
    const applicationTotal = ref(0)
    const applicationSearchForm = reactive({
      search: '',
      position_id: '',
      status: ''
    })
    
    // 职位表单
    const positionDialogVisible = ref(false)
    const isEditPosition = ref(false)
    const saving = ref(false)
    const positionFormRef = ref(null)
    const positionForm = reactive({
      title: '',
      department_id: '',
      description: '',
      requirements: '',
      salary_min: null,
      salary_max: null,
      positions_count: 1,
      status: 'open',
      publish_date: '',
      deadline: ''
    })
    const positionRules = {
      title: [
        { required: true, message: '请输入职位名称', trigger: 'blur' },
        { max: 100, message: '职位名称长度不能超过100个字符', trigger: 'blur' }
      ],
      positions_count: [
        { required: true, message: '请输入招聘人数', trigger: 'blur' },
        { type: 'number', min: 1, message: '招聘人数必须大于0', trigger: 'blur' }
      ],
      salary_min: [
        { type: 'number', min: 0, message: '最低薪资不能为负数', trigger: 'blur' }
      ],
      salary_max: [
        { type: 'number', min: 0, message: '最高薪资不能为负数', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value && positionForm.salary_min && value < positionForm.salary_min) {
              callback(new Error('最高薪资不能小于最低薪资'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
    }
    
    // 简历详情
    const applicationDetailVisible = ref(false)
    const currentApplication = ref(null)
    
    // 加载统计信息
    const loadStats = async () => {
      try {
        const response = await hrAPI.getRecruitmentStats()
        if (response.status === 'success') {
          stats.value = response.data
        }
      } catch (error) {
        console.error('加载统计信息失败:', error)
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
    
    // 加载职位列表
    const loadPositions = async () => {
      positionsLoading.value = true
      try {
        const params = {
          page: positionPage.value,
          limit: positionLimit.value,
          ...positionSearchForm
        }
        // 清理空值
        Object.keys(params).forEach(key => {
          if (params[key] === '' || params[key] == null) {
            delete params[key]
          }
        })
        
        const response = await hrAPI.getJobPositions(params)
        if (response.status === 'success') {
          positions.value = response.data.items
          positionTotal.value = response.data.total
        }
      } catch (error) {
        console.error('加载职位列表失败:', error)
        ElMessage.error('加载职位列表失败')
      }
      positionsLoading.value = false
    }
    
    // 加载应聘列表
    const loadApplications = async () => {
      applicationsLoading.value = true
      try {
        const params = {
          page: applicationPage.value,
          limit: applicationLimit.value,
          ...applicationSearchForm
        }
        // 清理空值
        Object.keys(params).forEach(key => {
          if (params[key] === '' || params[key] == null) {
            delete params[key]
          }
        })
        
        const response = await hrAPI.getJobApplications(params)
        if (response.status === 'success') {
          applications.value = response.data.items
          applicationTotal.value = response.data.total
        }
      } catch (error) {
        console.error('加载应聘列表失败:', error)
        ElMessage.error('加载应聘列表失败')
      }
      applicationsLoading.value = false
    }
    
    // 重置职位搜索
    const resetPositionSearch = () => {
      Object.keys(positionSearchForm).forEach(key => {
        positionSearchForm[key] = ''
      })
      positionPage.value = 1
      loadPositions()
    }
    
    // 重置应聘搜索
    const resetApplicationSearch = () => {
      Object.keys(applicationSearchForm).forEach(key => {
        applicationSearchForm[key] = ''
      })
      applicationPage.value = 1
      loadApplications()
    }
    
    // 显示创建职位对话框
    const showCreatePositionDialog = () => {
      isEditPosition.value = false
      resetPositionForm()
      positionDialogVisible.value = true
    }
    
    // 重置职位表单
    const resetPositionForm = () => {
      Object.keys(positionForm).forEach(key => {
        if (key === 'positions_count') {
          positionForm[key] = 1
        } else if (key === 'status') {
          positionForm[key] = 'open'
        } else {
          positionForm[key] = ''
        }
      })
      if (positionFormRef.value) {
        positionFormRef.value.clearValidate()
      }
    }
    
    // 保存职位
    const savePosition = async () => {
      try {
        await positionFormRef.value.validate()
        saving.value = true
        
        const formData = { ...positionForm }
        // 处理日期格式
        if (formData.publish_date) {
          formData.publish_date = new Date(formData.publish_date).toISOString().split('T')[0]
        }
        if (formData.deadline) {
          formData.deadline = new Date(formData.deadline).toISOString().split('T')[0]
        }
        
        // 创建时过滤掉 id 字段
        if (!isEditPosition.value) {
          delete formData.id
        }
        
        let response
        if (isEditPosition.value) {
          response = await hrAPI.updateJobPosition(positionForm.id, formData)
        } else {
          response = await hrAPI.createJobPosition(formData)
        }
        
        if (response.status === 'success') {
          ElMessage.success(response.message)
          positionDialogVisible.value = false
          loadPositions()
          loadStats()
        }
      } catch (error) {
        console.error('保存职位失败:', error)
        ElMessage.error('保存职位失败')
      }
      saving.value = false
    }
    
    // 查看职位详情
    const viewPosition = async (row) => {
      try {
        const response = await hrAPI.getJobPosition(row.id)
        if (response.status === 'success') {
          const position = response.data
          ElMessageBox.alert(`
            <div>
              <p><strong>职位名称:</strong> ${position.title}</p>
              <p><strong>所属部门:</strong> ${position.department_name || '-'}</p>
              <p><strong>招聘人数:</strong> ${position.positions_count}</p>
              <p><strong>薪资范围:</strong> ${position.salary_min ? position.salary_min + '-' + position.salary_max : '-'}</p>
              <p><strong>状态:</strong> ${getPositionStatusText(position.status)}</p>
              <p><strong>发布日期:</strong> ${position.publish_date || '-'}</p>
              <p><strong>截止日期:</strong> ${position.deadline || '-'}</p>
              <p><strong>职位描述:</strong></p>
              <p>${position.description || '-'}</p>
              <p><strong>任职要求:</strong></p>
              <p>${position.requirements || '-'}</p>
            </div>
          `, '职位详情', {
            dangerouslyUseHTMLString: true,
            customClass: 'position-detail-dialog'
          })
        }
      } catch (error) {
        console.error('查看职位详情失败:', error)
        ElMessage.error('查看职位详情失败')
      }
    }
    
    // 编辑职位
    const editPosition = async (row) => {
      try {
        const response = await hrAPI.getJobPosition(row.id)
        if (response.status === 'success') {
          const position = response.data
          Object.keys(positionForm).forEach(key => {
            if (position.hasOwnProperty(key)) {
              positionForm[key] = position[key]
            }
          })
          positionForm.id = position.id
          isEditPosition.value = true
          positionDialogVisible.value = true
        }
      } catch (error) {
        console.error('加载职位详情失败:', error)
        ElMessage.error('加载职位详情失败')
      }
    }
    
    // 查看职位的应聘申请
    const viewPositionApplications = (row) => {
      applicationSearchForm.position_id = row.id
      activeTab.value = 'applications'
      loadApplications()
    }
    
    // 查看应聘详情
    const viewApplication = async (row) => {
      try {
        const response = await hrAPI.getJobApplication(row.id)
        if (response.status === 'success') {
          currentApplication.value = response.data
          applicationDetailVisible.value = true
        }
      } catch (error) {
        console.error('查看应聘详情失败:', error)
        ElMessage.error('查看应聘详情失败')
      }
    }
    
    // 更新应聘状态
    const updateApplicationStatus = async (row, status) => {
      try {
        let confirmMessage = ''
        let interviewDate = null
        let notes = ''
        
        switch (status) {
          case 'scheduled':
            confirmMessage = '确定安排面试吗？'
            // 可以在这里弹出日期选择器
            interviewDate = new Date().toISOString()
            break
          case 'interviewed':
            confirmMessage = '确定标记为已面试吗？'
            break
          case 'hired':
            confirmMessage = '确定录用该候选人吗？'
            break
          case 'rejected':
            confirmMessage = '确定拒绝该候选人吗？'
            break
        }
        
        await ElMessageBox.confirm(confirmMessage, '确认操作')
        
        const response = await hrAPI.updateJobApplication(row.id, {
          status,
          interview_date: interviewDate,
          interview_notes: notes
        })
        
        if (response.status === 'success') {
          ElMessage.success(response.message)
          loadApplications()
          loadStats()
          
          // 如果当前有打开的详情对话框，更新数据并关闭
          if (applicationDetailVisible.value && currentApplication.value?.id === row.id) {
            currentApplication.value.status = status
            if (status === 'hired' || status === 'rejected') {
              applicationDetailVisible.value = false
            }
          }
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('更新应聘状态失败:', error)
          ElMessage.error('更新应聘状态失败')
        }
      }
    }
    
    // 导出数据
    const exportData = () => {
      ElMessage.info('导出功能开发中...')
    }
    
    // 工具方法
    const getPositionStatusType = (status) => {
      const typeMap = {
        open: 'success',
        paused: 'warning',
        closed: 'info'
      }
      return typeMap[status] || ''
    }
    
    const getPositionStatusText = (status) => {
      const textMap = {
        open: '招聘中',
        paused: '已暂停',
        closed: '已关闭'
      }
      return textMap[status] || status
    }
    
    const getApplicationStatusType = (status) => {
      const typeMap = {
        pending: 'warning',
        scheduled: 'primary',
        interviewed: 'info',
        hired: 'success',
        rejected: 'danger'
      }
      return typeMap[status] || ''
    }
    
    const getApplicationStatusText = (status) => {
      const textMap = {
        pending: '待筛选',
        scheduled: '已安排面试',
        interviewed: '已面试',
        hired: '已录用',
        rejected: '已拒绝'
      }
      return textMap[status] || status
    }
    
    const calculateAge = (birthDate) => {
      if (!birthDate) return '-'
      const today = new Date()
      const birth = new Date(birthDate)
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return age
    }
    
    // 生命周期
    onMounted(() => {
      loadStats()
      loadDepartments()
      loadPositions()
      loadApplications()
    })
    
    return {
      // 响应式数据
      activeTab,
      stats,
      departments,
      positions,
      positionsLoading,
      positionPage,
      positionLimit,
      positionTotal,
      positionSearchForm,
      applications,
      applicationsLoading,
      applicationPage,
      applicationLimit,
      applicationTotal,
      applicationSearchForm,
      positionDialogVisible,
      isEditPosition,
      saving,
      positionFormRef,
      positionForm,
      positionRules,
      applicationDetailVisible,
      currentApplication,
      
      // 方法
      loadPositions,
      loadApplications,
      resetPositionSearch,
      resetApplicationSearch,
      showCreatePositionDialog,
      savePosition,
      viewPosition,
      editPosition,
      viewPositionApplications,
      viewApplication,
      updateApplicationStatus,
      exportData,
      getPositionStatusType,
      getPositionStatusText,
      getApplicationStatusType,
      getApplicationStatusText,
      calculateAge
    }
  }
}
</script>

<style scoped>
.recruitment-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-title h2 {
  margin: 0 0 5px 0;
  color: #303133;
  font-size: 24px;
}

.header-title p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* 简历详情对话框样式 */
.application-detail {
  .detail-section {
    margin-bottom: 24px;
  }
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 16px 0;
    color: #303133;
    font-size: 16px;
    font-weight: 600;
    border-bottom: 2px solid #409EFF;
    padding-bottom: 8px;
  }
  
  .detail-value {
    font-weight: 600;
    color: #303133;
  }
  
  .detail-content {
    background: #f5f7fa;
    padding: 12px;
    border-radius: 6px;
    line-height: 1.6;
    color: #606266;
  }
  
  .detail-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    padding: 20px 0 0 0;
    border-top: 1px solid #ebeef5;
    margin-top: 20px;
  }
  
  .detail-actions .el-button {
    min-width: 100px;
  }
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.positions {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.applications {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  color: #333;
}

.stat-icon.hired {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #333;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

:deep(.position-detail-dialog) {
  max-width: 600px;
}

:deep(.position-detail-dialog .el-message-box__message) {
  line-height: 1.6;
}

:deep(.position-detail-dialog .el-message-box__message p) {
  margin: 8px 0;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .header-actions {
    display: flex;
    gap: 10px;
  }
}
</style> 