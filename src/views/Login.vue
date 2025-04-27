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
        <div class="login-actions">
          <el-button type="text" @click="showRegisterDialog = true">
            没有账号？立即注册
          </el-button>
        </div>
      </el-form>
    </div>

    <!-- 注册对话框 -->
    <el-dialog
      v-model="showRegisterDialog"
      title="用户注册"
      width="400px"
      :close-on-click-modal="false"
      center
    >
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="registerForm.email" placeholder="请输入邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showRegisterDialog = false">取消</el-button>
          <el-button type="primary" @click="handleRegister" :loading="registerLoading">
            注册
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
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
    ElMessage.error('登录失败，请检网络连接');
  } finally {
    loading.value = false;
  }
};

// 注册相关
const showRegisterDialog = ref(false);
const registerLoading = ref(false);
const registerFormRef = ref(null);

const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
  email: ''
});

// 注册表单验证规则
const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'));
  } else if (value.length < 6) {
    callback(new Error('密码长度不能小于6位'));
  } else {
    callback();
  }
};

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'));
  } else if (value !== registerForm.value.password) {
    callback(new Error('两次输入密码不一致'));
  } else {
    callback();
  }
};

const validateEmail = (rule, value, callback) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (value === '') {
    callback(new Error('请输入邮箱'));
  } else if (!emailRegex.test(value)) {
    callback(new Error('请输入有效的邮箱地址'));
  } else {
    callback();
  }
};

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { validator: validatePass, trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validatePass2, trigger: 'blur' }
  ],
  email: [
    { validator: validateEmail, trigger: 'blur' }
  ]
};

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return;
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      registerLoading.value = true;
      try {
        const response = await request.post('/api/register/', {
          username: registerForm.value.username,
          password: registerForm.value.password,
          email: registerForm.value.email
        });

        if (response.data.code === 200) {
          ElMessage.success('注册成功，请登录');
          showRegisterDialog.value = false;
          // 清空表单
          registerForm.value = {
            username: '',
            password: '',
            confirmPassword: '',
            email: ''
          };
          // 可以将注册的用户名自动填入登录框
          loginForm.value.username = response.data.data.username || registerForm.value.username;
        } else {
          ElMessage.error(response.data.message || '注册失败');
        }
      } catch (error) {
        console.error('注册失败:', error);
        ElMessage.error('注册失败，请检查网络连接');
      } finally {
        registerLoading.value = false;
      }
    }
  });
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

.login-actions {
  text-align: center;
  margin-top: 10px;
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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