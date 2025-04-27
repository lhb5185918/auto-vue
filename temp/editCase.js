// 添加编辑用例的方法
const editCase = (caseItem, index) => {
    // 调试日志
    console.log('editCase方法被调用，用例数据:', caseItem, '索引:', index);
    
    // 填充表单数据
    caseEditForm.value = {
        title: caseItem.title || '',
        method: caseItem.method || 'GET',
        api_path: caseItem.api_path || '',
        headers: caseItem.headers ? JSON.stringify(caseItem.headers, null, 2) : '',
        params: caseItem.params ? JSON.stringify(caseItem.params, null, 2) : '',
        expected: caseItem.expected ? JSON.stringify(caseItem.expected, null, 2) : '',
        case_id: caseItem.case_id,
        index: index,
        extractors: caseItem.extractors || [] // 加载已有的提取器配置
    };

    // 打开编辑弹窗
    showCaseEditDialog.value = true;
    console.log('弹窗状态:', showCaseEditDialog.value);
    
    // 确保在DOM更新后弹窗正确显示
    setTimeout(() => {
        if (!showCaseEditDialog.value) {
            console.log('尝试再次打开弹窗');
            showCaseEditDialog.value = true;
        }
    }, 100);
}; 