<template>
    <div class="login-container">
      <div class="header-info">
        <img src="@/assets/logo.svg" alt="系统Logo" class="logo" />
        <span class="system-name">自动化测试平台</span>
      </div>
      <div class="login-box">
        <h2>注册</h2> <!-- 更新标题为注册 -->
        <form @submit.prevent="handleRegister"> <!-- 更新方法为handleRegister -->
          <div class="input-group">
            <label for="username">账号</label>
            <input type="text" id="username" v-model="username" required />
          </div>
          <div class="input-group">
            <label for="password">密码</label>
            <input type="password" id="password" v-model="password" required />
          </div>
          <div class="input-group">
            <label for="email">邮箱</label> <!-- 新增邮箱输入框 -->
            <input type="email" id="email" v-model="email" required />
          </div>
          <div class="input-group">
            <label for="phone">手机号</label> <!-- 新增手机号输入框 -->
            <input type="tel" id="phone" v-model="phone" required />
          </div>
          <div class="button-group">
            <button type="submit" class="login-button">注册</button> <!-- 更新按钮文本为注册 -->
            <button type="button" class="register-button" @click="goToLogin">登录</button> <!-- 更新方法为goToLogin -->
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  import { ElMessage } from 'element-plus';
  export default {
  data() {
    return {
      username: '',
      password: '',
      email: '', // 新增邮箱数据
      phone: '' // 新增手机号数据
    };
  },
  methods: {
    async handleRegister() { // 更新为处理注册的方法
      try {
        const response = await axios.post('http://localhost:8000/api/register/', { // 更新API URL
          username: this.username,
          password: this.password,
          email: this.email, // 传递邮箱
          phone: this.phone // 传递手机号
        });
        
        console.log('注册成功:', response.data);
        if(response.data.redirect_url){
            this.$router.push(response.data.redirect_url);
        }
      } catch (error) {
        console.error('注册失败:', error);
        ElMessage.error('注册失败，请检查输入信息'); // 更新错误信息
      }
    },
    goToLogin() { // 新增跳转到登录页面的方法
        this.$router.push('/login'); // 示例：跳转到登录页面
      // this.$router.push('/login'); // 示例：跳转到登录页面
    }
  }
};
  </script>

<style scoped>
.login-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh; /* 使容器充满视口高度 */
    background-color: #f0f0f0; /* 背景颜色 */
}

.header-info {
    position: absolute;
    top: 20px;
    left: 20px;
    display: flex;
    align-items: center;
}

.logo {
    height: 40px;
    margin-right: 10px;
}

.system-name {
    font-size: 20px;
    font-weight: bold;
}

.login-box {
    background-color: #fff; /* 背景颜色 */
    padding: 40px; /* 增加内边距 */
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    width: 300px; /* 设置宽度 */
}

.input-group {
    margin-bottom: 15px;
}

.input-group label {
    display: block;
    margin-bottom: 5px;
}

.input-group input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
}

.button-group {
    display: flex;
    justify-content: space-between;
}

.login-button, .register-button {
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 10px 15px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.login-button:hover, .register-button:hover {
    background-color: #0056b3;
}
</style>