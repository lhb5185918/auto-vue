// 执行测试套件
const runSuite = async (suite) => {
    try {
        suite.executing = true;
        // 确保suite.id存在，如果不存在则尝试使用suite_id
        const suiteId = suite.id || suite.suite_id;
        
        if (!suiteId) {
            ElMessage.error('测试套件ID不存在');
            return;
        }
        
        // 获取测试套件详情，包括所有用例信息
        const detailResponse = await axios.get(
            `http://localhost:8081/api/suite/detail/${suiteId}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );
        
        if (detailResponse.data.code !== 200) {
            throw new Error('获取测试套件详情失败');
        }
        
        const cases = detailResponse.data.data.cases || [];
        if (cases.length === 0) {
            ElMessage.warning('测试套件中没有用例');
            return;
        }
        
        // 显示加载中状态
        const loadingInstance = ElLoading.service({
            lock: true,
            text: '执行测试套件中...',
            background: 'rgba(0, 0, 0, 0.7)'
        });
        
        try {
            // 存储执行过程中的变量
            const suiteVariables = {};
            
            // 发送执行测试套件请求
            const response = await axios.post(
                `http://localhost:8081/api/suite/execute/${suiteId}`,
                { 
                    env_id: suite.env_id,
                    enable_extractors: true // 启用提取器功能
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            
            if (response.data.code === 200) {
                ElMessage.success('测试套件执行成功');
                // 刷新测试报告列表
                fetchTestReports();
            } else {
                throw new Error(response.data.message || '执行测试套件失败');
            }
        } finally {
            loadingInstance.close();
        }
    } catch (error) {
        console.error('执行测试套件失败:', error);
        ElMessage.error('执行测试套件失败: ' + (error.message || '未知错误'));
    } finally {
        suite.executing = false;
    }
}; 