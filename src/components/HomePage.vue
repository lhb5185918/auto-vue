<template>
  <div id="app">
    <div class="container">
      <!-- 左侧菜单栏 -->
      <div class="sidebar">
        <div class="logo-area">
          <img src="@/assets/logo.svg" alt="系统Logo">
          <span>自动化测试平台</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          background-color="#333"
          text-color="#fff"
          active-text-color="#409EFF"
          :unique-opened="true"
          :router="true"
        >
          <el-menu-item index="/">
            <el-icon><Odometer /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>

          <el-sub-menu index="project">
            <template #title>
              <el-icon><Folder /></el-icon>
              <span>项目管理</span>
            </template>
            <el-menu-item index="/project">项目列表</el-menu-item>
            <el-menu-item index="/project-analysis">项目分析</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="test">
            <template #title>
              <el-icon><Files /></el-icon>
              <span>测试管理</span>
            </template>
            <el-menu-item index="/testcases">测试用例</el-menu-item>
            <el-menu-item index="/test-plan">测试计划</el-menu-item>
            <el-menu-item index="/test-execution">用例执行</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="report">
            <template #title>
              <el-icon><DataAnalysis /></el-icon>
              <span>测试报告</span>
            </template>
            <el-menu-item index="/execution-report">执行报告</el-menu-item>
            <el-menu-item index="/analysis-report">分析报告</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="system">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="/user-manage">用户管理</el-menu-item>
            <el-menu-item index="/role-manage">角色权限</el-menu-item>
            <el-menu-item index="/system-config">系统配置</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>

      <!-- 主内容区域 -->
      <div class="main-content">
        <div class="header">
          <div class="header-content">
            <div class="header-right">
              <el-space :size="20" class="header-items">
                <div class="action-buttons">
                  <el-button type="primary" @click="showModal = true">创建项目</el-button>
                  <el-button @click="viewProjectInfo">项目信息</el-button>
                </div>
                <el-dropdown trigger="click">
                  <div class="user-info">
                    <img src="@/assets/logo.svg" alt="用户头像">
                    <span>用户名</span>
                    <el-icon class="el-icon--right"><arrow-down /></el-icon>
                  </div>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item>
                        <router-link to="/profile">个人中心</router-link>
                      </el-dropdown-item>
                      <el-dropdown-item>
                        <router-link to="/settings">设置</router-link>
                      </el-dropdown-item>
                      <el-dropdown-item divided @click="logout">
                        退出登录
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </el-space>
            </div>
          </div>
        </div>

        <!-- 修改内容展示区域 -->
        <div class="content">
          <slot></slot>
        </div>
      </div>
    </div>

    <!-- 创建项目弹窗 -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2>创建项目</h2>
          <button class="close-button" @click="showModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <label for="projectName">项目名称:</label>
          <input type="text" v-model="projectName" id="projectName" required />
          <label for="projectDescription">项目描述:</label>
          <textarea v-model="projectDescription" id="projectDescription" required></textarea>
        </div>
        <div class="modal-footer">
          <button @click="createProject">创建</button>
          <button @click="showModal = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  Odometer,
  Folder,
  Files,
  DataAnalysis,
  Setting,
  User,
  ArrowDown
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const activeMenu = ref(route.path);
const showModal = ref(false);
const projectName = ref('');
const projectDescription = ref('');

// 创建项目方法
const createProject = async () => {
  if (!projectName.value || !projectDescription.value) {
    ElMessage.warning('请填写完整的信息');
    return;
  }

  try {
    const response = await fetch('http://localhost:8000/api/project/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: projectName.value,
        description: projectDescription.value,
      }),
    });

    if (!response.ok) {
      throw new Error('网络响应不正常');
    }

    const data = await response.json();
    ElMessage.success('项目创建成功');
    showModal.value = false;
    projectName.value = '';
    projectDescription.value = '';
    router.push('/project');
  } catch (error) {
    console.error('创建项目失败:', error);
    ElMessage.error('创建项目失败，请重试');
  }
};

// 查看项目信息
const viewProjectInfo = () => {
  router.push('/project');
};

// 退出登录
const logout = () => {
  // 清除本地存储的token等信息
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  router.push('/login');
  ElMessage.success('退出成功');
};

onMounted(() => {
  activeMenu.value = route.path;
});
</script>

<style scoped>
body {
  margin: 0;
  font-family: Arial, sans-serif;
}

.container {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 240px;
  background-color: #333;
  color: white;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.logo-area {
  padding: 20px;
  display: flex;
  align-items: center;
  background-color: #2b2b2b;
}

.logo-area img {
  height: 32px;
  margin-right: 10px;
}

.logo-area span {
  font-size: 16px;
  font-weight: bold;
}

/* 菜单样式优化 */
.sidebar-menu {
  border-right: none;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}

:deep(.el-menu-item.is-active) {
  background-color: #409EFF20 !important;
}

:deep(.el-sub-menu__title) {
  height: 50px;
  line-height: 50px;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: #4c4c4c !important;
}

:deep(.el-menu-item) .el-icon,
:deep(.el-sub-menu__title) .el-icon {
  margin-right: 10px;
  font-size: 18px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100vh;
}

.header {
  background-color: #fff;
  padding: 10px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  z-index: 1;
}

.header-content {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
  height: 60px;
  padding: 0 20px;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-items {
  display: flex;
  align-items: center;
  gap: 20px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.user-info:hover {
  background-color: var(--el-fill-color-light);
}

.user-info img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info span {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

/* 修改下拉菜单链接样式 */
:deep(.el-dropdown-menu__item) a {
  text-decoration: none;
  color: var(--el-text-color-regular);
  display: block;
  width: 100%;
}

:deep(.el-dropdown-menu__item:hover) a {
  color: var(--el-color-primary);
}

/* 移除多余的样式 */
.user-menu {
  display: none;
}

.content {
  flex: 1;
  padding: 0;  /* 移除内边距，由 PageContainer 控制 */
  overflow-y: auto;
  background-color: var(--bg-color);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  /* 半透明背景 */
  display: flex;
  justify-content: center;
  /* 水平居中 */
  align-items: center;
  /* 垂直居中 */
}

.modal {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 400px;
  /* 弹窗宽度 */
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* 水平居中 */
  justify-content: center;
  /* 垂直居中 */
  margin-bottom: 20px;
}

.modal-body label {
  display: block;
  margin-bottom: 5px;
  text-align: left;
  /* 保持标签左对齐 */
}

.modal-body input,
.modal-body textarea {
  width: 100%;
  max-width: 300px;
  /* 设置最大宽度，防止输入框过宽 */
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
}

.modal-footer button {
  margin-left: 10px;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.modal-footer button:first-child {
  background-color: #007bff;
  color: white;
}

.modal-footer button:first-child:hover {
  background-color: #0056b3;
}

.modal-footer button:last-child {
  background-color: #ccc;
  color: #333;
}

.modal-footer button:last-child:hover {
  background-color: #aaa;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  /* 更深的半透明背景 */
  display: flex;
  justify-content: center;
  /* 水平居中 */
  align-items: center;
  /* 垂直居中 */
}

.modal {
  background-color: white;
  padding: 30px;
  /* 增加内边距 */
  border-radius: 12px;
  /* 更大的圆角 */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  /* 更明显的阴影 */
  width: 400px;
  /* 弹窗宽度 */
  max-width: 90%;
  /* 适应小屏幕 */
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  /* 增加关闭按钮的字体 */
  cursor: pointer;
  color: #888;
  /* 关闭按钮颜色 */
}

.close-button:hover {
  color: #333;
  /* 悬停时颜色变化 */
}

.modal-body {
  margin-bottom: 20px;
}

.modal-body label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  /* 加粗标签 */
}

.modal-body input,
.modal-body textarea {
  width: 100%;
  padding: 12px;
  /* 增加内边距 */
  margin-bottom: 15px;
  /* 增加间距 */
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  /* 增加字���大小 */
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
}

.modal-footer button {
  margin-left: 10px;
  padding: 10px 20px;
  /* 增加按钮内边距 */
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  /* 添加过渡效果 */
}

.modal-footer button:first-child {
  background-color: #007bff;
  color: white;
}

.modal-footer button:first-child:hover {
  background-color: #0056b3;
  transform: scale(1.05);
  /* 悬停时放大 */
}

.modal-footer button:last-child {
  background-color: #ccc;
  color: #333;
}

.modal-footer button:last-child:hover {
  background-color: #aaa;
  transform: scale(1.05);
  /* 悬停时放大 */
}

/* 添加子菜单样式 */
:deep(.el-menu-item) {
  padding-left: 54px !important;
}

:deep(.el-sub-menu .el-menu-item) {
  min-width: 0;
  padding-left: 54px !important;
}

:deep(.el-sub-menu__title) {
  padding-left: 20px !important;
}

/* 优化菜单展开/收起动画 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  transition: all 0.3s ease-in-out;
}

/* 优化选中状态的样式 */
:deep(.el-menu-item.is-active) {
  background-color: #409EFF20 !important;
  border-right: 3px solid #409EFF;
}

/* 优化菜单图标样式 */
:deep(.el-icon) {
  vertical-align: middle;
  margin-right: 10px;
  width: 24px;
  text-align: center;
}

/* 优化子菜单展开时的背景色 */
:deep(.el-menu--inline) {
  background-color: #2b2b2b !important;
}

/* 优化顶部用户信息区域 */
.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 15px;
  height: 50px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f0f0f0;
}

.user-info img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 8px;
}

/* 优化顶部菜单样式 */
.top-menu ul {
  display: flex;
  gap: 20px;
  list-style: none;
  margin: 0;
  padding: 0 20px;
}

.top-menu ul li a {
  color: #666;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}

.top-menu ul li a:hover {
  color: #409EFF;
}

/* 优化按钮样式 */
.action-button {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
}

.action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
