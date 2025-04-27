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
            <el-menu-item index="/project">
              <el-icon><List /></el-icon>
              <span>项目列表</span>
            </el-menu-item>
            <el-menu-item index="/project-analysis">
              <el-icon><TrendCharts /></el-icon>
              <span>项目分析</span>
            </el-menu-item>

            <template v-if="currentProject">
              <el-menu-item 
                index="/testcases"
                @click="handleProjectMenu('/testcases')"
              >
                <el-icon><Files /></el-icon>
                <span>测试用例</span>
              </el-menu-item>

              <el-menu-item 
                index="/automation"
                @click="handleProjectMenu('/automation')"
              >
                <el-icon><Connection /></el-icon>
                <span>接口自动化</span>
              </el-menu-item>

              <el-menu-item 
                index="/test-plan"
                @click="handleProjectMenu('/test-plan')"
              >
                <el-icon><Calendar /></el-icon>
                <span>测试计划</span>
              </el-menu-item>

              <el-menu-item 
                index="/execution"
                @click="handleProjectMenu('/execution')"
              >
                <el-icon><VideoPlay /></el-icon>
                <span>用例执行</span>
              </el-menu-item>

              <el-menu-item 
                index="mindmap"
                @click="handleProjectMenu('mindmap')"
              >
                <el-icon><Share /></el-icon>
                <span>接口自动化脑图</span>
              </el-menu-item>
            </template>

            <template v-else>
              <div class="no-project-tip">
                <el-icon><InfoFilled /></el-icon>
                <span>请先选择项目</span>
              </div>
            </template>
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

      <!-- 主内容区��� -->
      <div class="main-content">
        <div class="header">
          <div class="header-content">
            <div class="header-left">
              <!-- 修改项目选择器部分 -->
              <el-select 
                v-model="currentProjectId"
                placeholder="请选择项目"
                @change="handleProjectChange"
                class="project-select"
                popper-class="project-select-dropdown"
              >
                <el-option
                  v-for="project in projects"
                  :key="project.id"
                  :label="project.name"
                  :value="project.id"
                >
                  <div class="project-option">
                    <div class="project-option-main">
                      <span class="project-name">{{ project.name }}</span>
                      <el-tag 
                        size="small" 
                        :type="project.status === 0 ? 'success' : 'info'"
                      >
                        {{ project.status === 0 ? '活跃' : '未活跃' }}
                      </el-tag>
                    </div>
                    <div class="project-option-info">
                      <span class="info-item">
                        <el-icon><Files /></el-icon>
                        {{ project.test_cases_count || 0 }} 个用例
                      </span>
                      <span class="info-item">
                        <el-icon><Timer /></el-icon>
                        执行次数: {{ project.execution_count || 0 }}
                      </span>
                      <span class="info-item">
                        <el-icon><TrendCharts /></el-icon>
                        成功率: {{ project.success_rate || 0 }}%
                      </span>
                    </div>
                    <div class="project-meta">
                      <span class="meta-item">
                        <el-icon><User /></el-icon>
                        创建者: {{ project.creator?.username }}
                      </span>
                      <span class="meta-item">
                        <el-icon><Clock /></el-icon>
                        创建时间: {{ formatDate(project.create_time) }}
                      </span>
                    </div>
                  </div>
                </el-option>
              </el-select>
            </div>
            <div class="header-right">
              <el-space :size="20" class="header-items">
                <div class="action-buttons">
                  <el-button type="primary" @click="showModal = true">创建项目</el-button>
                  <el-button @click="viewProjectInfo">项目信息</el-button>
                </div>
                <el-dropdown trigger="click">
                  <div class="user-info">
                    <img src="@/assets/logo.svg" alt="用户头像">
                    <span>{{ username }}</span>
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
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  Odometer,
  Folder,
  Files,
  DataAnalysis,
  Setting,
  User,
  ArrowDown,
  VideoPlay,
  Connection,
  Calendar,
  List,
  TrendCharts,
  InfoFilled,
  Timer,
  Clock,
  Share
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const activeMenu = computed(() => route.path);
const showModal = ref(false);
const projectName = ref('');
const projectDescription = ref('');
const username = ref('');

// 修改响应式数据
const projects = ref([]);
const currentProject = ref(null);
const currentProjectId = ref(null);

// 修改获取项目列表方法
const fetchProjects = async () => {
  try {
    const response = await fetch('http://47.94.195.221:8000/api/project/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page: 1,
        page_size: 50
      })
    });
    const data = await response.json();
    if (data.code === 200) {
      projects.value = data.data.projects;
      
      // 如果localStorage中有已选择的项目，则自动选中
      const savedProject = localStorage.getItem('currentProject');
      if (savedProject) {
        const parsedProject = JSON.parse(savedProject);
        const found = projects.value.find(p => p.id === parsedProject.id);
        if (found) {
          currentProject.value = found;
          currentProjectId.value = found.id;
        }
      }
    }
  } catch (error) {
    console.error('获取项目列表失败:', error);
    ElMessage.error('获取项目列表失败');
  }
};

// 修改项目变更处理方法
const handleProjectChange = (projectId) => {
  if (projectId) {
    // 根据ID找到完整的项目信息
    const selectedProject = projects.value.find(p => p.id === projectId);
    if (selectedProject) {
      currentProject.value = selectedProject;
      // 将选中的项目保存到 localStorage
      localStorage.setItem('currentProject', JSON.stringify(selectedProject));
      
      // 获取当前路由
      const currentPath = route.path;
      
      // 需要刷新数据的路由列表
      const refreshRoutes = [
        '/testcases',
        '/automation',
        '/test-plan',
        '/execution',
        '/project-analysis'
      ];
      
      // 如果当前页面需要刷新数据
      if (refreshRoutes.includes(currentPath)) {
        // 先跳转到一个中间路由，然后再跳回来，触发页面刷新
        router.replace({
          path: '/refresh',
          query: {
            redirect: currentPath,
            projectId: selectedProject.id,
            projectName: selectedProject.name
          }
        });
      }
    }
  } else {
    // 清除选中
    currentProject.value = null;
    currentProjectId.value = null;
    localStorage.removeItem('currentProject');
    
    // 如果当前在需要项目的页面，则跳转到首页
    const currentPath = route.path;
    if (['/testcases', '/automation', '/test-plan', '/execution'].includes(currentPath)) {
      router.push('/');
      ElMessage.warning('已清除项目选择');
    }
  }
};

// 处理菜单选择
const handleSelect = (index) => {
  if (['/testcases', '/automation', '/test-plan', '/execution'].includes(index)) {
    const currentProject = localStorage.getItem('currentProject');
    if (!currentProject) {
      ElMessage.warning('请先选择项目');
      return false;
    }
    // 如果有选中的项目，则带上项目参数进行跳转
    const project = JSON.parse(currentProject);
    router.push({
      path: index,
      query: {
        projectId: project.id,
        projectName: project.name
      }
    });
  } else {
    router.push(index);
  }
};

// 在组件挂载时获取项目列表
onMounted(() => {
  fetchProjects();
});

// 添加获取用户信息的方法
const getUserInfo = () => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    const { username: storedUsername } = JSON.parse(userInfo);
    username.value = storedUsername;
  }
};

// 修改创建项目方法
const createProject = async () => {
  if (!projectName.value || !projectDescription.value) {
    ElMessage.warning('请填写完整的信息');
    return;
  }

  try {
    const response = await fetch('http://47.94.195.221:8000/api/project/create/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: projectName.value,
        description: projectDescription.value,
        status: 0  // 添加 status 字段，默认为活跃状态(0)
      })
    });

    const data = await response.json();
    
    if (data.code === 200) {
      ElMessage.success('项目创建成功');
      showModal.value = false;
      projectName.value = '';
      projectDescription.value = '';
      // 刷新项目列表
      fetchProjects();
      // 跳转到项目列表页
      router.push('/project');
    } else {
      ElMessage.error(data.message || '创建项目失败');
    }
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
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  router.push('/login');
  ElMessage.success('退出成功');
};

// 修改处理项目相关菜单点击的方法
const handleProjectMenu = (key) => {
  // 如果没有选择项目，显示提示
  if (!currentProject.value) {
    ElMessage.warning('请先选择项目');
    return;
  }

  switch (key) {
    case 'mindmap':
      // 使用当前选中项目的ID
      const projectId = currentProject.value.id;
      router.push(`/mindmap/${projectId}`);
      break;
      
    default:
      // 处理其他菜单项的跳转
      router.push({
        path: key,
        query: {
          projectId: currentProject.value.id,
          projectName: currentProject.value.name
        }
      });
      break;
  }
};

onMounted(() => {
  activeMenu.value = route.path;
  // 在组件挂载时获取用户信息
  getUserInfo();
});

// 添加日期格式化方法
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// 在菜单配置中添加测试计划
const menuItems = [
  {
    icon: 'House',
    title: '仪表盘',
    path: '/'
  },
  {
    icon: 'Files',
    title: '测试用例',
    path: '/testcases'
  },
  {
    icon: 'Calendar',  // 或其他合适的图标
    title: '测试计划',
    path: '/test-plan'  // 确保这里的路径与路由配置匹配
  }
  // ... 其他菜单项
];
</script>

<style scoped>
body {
  margin: 0;
  font-family: Arial, sans-serif;
}

.container {
  display: flex;
  height: 100vh;
  background-color: #f5f7fa;
}

.sidebar {
  width: 240px;
  background: linear-gradient(180deg, #2b2b2b 0%, #333333 100%);
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.logo-area {
  padding: 24px 20px;
  background-color: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-area img {
  height: 36px;
  margin-right: 12px;
  transition: transform 0.3s ease;
}

.logo-area:hover img {
  transform: scale(1.05);
}

.logo-area span {
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(45deg, #409EFF, #67C23A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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
  padding: 12px 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  flex: 0 0 auto;
}

.header-right {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.action-buttons {
  display: flex;
  gap: 16px;
  margin-right: 24px;
}

.action-buttons .el-button {
  padding: 10px 20px;
  transition: all 0.3s ease;
}

.action-buttons .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  background-color: #f5f7fa;
  transition: all 0.3s ease;
  cursor: pointer;
}

.user-info:hover {
  background-color: #ecf5ff;
  transform: translateY(-1px);
}

.user-info img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
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
  padding: 24px;
  border-radius: 8px;
  margin: 16px;
  background-color: #f5f7fa;
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
  /* 增加关闭按钮的字 */
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
  /* 增加字体大小 */
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
}

.modal-footer button {
  margin-left: 10px;
  padding: 10px 20px;
  /* 增加按钮边距 */
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
  /* 停时放大 */
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

/* 优化单图标样式 */
:deep(.el-icon) {
  vertical-align: middle;
  margin-right: 10px;
  width: 24px;
  text-align: center;
}

/* 优化子菜单展开的背景色 */
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

/* 为接口自动化菜单项添加特图标样式 */
:deep(.el-menu-item .icon-automation) {
  color: #67C23A;
}

/* 添加项目选择器样式 */
.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.project-select {
  width: 340px;
  transition: all 0.3s ease;
}

.project-select:hover {
  transform: translateY(-1px);
}

:deep(.project-select-dropdown) {
  .el-select-dropdown__item {
    padding: 12px 16px;
    height: auto;
  }
}

.project-option {
  padding: 8px 0;
}

.project-option-main {
  margin-bottom: 10px;
}

.project-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.project-option-info {
  padding-left: 8px;
  opacity: 0.85;
}

.project-meta {
  padding-left: 8px;
  opacity: 0.85;
}

.info-item, .meta-item {
  background-color: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.info-item:hover, .meta-item:hover {
  background-color: #ecf5ff;
}

/* 选中和悬停效果 */
:deep(.el-select-dropdown__item.selected),
:deep(.el-select-dropdown__item:hover) {
  .project-name {
    color: var(--el-color-primary);
  }
}

/* 添加未选择项目时的提示样式 */
.no-project-tip {
  margin: 8px 16px;
  padding: 12px 16px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border-left: 3px solid #909399;
  transition: all 0.3s ease;
}

.no-project-tip:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-left-color: #409EFF;
}

/* 调整子菜单样式 */
:deep(.el-sub-menu .el-menu-item) {
  min-width: 0;
  padding-left: 54px !important;
}

:deep(.el-menu-item.is-active) {
  background-color: #409EFF20 !important;
  border-right: 3px solid #409EFF;
}

/* 优化图标样式 */
.el-icon {
  vertical-align: middle;
  margin-right: 10px;
  width: 24px;
  text-align: center;
}

/* 优化子菜单的背景色 */
:deep(.el-menu--inline) {
  background-color: #2b2b2b !important;
}

/* 添加滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}
</style>
