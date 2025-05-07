<template>
  <Home>
    <PageContainer title="智能测试用例维护">
      <div class="smart-testcases-container">
        <div class="header-actions">
          <el-button type="primary" @click="showGenerateDialog">
            <el-icon><Plus /></el-icon>测试用例生成
          </el-button>
          <el-button type="success" @click="showEnhanceDialog">
            <el-icon><Star /></el-icon>智能增强测试用例生成
          </el-button>
        </div>
        
        <div class="content-area">
          <h2>智能测试用例维护</h2>
          <p>这里是智能测试用例维护页面，可以上传文件生成智能测试用例。</p>
        </div>
        
        <!-- 文件上传弹窗 -->
        <el-dialog
          title="上传文件生成测试用例"
          v-model="dialogVisible"
          width="500px"
        >
          <el-upload
            class="upload-container"
            drag
            multiple
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="uploadFileList"
          >
            <el-icon class="el-icon--upload"><Upload /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                请上传项目文件，系统将自动生成智能测试用例
              </div>
            </template>
          </el-upload>
          
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="dialogVisible = false">取消</el-button>
              <el-button type="primary" @click="handleUpload" :loading="uploading">
                上传
              </el-button>
            </span>
          </template>
        </el-dialog>
        
        <!-- 智能增强测试用例生成弹窗 -->
        <el-dialog
          title="智能增强测试用例生成"
          v-model="enhanceDialogVisible"
          width="500px"
        >
          <el-upload
            class="upload-container"
            drag
            multiple
            :auto-upload="false"
            :on-change="handleEnhanceFileChange"
            :file-list="enhanceFileList"
          >
            <el-icon class="el-icon--upload"><Upload /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                上传项目文件，系统将自动生成智能增强测试用例
              </div>
            </template>
          </el-upload>
          
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="enhanceDialogVisible = false">取消</el-button>
              <el-button type="success" @click="handleEnhanceUpload" :loading="enhanceUploading">
                开始增强
              </el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </PageContainer>
  </Home>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import Home from '@/components/HomePage.vue';
import PageContainer from '@/components/PageContainer.vue';
import request from '@/utils/request';

// 弹窗控制
const dialogVisible = ref(false);
const uploadFileList = ref([]);
const uploading = ref(false);

// 智能增强弹窗控制
const enhanceDialogVisible = ref(false);
const enhanceFileList = ref([]);
const enhanceUploading = ref(false);

// 显示生成对话框
const showGenerateDialog = () => {
  dialogVisible.value = true;
};

// 显示增强对话框
const showEnhanceDialog = () => {
  enhanceDialogVisible.value = true;
};

// 文件变更处理
const handleFileChange = (file) => {
  // 检查文件是否已在列表中
  const isDuplicate = uploadFileList.value.some(item => item.name === file.name);
  if (isDuplicate) {
    ElMessage.warning(`文件 ${file.name} 已经存在`);
    return;
  }
  
  // 添加到上传列表
  uploadFileList.value.push(file);
};

// 增强文件变更处理
const handleEnhanceFileChange = (file) => {
  // 检查文件是否已在列表中
  const isDuplicate = enhanceFileList.value.some(item => item.name === file.name);
  if (isDuplicate) {
    ElMessage.warning(`文件 ${file.name} 已经存在`);
    return;
  }
  
  // 添加到上传列表
  enhanceFileList.value.push(file);
};

// 上传文件
const handleUpload = async () => {
  if (uploadFileList.value.length === 0) {
    ElMessage.warning('请先选择要上传的文件');
    return;
  }
  
  uploading.value = true;
  
  try {
    for (const file of uploadFileList.value) {
      const formData = new FormData();
      formData.append('file', file.raw);
      
      // 调用/api/agent/file/parse接口
      const response = await request.post('/api/agent/file/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.code === 200) {
        ElMessage.success(`文件 ${file.name} 解析成功`);
      } else {
        ElMessage.error(`文件 ${file.name} 解析失败: ${response.data.message}`);
      }
    }
    
    // 上传完成后关闭对话框并清空文件列表
    dialogVisible.value = false;
    uploadFileList.value = [];
  } catch (error) {
    console.error('上传文件失败:', error);
    ElMessage.error('上传文件失败，请检查网络连接或联系管理员');
  } finally {
    uploading.value = false;
  }
};

// 处理增强上传
const handleEnhanceUpload = async () => {
  if (enhanceFileList.value.length === 0) {
    ElMessage.warning('请先选择要上传的文件');
    return;
  }
  
  enhanceUploading.value = true;
  
  try {
    for (const file of enhanceFileList.value) {
      const formData = new FormData();
      formData.append('file', file.raw);
      formData.append('enhance', 'true'); // 添加增强标记
      
      // 调用/api/agent/file/parse接口并标记为增强模式
      const response = await request.post('/api/agent/file/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.code === 200) {
        ElMessage.success(`文件 ${file.name} 增强解析成功`);
      } else {
        ElMessage.error(`文件 ${file.name} 增强解析失败: ${response.data.message}`);
      }
    }
    
    // 上传完成后关闭对话框并清空文件列表
    enhanceDialogVisible.value = false;
    enhanceFileList.value = [];
  } catch (error) {
    console.error('增强上传文件失败:', error);
    ElMessage.error('增强上传文件失败，请检查网络连接或联系管理员');
  } finally {
    enhanceUploading.value = false;
  }
};
</script>

<style scoped>
.smart-testcases-container {
  padding: 20px;
}

.header-actions {
  margin-bottom: 20px;
}

.header-actions .el-button {
  margin-right: 10px;
}

.content-area {
  text-align: center;
  padding: 40px;
}

.upload-container {
  width: 100%;
}
</style> 