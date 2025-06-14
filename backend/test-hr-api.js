const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// 简单的API测试
async function testHRAPI() {
  try {
    console.log('🚀 开始测试人力资源API...\n');
    
    // 1. 登录获取token
    console.log('1. 登录测试...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginResponse.data.status === 'success') {
      console.log('✅ 登录成功');
      const token = loginResponse.data.data.token;
      const headers = { Authorization: `Bearer ${token}` };
      
      // 2. 测试员工API
      console.log('\n2. 测试员工管理API...');
      const employeesResponse = await axios.get(`${BASE_URL}/hr/employees`, { headers });
      console.log(`✅ 获取员工列表成功，共 ${employeesResponse.data.data.total} 条记录`);
      
      // 3. 测试招聘API
      console.log('\n3. 测试招聘管理API...');
      const recruitmentResponse = await axios.get(`${BASE_URL}/hr/recruitment/positions`, { headers });
      console.log(`✅ 获取招聘职位成功，共 ${recruitmentResponse.data.data.total} 条记录`);
      
      // 4. 测试考勤API
      console.log('\n4. 测试考勤管理API...');
      const attendanceResponse = await axios.get(`${BASE_URL}/hr/attendance/records`, { headers });
      console.log(`✅ 获取考勤记录成功，共 ${attendanceResponse.data.data.total} 条记录`);
      
      // 5. 测试请假API
      console.log('\n5. 测试请假管理API...');
      const leaveResponse = await axios.get(`${BASE_URL}/hr/leave/requests`, { headers });
      console.log(`✅ 获取请假申请成功，共 ${leaveResponse.data.data.total} 条记录`);
      
      // 6. 测试绩效API
      console.log('\n6. 测试绩效管理API...');
      const performanceResponse = await axios.get(`${BASE_URL}/hr/performance/evaluations`, { headers });
      console.log(`✅ 获取绩效考核成功，共 ${performanceResponse.data.data.total} 条记录`);
      
      // 7. 测试薪酬API
      console.log('\n7. 测试薪酬管理API...');
      const salaryResponse = await axios.get(`${BASE_URL}/hr/salary/records`, { headers });
      console.log(`✅ 获取薪酬记录成功，共 ${salaryResponse.data.data.total} 条记录`);
      
      console.log('\n🎉 所有人力资源API测试通过！');
      
    } else {
      console.log('❌ 登录失败');
    }
    
  } catch (error) {
    console.error('❌ API测试失败:', error.response?.data?.message || error.message);
  }
}

// 检查axios是否已安装
try {
  require.resolve('axios');
} catch (e) {
  console.log('需要安装axios: npm install axios');
  process.exit(1);
}

// 运行测试
if (require.main === module) {
  testHRAPI();
}

module.exports = testHRAPI; 