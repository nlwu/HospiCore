// 权限验证中间件
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: '未登录'
      });
    }

    // 超级管理员拥有所有权限
    if (user.permissions === '*') {
      return next();
    }

    // 检查用户权限
    const userPermissions = user.permissions ? user.permissions.split(',') : [];
    
    // 支持模块权限和具体操作权限
    const hasPermission = userPermissions.some(permission => {
      // 完全匹配
      if (permission === requiredPermission) {
        return true;
      }
      
      // 模块权限匹配（如 user 包含 user:view）
      if (requiredPermission.includes(':')) {
        const [module] = requiredPermission.split(':');
        return permission === module;
      }
      
      return false;
    });

    if (!hasPermission) {
      return res.status(403).json({
        status: 'error',
        message: '权限不足'
      });
    }

    next();
  };
};

module.exports = { checkPermission }; 