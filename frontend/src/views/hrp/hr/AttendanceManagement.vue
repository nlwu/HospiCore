<template>
  <div class="attendance-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-title">
          <el-icon size="24" color="#409EFF"><Clock /></el-icon>
          <div class="title-content">
            <h2>考勤排班管理</h2>
            <p>管理员工考勤记录、排班安排和统计分析</p>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" icon="Plus" @click="showPunchDialog" size="large">
          手动打卡
        </el-button>
        <el-button type="success" icon="Calendar" @click="showScheduleDialog" size="large">
          安排排班
        </el-button>
      </div>
    </div>

    <!-- 今日考勤卡片 -->
    <div class="today-stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card punch-in">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="28"><Timer /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ todayStats.punchIn || '未打卡' }}</div>
                <div class="stat-label">今日上班打卡</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card punch-out">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="28"><CircleClose /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ todayStats.punchOut || '未打卡' }}</div>
                <div class="stat-label">今日下班打卡</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card work-hours">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="28"><Stopwatch /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ todayStats.workHours || '0' }}h</div>
                <div class="stat-label">今日工作时长</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card attendance-rate">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="28"><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ todayStats.attendanceRate || '0' }}%</div>
                <div class="stat-label">本月出勤率</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 功能标签页 -->
    <el-card class="main-card" shadow="hover">
      <el-tabs v-model="activeTab" type="card">
        <!-- 考勤记录 -->
        <el-tab-pane label="考勤记录" name="records">
          <div class="records-section">
            <!-- 搜索筛选 -->
            <el-form :model="recordSearchForm" inline class="search-form">
              <el-form-item label="员工姓名">
                <el-input
                  v-model="recordSearchForm.employee_name"
                  placeholder="请输入员工姓名"
                  prefix-icon="User"
                  clearable
                  style="width: 200px"
                />
              </el-form-item>
              <el-form-item label="日期范围">
                <el-date-picker
                  v-model="recordSearchForm.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="searchRecords" icon="Search">
                  搜索
                </el-button>
                <el-button @click="resetRecordSearch" icon="Refresh">
                  重置
                </el-button>
              </el-form-item>
            </el-form>

            <!-- 考勤记录表格 -->
            <el-table
              :data="attendanceRecords"
              v-loading="recordsLoading"
              stripe
              border
              height="400"
            >
              <el-table-column type="index" label="序号" width="60" align="center" />
              <el-table-column prop="employee_name" label="员工姓名" width="120" />
              <el-table-column prop="date" label="日期" width="120" />
              <el-table-column prop="punch_in_time" label="上班打卡" width="120" />
              <el-table-column prop="punch_out_time" label="下班打卡" width="120" />
              <el-table-column prop="work_hours" label="工作时长" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.work_hours >= 8 ? 'success' : 'warning'">
                    {{ row.work_hours }}h
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag
                    :type="row.status === '正常' ? 'success' : 
                           row.status === '迟到' ? 'warning' : 'danger'"
                  >
                    {{ row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="notes" label="备注" />
            </el-table>

            <!-- 分页 -->
            <div class="pagination-wrapper">
              <el-pagination
                v-model:current-page="recordsPagination.page"
                v-model:page-size="recordsPagination.limit"
                :page-sizes="[10, 20, 50]"
                :total="recordsPagination.total"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleRecordsPageChange"
                @current-change="handleRecordsPageChange"
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- 排班管理 -->
        <el-tab-pane label="排班管理" name="schedules">
          <div class="schedules-section">
            <!-- 排班日历 -->
            <el-calendar v-model="selectedDate">
              <template #date-cell="{ data }">
                <div class="calendar-cell">
                  <div class="date">{{ data.day.split('-').pop() }}</div>
                  <div class="schedule-info">
                    <div 
                      v-for="schedule in getScheduleByDate(data.day)" 
                      :key="schedule.id"
                      class="schedule-item"
                      :class="schedule.shift_type"
                    >
                      <span class="employee-name">{{ schedule.employee_name }}</span>
                      <span class="shift-time">{{ schedule.shift_type }}</span>
                    </div>
                  </div>
                </div>
              </template>
            </el-calendar>
          </div>
        </el-tab-pane>

        <!-- 统计分析 -->
        <el-tab-pane label="统计分析" name="statistics">
          <div class="statistics-section">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card title="部门出勤率统计" shadow="hover">
                  <div ref="departmentChart" style="height: 300px;"></div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card title="月度考勤趋势" shadow="hover">
                  <div ref="trendChart" style="height: 300px;"></div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 手动打卡弹窗 -->
    <el-dialog
      v-model="punchDialogVisible"
      title="手动打卡"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="punchFormRef"
        :model="punchForm"
        :rules="punchRules"
        label-width="100px"
      >
        <el-form-item label="员工" prop="employee_id">
          <el-select
            v-model="punchForm.employee_id"
            placeholder="请选择员工"
            style="width: 100%"
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
        <el-form-item label="打卡类型" prop="punch_type">
          <el-radio-group v-model="punchForm.punch_type">
            <el-radio label="in">上班打卡</el-radio>
            <el-radio label="out">下班打卡</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="打卡时间" prop="punch_time">
          <el-date-picker
            v-model="punchForm.punch_time"
            type="datetime"
            placeholder="选择打卡时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="punchForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="punchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPunch" :loading="punchLoading">
          确定打卡
        </el-button>
      </template>
    </el-dialog>

    <!-- 排班安排弹窗 -->
    <el-dialog
      v-model="scheduleDialogVisible"
      title="安排排班"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="scheduleFormRef"
        :model="scheduleForm"
        :rules="scheduleRules"
        label-width="100px"
      >
        <el-form-item label="员工" prop="employee_id">
          <el-select
            v-model="scheduleForm.employee_id"
            placeholder="请选择员工"
            style="width: 100%"
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
        <el-form-item label="排班日期" prop="work_date">
          <el-date-picker
            v-model="scheduleForm.work_date"
            type="date"
            placeholder="选择排班日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="班次类型" prop="shift_type">
          <el-select
            v-model="scheduleForm.shift_type"
            placeholder="请选择班次"
            style="width: 100%"
          >
            <el-option label="白班 (08:00-18:00)" value="白班" />
            <el-option label="夜班 (18:00-08:00)" value="夜班" />
            <el-option label="值班 (24小时)" value="值班" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="scheduleForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="scheduleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSchedule" :loading="scheduleLoading">
          确定安排
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { hrAPI } from '../../../utils/api.js'
import { 
  Clock, Plus, Calendar, Timer, CircleClose, Stopwatch, 
  TrendCharts, User, Search, Refresh 
} from '@element-plus/icons-vue'

export default {
  name: 'AttendanceManagement',
  components: {
    Clock, Plus, Calendar, Timer, CircleClose, Stopwatch,
    TrendCharts, User, Search, Refresh
  },
  setup() {
    // 响应式数据
    const activeTab = ref('records')
    const recordsLoading = ref(false)
    const punchLoading = ref(false)
    const scheduleLoading = ref(false)
    
    const todayStats = ref({})
    const attendanceRecords = ref([])
    const schedules = ref([])
    const employees = ref([])
    
    // 弹窗控制
    const punchDialogVisible = ref(false)
    const scheduleDialogVisible = ref(false)
    const selectedDate = ref(new Date())
    
    // 表单引用
    const punchFormRef = ref()
    const scheduleFormRef = ref()

    // 搜索表单
    const recordSearchForm = reactive({
      employee_name: '',
      dateRange: []
    })

    // 分页
    const recordsPagination = reactive({
      page: 1,
      limit: 20,
      total: 0
    })

    // 打卡表单
    const punchForm = reactive({
      employee_id: '',
      punch_type: 'in',
      punch_time: '',
      notes: ''
    })

    // 排班表单
    const scheduleForm = reactive({
      employee_id: '',
      work_date: '',
      shift_type: '',
      notes: ''
    })

    // 表单验证规则
    const punchRules = {
      employee_id: [{ required: true, message: '请选择员工', trigger: 'change' }],
      punch_type: [{ required: true, message: '请选择打卡类型', trigger: 'change' }],
      punch_time: [{ required: true, message: '请选择打卡时间', trigger: 'change' }]
    }

    const scheduleRules = {
      employee_id: [{ required: true, message: '请选择员工', trigger: 'change' }],
      work_date: [{ required: true, message: '请选择排班日期', trigger: 'change' }],
      shift_type: [{ required: true, message: '请选择班次类型', trigger: 'change' }]
    }

    // 获取今日统计
    const loadTodayStats = async () => {
      try {
        const response = await hrAPI.attendance.getStats({ 
          date: new Date().toISOString().split('T')[0] 
        })
        if (response.status === 'success') {
          todayStats.value = response.data
        }
      } catch (error) {
        console.error('获取今日统计失败:', error)
      }
    }

    // 获取考勤记录
    const loadAttendanceRecords = async () => {
      try {
        recordsLoading.value = true
        const params = {
          page: recordsPagination.page,
          limit: recordsPagination.limit,
          ...recordSearchForm
        }
        
        if (recordSearchForm.dateRange && recordSearchForm.dateRange.length === 2) {
          params.start_date = recordSearchForm.dateRange[0]
          params.end_date = recordSearchForm.dateRange[1]
          delete params.dateRange
        }

        const response = await hrAPI.attendance.records.getList(params)
        if (response.status === 'success') {
          attendanceRecords.value = response.data.records
          recordsPagination.total = response.data.total
        }
      } catch (error) {
        console.error('获取考勤记录失败:', error)
        ElMessage.error('获取考勤记录失败')
      } finally {
        recordsLoading.value = false
      }
    }

    // 获取排班信息
    const loadSchedules = async () => {
      try {
        const response = await hrAPI.attendance.schedules.getList()
        if (response.status === 'success') {
          schedules.value = response.data.schedules
        }
      } catch (error) {
        console.error('获取排班信息失败:', error)
      }
    }

    // 获取员工列表
    const loadEmployees = async () => {
      try {
        const response = await hrAPI.employees.getList({ limit: 1000 })
        if (response.status === 'success') {
          employees.value = response.data.employees
        }
      } catch (error) {
        console.error('获取员工列表失败:', error)
      }
    }

    // 搜索考勤记录
    const searchRecords = () => {
      recordsPagination.page = 1
      loadAttendanceRecords()
    }

    // 重置搜索
    const resetRecordSearch = () => {
      recordSearchForm.employee_name = ''
      recordSearchForm.dateRange = []
      searchRecords()
    }

    // 分页处理
    const handleRecordsPageChange = () => {
      loadAttendanceRecords()
    }

    // 根据日期获取排班
    const getScheduleByDate = (date) => {
      return schedules.value.filter(schedule => schedule.work_date === date)
    }

    // 显示打卡弹窗
    const showPunchDialog = () => {
      punchForm.punch_time = new Date().toISOString().slice(0, 19).replace('T', ' ')
      punchDialogVisible.value = true
    }

    // 显示排班弹窗
    const showScheduleDialog = () => {
      scheduleDialogVisible.value = true
    }

    // 提交打卡
    const submitPunch = async () => {
      try {
        await punchFormRef.value.validate()
        punchLoading.value = true
        
        const response = punchForm.punch_type === 'in' 
          ? await hrAPI.attendance.records.punchIn(punchForm)
          : await hrAPI.attendance.records.punchOut(punchForm)
        
        if (response.status === 'success') {
          ElMessage.success('打卡成功')
          punchDialogVisible.value = false
          loadAttendanceRecords()
          loadTodayStats()
        }
      } catch (error) {
        console.error('打卡失败:', error)
        ElMessage.error('打卡失败，请重试')
      } finally {
        punchLoading.value = false
      }
    }

    // 提交排班
    const submitSchedule = async () => {
      try {
        await scheduleFormRef.value.validate()
        scheduleLoading.value = true
        
        const response = await hrAPI.attendance.schedules.create(scheduleForm)
        if (response.status === 'success') {
          ElMessage.success('排班安排成功')
          scheduleDialogVisible.value = false
          loadSchedules()
        }
      } catch (error) {
        console.error('排班失败:', error)
        ElMessage.error('排班失败，请重试')
      } finally {
        scheduleLoading.value = false
      }
    }

    // 生命周期
    onMounted(() => {
      loadTodayStats()
      loadAttendanceRecords()
      loadSchedules()
      loadEmployees()
    })

    return {
      // 响应式数据
      activeTab,
      recordsLoading,
      punchLoading,
      scheduleLoading,
      todayStats,
      attendanceRecords,
      schedules,
      employees,
      
      // 弹窗控制
      punchDialogVisible,
      scheduleDialogVisible,
      selectedDate,
      
      // 表单引用
      punchFormRef,
      scheduleFormRef,
      
      // 搜索和分页
      recordSearchForm,
      recordsPagination,
      
      // 表单
      punchForm,
      scheduleForm,
      punchRules,
      scheduleRules,
      
      // 方法
      loadTodayStats,
      loadAttendanceRecords,
      loadSchedules,
      loadEmployees,
      searchRecords,
      resetRecordSearch,
      handleRecordsPageChange,
      getScheduleByDate,
      showPunchDialog,
      showScheduleDialog,
      submitPunch,
      submitSchedule
    }
  }
}
</script>

<style scoped>
.attendance-management {
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

/* 今日统计卡片 */
.today-stats {
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

.punch-in .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.punch-out .stat-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.work-hours .stat-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.attendance-rate .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

/* 主要卡片 */
.main-card {
  border-radius: 8px;
}

/* 搜索表单 */
.search-form {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.search-form .el-form-item {
  margin-bottom: 0;
}

/* 分页样式 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 日历样式 */
.calendar-cell {
  min-height: 80px;
  padding: 4px;
}

.calendar-cell .date {
  font-weight: bold;
  margin-bottom: 4px;
}

.schedule-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.schedule-item {
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 3px;
  color: white;
  display: flex;
  justify-content: space-between;
}

.schedule-item.白班 {
  background: #409EFF;
}

.schedule-item.夜班 {
  background: #E6A23C;
}

.schedule-item.值班 {
  background: #F56C6C;
}

.employee-name {
  font-weight: 500;
}

.shift-time {
  font-size: 10px;
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
    margin-bottom: 16px;
    margin-right: 0;
  }
}
</style> 