// 统一数据管理
export class DataManager {
  constructor() {
    this.initData()
  }

  initData() {
    // 用户数据
    const users = [
      {
        id: 1,
        username: 'admin',
        name: '系统管理员',
        role: 'admin',
        department: '信息科',
        phone: '13800138001',
        status: 'normal',
        lastLogin: '2024-01-15 09:30:00'
      },
      {
        id: 2,
        username: 'hr001',
        name: '张人事',
        role: 'hr',
        department: '人事部',
        phone: '13800138002',
        status: 'normal',
        lastLogin: '2024-01-15 08:45:00'
      },
      {
        id: 3,
        username: 'doc001',
        name: '李医生',
        role: 'director',
        department: '内科',
        phone: '13800138003',
        status: 'normal',
        lastLogin: '2024-01-14 16:20:00'
      },
      {
        id: 4,
        username: 'nurse001',
        name: '王护士',
        role: 'user',
        department: '护理部',
        phone: '13800138004',
        status: 'locked',
        lastLogin: '2024-01-10 14:15:00'
      }
    ]

    // 角色数据
    const roles = [
      {
        id: 1,
        name: '超级管理员',
        description: '系统所有权限',
        userCount: 1,
        permissions: ['user:read', 'user:write', 'role:read', 'role:write', 'system:all'],
        status: 'active',
        createTime: '2024-01-01 00:00:00'
      },
      {
        id: 2,
        name: 'HR管理员',
        description: '人事管理权限',
        userCount: 1,
        permissions: ['user:read', 'user:write', 'hr:all'],
        status: 'active',
        createTime: '2024-01-01 00:00:00'
      },
      {
        id: 3,
        name: '科室主任',
        description: '科室管理权限',
        userCount: 1,
        permissions: ['user:read', 'department:read', 'approval:all'],
        status: 'active',
        createTime: '2024-01-01 00:00:00'
      },
      {
        id: 4,
        name: '普通用户',
        description: '基础使用权限',
        userCount: 1,
        permissions: ['user:read', 'todo:read'],
        status: 'active',
        createTime: '2024-01-01 00:00:00'
      }
    ]

    // 待办事项数据
    const todoList = [
      {
        id: 1,
        type: 'leave',
        title: '年假申请',
        description: '申请年假5天，用于家庭旅游',
        priority: '高',
        duration: '5天',
        source: '人力资源部',
        createTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        applicant: {
          name: '张三',
          department: '内科',
          avatar: ''
        },
        processing: false,
        isUrgent: true,
        isOverdue: false
      },
      {
        id: 2,
        type: 'purchase',
        title: '医疗设备采购申请',
        description: '申请采购心电监护仪2台',
        priority: '中',
        amount: 150000,
        source: '设备科',
        createTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        applicant: {
          name: '李四',
          department: '设备科',
          avatar: ''
        },
        processing: false,
        isUrgent: false,
        isOverdue: false
      },
      {
        id: 3,
        type: 'reimburse',
        title: '差旅费报销申请',
        description: '参加学术会议差旅费报销',
        priority: '低',
        amount: 3500,
        source: '财务部',
        createTime: new Date(Date.now() - 8 * 60 * 60 * 1000),
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 已过期
        applicant: {
          name: '王五',
          department: '外科',
          avatar: ''
        },
        processing: false,
        isUrgent: false,
        isOverdue: true
      },
      {
        id: 4,
        type: 'training',
        title: '外出培训申请',
        description: '申请参加护理技能培训班',
        priority: '中',
        duration: '3天',
        source: '人力资源部',
        createTime: new Date(Date.now() - 12 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        applicant: {
          name: '赵六',
          department: '护理部',
          avatar: ''
        },
        processing: false,
        isUrgent: false,
        isOverdue: false
      },
      {
        id: 5,
        type: 'leave',
        title: '事假申请',
        description: '家中有事需要请假',
        priority: '高',
        duration: '1天',
        source: '人力资源部',
        createTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 今日新增
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        applicant: {
          name: '孙七',
          department: '药剂科',
          avatar: ''
        },
        processing: false,
        isUrgent: true,
        isOverdue: false
      },
      {
        id: 6,
        type: 'purchase',
        title: '办公用品采购',
        description: '申请采购打印机耗材',
        priority: '低',
        amount: 2000,
        createTime: new Date(Date.now() - 30 * 60 * 1000), // 今日新增
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        applicant: {
          name: '周八',
          department: '行政部',
          avatar: ''
        },
        processing: false,
        isUrgent: false,
        isOverdue: false
      },
      {
        id: 7,
        type: 'reimburse',
        title: '培训费用报销',
        description: '参加医学会议培训费用报销',
        priority: '中',
        amount: 5800,
        createTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        applicant: {
          name: '吴九',
          department: '心内科',
          avatar: ''
        },
        processing: false,
        isUrgent: false,
        isOverdue: false
      },
      {
        id: 8,
        type: 'leave',
        title: '病假申请',
        description: '因感冒需要请病假2天',
        priority: '高',
        duration: '2天',
        createTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        applicant: {
          name: '郑十',
          department: '儿科',
          avatar: ''
        },
        processing: false,
        isUrgent: true,
        isOverdue: false
      },
      {
        id: 9,
        type: 'training',
        title: '学术会议申请',
        description: '申请参加全国医学学术会议',
        priority: '中',
        duration: '5天',
        createTime: new Date(Date.now() - 10 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        applicant: {
          name: '钱十一',
          department: '外科',
          avatar: ''
        },
        processing: false,
        isUrgent: false,
        isOverdue: false
      },
      {
        id: 10,
        type: 'purchase',
        title: '药品采购申请',
        description: '申请采购常用药品补充库存',
        priority: '高',
        amount: 80000,
        createTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        applicant: {
          name: '孙十二',
          department: '药剂科',
          avatar: ''
        },
        processing: false,
        isUrgent: true,
        isOverdue: false
      },
      {
        id: 11,
        type: 'reimburse',
        title: '设备维修费报销',
        description: '医疗设备维修费用报销申请',
        priority: '低',
        amount: 1200,
        createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2天前
        deadline: new Date(Date.now() - 6 * 60 * 60 * 1000), // 已过期
        applicant: {
          name: '李十三',
          department: '设备科',
          avatar: ''
        },
        processing: false,
        isUrgent: false,
        isOverdue: true
      },
      {
        id: 12,
        type: 'leave',
        title: '调休申请',
        description: '申请调休半天处理个人事务',
        priority: '低',
        duration: '0.5天',
        createTime: new Date(Date.now() - 45 * 60 * 1000), // 今日新增
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        applicant: {
          name: '周十四',
          department: '护理部',
          avatar: ''
        },
        processing: false,
        isUrgent: false,
        isOverdue: false
      }
    ]

    // 已办事项数据
    const completedList = [
      {
        id: 101,
        type: 'leave',
        title: '病假申请',
        description: '因病需要请假3天',
        result: 'approved',
        comment: '同意请假，注意休息',
        processTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        applicant: {
          name: '刘七',
          department: '内科',
          avatar: ''
        }
      },
      {
        id: 102,
        type: 'purchase',
        title: '办公用品采购',
        description: '采购办公桌椅10套',
        result: 'rejected',
        comment: '预算不足，暂缓采购',
        processTime: new Date(Date.now() - 48 * 60 * 60 * 1000),
        applicant: {
          name: '孙八',
          department: '行政部',
          avatar: ''
        }
      }
    ]

    // 我发起的流程
    const myProcessList = [
      {
        id: 1,
        type: 'leave',
        title: '年假申请',
        description: '申请年假5天，用于家庭旅游',
        status: 'pending',
        currentHandler: '张主任',
        currentStep: 1,
        createTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        steps: [
          { title: '发起申请', handler: '本人' },
          { title: '科室主任审批', handler: '张主任' },
          { title: 'HR审批', handler: '人事部' },
          { title: '完成', handler: '' }
        ]
      },
      {
        id: 2,
        type: 'purchase',
        title: '医疗设备采购申请',
        description: '申请采购心电监护仪2台',
        status: 'approved',
        currentHandler: null,
        currentStep: 3,
        amount: 150000,
        createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        steps: [
          { title: '发起申请', handler: '本人' },
          { title: '科室审批', handler: '李主任' },
          { title: '财务审批', handler: '财务部' },
          { title: '完成', handler: '' }
        ]
      }
    ]

    // 我已处理的流程
    const myProcessedList = [
      {
        id: 4,
        type: 'leave',
        title: '病假申请',
        description: '因感冒申请病假2天',
        myAction: '同意',
        myComment: '同意请假，注意休息',
        processTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        applicant: {
          name: '李四',
          department: '护理部',
          avatar: ''
        }
      }
    ]

    // 存储到sessionStorage
    const data = {
      users,
      roles,
      todoList,
      completedList,
      myProcessList,
      myProcessedList,
      // HRP系统数据
      employees: this.generateEmployees(),
      departments: this.generateDepartments(),
      positions: this.generatePositions(),
      recruitment: this.generateRecruitment(),
      attendance: this.generateAttendance(),
      schedules: this.generateSchedules(),
      leaveTypes: this.generateLeaveTypes(),
      leaveApplications: this.generateLeaveApplications(),
      performanceSchemes: this.generatePerformanceSchemes(),
      performanceEvaluations: this.generatePerformanceEvaluations(),
      salaryStructures: this.generateSalaryStructures(),
      payrolls: this.generatePayrolls(),
      budgets: this.generateBudgets(),
      expenses: this.generateExpenses(),
      assets: this.generateAssets(),
      assetCategories: this.generateAssetCategories(),
      suppliers: this.generateSuppliers(),
      // 统计数据
      stats: {
        todo: {
          total: todoList.length,
          urgent: todoList.filter(item => item.isUrgent).length,
          today: todoList.filter(item => {
            const today = new Date()
            const createDate = new Date(item.createTime)
            return createDate.toDateString() === today.toDateString()
          }).length,
          overdue: todoList.filter(item => item.isOverdue).length
        }
      }
    }

    sessionStorage.setItem('mockData', JSON.stringify(data))
  }

  // 生成部门数据
  generateDepartments() {
    return [
      { id: 1, name: '内科', parentId: null, code: 'NK', level: 1, sort: 1, 
        manager: '李主任', phone: '0123-1001', address: '1号楼3层', 
        status: 'active', createTime: '2024-01-01' },
      { id: 2, name: '外科', parentId: null, code: 'WK', level: 1, sort: 2, 
        manager: '王主任', phone: '0123-1002', address: '2号楼2层', 
        status: 'active', createTime: '2024-01-01' },
      { id: 3, name: '妇产科', parentId: null, code: 'FCK', level: 1, sort: 3, 
        manager: '张主任', phone: '0123-1003', address: '3号楼4层', 
        status: 'active', createTime: '2024-01-01' },
      { id: 4, name: '儿科', parentId: null, code: 'EK', level: 1, sort: 4, 
        manager: '刘主任', phone: '0123-1004', address: '4号楼1层', 
        status: 'active', createTime: '2024-01-01' },
      { id: 5, name: '护理部', parentId: null, code: 'HLB', level: 1, sort: 5, 
        manager: '护士长', phone: '0123-1005', address: '1号楼1层', 
        status: 'active', createTime: '2024-01-01' },
      { id: 6, name: '人事部', parentId: null, code: 'RSB', level: 1, sort: 6, 
        manager: '人事经理', phone: '0123-1006', address: '行政楼2层', 
        status: 'active', createTime: '2024-01-01' },
      { id: 7, name: '财务部', parentId: null, code: 'CWB', level: 1, sort: 7, 
        manager: '财务经理', phone: '0123-1007', address: '行政楼3层', 
        status: 'active', createTime: '2024-01-01' },
      { id: 8, name: '信息科', parentId: null, code: 'XXK', level: 1, sort: 8, 
        manager: '信息主管', phone: '0123-1008', address: '行政楼4层', 
        status: 'active', createTime: '2024-01-01' },
      { id: 9, name: '设备科', parentId: null, code: 'SBK', level: 1, sort: 9, 
        manager: '设备主管', phone: '0123-1009', address: '后勤楼1层', 
        status: 'active', createTime: '2024-01-01' },
      { id: 10, name: '药剂科', parentId: null, code: 'YJK', level: 1, sort: 10, 
        manager: '药剂主任', phone: '0123-1010', address: '1号楼负1层', 
        status: 'active', createTime: '2024-01-01' }
    ]
  }

  // 生成职位数据
  generatePositions() {
    return [
      { id: 1, name: '主任医师', level: 'senior', category: '医疗', 
        requirements: '医学博士，15年以上临床经验', 
        responsibilities: '负责科室医疗管理，疑难病例诊治' },
      { id: 2, name: '副主任医师', level: 'senior', category: '医疗', 
        requirements: '医学硕士，10年以上临床经验', 
        responsibilities: '协助科室管理，负责疑难病例' },
      { id: 3, name: '主治医师', level: 'middle', category: '医疗', 
        requirements: '医学学士，5年以上临床经验', 
        responsibilities: '负责病房管理，常见病诊治' },
      { id: 4, name: '住院医师', level: 'junior', category: '医疗', 
        requirements: '医学学士，1-3年临床经验', 
        responsibilities: '负责病人基础治疗，值班工作' },
      { id: 5, name: '护士长', level: 'senior', category: '护理', 
        requirements: '护理本科，10年以上护理经验', 
        responsibilities: '负责护理管理，质量控制' },
      { id: 6, name: '主管护师', level: 'middle', category: '护理', 
        requirements: '护理专科，5年以上护理经验', 
        responsibilities: '指导护理工作，带教实习生' },
      { id: 7, name: '护师', level: 'middle', category: '护理', 
        requirements: '护理专科，3年以上护理经验', 
        responsibilities: '执行护理计划，健康宣教' },
      { id: 8, name: '护士', level: 'junior', category: '护理', 
        requirements: '护理专科或中专', 
        responsibilities: '基础护理工作，协助医生治疗' }
    ]
  }

  // 生成员工档案数据
  generateEmployees() {
    return [
      {
        id: 1, employeeNo: 'HY2024001', name: '李明华', gender: '男',
        birthday: '1975-05-12', idCard: '320102197505120012',
        phone: '13800001001', email: 'liminghua@hospital.com',
        departmentId: 1, departmentName: '内科', positionId: 1, positionName: '主任医师',
        title: '主任医师', education: '博士', school: '北京医科大学',
        major: '内科学', graduationDate: '2000-07-01',
        hireDate: '2000-08-15', contractStart: '2024-01-01', contractEnd: '2026-12-31',
        employeeType: '正式员工', workStatus: '在职', maritalStatus: '已婚',
        address: '北京市朝阳区建国路88号', emergencyContact: '张女士',
        emergencyPhone: '13900001001', relationship: '配偶',
        avatar: '/avatars/male1.jpg', 
        certificates: ['执业医师证', '主任医师证书'],
        workExperience: '20年临床经验，专长心血管疾病诊治',
        createTime: '2024-01-01 09:00:00', updateTime: '2024-01-15 14:30:00'
      },
      {
        id: 2, employeeNo: 'HY2024002', name: '王小红', gender: '女',
        birthday: '1980-03-22', idCard: '110101198003220045',
        phone: '13800002002', email: 'wangxiaohong@hospital.com',
        departmentId: 5, departmentName: '护理部', positionId: 5, positionName: '护士长',
        title: '主管护师', education: '本科', school: '首都医科大学',
        major: '护理学', graduationDate: '2002-07-01',
        hireDate: '2002-09-01', contractStart: '2024-01-01', contractEnd: '2026-12-31',
        employeeType: '正式员工', workStatus: '在职', maritalStatus: '已婚',
        address: '北京市海淀区中关村大街100号', emergencyContact: '李先生',
        emergencyPhone: '13900002002', relationship: '配偶',
        avatar: '/avatars/female1.jpg',
        certificates: ['护士执业证', '主管护师证书'],
        workExperience: '22年护理管理经验，获得多项护理质量奖',
        createTime: '2024-01-01 09:00:00', updateTime: '2024-01-10 10:15:00'
      },
      {
        id: 3, employeeNo: 'HY2024003', name: '张伟强', gender: '男',
        birthday: '1985-07-18', idCard: '320106198507180089',
        phone: '13800003003', email: 'zhangweiqiang@hospital.com',
        departmentId: 2, departmentName: '外科', positionId: 3, positionName: '主治医师',
        title: '主治医师', education: '硕士', school: '南京医科大学',
        major: '外科学', graduationDate: '2010-07-01',
        hireDate: '2010-08-20', contractStart: '2024-01-01', contractEnd: '2026-12-31',
        employeeType: '正式员工', workStatus: '在职', maritalStatus: '未婚',
        address: '江苏省南京市鼓楼区中山路200号', emergencyContact: '张母',
        emergencyPhone: '13900003003', relationship: '母亲',
        avatar: '/avatars/male2.jpg',
        certificates: ['执业医师证', '主治医师证书'],
        workExperience: '14年外科临床经验，专长腹腔镜手术',
        createTime: '2024-01-01 09:00:00', updateTime: '2024-01-08 16:45:00'
      },
      {
        id: 4, employeeNo: 'HY2024004', name: '陈美玲', gender: '女',
        birthday: '1990-11-05', idCard: '440103199011050123',
        phone: '13800004004', email: 'chenmeiling@hospital.com',
        departmentId: 3, departmentName: '妇产科', positionId: 4, positionName: '住院医师',
        title: '住院医师', education: '本科', school: '中山大学医学院',
        major: '临床医学', graduationDate: '2013-07-01',
        hireDate: '2013-08-01', contractStart: '2024-01-01', contractEnd: '2025-12-31',
        employeeType: '正式员工', workStatus: '在职', maritalStatus: '已婚',
        address: '广东省广州市天河区天河路500号', emergencyContact: '陈先生',
        emergencyPhone: '13900004004', relationship: '配偶',
        avatar: '/avatars/female2.jpg',
        certificates: ['执业医师证'],
        workExperience: '11年妇产科临床经验',
        createTime: '2024-01-01 09:00:00', updateTime: '2024-01-12 11:20:00'
      },
      {
        id: 5, employeeNo: 'HY2024005', name: '刘建国', gender: '男',
        birthday: '1988-09-12', idCard: '130102198809120456',
        phone: '13800005005', email: 'liujianguo@hospital.com',
        departmentId: 6, departmentName: '人事部', positionId: null, positionName: '人事专员',
        title: '中级', education: '本科', school: '河北大学',
        major: '人力资源管理', graduationDate: '2011-07-01',
        hireDate: '2011-09-01', contractStart: '2024-01-01', contractEnd: '2026-12-31',
        employeeType: '正式员工', workStatus: '在职', maritalStatus: '已婚',
        address: '河北省石家庄市长安区中山路300号', emergencyContact: '刘女士',
        emergencyPhone: '13900005005', relationship: '配偶',
        avatar: '/avatars/male3.jpg',
        certificates: ['人力资源管理师证书'],
        workExperience: '13年人事管理经验',
        createTime: '2024-01-01 09:00:00', updateTime: '2024-01-05 08:30:00'
      }
    ]
  }

  // 生成招聘数据
  generateRecruitment() {
    return {
      plans: [
        {
          id: 1, title: '内科主任医师招聘', departmentId: 1, departmentName: '内科',
          positionId: 1, positionName: '主任医师', needCount: 1,
          requirements: '医学博士学位，15年以上临床经验，具有科室管理能力',
          salary: '30000-50000', workLocation: '内科病房',
          status: 'recruiting', publishDate: '2024-01-01',
          deadline: '2024-03-01', creator: '人事部',
          createTime: '2024-01-01 10:00:00'
        },
        {
          id: 2, title: '护士招聘', departmentId: 5, departmentName: '护理部',
          positionId: 8, positionName: '护士', needCount: 5,
          requirements: '护理专业毕业，有护士执业证书，具备良好沟通能力',
          salary: '8000-12000', workLocation: '各科室病房',
          status: 'recruiting', publishDate: '2024-01-05',
          deadline: '2024-02-28', creator: '人事部',
          createTime: '2024-01-05 14:00:00'
        }
      ],
      resumes: [
        {
          id: 1, planId: 1, name: '赵大夫', gender: '男', age: 45,
          phone: '13700001001', email: 'zhaodaifu@email.com',
          education: '博士', school: '协和医学院', major: '内科学',
          experience: '18年', currentCompany: '某三甲医院',
          expectedSalary: '45000', status: '待面试',
          submitTime: '2024-01-10 09:00:00',
          resumeFile: 'resume_zhao.pdf'
        },
        {
          id: 2, planId: 2, name: '李护士', gender: '女', age: 26,
          phone: '13700002002', email: 'lihushi@email.com',
          education: '本科', school: '某医科大学', major: '护理学',
          experience: '3年', currentCompany: '某二甲医院',
          expectedSalary: '10000', status: '初筛通过',
          submitTime: '2024-01-12 14:30:00',
          resumeFile: 'resume_li.pdf'
        }
      ],
      interviews: [
        {
          id: 1, resumeId: 1, interviewType: '初试',
          interviewTime: '2024-01-20 14:00:00',
          interviewer: '李主任,人事经理', location: '会议室A',
          status: 'scheduled', remark: '技术面试+管理能力评估'
        }
      ]
    }
  }

  // 生成考勤数据
  generateAttendance() {
    return {
      records: [
        {
          id: 1, employeeId: 1, employeeNo: 'HY2024001', employeeName: '李明华',
          date: '2024-01-15', scheduleType: '常白班',
          planIn: '08:00', planOut: '17:00',
          actualIn: '07:55', actualOut: '17:10',
          status: '正常', workHours: 8.25, overtimeHours: 0.17,
          lateMinutes: 0, earlyMinutes: 0, deviceName: '门禁001'
        },
        {
          id: 2, employeeId: 2, employeeNo: 'HY2024002', employeeName: '王小红',
          date: '2024-01-15', scheduleType: '常白班',
          planIn: '08:00', planOut: '17:00',
          actualIn: '08:05', actualOut: '17:00',
          status: '迟到', workHours: 7.92, overtimeHours: 0,
          lateMinutes: 5, earlyMinutes: 0, deviceName: '门禁002'
        }
      ],
      summary: [
        {
          employeeId: 1, employeeName: '李明华', month: '2024-01',
          workDays: 22, attendDays: 22, lateTimes: 0, earlyTimes: 0,
          absentDays: 0, overtimeHours: 8.5, leaveHours: 0
        }
      ]
    }
  }

  // 生成排班数据
  generateSchedules() {
    return {
      shifts: [
        { id: 1, name: '常白班', startTime: '08:00', endTime: '17:00', 
          workHours: 8, color: '#409EFF', remark: '正常工作时间' },
        { id: 2, name: '夜班', startTime: '20:00', endTime: '08:00', 
          workHours: 12, color: '#909399', remark: '夜间值班' },
        { id: 3, name: '早班', startTime: '06:00', endTime: '14:00', 
          workHours: 8, color: '#67C23A', remark: '早班时间' },
        { id: 4, name: '晚班', startTime: '14:00', endTime: '22:00', 
          workHours: 8, color: '#E6A23C', remark: '晚班时间' }
      ],
      schedules: [
        {
          id: 1, employeeId: 1, employeeName: '李明华',
          departmentId: 1, date: '2024-01-15', shiftId: 1, shiftName: '常白班',
          status: 'published', creator: '科室主任',
          createTime: '2024-01-10 10:00:00'
        }
      ]
    }
  }

  // 生成假期类型数据
  generateLeaveTypes() {
    return [
      { id: 1, name: '年假', code: 'ANNUAL', maxDays: 15, needApproval: true,
        description: '法定年假', isDeductSalary: false, color: '#409EFF' },
      { id: 2, name: '病假', code: 'SICK', maxDays: 90, needApproval: true,
        description: '因病请假', isDeductSalary: true, color: '#F56C6C' },
      { id: 3, name: '事假', code: 'PERSONAL', maxDays: 30, needApproval: true,
        description: '个人事务假', isDeductSalary: true, color: '#E6A23C' },
      { id: 4, name: '婚假', code: 'MARRIAGE', maxDays: 3, needApproval: true,
        description: '结婚假期', isDeductSalary: false, color: '#F78989' },
      { id: 5, name: '产假', code: 'MATERNITY', maxDays: 98, needApproval: true,
        description: '女职工产假', isDeductSalary: false, color: '#FF69B4' }
    ]
  }

  // 生成假勤申请数据
  generateLeaveApplications() {
    return [
      {
        id: 1, employeeId: 1, employeeName: '李明华',
        leaveTypeId: 1, leaveTypeName: '年假',
        startDate: '2024-02-01', endDate: '2024-02-05',
        days: 5, hours: 0, reason: '春节回家探亲',
        status: 'pending', applyTime: '2024-01-15 10:00:00',
        approver: '科室主任', approveTime: null,
        approveRemark: '', attachments: []
      },
      {
        id: 2, employeeId: 2, employeeName: '王小红',
        leaveTypeId: 3, leaveTypeName: '事假',
        startDate: '2024-01-20', endDate: '2024-01-20',
        days: 1, hours: 0, reason: '处理家庭事务',
        status: 'approved', applyTime: '2024-01-18 14:00:00',
        approver: '护士长', approveTime: '2024-01-18 16:30:00',
        approveRemark: '同意请假', attachments: []
      }
    ]
  }

  // 生成绩效方案数据
  generatePerformanceSchemes() {
    return [
      {
        id: 1, name: '医师绩效考核方案', category: '医疗人员',
        cycle: 'quarterly', status: 'active',
        description: '针对医师岗位的综合绩效考核',
        indicators: [
          { id: 1, name: '医疗质量', weight: 40, type: 'score', 
            description: '病历质量、诊疗规范等' },
          { id: 2, name: '工作量', weight: 30, type: 'data', 
            description: '门诊量、手术量、病房管理等' },
          { id: 3, name: '服务态度', weight: 20, type: 'score', 
            description: '患者满意度、同事评价等' },
          { id: 4, name: '学习发展', weight: 10, type: 'score', 
            description: '继续教育、论文发表等' }
        ],
        createTime: '2024-01-01 09:00:00'
      },
      {
        id: 2, name: '护理人员绩效考核方案', category: '护理人员',
        cycle: 'monthly', status: 'active',
        description: '针对护理人员的绩效考核',
        indicators: [
          { id: 1, name: '护理质量', weight: 50, type: 'score', 
            description: '护理操作规范、质量控制等' },
          { id: 2, name: '工作态度', weight: 30, type: 'score', 
            description: '责任心、团队协作等' },
          { id: 3, name: '业务能力', weight: 20, type: 'score', 
            description: '专业技能、学习能力等' }
        ],
        createTime: '2024-01-01 09:00:00'
      }
    ]
  }

  // 生成绩效评估数据
  generatePerformanceEvaluations() {
    return [
      {
        id: 1, schemeId: 1, employeeId: 1, employeeName: '李明华',
        period: '2024Q1', status: 'completed',
        selfScore: 85, managerScore: 88, finalScore: 87,
        level: 'A', selfComment: '本季度完成各项工作指标，积极参与科研项目',
        managerComment: '工作认真负责，专业能力突出，管理能力有待提升',
        improvements: '加强团队管理和沟通技巧',
        evaluateTime: '2024-01-15 16:00:00'
      }
    ]
  }

  // 生成薪酬结构数据
  generateSalaryStructures() {
    return [
      {
        id: 1, name: '主任医师薪酬标准', positionId: 1,
        baseSalary: 15000, positionSalary: 8000, performanceRatio: 0.3,
        allowances: [
          { name: '岗位津贴', amount: 2000 },
          { name: '学历津贴', amount: 1000 },
          { name: '职称津贴', amount: 1500 }
        ],
        socialInsurance: {
          pension: 0.08, medical: 0.02, unemployment: 0.005,
          injury: 0, maternity: 0, housingFund: 0.12
        },
        status: 'active', createTime: '2024-01-01'
      },
      {
        id: 2, name: '护士长薪酬标准', positionId: 5,
        baseSalary: 8000, positionSalary: 3000, performanceRatio: 0.2,
        allowances: [
          { name: '岗位津贴', amount: 1000 },
          { name: '夜班津贴', amount: 500 }
        ],
        socialInsurance: {
          pension: 0.08, medical: 0.02, unemployment: 0.005,
          injury: 0, maternity: 0, housingFund: 0.12
        },
        status: 'active', createTime: '2024-01-01'
      }
    ]
  }

  // 生成工资单数据
  generatePayrolls() {
    return [
      {
        id: 1, employeeId: 1, employeeName: '李明华',
        month: '2024-01', baseSalary: 15000, positionSalary: 8000,
        performanceBonus: 5200, allowanceTotal: 4500,
        overtimePay: 800, totalIncome: 33500,
        pensionDeduction: 1840, medicalDeduction: 460,
        unemploymentDeduction: 115, housingFundDeduction: 2760,
        taxDeduction: 3850, totalDeduction: 9025,
        netSalary: 24475, paymentDate: '2024-02-01',
        status: 'paid', remark: '正常发放'
      },
      {
        id: 2, employeeId: 2, employeeName: '王小红',
        month: '2024-01', baseSalary: 8000, positionSalary: 3000,
        performanceBonus: 1800, allowanceTotal: 1500,
        overtimePay: 400, totalIncome: 14700,
        pensionDeduction: 800, medicalDeduction: 200,
        unemploymentDeduction: 50, housingFundDeduction: 1200,
        taxDeduction: 680, totalDeduction: 2930,
        netSalary: 11770, paymentDate: '2024-02-01',
        status: 'paid', remark: '正常发放'
      }
    ]
  }

  // 生成预算数据
  generateBudgets() {
    return [
      {
        id: 1, year: 2024, departmentId: 1, departmentName: '内科',
        category: '人员经费', budgetAmount: 5000000,
        usedAmount: 800000, remainingAmount: 4200000,
        status: 'approved', approver: '财务经理',
        approveTime: '2024-01-05 10:00:00',
        remark: '年度人员预算'
      },
      {
        id: 2, year: 2024, departmentId: 1, departmentName: '内科',
        category: '设备采购', budgetAmount: 2000000,
        usedAmount: 350000, remainingAmount: 1650000,
        status: 'approved', approver: '财务经理',
        approveTime: '2024-01-05 10:00:00',
        remark: '年度设备采购预算'
      }
    ]
  }

  // 生成费用报销数据
  generateExpenses() {
    return [
      {
        id: 1, employeeId: 1, employeeName: '李明华',
        type: '差旅费', amount: 3500, budgetId: 1,
        budgetCategory: '人员经费', applyDate: '2024-01-10',
        status: 'approved', invoiceCount: 5,
        invoices: [
          { type: '机票', amount: 2000, number: 'CA20240110001' },
          { type: '酒店', amount: 1200, number: 'HT20240110002' },
          { type: '餐费', amount: 300, number: 'RF20240110003' }
        ],
        approveFlow: [
          { approver: '科室主任', result: '同意', time: '2024-01-11 09:00:00' },
          { approver: '财务经理', result: '通过', time: '2024-01-12 14:00:00' }
        ],
        paymentStatus: 'paid', paymentDate: '2024-01-15'
      }
    ]
  }

  // 生成资产分类数据
  generateAssetCategories() {
    return [
      { id: 1, name: '医疗设备', code: 'ME', parentId: null, 
        description: '各类医疗诊疗设备', sort: 1 },
      { id: 2, name: '办公设备', code: 'OE', parentId: null, 
        description: '办公用电脑、打印机等', sort: 2 },
      { id: 3, name: '家具用品', code: 'FU', parentId: null, 
        description: '办公桌椅、柜子等', sort: 3 },
      { id: 4, name: '车辆', code: 'VE', parentId: null, 
        description: '救护车、公务车等', sort: 4 }
    ]
  }

  // 生成供应商数据
  generateSuppliers() {
    return [
      {
        id: 1, name: '北京医疗设备有限公司', code: 'SUP001',
        type: '设备供应商', contact: '张经理', phone: '010-88888888',
        email: 'zhang@medical.com', address: '北京市朝阳区医疗街100号',
        bankAccount: '1234567890123456789', bank: '工商银行朝阳支行',
        taxNumber: '91110000123456789X', status: 'active',
        rating: 'A', cooperationYears: 5,
        businessScope: '医疗设备销售、维修、租赁',
        createTime: '2024-01-01'
      }
    ]
  }

  // 生成资产数据
  generateAssets() {
    return [
      {
        id: 1, assetNo: 'ZC2024001', name: 'X光机', model: 'XR-2000',
        categoryId: 1, categoryName: '医疗设备',
        brand: '西门子', supplierId: 1, supplierName: '北京医疗设备有限公司',
        purchaseDate: '2024-01-10', originalValue: 500000,
        currentValue: 480000, depreciationRate: 0.1,
        departmentId: 1, departmentName: '内科',
        managerId: 1, managerName: '李明华',
        location: '1号楼3层放射科', status: '在用',
        warranty: '3年', warrantyEnd: '2027-01-10',
        maintenanceDate: '2024-01-15', nextMaintenanceDate: '2024-07-15',
        specifications: '数字化X光机，支持DR成像',
        remark: '科室主要影像设备',
        qrCode: 'QR_ZC2024001', rfidTag: 'RFID_ZC2024001',
        createTime: '2024-01-10 10:00:00'
      },
      {
        id: 2, assetNo: 'ZC2024002', name: '电脑', model: 'ThinkPad T14',
        categoryId: 2, categoryName: '办公设备',
        brand: '联想', supplierId: 1, supplierName: '北京医疗设备有限公司',
        purchaseDate: '2024-01-05', originalValue: 8000,
        currentValue: 7500, depreciationRate: 0.2,
        departmentId: 6, departmentName: '人事部',
        managerId: 5, managerName: '刘建国',
        location: '行政楼2层人事部', status: '在用',
        warranty: '3年', warrantyEnd: '2027-01-05',
        maintenanceDate: null, nextMaintenanceDate: '2024-06-05',
        specifications: 'i5处理器，8G内存，256G固态硬盘',
        remark: '人事专员办公电脑',
        qrCode: 'QR_ZC2024002', rfidTag: 'RFID_ZC2024002',
        createTime: '2024-01-05 14:00:00'
      }
    ]
  }

  // 获取数据
  getData(key) {
    const data = JSON.parse(sessionStorage.getItem('mockData') || '{}')
    return key ? data[key] : data
  }

  // 更新数据
  updateData(key, value) {
    const data = this.getData()
    data[key] = value
    sessionStorage.setItem('mockData', JSON.stringify(data))
  }

  // 获取统计数据
  getStats() {
    const data = this.getData()
    const todoList = data.todoList || []
    
    const today = new Date()
    return {
      todo: {
        total: todoList.length,
        urgent: todoList.filter(item => item.isUrgent).length,
        today: todoList.filter(item => {
          const createDate = new Date(item.createTime)
          return createDate.toDateString() === today.toDateString()
        }).length,
        overdue: todoList.filter(item => item.isOverdue).length
      }
    }
  }

  // 更新用户数量统计
  updateRoleUserCount() {
    const data = this.getData()
    const users = data.users || []
    const roles = data.roles || []
    
    roles.forEach(role => {
      const roleKey = this.getRoleKey(role.name)
      role.userCount = users.filter(user => user.role === roleKey).length
    })
    
    this.updateData('roles', roles)
  }

  // 角色名称映射
  getRoleKey(roleName) {
    const roleMap = {
      '超级管理员': 'admin',
      'HR管理员': 'hr',
      '科室主任': 'director',
      '普通用户': 'user'
    }
    return roleMap[roleName] || 'user'
  }


  // 在 DataManager 类中添加 initializeData 方法
  initializeData(currentUser) {
    // 可以在这里添加用户登录后的初始化逻辑
    console.log('用户登录初始化:', currentUser)
    // 如果需要，可以调用 initData 方法
    // this.initData()
  }
  
}

// 创建单例实例
export const dataManager = new DataManager()