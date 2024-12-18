<template>
  <div class="login-container">
    <div class="header-info">
      <img src="@/assets/logo.svg" alt="系统Logo" class="logo" />
      <span class="system-name">自动化测试平台</span>
    </div>
    <div class="login-box">
      <h2>登录</h2>
      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label for="username">账号</label>
          <input type="text" id="username" v-model="username" required />
        </div>
        <div class="input-group">
          <label for="password">密码</label>
          <input type="password" id="password" v-model="password" required />
        </div>
        <div class="button-group">
          <button type="submit" class="login-button">登录</button>
          <button type="button" class="register-button" @click="goToRegister">注册</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import request from '@/utils/request';

const username = ref('');
const password = ref('');
const router = useRouter();

const handleLogin = async () => {
  try {
    const response = await request.post('/login/', {
      username: username.value,
      password: password.value
    });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      router.push('/');
      ElMessage.success('登录成功');
    }
  } catch (error) {
    console.error('登录失败:', error);
  }
};

const goToRegister = () => {
  router.push('/register');
};
</script>

<style scoped>
body {
  margin: 0;
  font-family: Arial, sans-serif;
}

.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  position: relative;
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
  background-color: #f8f9fa;
  padding: 40px;
  /* 增加内边距 */
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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

.login-button,
.register-button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-button:hover,
.register-button:hover {
  background-color: #0056b3;
}
</style>