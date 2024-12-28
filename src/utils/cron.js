// 简化版的 Cron 解析实现
export const parseCron = (expression) => {
  try {
    // 简单的验证 Cron 表达式格式
    const parts = expression.split(' ');
    if (parts.length !== 5 && parts.length !== 6) {
      throw new Error('Invalid cron expression');
    }

    // 计算下次执行时间
    const now = new Date();
    const next = new Date(now.getTime() + 60000); // 示例：下一分钟
    
    return next.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (err) {
    console.error('Cron expression parse error:', err);
    return '表达式格式错误';
  }
};

// 简单的 Cron 表达式验证
export const validateCron = (expression) => {
  try {
    const parts = expression.split(' ');
    return parts.length === 5 || parts.length === 6;
  } catch (err) {
    return false;
  }
};

// 获取最近几次执行时间
export const getNextExecutions = (expression, count = 5) => {
  try {
    const executions = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      // 示例：每次增加一分钟
      const next = new Date(now.getTime() + (i + 1) * 60000);
      executions.push(next);
    }
    
    return executions;
  } catch (err) {
    console.error('Get next executions error:', err);
    return [];
  }
}; 