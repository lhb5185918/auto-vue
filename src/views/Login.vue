<template>
  <div class="login-container">
    <div class="platform-logo">
      <img 
        src="../assets/logo.png"
        alt="平台 Logo" 
        class="logo-image" 
      />
      <span class="logo-text">AUTOTEST自动化测试平台</span>
    </div>
    
    <div class="login-box">
      <div class="login-header">
        <h2>欢迎登录</h2>
        <p class="subtitle">请使用您的账号密码登录系统</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        class="login-form"
      >
        <el-form-item>
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            :loading="loading"
            type="primary"
            class="login-button"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import request from '@/utils/request';

const router = useRouter();
const loginForm = ref({
  username: '',
  password: ''
});

const loading = ref(false);

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    ElMessage.warning('请输入用户名和密码');
    return;
  }

  loading.value = true;
  try {
    const response = await request.post('/api/login/', {
      username: loginForm.value.username,
      password: loginForm.value.password
    });

    if (response.data.code === 200) {
      const { token, user, redirect_url } = response.data.data;
      
      // 保存token
      localStorage.setItem('token', token);
      
      // 保存用户信息
      localStorage.setItem('userInfo', JSON.stringify({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        email: user.email
      }));

      ElMessage.success('登录成功');

      // 使用 nextTick 确保状态更新后再跳转
      await router.push(redirect_url || '/');
    } else {
      ElMessage.error(response.data.message || '登录失败');
    }
  } catch (error) {
    console.error('登录失败:', error);
    ElMessage.error('登录失败，请检���网络连接');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  position: relative;
}

.platform-logo {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
}

.logo-image {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h2 {
  margin: 0;
  color: #1a1a1a;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.login-form {
  margin-top: 20px;
}

:deep(.el-input__wrapper) {
  padding: 1px 11px;
  background-color: #f5f7fa;
  border: 1px solid transparent;
  transition: all 0.3s;
}

:deep(.el-input__wrapper:hover) {
  background-color: #fff;
  border-color: #1890ff;
}

:deep(.el-input__wrapper.is-focus) {
  background-color: #fff;
  box-shadow: 0 0 0 1px #1890ff;
}

:deep(.el-input__inner) {
  height: 40px;
  color: #1a1a1a;
}

:deep(.el-input__prefix-inner) {
  color: #999;
}

.login-button {
  width: 100%;
  height: 40px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 1px;
  background: linear-gradient(90deg, #1890ff 0%, #36cfc9 100%);
  border: none;
  transition: all 0.3s;
}

.login-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.login-button:active {
  transform: translateY(0);
}

@media screen and (max-width: 576px) {
  .login-box {
    width: 90%;
    padding: 30px 20px;
  }
  
  .platform-logo {
    top: 10px;
    left: 10px;
  }
  
  .logo-image {
    width: 32px;
    height: 32px;
  }
  
  .logo-text {
    font-size: 16px;
  }
}
</style>