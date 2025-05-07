<template>
  <Home>
    <PageContainer title="系统配置">
      <el-card class="system-config-card">
        <el-tabs v-model="activeTab">
          <!-- 系统参数配置 -->
          <el-tab-pane label="系统参数" name="params">
            <el-form
              ref="paramsForm"
              :model="paramsData"
              :rules="paramsRules"
              label-width="120px"
            >
              <el-form-item label="最大并发数" prop="maxConcurrent">
                <el-input-number v-model="paramsData.maxConcurrent" :min="1" :max="100" />
                <span class="form-help">系统允许的最大并发执行任务数</span>
              </el-form-item>
              
              <el-form-item label="任务超时时间" prop="taskTimeout">
                <el-input-number v-model="paramsData.taskTimeout" :min="30" :max="3600" />
                <span class="form-help">单位: 秒</span>
              </el-form-item>

              <el-form-item label="数据保留策略" prop="dataRetention">
                <el-select v-model="paramsData.dataRetention" style="width: 100%">
                  <el-option label="保留7天" value="7" />
                  <el-option label="保留30天" value="30" />
                  <el-option label="保留90天" value="90" />
                  <el-option label="永久保留" value="forever" />
                </el-select>
                <span class="form-help">系统自动清理超过保留期的历史数据</span>
              </el-form-item>

              <el-form-item label="文件上传限制" prop="uploadLimit">
                <el-input-number v-model="paramsData.uploadLimit" :min="1" :max="100" />
                <span class="form-help">单位: MB</span>
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="saveParams">保存设置</el-button>
                <el-button @click="resetParams">重置</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 系统日志 -->
          <el-tab-pane label="系统日志" name="logs">
            <div class="filter-container">
              <el-select v-model="logLevel" placeholder="日志级别" clearable style="width: 120px; margin-right: 10px;">
                <el-option label="ERROR" value="error" />
                <el-option label="WARN" value="warn" />
                <el-option label="INFO" value="info" />
                <el-option label="DEBUG" value="debug" />
              </el-select>
              
              <el-date-picker
                v-model="logDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 280px; margin-right: 10px;"
              />
              
              <el-button type="primary" @click="fetchLogs">查询</el-button>
              <el-button @click="clearLogs">清空日志</el-button>
              <el-button @click="downloadLogs">下载日志</el-button>
            </div>
            
            <el-table
              :data="logs"
              v-loading="logsLoading"
              style="width: 100%; margin-top: 15px;"
              border
              stripe
              max-height="500"
            >
              <el-table-column prop="timestamp" label="时间" width="180" sortable />
              <el-table-column prop="level" label="级别" width="80">
                <template #default="{ row }">
                  <el-tag
                    :type="getLogLevelType(row.level)"
                    effect="plain"
                  >
                    {{ row.level }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="module" label="模块" width="120" />
              <el-table-column prop="message" label="日志内容" min-width="300" show-overflow-tooltip />
              <el-table-column prop="ip" label="IP" width="130" />
              <el-table-column prop="user" label="操作用户" width="120" />
            </el-table>
            
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="total"
                :page-sizes="[10, 20, 50, 100]"
                background
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </el-tab-pane>

          <!-- API配置 -->
          <el-tab-pane label="API配置" name="api">
            <el-form
              ref="apiForm"
              :model="apiData"
              :rules="apiRules"
              label-width="120px"
            >
              <el-form-item label="API请求超时" prop="requestTimeout">
                <el-input-number v-model="apiData.requestTimeout" :min="1" :max="60" />
                <span class="form-help">单位: 秒</span>
              </el-form-item>
              
              <el-form-item label="最大重试次数" prop="maxRetries">
                <el-input-number v-model="apiData.maxRetries" :min="0" :max="5" />
              </el-form-item>

              <el-form-item label="限流策略" prop="rateLimit">
                <el-input-number v-model="apiData.rateLimit" :min="10" :max="1000" />
                <span class="form-help">每分钟最大请求数</span>
              </el-form-item>

              <el-form-item label="API密钥" prop="apiKey">
                <el-input
                  v-model="apiData.apiKey"
                  placeholder="系统API访问密钥"
                  show-password
                />
                <div class="form-action">
                  <el-button size="small" @click="generateApiKey">重新生成</el-button>
                </div>
              </el-form-item>

              <el-form-item label="允许的IP" prop="allowedIps">
                <el-input
                  v-model="apiData.allowedIps"
                  placeholder="允许访问API的IP地址，多个IP用逗号分隔"
                  type="textarea"
                  :rows="3"
                />
                <span class="form-help">留空表示不限制IP</span>
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="saveApiConfig">保存设置</el-button>
                <el-button @click="resetApiConfig">重置</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 备份与恢复 -->
          <el-tab-pane label="备份与恢复" name="backup">
            <div class="backup-options">
              <el-card class="backup-card">
                <template #header>
                  <div class="card-header">
                    <span>系统备份</span>
                  </div>
                </template>
                <p>创建系统配置和数据的完整备份</p>
                <div class="backup-actions">
                  <el-button type="primary" @click="createBackup" :loading="backupLoading">立即备份</el-button>
                </div>
              </el-card>
              
              <el-card class="backup-card">
                <template #header>
                  <div class="card-header">
                    <span>备份历史</span>
                  </div>
                </template>
                <el-table 
                  :data="backupHistory" 
                  style="width: 100%"
                  v-loading="historyLoading"
                  max-height="300"
                >
                  <el-table-column prop="filename" label="备份文件" min-width="180" />
                  <el-table-column prop="size" label="大小" width="100" />
                  <el-table-column prop="create_time" label="创建时间" width="180" />
                  <el-table-column label="操作" width="150">
                    <template #default="{ row }">
                      <el-button-group>
                        <el-button size="small" type="primary" @click="downloadBackup(row)">下载</el-button>
                        <el-button size="small" type="danger" @click="deleteBackup(row)">删除</el-button>
                      </el-button-group>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
              
              <el-card class="backup-card">
                <template #header>
                  <div class="card-header">
                    <span>系统恢复</span>
                  </div>
                </template>
                <p>从备份文件恢复系统配置和数据</p>
                <el-upload
                  class="upload-area"
                  action="/api/system/restore"
                  :headers="uploadHeaders"
                  :on-success="handleRestoreSuccess"
                  :on-error="handleRestoreError"
                  :before-upload="beforeRestoreUpload"
                  :limit="1"
                >
                  <el-button type="warning">上传备份文件并恢复</el-button>
                  <template #tip>
                    <div class="el-upload__tip">
                      只能上传系统备份文件 (.zip)，且不超过500MB
                    </div>
                  </template>
                </el-upload>
              </el-card>
            </div>
          </el-tab-pane>

          <!-- 通知配置 -->
          <el-tab-pane label="通知配置" name="notification">
            <el-tabs v-model="notificationTab" tab-position="left" class="notification-tabs">
              <!-- 钉钉机器人配置 -->
              <el-tab-pane label="钉钉机器人" name="dingtalk">
                <el-form
                  ref="dingtalkForm"
                  :model="dingtalkData"
                  :rules="dingtalkRules"
                  label-width="120px"
                >
                  <el-form-item label="启用钉钉通知" prop="enabled">
                    <el-switch v-model="dingtalkData.enabled" />
                  </el-form-item>

                  <el-form-item label="Webhook地址" prop="webhook">
                    <el-input 
                      v-model="dingtalkData.webhook" 
                      placeholder="请输入钉钉机器人Webhook地址"
                      :disabled="!dingtalkData.enabled"
                    />
                    <span class="form-help">钉钉机器人的完整Webhook URL</span>
                  </el-form-item>

                  <el-form-item label="安全密钥" prop="secret">
                    <el-input 
                      v-model="dingtalkData.secret" 
                      placeholder="请输入安全密钥(可选)" 
                      :disabled="!dingtalkData.enabled"
                      show-password
                    />
                    <span class="form-help">如果配置了加签，请填写</span>
                  </el-form-item>

                  <el-form-item label="@指定人员" prop="atMobiles">
                    <el-input 
                      v-model="dingtalkData.atMobiles" 
                      placeholder="多个手机号用逗号分隔" 
                      :disabled="!dingtalkData.enabled"
                    />
                    <span class="form-help">消息中@指定人员的手机号</span>
                  </el-form-item>

                  <el-form-item label="通知级别" prop="level">
                    <el-select 
                      v-model="dingtalkData.level" 
                      style="width: 100%" 
                      :disabled="!dingtalkData.enabled"
                    >
                      <el-option label="全部消息" value="all" />
                      <el-option label="仅错误和警告" value="error_warn" />
                      <el-option label="仅错误" value="error" />
                    </el-select>
                    <span class="form-help">选择需要通知的消息级别</span>
                  </el-form-item>

                  <el-form-item>
                    <el-button type="primary" @click="saveDingtalkConfig" :disabled="!dingtalkData.enabled">保存设置</el-button>
                    <el-button @click="testDingtalkConfig" :disabled="!dingtalkData.enabled">测试连接</el-button>
                    <el-button @click="resetDingtalkConfig">重置</el-button>
                  </el-form-item>
                </el-form>
              </el-tab-pane>

              <!-- 企业微信机器人配置 -->
              <el-tab-pane label="企业微信机器人" name="wechat">
                <el-form
                  ref="wechatForm"
                  :model="wechatData"
                  :rules="wechatRules"
                  label-width="120px"
                >
                  <el-form-item label="启用企微通知" prop="enabled">
                    <el-switch v-model="wechatData.enabled" />
                  </el-form-item>

                  <el-form-item label="Webhook地址" prop="webhook">
                    <el-input 
                      v-model="wechatData.webhook" 
                      placeholder="请输入企业微信机器人Webhook地址"
                      :disabled="!wechatData.enabled"
                    />
                    <span class="form-help">企业微信机器人的完整Webhook URL</span>
                  </el-form-item>

                  <el-form-item label="@指定人员" prop="mentionedList">
                    <el-input 
                      v-model="wechatData.mentionedList" 
                      placeholder="多个用户ID用逗号分隔" 
                      :disabled="!wechatData.enabled"
                    />
                    <span class="form-help">消息中@指定人员的ID</span>
                  </el-form-item>

                  <el-form-item label="通知级别" prop="level">
                    <el-select 
                      v-model="wechatData.level" 
                      style="width: 100%" 
                      :disabled="!wechatData.enabled"
                    >
                      <el-option label="全部消息" value="all" />
                      <el-option label="仅错误和警告" value="error_warn" />
                      <el-option label="仅错误" value="error" />
                    </el-select>
                    <span class="form-help">选择需要通知的消息级别</span>
                  </el-form-item>

                  <el-form-item>
                    <el-button type="primary" @click="saveWechatConfig" :disabled="!wechatData.enabled">保存设置</el-button>
                    <el-button @click="testWechatConfig" :disabled="!wechatData.enabled">测试连接</el-button>
                    <el-button @click="resetWechatConfig">重置</el-button>
                  </el-form-item>
                </el-form>
              </el-tab-pane>

              <!-- 邮件配置 -->
              <el-tab-pane label="邮件配置" name="email">
                <el-form
                  ref="emailForm"
                  :model="emailData"
                  :rules="emailRules"
                  label-width="120px"
                >
                  <el-form-item label="启用邮件通知" prop="enabled">
                    <el-switch v-model="emailData.enabled" />
                  </el-form-item>

                  <el-form-item label="SMTP服务器" prop="host">
                    <el-input 
                      v-model="emailData.host" 
                      placeholder="如：smtp.gmail.com"
                      :disabled="!emailData.enabled"
                    />
                  </el-form-item>

                  <el-form-item label="SMTP端口" prop="port">
                    <el-input-number 
                      v-model="emailData.port" 
                      :min="1" 
                      :max="65535"
                      :disabled="!emailData.enabled"
                    />
                    <span class="form-help">常用端口：25, 465(SSL), 587(TLS)</span>
                  </el-form-item>

                  <el-form-item label="安全连接" prop="secure">
                    <el-select 
                      v-model="emailData.secure" 
                      style="width: 100%"
                      :disabled="!emailData.enabled"
                    >
                      <el-option label="无" value="none" />
                      <el-option label="SSL" value="ssl" />
                      <el-option label="TLS" value="tls" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="发件人邮箱" prop="username">
                    <el-input 
                      v-model="emailData.username" 
                      placeholder="发件人邮箱地址"
                      :disabled="!emailData.enabled"
                    />
                  </el-form-item>

                  <el-form-item label="邮箱密码/授权码" prop="password">
                    <el-input 
                      v-model="emailData.password" 
                      placeholder="邮箱密码或应用专用授权码" 
                      type="password"
                      :disabled="!emailData.enabled"
                      show-password
                    />
                    <span class="form-help">大多数邮箱服务商需要使用应用专用授权码</span>
                  </el-form-item>

                  <el-form-item label="收件人邮箱" prop="recipients">
                    <el-input 
                      v-model="emailData.recipients" 
                      placeholder="多个邮箱用逗号分隔"
                      :disabled="!emailData.enabled"
                      type="textarea"
                      :rows="3"
                    />
                    <span class="form-help">通知邮件将发送给这些邮箱</span>
                  </el-form-item>

                  <el-form-item label="通知级别" prop="level">
                    <el-select 
                      v-model="emailData.level" 
                      style="width: 100%"
                      :disabled="!emailData.enabled"
                    >
                      <el-option label="全部消息" value="all" />
                      <el-option label="仅错误和警告" value="error_warn" />
                      <el-option label="仅错误" value="error" />
                    </el-select>
                    <span class="form-help">选择需要通知的消息级别</span>
                  </el-form-item>

                  <el-form-item>
                    <el-button type="primary" @click="saveEmailConfig" :disabled="!emailData.enabled">保存设置</el-button>
                    <el-button @click="testEmailConfig" :disabled="!emailData.enabled">测试发送</el-button>
                    <el-button @click="resetEmailConfig">重置</el-button>
                  </el-form-item>
                </el-form>
              </el-tab-pane>
            </el-tabs>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </PageContainer>
  </Home>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import Home from '@/components/HomePage.vue';
import PageContainer from '@/components/PageContainer.vue';
import request from '@/utils/request';
import { formatDate } from '@/utils/format';

// 当前激活的选项卡
const activeTab = ref('params');
// 当前激活的通知配置选项卡
const notificationTab = ref('dingtalk');

// 系统参数相关
const paramsForm = ref(null);
const paramsData = ref({
  maxConcurrent: 10,
  taskTimeout: 300,
  dataRetention: '30',
  uploadLimit: 10
});

const paramsRules = {
  maxConcurrent: [
    { required: true, message: '请输入最大并发数', trigger: 'blur' }
  ],
  taskTimeout: [
    { required: true, message: '请输入任务超时时间', trigger: 'blur' }
  ],
  dataRetention: [
    { required: true, message: '请选择数据保留策略', trigger: 'change' }
  ],
  uploadLimit: [
    { required: true, message: '请输入文件上传限制', trigger: 'blur' }
  ]
};

// 保存系统参数
const saveParams = async () => {
  if (!paramsForm.value) return;
  
  await paramsForm.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await request.put('/api/system/params', paramsData.value);
        
        if (response.data.code === 200) {
          ElMessage.success('系统参数保存成功');
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        console.error('保存系统参数失败:', error);
        ElMessage.error(error.message || '保存系统参数失败');
      }
    }
  });
};

// 重置系统参数
const resetParams = () => {
  paramsForm.value?.resetFields();
};

// 日志相关
const logs = ref([]);
const logsLoading = ref(false);
const logLevel = ref('');
const logDateRange = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

// 获取日志列表
const fetchLogs = async () => {
  logsLoading.value = true;
  try {
    const startTime = logDateRange.value?.[0] ? formatDate(logDateRange.value[0], 'yyyy-MM-dd') : '';
    const endTime = logDateRange.value?.[1] ? formatDate(logDateRange.value[1], 'yyyy-MM-dd') : '';
    
    const response = await request.get('/api/system/logs', {
      params: {
        level: logLevel.value,
        startTime,
        endTime,
        page: currentPage.value,
        pageSize: pageSize.value
      }
    });

    if (response.data.code === 200) {
      logs.value = response.data.data.list;
      total.value = response.data.data.total;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('获取日志失败:', error);
    ElMessage.error(error.message || '获取日志失败');
  } finally {
    logsLoading.value = false;
  }
};

// 清空日志
const clearLogs = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有日志吗？此操作不可恢复。',
      '清空确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const response = await request.delete('/api/system/logs');
    
    if (response.data.code === 200) {
      ElMessage.success('日志清空成功');
      fetchLogs(); // 刷新日志列表
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空日志失败:', error);
      ElMessage.error(error.message || '清空日志失败');
    }
  }
};

// 下载日志
const downloadLogs = () => {
  const startTime = logDateRange.value?.[0] ? formatDate(logDateRange.value[0], 'yyyy-MM-dd') : '';
  const endTime = logDateRange.value?.[1] ? formatDate(logDateRange.value[1], 'yyyy-MM-dd') : '';
  
  // 构建下载URL并带上参数
  const params = new URLSearchParams();
  if (logLevel.value) params.append('level', logLevel.value);
  if (startTime) params.append('startTime', startTime);
  if (endTime) params.append('endTime', endTime);
  
  const downloadUrl = `/api/system/logs/download?${params.toString()}`;
  
  // 创建一个隐藏的a标签并点击它来下载
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', `system_logs_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchLogs();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchLogs();
};

// 获取日志级别对应的标签类型
const getLogLevelType = (level) => {
  const types = {
    'error': 'danger',
    'warn': 'warning',
    'info': 'info',
    'debug': 'success'
  };
  return types[level.toLowerCase()] || 'info';
};

// API配置相关
const apiForm = ref(null);
const apiData = ref({
  requestTimeout: 30,
  maxRetries: 3,
  rateLimit: 100,
  apiKey: '',
  allowedIps: ''
});

const apiRules = {
  requestTimeout: [
    { required: true, message: '请输入API请求超时时间', trigger: 'blur' }
  ],
  maxRetries: [
    { required: true, message: '请输入最大重试次数', trigger: 'blur' }
  ],
  rateLimit: [
    { required: true, message: '请输入限流策略', trigger: 'blur' }
  ],
  apiKey: [
    { required: true, message: '请输入API密钥', trigger: 'blur' }
  ]
};

// 生成API密钥
const generateApiKey = async () => {
  try {
    const response = await request.post('/api/system/generate-api-key');
    
    if (response.data.code === 200) {
      apiData.value.apiKey = response.data.data.apiKey;
      ElMessage.success('API密钥生成成功');
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('生成API密钥失败:', error);
    ElMessage.error(error.message || '生成API密钥失败');
  }
};

// 保存API配置
const saveApiConfig = async () => {
  if (!apiForm.value) return;
  
  await apiForm.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await request.put('/api/system/api-config', apiData.value);
        
        if (response.data.code === 200) {
          ElMessage.success('API配置保存成功');
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        console.error('保存API配置失败:', error);
        ElMessage.error(error.message || '保存API配置失败');
      }
    }
  });
};

// 重置API配置
const resetApiConfig = () => {
  apiForm.value?.resetFields();
};

// 备份与恢复相关
const backupLoading = ref(false);
const historyLoading = ref(false);
const backupHistory = ref([]);

// 获取上传请求头
const uploadHeaders = computed(() => {
  return {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  };
});

// 获取备份历史
const fetchBackupHistory = async () => {
  historyLoading.value = true;
  try {
    const response = await request.get('/api/system/backups');
    
    if (response.data.code === 200) {
      backupHistory.value = response.data.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('获取备份历史失败:', error);
    ElMessage.error(error.message || '获取备份历史失败');
  } finally {
    historyLoading.value = false;
  }
};

// 创建备份
const createBackup = async () => {
  backupLoading.value = true;
  try {
    const response = await request.post('/api/system/backup');
    
    if (response.data.code === 200) {
      ElMessage.success('系统备份创建成功');
      fetchBackupHistory(); // 刷新备份历史
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('创建备份失败:', error);
    ElMessage.error(error.message || '创建备份失败');
  } finally {
    backupLoading.value = false;
  }
};

// 下载备份
const downloadBackup = (backup) => {
  const downloadUrl = `/api/system/backups/${backup.filename}/download`;
  
  // 创建一个隐藏的a标签并点击它来下载
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', backup.filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 删除备份
const deleteBackup = async (backup) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除备份文件 "${backup.filename}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const response = await request.delete(`/api/system/backups/${backup.filename}`);
    
    if (response.data.code === 200) {
      ElMessage.success('备份删除成功');
      fetchBackupHistory(); // 刷新备份历史
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除备份失败:', error);
      ElMessage.error(error.message || '删除备份失败');
    }
  }
};

// 恢复前检查文件
const beforeRestoreUpload = (file) => {
  const isZip = file.type === 'application/zip' || file.name.endsWith('.zip');
  const isLessThan500M = file.size / 1024 / 1024 < 500;

  if (!isZip) {
    ElMessage.error('只能上传ZIP备份文件!');
    return false;
  }
  
  if (!isLessThan500M) {
    ElMessage.error('文件大小不能超过 500MB!');
    return false;
  }
  
  return ElMessageBox.confirm(
    '恢复操作将覆盖当前系统配置和数据，确定要继续吗？',
    '恢复确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => true).catch(() => false);
};

// 恢复成功处理
const handleRestoreSuccess = (response) => {
  if (response.code === 200) {
    ElMessage.success('系统已成功恢复，请刷新页面');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } else {
    ElMessage.error(response.message || '系统恢复失败');
  }
};

// 恢复失败处理
const handleRestoreError = (error) => {
  console.error('系统恢复失败:', error);
  ElMessage.error('系统恢复失败，请检查备份文件是否有效');
};

// 通知配置相关
// 钉钉机器人配置
const dingtalkForm = ref(null);
const dingtalkData = ref({
  enabled: false,
  webhook: '',
  secret: '',
  atMobiles: '',
  level: 'error_warn'
});

const dingtalkRules = {
  webhook: [
    { required: true, message: '请输入钉钉机器人Webhook地址', trigger: 'blur' },
    { pattern: /^https:\/\/oapi\.dingtalk\.com\/robot\/send\?access_token=.+/, message: 'Webhook地址格式不正确', trigger: 'blur' }
  ]
};

// 保存钉钉配置
const saveDingtalkConfig = async () => {
  if (!dingtalkForm.value) return;
  
  await dingtalkForm.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await request.put('/api/system/notification/dingtalk', dingtalkData.value);
        
        if (response.data.code === 200) {
          ElMessage.success('钉钉机器人配置保存成功');
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        console.error('保存钉钉机器人配置失败:', error);
        ElMessage.error(error.message || '保存钉钉机器人配置失败');
      }
    }
  });
};

// 测试钉钉连接
const testDingtalkConfig = async () => {
  try {
    const response = await request.post('/api/system/notification/dingtalk/test', dingtalkData.value);
    
    if (response.data.code === 200) {
      ElMessage.success('钉钉机器人测试消息发送成功');
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('钉钉机器人测试失败:', error);
    ElMessage.error(error.message || '钉钉机器人测试失败');
  }
};

// 重置钉钉配置
const resetDingtalkConfig = () => {
  dingtalkForm.value?.resetFields();
};

// 企业微信机器人配置
const wechatForm = ref(null);
const wechatData = ref({
  enabled: false,
  webhook: '',
  mentionedList: '',
  level: 'error_warn'
});

const wechatRules = {
  webhook: [
    { required: true, message: '请输入企业微信机器人Webhook地址', trigger: 'blur' },
    { pattern: /^https:\/\/qyapi\.weixin\.qq\.com\/cgi-bin\/webhook\/send\?key=.+/, message: 'Webhook地址格式不正确', trigger: 'blur' }
  ]
};

// 保存企业微信配置
const saveWechatConfig = async () => {
  if (!wechatForm.value) return;
  
  await wechatForm.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await request.put('/api/system/notification/wechat', wechatData.value);
        
        if (response.data.code === 200) {
          ElMessage.success('企业微信机器人配置保存成功');
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        console.error('保存企业微信机器人配置失败:', error);
        ElMessage.error(error.message || '保存企业微信机器人配置失败');
      }
    }
  });
};

// 测试企业微信连接
const testWechatConfig = async () => {
  try {
    const response = await request.post('/api/system/notification/wechat/test', wechatData.value);
    
    if (response.data.code === 200) {
      ElMessage.success('企业微信机器人测试消息发送成功');
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('企业微信机器人测试失败:', error);
    ElMessage.error(error.message || '企业微信机器人测试失败');
  }
};

// 重置企业微信配置
const resetWechatConfig = () => {
  wechatForm.value?.resetFields();
};

// 邮件配置
const emailForm = ref(null);
const emailData = ref({
  enabled: false,
  host: '',
  port: 25,
  secure: 'none',
  username: '',
  password: '',
  recipients: '',
  level: 'error_warn'
});

const emailRules = {
  host: [
    { required: true, message: '请输入SMTP服务器地址', trigger: 'blur' }
  ],
  port: [
    { required: true, message: '请输入SMTP端口', trigger: 'blur' }
  ],
  username: [
    { required: true, message: '请输入发件人邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入邮箱密码或授权码', trigger: 'blur' }
  ],
  recipients: [
    { required: true, message: '请输入至少一个收件人邮箱', trigger: 'blur' }
  ]
};

// 保存邮件配置
const saveEmailConfig = async () => {
  if (!emailForm.value) return;
  
  await emailForm.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await request.put('/api/system/notification/email', emailData.value);
        
        if (response.data.code === 200) {
          ElMessage.success('邮件配置保存成功');
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        console.error('保存邮件配置失败:', error);
        ElMessage.error(error.message || '保存邮件配置失败');
      }
    }
  });
};

// 测试邮件发送
const testEmailConfig = async () => {
  try {
    const response = await request.post('/api/system/notification/email/test', emailData.value);
    
    if (response.data.code === 200) {
      ElMessage.success('测试邮件发送成功');
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('测试邮件发送失败:', error);
    ElMessage.error(error.message || '测试邮件发送失败');
  }
};

// 重置邮件配置
const resetEmailConfig = () => {
  emailForm.value?.resetFields();
};

// 获取系统配置
const getSystemConfig = async () => {
  try {
    // 获取系统参数
    const paramsResponse = await request.get('/api/system/params');
    if (paramsResponse.data.code === 200) {
      paramsData.value = { ...paramsData.value, ...paramsResponse.data.data };
    }
    
    // 获取API配置
    const apiResponse = await request.get('/api/system/api-config');
    if (apiResponse.data.code === 200) {
      apiData.value = { ...apiData.value, ...apiResponse.data.data };
    }
    
    // 获取钉钉机器人配置
    const dingtalkResponse = await request.get('/api/system/notification/dingtalk');
    if (dingtalkResponse.data.code === 200) {
      dingtalkData.value = { ...dingtalkData.value, ...dingtalkResponse.data.data };
    }
    
    // 获取企业微信机器人配置
    const wechatResponse = await request.get('/api/system/notification/wechat');
    if (wechatResponse.data.code === 200) {
      wechatData.value = { ...wechatData.value, ...wechatResponse.data.data };
    }
    
    // 获取邮件配置
    const emailResponse = await request.get('/api/system/notification/email');
    if (emailResponse.data.code === 200) {
      emailData.value = { ...emailData.value, ...emailResponse.data.data };
    }
    
    // 获取备份历史
    await fetchBackupHistory();
    
    // 获取日志
    await fetchLogs();
  } catch (error) {
    console.error('获取系统配置失败:', error);
    ElMessage.error('获取系统配置失败');
  }
};

onMounted(() => {
  getSystemConfig();
});
</script>

<style scoped>
.system-config-card {
  margin: 0 auto;
  max-width: 1000px;
}

.form-help {
  color: #909399;
  font-size: 13px;
  margin-left: 10px;
}

.form-action {
  margin-top: 5px;
  display: flex;
  justify-content: flex-end;
}

/* 日志筛选区域 */
.filter-container {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

/* 分页区域 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 备份与恢复区域 */
.backup-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.backup-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.backup-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.upload-area {
  margin-top: 20px;
}

/* 通知配置相关样式 */
.notification-tabs {
  margin-top: 10px;
}

.notification-tabs :deep(.el-tabs__header) {
  margin-right: 20px;
}

.notification-tabs :deep(.el-tabs__item) {
  height: 40px;
  line-height: 40px;
  min-width: 120px;
}

.notification-tabs :deep(.el-form) {
  max-width: 600px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .backup-options {
    grid-template-columns: 1fr;
  }
  
  .filter-container {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filter-container > * {
    margin-bottom: 10px;
    width: 100% !important;
  }
  
  .notification-tabs {
    display: flex;
    flex-direction: column;
  }
  
  .notification-tabs :deep(.el-tabs__header) {
    margin-right: 0;
    margin-bottom: 20px;
  }
}
</style> 