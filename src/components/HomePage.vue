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
                    <li><router-link to="/" class="menu-item">首页</router-link></li>
                    <li><router-link to="/menu1" class="menu-item">菜单1</router-link></li>
                    <li><router-link to="/menu2" class="menu-item">菜单2</router-link></li>
                    <li><router-link to="/menu3" class="menu-item">菜单3</router-link></li>
                </ul>
            </div>
  
            <!-- 主内容区域 -->
            <div class="main-content">
                <div class="header">
                    <div class="top-menu">
                        <div class="action-buttons">
                            <button class="action-button" @click="createProject">创建项目</button>
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
    </div>
  </template>
  
  <script>
  export default {
    methods: {
        createProject() {
            // 创建项目的逻辑
            alert('创建项目');
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
    margin-bottom: 20px; /* 增加Logo区域与菜单的间距 */
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
    transition: background-color 0.3s; /* 添加过渡效果 */
  }
  
  .menu-item:hover {
    background-color: #555; /* 高亮显示 */
    cursor: pointer; /* 更改鼠标样式为点击样式 */
  }
  
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .header {
    display: flex;
    justify-content: space-between; /* 将顶部菜单推到两侧 */
    background-color: #f8f9fa;
    padding: 10px 20px;
  }
  
  .top-menu {
    display: flex;
    align-items: center;
    margin-left: auto; /* 将顶部菜单推到右侧 */
  }
  
  .action-buttons {
    display: flex;
    gap: 10px; /* 按钮之间的间距 */
  }
  
  .action-button {
    background-color: #007bff; /* 按钮背景色 */
    color: white; /* 按钮文字颜色 */
    border: none; /* 去掉边框 */
    border-radius: 5px; /* 圆角 */
    padding: 10px 15px; /* 内边距 */
    cursor: pointer; /* 鼠标样式 */
    transition: background-color 0.3s; /* 添加过渡效果 */
  }
  
  .action-button:hover {
    background-color: #0056b3; /* 悬停时的背景色 */
  }
  
  .user-info {
    display: flex;
    align-items: center;
    margin-left: 20px; /* 增加用户信息与按钮之间的间距 */
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
    overflow-y: auto; /* 允许内容区域滚动 */
  }
  </style>