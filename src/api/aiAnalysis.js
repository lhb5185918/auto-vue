import request from '@/utils/request';

// 获取AI分析报告列表
export function getAnalysisList(params) {
  return request({
    url: '/api/ai-analysis/list',
    method: 'get',
    params
  });
}

// 获取AI分析报告详情
export function getAnalysisDetail(id) {
  return request({
    url: `/api/ai-analysis/${id}`,
    method: 'get'
  });
}

// 创建AI分析任务
export function createAnalysisTask(data) {
  return request({
    url: '/api/ai-analysis/create',
    method: 'post',
    data
  });
}

// 删除AI分析报告
export function deleteAnalysis(id) {
  return request({
    url: `/api/ai-analysis/${id}`,
    method: 'delete'
  });
}

// 应用代码修复
export function applyCodeFix(data) {
  return request({
    url: '/api/ai-analysis/apply-fix',
    method: 'post',
    data
  });
}

// 获取执行结果列表
export function getExecutionList() {
  return request({
    url: '/api/execution/list',
    method: 'get'
  });
}

// 生成完整分析报告
export function generateFullReport(id) {
  return request({
    url: `/api/ai-analysis/generate-report/${id}`,
    method: 'post'
  });
} 