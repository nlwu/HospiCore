const db = require('../config/database');

// 人力资源模块数据库表结构
const createHRTables = {
  // 员工档案表
  employees: `
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_number VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(50) NOT NULL,
      gender VARCHAR(10),
      birth_date DATE,
      id_card VARCHAR(18),
      phone VARCHAR(20),
      email VARCHAR(100),
      address TEXT,
      education VARCHAR(20),
      marital_status VARCHAR(10),
      department_id INTEGER,
      position VARCHAR(50),
      hire_date DATE,
      status VARCHAR(20) DEFAULT 'active',
      salary DECIMAL(10,2),
      emergency_contact_name VARCHAR(50),
      emergency_contact_phone VARCHAR(20),
      photo VARCHAR(255),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    )
  `,

  // 招聘职位表
  job_positions: `
    CREATE TABLE IF NOT EXISTS job_positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(100) NOT NULL,
      department_id INTEGER,
      description TEXT,
      requirements TEXT,
      salary_min DECIMAL(10,2),
      salary_max DECIMAL(10,2),
      positions_count INTEGER DEFAULT 1,
      status VARCHAR(20) DEFAULT 'open',
      publish_date DATE,
      deadline DATE,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `,

  // 应聘者表
  job_applications: `
    CREATE TABLE IF NOT EXISTS job_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      position_id INTEGER,
      name VARCHAR(50) NOT NULL,
      gender VARCHAR(10),
      birth_date DATE,
      phone VARCHAR(20),
      email VARCHAR(100),
      education VARCHAR(20),
      work_experience TEXT,
      resume_file VARCHAR(255),
      status VARCHAR(20) DEFAULT 'pending',
      interview_date DATETIME,
      interview_notes TEXT,
      result VARCHAR(20),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (position_id) REFERENCES job_positions(id)
    )
  `,

  // 考勤记录表
  attendance_records: `
    CREATE TABLE IF NOT EXISTS attendance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      date DATE,
      check_in_time TIME,
      check_out_time TIME,
      work_hours DECIMAL(4,2),
      overtime_hours DECIMAL(4,2),
      status VARCHAR(20) DEFAULT 'normal',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      UNIQUE(employee_id, date)
    )
  `,

  // 排班表
  work_schedules: `
    CREATE TABLE IF NOT EXISTS work_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      date DATE,
      shift_type VARCHAR(20),
      start_time TIME,
      end_time TIME,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      UNIQUE(employee_id, date)
    )
  `,

  // 请假申请表
  leave_requests: `
    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      leave_type VARCHAR(20),
      start_date DATE,
      end_date DATE,
      days_count DECIMAL(3,1),
      reason TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      approved_by INTEGER,
      approved_at DATETIME,
      approval_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    )
  `,

  // 调休记录表
  compensatory_leaves: `
    CREATE TABLE IF NOT EXISTS compensatory_leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      overtime_date DATE,
      overtime_hours DECIMAL(4,2),
      comp_leave_date DATE,
      comp_leave_hours DECIMAL(4,2),
      status VARCHAR(20) DEFAULT 'earned',
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    )
  `,

  // 绩效考核表
  performance_evaluations: `
    CREATE TABLE IF NOT EXISTS performance_evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      evaluation_period VARCHAR(20),
      year INTEGER,
      quarter INTEGER,
      month INTEGER,
      evaluator_id INTEGER,
      work_quality_score INTEGER,
      work_efficiency_score INTEGER,
      teamwork_score INTEGER,
      innovation_score INTEGER,
      total_score INTEGER,
      rating VARCHAR(10),
      comments TEXT,
      status VARCHAR(20) DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (evaluator_id) REFERENCES users(id)
    )
  `,

  // 薪酬记录表
  salary_records: `
    CREATE TABLE IF NOT EXISTS salary_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      year INTEGER,
      month INTEGER,
      base_salary DECIMAL(10,2),
      allowances DECIMAL(10,2),
      overtime_pay DECIMAL(10,2),
      bonus DECIMAL(10,2),
      deductions DECIMAL(10,2),
      social_insurance DECIMAL(10,2),
      tax DECIMAL(10,2),
      net_salary DECIMAL(10,2),
      status VARCHAR(20) DEFAULT 'pending',
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      UNIQUE(employee_id, year, month)
    )
  `,

  // 福利管理表
  benefits: `
    CREATE TABLE IF NOT EXISTS benefits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(50),
      description TEXT,
      amount DECIMAL(10,2),
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // 员工福利关联表
  employee_benefits: `
    CREATE TABLE IF NOT EXISTS employee_benefits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      benefit_id INTEGER,
      start_date DATE,
      end_date DATE,
      amount DECIMAL(10,2),
      status VARCHAR(20) DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (benefit_id) REFERENCES benefits(id)
    )
  `
};

// 初始化人力资源数据
async function initializeHRData() {
  try {
    console.log('开始初始化人力资源数据库表...');

    // 创建所有表
    for (const [tableName, sql] of Object.entries(createHRTables)) {
      await db.run(sql);
      console.log(`✅ 创建人力资源表 ${tableName} 成功`);
    }

    // 插入示例员工数据
    const employees = [
      {
        employee_number: 'EMP001',
        name: '张三',
        gender: '男',
        birth_date: '1990-01-15',
        id_card: '110101199001154321',
        phone: '13800138001',
        email: 'zhangsan@hospital.com',
        address: '北京市朝阳区',
        education: '本科',
        marital_status: '已婚',
        department_id: 2,
        position: '软件工程师',
        hire_date: '2020-03-01',
        salary: 8000,
        emergency_contact_name: '李四',
        emergency_contact_phone: '13800138002'
      },
      {
        employee_number: 'EMP002',
        name: '李小红',
        gender: '女',
        birth_date: '1992-06-20',
        id_card: '110101199206204321',
        phone: '13800138003',
        email: 'lixiaohong@hospital.com',
        address: '北京市海淀区',
        education: '硕士',
        marital_status: '未婚',
        department_id: 3,
        position: '主治医师',
        hire_date: '2021-08-15',
        salary: 12000,
        emergency_contact_name: '李大明',
        emergency_contact_phone: '13800138004'
      },
      {
        employee_number: 'EMP003',
        name: '王护士',
        gender: '女',
        birth_date: '1988-03-10',
        id_card: '110101198803104321',
        phone: '13800138005',
        email: 'wanghushi@hospital.com',
        address: '北京市西城区',
        education: '专科',
        marital_status: '已婚',
        department_id: 4,
        position: '护师',
        hire_date: '2019-01-10',
        salary: 6000,
        emergency_contact_name: '王大伟',
        emergency_contact_phone: '13800138006'
      }
    ];

    for (const emp of employees) {
      await db.run(`
        INSERT OR IGNORE INTO employees (
          employee_number, name, gender, birth_date, id_card, phone, email, 
          address, education, marital_status, department_id, position, 
          hire_date, salary, emergency_contact_name, emergency_contact_phone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        emp.employee_number, emp.name, emp.gender, emp.birth_date, emp.id_card,
        emp.phone, emp.email, emp.address, emp.education, emp.marital_status,
        emp.department_id, emp.position, emp.hire_date, emp.salary,
        emp.emergency_contact_name, emp.emergency_contact_phone
      ]);
    }
    console.log('✅ 初始化员工数据成功');

    // 插入示例招聘职位
    const positions = [
      {
        title: '软件开发工程师',
        department_id: 2,
        description: '负责医院信息系统的开发和维护',
        requirements: '计算机相关专业，3年以上开发经验',
        salary_min: 8000,
        salary_max: 15000,
        positions_count: 2,
        publish_date: '2024-01-01',
        deadline: '2024-02-01',
        created_by: 1
      },
      {
        title: '主治医师',
        department_id: 3,
        description: '负责患者诊疗工作',
        requirements: '医学专业，具有执业医师资格',
        salary_min: 10000,
        salary_max: 20000,
        positions_count: 1,
        publish_date: '2024-01-01',
        deadline: '2024-03-01',
        created_by: 1
      }
    ];

    for (const pos of positions) {
      await db.run(`
        INSERT OR IGNORE INTO job_positions (
          title, department_id, description, requirements, salary_min, 
          salary_max, positions_count, publish_date, deadline, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        pos.title, pos.department_id, pos.description, pos.requirements,
        pos.salary_min, pos.salary_max, pos.positions_count,
        pos.publish_date, pos.deadline, pos.created_by
      ]);
    }
    console.log('✅ 初始化招聘职位数据成功');

    // 插入示例福利项目
    const benefits = [
      { name: '五险一金', type: '社会保险', description: '基本社会保险和住房公积金', amount: 1000 },
      { name: '餐费补贴', type: '生活补贴', description: '每月餐费补贴', amount: 500 },
      { name: '交通补贴', type: '交通津贴', description: '每月交通费用补贴', amount: 300 },
      { name: '年终奖', type: '奖金', description: '年终绩效奖金', amount: 0 }
    ];

    for (const benefit of benefits) {
      await db.run(`
        INSERT OR IGNORE INTO benefits (name, type, description, amount) 
        VALUES (?, ?, ?, ?)
      `, [benefit.name, benefit.type, benefit.description, benefit.amount]);
    }
    console.log('✅ 初始化福利项目数据成功');

    console.log('🎉 人力资源数据库初始化完成！');

  } catch (error) {
    console.error('❌ 人力资源数据库初始化失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initializeHRData()
    .then(() => {
      console.log('初始化完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('初始化失败:', error);
      process.exit(1);
    });
}

module.exports = { createHRTables, initializeHRData }; 