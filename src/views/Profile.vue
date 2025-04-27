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
                        <p class="user-meta">
                            <span>用户ID: {{ userInfo.id }}</span>
                            <span>注册时间: {{ formatDateTime(userInfo.date_joined) }}</span>
                        </p>
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
                        
                        <div class="account-info">
                            <h3>账号信息</h3>
                            <div class="info-item">
                                <span class="label">最后登录时间:</span>
                                <span>{{ formatDateTime(userInfo.last_login) }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">注册时间:</span>
                                <span>{{ formatDateTime(userInfo.date_joined) }}</span>
                            </div>
                        </div>
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

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '暂无记录';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
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
            // 更新为新的数据结构
            userInfo.value = data.data.user;
            profileData.value = {
                username: data.data.user.username,
                email: data.data.user.email,
                phone: data.data.user.phone || ''
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
        ElMessage.error('上传头像只能是 JPG 或 PNG 格式!');
    }
    if (!isLt2M) {
        ElMessage.error('上传头像大小不能超过 2MB!');
    }
    return isJPG && isLt2M;
};

onMounted(() => {
    getUserInfo();
});
</script>

<style scoped>
.profile-card {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
    border-radius: 12px !important;
    overflow: hidden;
}

.profile-header {
    display: flex;
    padding: 32px 24px;
    margin-bottom: 30px;
    border-bottom: 1px solid #f0f0f0;
    background-color: #f9fafc;
}

.avatar-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 48px;
}

:deep(.el-avatar) {
    border: 4px solid #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s;
}

:deep(.el-avatar:hover) {
    transform: scale(1.05);
}

.avatar-uploader {
    margin-top: 20px;
}

.avatar-uploader :deep(.el-button) {
    border-radius: 20px;
    padding: 8px 16px;
    transition: all 0.3s;
}

.avatar-uploader :deep(.el-button:hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
}

.user-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.user-info h2 {
    margin-top: 0;
    margin-bottom: 12px;
    font-size: 28px;
    color: #303133;
    font-weight: 600;
}

.user-info p {
    margin: 8px 0;
    color: #606266;
    font-size: 16px;
}

.user-meta {
    margin-top: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    font-size: 14px;
    color: #909399;
}

.user-meta span {
    background-color: #f2f6fc;
    padding: 6px 12px;
    border-radius: 16px;
    color: #606266;
}

:deep(.el-tabs__header) {
    margin-bottom: 30px;
    border-bottom-color: #ebeef5;
}

:deep(.el-tabs__item) {
    font-size: 16px;
    padding: 0 24px 12px;
    height: 48px;
    line-height: 48px;
    transition: all 0.3s;
}

:deep(.el-tabs__item.is-active) {
    font-weight: 600;
    color: #1890ff;
}

:deep(.el-tabs__active-bar) {
    height: 3px;
    border-radius: 3px;
    background-color: #1890ff;
}

.account-info {
    background-color: #f8f9fa;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 32px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    border: 1px solid #ebeef5;
}

.account-info h3 {
    margin-top: 0;
    margin-bottom: 24px;
    font-size: 18px;
    color: #303133;
    font-weight: 600;
    border-left: 4px solid #1890ff;
    padding-left: 12px;
}

.info-item {
    display: flex;
    margin-bottom: 16px;
    align-items: center;
}

.info-item:last-child {
    margin-bottom: 0;
}

.info-item .label {
    width: 150px;
    color: #606266;
    font-weight: 500;
}

.info-item span:last-child {
    flex: 1;
    color: #303133;
    background-color: #fff;
    padding: 8px 16px;
    border-radius: 4px;
    border: 1px solid #ebeef5;
}

:deep(.el-form) {
    max-width: 600px;
}

:deep(.el-form-item__label) {
    font-weight: 500;
    color: #606266;
}

:deep(.el-input__wrapper) {
    padding: 0 15px;
    box-shadow: 0 0 0 1px #dcdfe6 inset;
    border-radius: 8px;
    transition: all 0.3s;
}

:deep(.el-input__wrapper:hover) {
    box-shadow: 0 0 0 1px #1890ff inset;
}

:deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px #1890ff inset;
}

:deep(.el-button--primary) {
    background: linear-gradient(90deg, #1890ff 0%, #36cfc9 100%);
    border: none;
    padding: 12px 24px;
    font-weight: 500;
    font-size: 16px;
    border-radius: 8px;
    transition: all 0.3s;
}

:deep(.el-button--primary:hover) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(24, 144, 255, 0.3);
}

:deep(.el-form-item:last-child) {
    margin-top: 30px;
}

@media screen and (max-width: 768px) {
    .profile-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    
    .avatar-container {
        margin-right: 0;
        margin-bottom: 24px;
    }
    
    .user-meta {
        justify-content: center;
    }
    
    .info-item {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .info-item .label {
        width: 100%;
        margin-bottom: 8px;
    }
    
    .info-item span:last-child {
        width: 100%;
    }
    
    :deep(.el-form) {
        width: 100%;
    }
}
</style> 