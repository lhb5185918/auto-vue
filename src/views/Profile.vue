<template>
    <Home>
        <PageContainer title="个人中心">
            <el-card class="profile-card">
                <div class="profile-header">
                    <div class="avatar-container">
                        <el-avatar :size="100" :src="userInfo.avatar || defaultAvatar">
                            {{ userInfo.username?.charAt(0).toUpperCase() }}
                        </el-avatar>
                        <el-upload
                            class="avatar-uploader"
                            action="/api/user/avatar"
                            :show-file-list="false"
                            :on-success="handleAvatarSuccess"
                            :before-upload="beforeAvatarUpload"
                        >
                            <el-button size="small" type="primary">更换头像</el-button>
                        </el-upload>
                    </div>
                    <div class="user-info">
                        <h2>{{ userInfo.username }}</h2>
                        <p>{{ userInfo.email }}</p>
                    </div>
                </div>

                <el-tabs v-model="activeTab">
                    <el-tab-pane label="基本信息" name="basic">
                        <el-form
                            ref="profileForm"
                            :model="profileData"
                            :rules="rules"
                            label-width="100px"
                        >
                            <el-form-item label="用户名" prop="username">
                                <el-input v-model="profileData.username" />
                            </el-form-item>
                            <el-form-item label="邮箱" prop="email">
                                <el-input v-model="profileData.email" />
                            </el-form-item>
                            <el-form-item label="手机号" prop="phone">
                                <el-input v-model="profileData.phone" />
                            </el-form-item>
                            <el-form-item>
                                <el-button type="primary" @click="updateProfile">保存修改</el-button>
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>

                    <el-tab-pane label="修改密码" name="password">
                        <el-form
                            ref="passwordForm"
                            :model="passwordData"
                            :rules="passwordRules"
                            label-width="100px"
                        >
                            <el-form-item label="当前密码" prop="currentPassword">
                                <el-input
                                    v-model="passwordData.currentPassword"
                                    type="password"
                                    show-password
                                />
                            </el-form-item>
                            <el-form-item label="新密码" prop="newPassword">
                                <el-input
                                    v-model="passwordData.newPassword"
                                    type="password"
                                    show-password
                                />
                            </el-form-item>
                            <el-form-item label="确认新密码" prop="confirmPassword">
                                <el-input
                                    v-model="passwordData.confirmPassword"
                                    type="password"
                                    show-password
                                />
                            </el-form-item>
                            <el-form-item>
                                <el-button type="primary" @click="updatePassword">修改密码</el-button>
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>
                </el-tabs>
            </el-card>
        </PageContainer>
    </Home>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import Home from '@/components/HomePage.vue';
import PageContainer from '@/components/PageContainer.vue';

const defaultAvatar = '/default-avatar.png';
const activeTab = ref('basic');
const userInfo = ref({});
const profileForm = ref(null);
const passwordForm = ref(null);

const profileData = ref({
    username: '',
    email: '',
    phone: ''
});

const passwordData = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
});

const rules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
    ],
    phone: [
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
    ]
};

const passwordRules = {
    currentPassword: [
        { required: true, message: '请输入当前密码', trigger: 'blur' }
    ],
    newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请再次输入新密码', trigger: 'blur' },
        {
            validator: (rule, value, callback) => {
                if (value !== passwordData.value.newPassword) {
                    callback(new Error('两次输入的密码不一致'));
                } else {
                    callback();
                }
            },
            trigger: 'blur'
        }
    ]
};

const getUserInfo = async () => {
    try {
        const response = await fetch('/api/user/info', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        if (data.code === 200) {
            userInfo.value = data.data;
            profileData.value = {
                username: data.data.username,
                email: data.data.email,
                phone: data.data.phone || ''
            };
        }
    } catch (error) {
        console.error('获取用户信息失败:', error);
        ElMessage.error('获取用户信息失败');
    }
};

const updateProfile = async () => {
    if (!profileForm.value) return;
    
    await profileForm.value.validate(async (valid) => {
        if (valid) {
            try {
                const response = await fetch('/api/user/update', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(profileData.value)
                });
                
                const data = await response.json();
                if (data.code === 200) {
                    ElMessage.success('个人信息更新成功');
                    getUserInfo();
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('更新个人信息失败:', error);
                ElMessage.error(error.message || '更新个人信息失败');
            }
        }
    });
};

const updatePassword = async () => {
    if (!passwordForm.value) return;
    
    await passwordForm.value.validate(async (valid) => {
        if (valid) {
            try {
                const response = await fetch('/api/user/password', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        current_password: passwordData.value.currentPassword,
                        new_password: passwordData.value.newPassword
                    })
                });
                
                const data = await response.json();
                if (data.code === 200) {
                    ElMessage.success('密码修改成功');
                    passwordData.value = {
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                    };
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('修改密码失败:', error);
                ElMessage.error(error.message || '修改密码失败');
            }
        }
    });
};

const handleAvatarSuccess = (response) => {
    if (response.code === 200) {
        userInfo.value.avatar = response.data.url;
        ElMessage.success('头像上传成功');
    } else {
        ElMessage.error(response.message || '头像上传失败');
    }
};

const beforeAvatarUpload = (file) => {
    const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
    const isLt2M = file.size / 1024 / 1024 < 2;

    if (!isJPG) {
        ElMessage.error('头像只能是 JPG 或 PNG 格式!');
        return false;
    }
    if (!isLt2M) {
        ElMessage.error('头像大小不能超过 2MB!');
        return false;
    }
    return true;
};

onMounted(() => {
    getUserInfo();
});
</script>

<style scoped>
.profile-card {
    max-width: 800px;
    margin: 0 auto;
}

.profile-header {
    display: flex;
    align-items: center;
    margin-bottom: 30px;
    padding: 20px;
    background-color: #f5f7fa;
    border-radius: 8px;
}

.avatar-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 30px;
}

.avatar-uploader {
    margin-top: 10px;
}

.user-info {
    h2 {
        margin: 0 0 10px 0;
        color: #303133;
    }
    
    p {
        margin: 0;
        color: #606266;
    }
}

.el-form {
    max-width: 500px;
    margin: 0 auto;
}
</style> 