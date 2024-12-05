<template>
  <div id="app">
    <div class="container">
      <!-- 左侧菜单栏 -->
      <div class="sidebar">
        <div class="logo-area">
          <img src="@/assets/logo.svg" alt="系统Logo">
          <span>自动化测试平台</span>
        </div>
        <ul>
          <li><router-link to="/" class="menu-item">仪表盘</router-link></li>
          <li><router-link to="/project" class="menu-item">项目</router-link></li>
          <li><router-link to="/testcases" class="menu-item">测试用例</router-link></li>
          <li><router-link to="/menu3" class="menu-item">菜单3</router-link></li>
        </ul>
      </div>

      <!-- 主内容区域 -->
      <div class="main-content">
        <div class="header">
          <div class="top-menu">
            <div class="action-buttons">
              <button class="action-button" @click="showModal = true">创建项目</button>
              <button class="action-button" @click="viewProjectInfo">项目信息</button>
            </div>
            <div class="user-info">
              <img src="@/assets/logo.svg" alt="用户头像">
              <span>用户名</span>
            </div>
            <ul>
              <li><router-link to="/profile">个人中心</router-link></li>
              <li><router-link to="/settings">设置</router-link></li>
              <li><a href="#" @click.prevent="logout">退出</a></li>
            </ul>
          </div>
        </div>

        <!-- 内容展示区域 -->
        <div class="content">
          <router-view></router-view>
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

<script>
export default {
  data() {
    return {
      showModal: false, // 控制弹窗显示
      projectName: '', // 项目名称
      projectDescription: '' // 项目描述
    };
  },
  methods: {
    async createProject() {
      if (!this.projectName || !this.projectDescription) {
        alert('请填写完整的信息');
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/project/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: this.projectName,
            description: this.projectDescription,
          }),
        });

        if (!response.ok) {
          throw new Error('网络响应不正常');
        }

        const data = await response.json();
        alert(`项目创建成功: ${data.projectName}`); // 根据后端返回的数据调整
        this.showModal = false; // 关闭弹窗
        this.projectName = ''; // 清空输入
        this.projectDescription = ''; // 清空输入
      } catch (error) {
        console.error('创建项目失败:', error);
        alert('创建项目失败，请重试');
      }
    },
    viewProjectInfo() {
      // 查看项目信息的逻辑
      alert('查看项目信息');
    },
    logout() {
      // 处理退出逻辑
      alert('退出成功');
    }
  }
};
</script>

<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
}

.container {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 200px;
  background-color: #333;
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.logo-area {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  /* 增加Logo区域与菜单的间距 */
}

.logo-area img {
  height: 50px;
  margin-right: 10px;
}

.sidebar ul {
  list-style-type: none;
  padding: 0;
}

.sidebar ul li {
  margin: 10px 0;
}

.menu-item {
  color: white;
  text-decoration: none;
  display: block;
  padding: 10px;
  border-radius: 5px;
  transition: background-color 0.3s;
  /* 添加过渡效果 */
}

.menu-item:hover {
  background-color: #555;
  /* 高亮显示 */
  cursor: pointer;
  /* 更改鼠标样式为点击样式 */
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  /* 将顶部菜单推到两侧 */
  background-color: #f8f9fa;
  padding: 10px 20px;
}

.top-menu {
  display: flex;
  align-items: center;
  margin-left: auto;
  /* 将顶部菜单推到右侧 */
}

.action-buttons {
  display: flex;
  gap: 10px;
  /* 按钮之间的间距 */
}

.action-button {
  background-color: #007bff;
  /* 按钮背景色 */
  color: white;
  /* 按钮文字颜色 */
  border: none;
  /* 去掉边框 */
  border-radius: 5px;
  /* 圆角 */
  padding: 10px 15px;
  /* 内边距 */
  cursor: pointer;
  /* 鼠标样式 */
  transition: background-color 0.3s;
  /* 添加过渡效果 */
}

.action-button:hover {
  background-color: #0056b3;
  /* 悬停时的背景色 */
}

.user-info {
  display: flex;
  align-items: center;
  margin-left: 20px;
  /* 增加用户信息与按钮之间的间距 */
}

.user-info img {
  height: 30px;
  border-radius: 50%;
  margin-right: 10px;
}

.top-menu ul {
  list-style-type: none;
  display: flex;
  gap: 10px;
}

.top-menu ul li a {
  text-decoration: none;
  color: #333;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  /* 允许内容区域滚动 */
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
  /* 增大关闭按钮的字体 */
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
</style>
