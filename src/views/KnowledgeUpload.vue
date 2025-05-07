<template>
  <Home>
    <PageContainer :title="knowledgeInfo.name + ' - 文件上传'">
      <el-card class="upload-card">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="文件上传" name="upload">
            <div class="knowledge-info">
              <div class="info-item">
                <span class="label">知识库ID:</span>
                <span class="value">{{ knowledgeInfo.id }}</span>
              </div>
              <div class="info-item">
                <span class="label">数据集ID:</span>
                <span class="value">{{ knowledgeInfo.datasetId }}</span>
              </div>
              <div class="info-item">
                <span class="label">空间ID:</span>
                <span class="value">{{ knowledgeInfo.spaceId }}</span>
              </div>
              <div class="info-item">
                <span class="label">类型:</span>
                <span class="value">{{ parseInt(knowledgeInfo.formatType) === 0 ? '文本类型' : '图片类型' }}</span>
              </div>
            </div>

            <!-- 分段规则设置 -->
            <el-divider content-position="left">分段规则设置</el-divider>
            
            <el-form :model="chunkStrategyForm" label-width="140px" class="chunk-strategy-form">
              <!-- 文本类型知识库设置 -->
              <template v-if="parseInt(knowledgeInfo.formatType) === 0">
                <el-form-item label="分段设置方式">
                  <el-radio-group v-model="chunkStrategyForm.chunk_type">
                    <el-radio :label="0">自动分段与清洗</el-radio>
                    <el-radio :label="1">自定义分段规则</el-radio>
                  </el-radio-group>
                  <div class="form-help">
                    自动分段：系统使用扫描规则进行数据分段处理<br>
                    自定义：需要设置分段标记符、最大分段长度等
                  </div>
                </el-form-item>

                <template v-if="chunkStrategyForm.chunk_type === 1">
                  <el-form-item label="分段标记符" required>
                    <el-input 
                      v-model="chunkStrategyForm.separator" 
                      placeholder="如 \n\n 表示空行分段"
                    />
                    <div class="form-help">定义文档如何被分割成小块的标记</div>
                  </el-form-item>
                  
                  <el-form-item label="最大分段长度" required>
                    <el-slider 
                      v-model="chunkStrategyForm.max_tokens" 
                      :min="100" 
                      :max="2000" 
                      :step="50"
                      show-input
                    />
                    <div class="form-help">每个分段最大令牌数，范围100-2000</div>
                  </el-form-item>
                  
                  <el-form-item label="过滤连续空白符">
                    <el-switch 
                      v-model="chunkStrategyForm.remove_extra_spaces"
                      active-text="开启"
                      inactive-text="关闭"
                    />
                    <div class="form-help">自动过滤连续的空格、换行符和制表符</div>
                  </el-form-item>
                  
                  <el-form-item label="过滤URL和邮箱">
                    <el-switch 
                      v-model="chunkStrategyForm.remove_urls_emails"
                      active-text="开启"
                      inactive-text="关闭"
                    />
                    <div class="form-help">自动过滤所有URL和电子邮箱地址</div>
                  </el-form-item>
                </template>
              </template>
              
              <!-- 图片类型知识库设置 -->
              <template v-else>
                <el-form-item label="图片标注方式">
                  <el-radio-group v-model="chunkStrategyForm.caption_type">
                    <el-radio :label="0">系统自动标注</el-radio>
                    <el-radio :label="1">手工标注</el-radio>
                  </el-radio-group>
                  <div class="form-help">
                    自动标注：系统自动标注描述信息<br>
                    手工标注：上传图片后需要再次调用API更新知识库图片描述
                  </div>
                </el-form-item>
              </template>
            </el-form>

            <el-divider content-position="left">文件上传</el-divider>

            <!-- 文件解析进度 -->
            <div v-if="showProgress" class="parsing-progress-container">
              <div class="parsing-progress-header">
                <el-icon :class="parsingProgress >= 100 ? 'success-icon' : 'processing-icon'">
                  <component :is="parsingProgress >= 100 ? 'Check' : 'Loading'" />
                </el-icon>
                <span>{{ parsingMessage }}</span>
              </div>
              <el-progress 
                :percentage="parsingProgress" 
                :status="parsingProgress >= 100 ? 'success' : ''"
                :stroke-width="18"
              />
            </div>

            <el-upload
              class="upload-container"
              drag
              multiple
              :auto-upload="false"
              :on-change="handleFileChange"
              :file-list="uploadFileList"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持上传PDF、Word、Excel、TXT等多种格式文件，单文件不超过10MB
                </div>
              </template>
            </el-upload>

            <div class="upload-actions">
              <el-button type="primary" @click="handleUpload" :loading="uploading">
                开始上传
              </el-button>
              <el-button @click="clearFiles">清空文件</el-button>
            </div>
          </el-tab-pane>

          <el-tab-pane label="文件列表" name="filelist">
            <el-table :data="parsedFileList" style="width: 100%" v-loading="tableLoading">
              <el-table-column prop="name" label="文件名称" min-width="200">
                <template #default="scope">
                  <div class="file-name-cell">
                    <el-icon><document /></el-icon>
                    <el-link type="primary" @click="previewFile(scope.row)">{{ scope.row.name }}</el-link>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="size" label="大小" width="120">
                <template #default="scope">
                  {{ formatFileSize(scope.row.size) }}
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="上传时间" width="180">
                <template #default="scope">
                  {{ formatTime(scope.row.createTime) }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="120">
                <template #default="scope">
                  <el-tag type="success">已完成</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="sourceType" label="上传方式" width="100">
                <template #default="scope">
                  <span>{{ getSourceTypeText(scope.row.sourceType) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="chunkStrategy" label="分段规则" min-width="180">
                <template #default="scope">
                  <el-tooltip effect="dark" :content="JSON.stringify(scope.row.chunkStrategy, null, 2)" placement="top">
                    <span style="cursor:pointer;">{{ shortChunkStrategy(scope.row.chunkStrategy) }}</span>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column prop="charCount" label="字符数" width="80">
                <template #default="scope">
                  <span>{{ scope.row.charCount }}</span>
                </template>
              </el-table-column>
              <el-table-column label="下载" width="120">
                <template #default="scope">
                  <el-link v-if="scope.row.webUrl" :href="scope.row.webUrl" target="_blank">下载</el-link>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </PageContainer>
  </Home>

  <el-dialog v-model="previewDialogVisible" title="文件预览" width="500px">
    <div style="margin-bottom: 12px; font-weight: bold;">{{ previewFileInfo.name }}</div>
    <el-link v-if="previewFileInfo.webUrl" :href="previewFileInfo.webUrl" target="_blank">点击下载/在线预览</el-link>
    <div v-else>暂不支持预览</div>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { UploadFilled, Document, Loading, Check } from '@element-plus/icons-vue';
import Home from '@/components/HomePage.vue';
import PageContainer from '@/components/PageContainer.vue';
import request from '@/utils/request';

const route = useRoute();
const router = useRouter();

// 知识库基本信息
const knowledgeInfo = ref({
  id: route.query.id || '',
  name: route.query.name || '知识库文件上传',
  spaceId: route.query.spaceId || '',
  formatType: route.query.formatType || 0,
  datasetId: route.query.datasetId || ''
});

// 文件列表
const fileList = ref([]);
const tableLoading = ref(false);
const uploadFileList = ref([]);
const uploading = ref(false);

// 解析进度相关
const showProgress = ref(false);
const parsingProgress = ref(0);
const parsingProgressTimer = ref(null);
const parsingMessage = ref('文件解析中...');
const lastUploadDocumentIds = ref([]); // 记录最近上传的文件ID

// 分段规则表单
const chunkStrategyForm = ref({
  // 默认文本类型设置
  chunk_type: parseInt(knowledgeInfo.value.formatType) === 0 ? 1 : undefined, // 默认自定义
  separator: "\n\n",
  max_tokens: 800,
  remove_extra_spaces: false,
  remove_urls_emails: false,
  
  // 默认图片类型设置
  caption_type: parseInt(knowledgeInfo.value.formatType) === 0 ? undefined : 0 // 默认自动标注
});

// 上传相关配置
const token = localStorage.getItem('token') || '';
const maxFileSize = 10 * 1024 * 1024; // 10MB

// 支持的文件类型映射
const fileTypeMap = {
  'pdf': 'pdf',
  'doc': 'doc',
  'docx': 'docx',
  'xls': 'xls',
  'xlsx': 'xlsx',
  'txt': 'txt',
  'csv': 'csv',
  'ppt': 'ppt',
  'pptx': 'pptx',
  'png': 'png',
  'jpg': 'jpg',
  'jpeg': 'jpeg'
};

// 获取已上传文件列表
const fetchFileList = async () => {
  if (!knowledgeInfo.value.datasetId) return;
  
  tableLoading.value = true;
  try {
    const response = await request.post('/api/rag/documents', {
      dataset_id: knowledgeInfo.value.datasetId,
      page: 1,
      size: 10
    });
    if (response.data.code === 200) {
      // 适配后端返回的document_list字段
      const documents = response.data.data?.document_list || [];
      fileList.value = documents.map(file => ({
        charCount: file.char_count,
        chunkStrategy: file.chunk_strategy,
        createTime: file.create_time,
        documentId: file.document_id,
        formatType: file.format_type,
        hitCount: file.hit_count,
        name: file.name,
        size: file.size,
        sliceCount: file.slice_count,
        sourceType: file.source_type,
        status: file.status,
        type: file.type,
        updateInterval: file.update_interval,
        updateTime: file.update_time,
        webUrl: file.web_url
      }));
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('获取文件列表失败:', error);
    ElMessage.error('获取文件列表失败');
  } finally {
    tableLoading.value = false;
  }
};

// 获取文件状态文本
const getFileStatus = (status) => {
  const statusMap = {
    0: '处理中',
    1: '处理完毕',
    9: '处理失败'
  };
  return statusMap[status] || '未知';
};

// 文件选择处理
const handleFileChange = (file) => {
  // 检查文件大小
  if (file.raw.size > maxFileSize) {
    ElMessage.error(`文件 ${file.name} 大小超过10MB，无法上传`);
    return;
  }
  
  // 检查文件类型
  const extension = file.name.split('.').pop().toLowerCase();
  if (!fileTypeMap[extension]) {
    ElMessage.error(`不支持的文件类型: ${extension}`);
    return;
  }
  
  // 已经存在相同文件名的文件
  const isDuplicate = uploadFileList.value.some(item => item.name === file.name);
  if (isDuplicate) {
    ElMessage.warning(`文件 ${file.name} 已经存在`);
    return;
  }
  
  // 添加到上传列表
  uploadFileList.value.push(file);
};

// 获取文件的Base64编码
const getFileBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // 移除Base64前缀，如"data:application/pdf;base64,"
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
};

// 获取文件类型
const getFileType = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  return fileTypeMap[extension] || extension;
};

// 获取分段规则
const getChunkStrategy = () => {
  const formatType = parseInt(knowledgeInfo.value.formatType);
  
  // 根据知识库类型返回相应的分段规则
  if (formatType === 2) {
    // 图片类型知识库
    return {
      caption_type: chunkStrategyForm.value.caption_type
    };
  } else {
    // 文本类型知识库 - 始终返回完整的参数结构
    return {
      separator: chunkStrategyForm.value.separator,
      max_tokens: chunkStrategyForm.value.max_tokens,
      remove_extra_spaces: chunkStrategyForm.value.remove_extra_spaces,
      remove_urls_emails: chunkStrategyForm.value.remove_urls_emails,
      chunk_type: chunkStrategyForm.value.chunk_type
    };
  }
};

// 上传文件
const handleUpload = async () => {
  if (uploadFileList.value.length === 0) {
    ElMessage.warning('请先选择要上传的文件');
    return;
  }
  
  // 验证分段规则参数
  const formatType = parseInt(knowledgeInfo.value.formatType);
  if (formatType === 0 && chunkStrategyForm.value.chunk_type === 1) {
    if (!chunkStrategyForm.value.separator) {
      ElMessage.error('请输入分段标记符');
      return;
    }
    if (!chunkStrategyForm.value.max_tokens || 
        chunkStrategyForm.value.max_tokens < 100 || 
        chunkStrategyForm.value.max_tokens > 2000) {
      ElMessage.error('最大分段长度必须在100-2000之间');
      return;
    }
  }
  
  uploading.value = true;
  
  try {
    // 构建请求参数
    const documentBases = [];
    
    // 处理每个文件
    for (const file of uploadFileList.value) {
      try {
        const fileType = getFileType(file.name);
        console.log('处理文件:', file.name, fileType);
        if (["jpg", "jpeg", "png"].includes(fileType.toLowerCase())) {
          const formData = new FormData();
          formData.append('file', file.raw);
          const imgUploadResp = await request.post('/api/rag/file/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          console.log('图片上传返回:', imgUploadResp.data);
          const fileId = imgUploadResp.data.data?.api_response?.data?.id;
          if (imgUploadResp.data.code === 200 && fileId) {
            documentBases.push({
              name: file.name,
              source_info: {
                source_file_id: fileId,
                document_source: 5
              }
            });
            console.log('已push图片元数据:', documentBases);
          } else {
            throw new Error('图片文件上传失败');
          }
        } else {
          // 其它类型文件仍然用base64
          const base64Content = await getFileBase64(file.raw);
          documentBases.push({
            name: file.name,
            source_info: {
              file_base64: base64Content,
              file_type: fileType
            }
          });
        }
      } catch (error) {
        console.error(`处理文件 ${file.name} 失败:`, error);
        ElMessage.error(`处理文件 ${file.name} 失败`);
      }
    }
    console.log('最终documentBases:', documentBases);
    
    // 发送请求
    const response = await request.post(`/api/rag/upload`, {
      dataset_id: knowledgeInfo.value.datasetId,
      document_bases: documentBases,
      chunk_strategy: {
        caption_type: chunkStrategyForm.value.caption_type
      },
      format_type: parseInt(knowledgeInfo.value.formatType)
    });
    
    if (response.data.code === 200) {
      ElMessage.success('文件上传成功');
      uploadFileList.value = []; // 清空上传列表

      // 提取上传文件的document_id信息
      const documentInfos = response.data.data?.document_infos || [];
      if (documentInfos.length > 0) {
        lastUploadDocumentIds.value = documentInfos.map(info => info.document_id);
      } else {
        lastUploadDocumentIds.value = [];
      }
      fetchFileList(); // 刷新文件列表
      // 开始轮询解析进度
      startProgressPolling();
    } else {
      throw new Error(response.data.message || '上传失败');
    }
  } catch (error) {
    console.error('上传文件失败:', error);
    ElMessage.error(error.message || '上传文件失败');
  } finally {
    uploading.value = false;
  }
};

// 开始轮询解析进度
const startProgressPolling = () => {
  // 重置进度状态
  showProgress.value = true;
  parsingProgress.value = 0;
  parsingMessage.value = '文件解析中...';
  if (parsingProgressTimer.value) {
    clearInterval(parsingProgressTimer.value);
  }
  parsingProgressTimer.value = setInterval(fetchParsingProgress, 5000);
  fetchParsingProgress();
};

// 查询解析进度
const fetchParsingProgress = async () => {
  if (!lastUploadDocumentIds.value.length) {
    stopProgressPolling();
    return;
  }
  try {
    const response = await request.post('/api/rag/progress', {
      space_id: knowledgeInfo.value.spaceId,
      dataset_id: knowledgeInfo.value.datasetId,
      document_ids: lastUploadDocumentIds.value
    });
    if (response.data.code === 200) {
      const progresses = response.data.data?.data || [];
      if (!progresses.length) {
        // 没有进度信息，继续轮询
        return;
      }
      let allDone = true;
      let totalProgress = 0;
      let hasFailedFiles = false;
      progresses.forEach(item => {
        const status = item.status || 0;
        // 直接用后端progress字段
        const progress = typeof item.progress === 'number' ? item.progress : 0;
        totalProgress += progress;
        if (progress < 100 && status !== 2 && status !== 3) {
          allDone = false;
        }
        if (status === 3) {
          hasFailedFiles = true;
        }
      });
      const averageProgress = Math.round(totalProgress / progresses.length);
      parsingProgress.value = averageProgress;
      if (hasFailedFiles) {
        parsingMessage.value = '部分文件解析失败';
      } else if (!allDone) {
        parsingMessage.value = `文件解析中 (${averageProgress}%)...`;
      } else {
        parsingMessage.value = '文件解析完成';
      }
      // 只要全部完成，立即停止轮询
      if (allDone) {
        parsingProgress.value = 100;
        stopProgressPolling();
        fetchFileList();
      }
    } else {
      console.error('获取解析进度失败:', response.data.message);
    }
  } catch (error) {
    console.error('获取解析进度失败:', error);
  }
};

// 停止轮询解析进度
const stopProgressPolling = () => {
  if (parsingProgressTimer.value) {
    clearInterval(parsingProgressTimer.value);
    parsingProgressTimer.value = null;
  }
  
  // 5秒后隐藏进度条
  setTimeout(() => {
    showProgress.value = false;
  }, 5000);
};

// 组件卸载时清除定时器
onUnmounted(() => {
  if (parsingProgressTimer.value) {
    clearInterval(parsingProgressTimer.value);
  }
});

// 清空文件列表
const clearFiles = () => {
  uploadFileList.value = [];
};

// 删除文件
const handleDelete = async (file) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件 "${file.fileName}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 使用document_id删除文件
    const response = await request.delete(`/api/rag/document/${file.documentId}`);
    
    if (response.data.code === 200) {
      ElMessage.success('文件删除成功');
      fetchFileList(); // 刷新文件列表
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除文件失败:', error);
      ElMessage.error(error.message || '删除文件失败');
    }
  }
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 返回知识库列表
const goBack = () => {
  router.push('/knowledge-base');
};

const activeTab = ref('upload');

// 只展示所有文件
const parsedFileList = computed(() => fileList.value);

const formatTime = (timestamp) => {
  if (!timestamp) return '未知';
  const ts = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
  return new Date(ts).toLocaleString();
};

const getSourceTypeText = (type) => {
  const map = {
    0: '本地',
    1: '网页'
  };
  return map[type] || '未知';
};

const shortChunkStrategy = (strategy) => {
  if (!strategy) return '';
  // 简要显示分段类型和主参数
  if (strategy.chunk_type === 1) {
    return `自定义(${strategy.separator || ''}, ${strategy.max_tokens || ''})`;
  } else if (strategy.chunk_type === 0) {
    return '自动分段';
  } else if (strategy.caption_type !== undefined) {
    return `图片标注:${strategy.caption_type}`;
  }
  return '未知';
};

const previewDialogVisible = ref(false);
const previewFileInfo = ref({});
const previewFile = (row) => {
  previewFileInfo.value = row;
  previewDialogVisible.value = true;
};

onMounted(() => {
  if (!knowledgeInfo.value.id) {
    ElMessage.error('知识库信息不完整，无法加载');
    router.push('/knowledge-base');
    return;
  }
  
  fetchFileList();
});
</script>

<style scoped>
.upload-card {
  margin-bottom: 20px;
}

.knowledge-info {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
}

.label {
  font-weight: bold;
  margin-right: 8px;
  color: #606266;
}

.value {
  color: #303133;
}

.chunk-strategy-form {
  margin-bottom: 20px;
}

.form-help {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.5;
}

.upload-container {
  width: 100%;
  margin-bottom: 20px;
}

.upload-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.file-list-section {
  margin-top: 20px;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-tip {
  margin-top: 10px;
  color: #606266;
}

.el-upload {
  width: 100%;
}

.el-upload-dragger {
  width: 100%;
}

.parsing-progress-container {
  margin-bottom: 20px;
}

.parsing-progress-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.success-icon {
  color: #67C23A;
}

.processing-icon {
  color: #E6A23C;
}
</style> 