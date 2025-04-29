// 实现编辑用例的方法
const saveCase = async () => {
    try {
        // 验证表单数据
        if (!caseEditForm.value.title) {
            ElMessage.warning('用例名称不能为空');
            return;
        }

        const index = caseEditForm.value.index;
        if (index === -1) {
            ElMessage.error('无法确定要编辑的用例');
            return;
        }

        // 验证提取器配置
        const invalidExtractors = caseEditForm.value.extractors.filter(
            e => (e.name && !e.jsonPath) || (!e.name && e.jsonPath)
        );
        
        if (invalidExtractors.length > 0) {
            ElMessage.warning('提取器配置不完整，请填写变量名和JSONPath');
            return;
        }

        // 构建更新的用例数据
        const updatedCase = {
            ...suiteForm.value.selectedCases[index],
            title: caseEditForm.value.title,
            method: caseEditForm.value.method,
            api_path: caseEditForm.value.api_path,
            // 转换JSON字符串为对象
            headers: caseEditForm.value.headers ? JSON.parse(caseEditForm.value.headers) : {},
            params: caseEditForm.value.params ? JSON.parse(caseEditForm.value.params) : {},
            expected: caseEditForm.value.expected ? JSON.parse(caseEditForm.value.expected) : {},
            extractors: caseEditForm.value.extractors // 保存提取器配置
        };

        // 调用后端更新接口
        const loadingInstance = ElLoading.service({
            lock: true,
            text: '正在保存...',
            background: 'rgba(0, 0, 0, 0.7)'
        });

        try {
            // 获取原始用例ID
            const originalCaseId = caseEditForm.value.case_id;
            // 如果ID包含下划线，说明是克隆的用例，需要从selectedCases中找回原始ID
            const caseId = originalCaseId.includes('_') 
                ? suiteForm.value.selectedCases[index].original_id || originalCaseId.split('_')[0]
                : originalCaseId;

            console.log('更新用例ID:', caseId, '更新数据:', updatedCase);

            // 调用后端接口更新用例
            const response = await axios.put(
                `http://localhost:8081/api/testcase/update/${caseId}`,
                {
                    title: updatedCase.title,
                    method: updatedCase.method,
                    api_path: updatedCase.api_path,
                    headers: updatedCase.headers,
                    params: updatedCase.params,
                    expected: updatedCase.expected,
                    extractors: updatedCase.extractors // 添加提取器配置
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.code === 200) {
                // 更新前端用例列表
                suiteForm.value.selectedCases.splice(index, 1, updatedCase);
                ElMessage.success('用例更新成功');
                showCaseEditDialog.value = false;
            } else {
                throw new Error(response.data.message || '更新用例失败');
            }
        } finally {
            loadingInstance.close();
        }
    } catch (error) {
        console.error('保存用例失败:', error);
        ElMessage.error('保存失败: ' + (error.message || '参数格式错误'));
    }
}; 