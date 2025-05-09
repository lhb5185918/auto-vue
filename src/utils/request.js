import axios from 'axios';
import { ElMessage } from 'element-plus';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 1000000
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('请求URL:', config.url, '请求方法:', config.method, '请求参数:', config.params || config.data);
    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    console.log('响应状态:', response.status, '响应数据:', response.data);
    return response;
  },
  error => {
    console.error('响应错误:', error.response?.status, error.response?.data, error.message);
    ElMessage.error(error.response?.data?.message || '请求失败');
    return Promise.reject(error);
  }
);

export default request; 