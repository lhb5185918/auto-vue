<template>
    <Home>
        <PageContainer title="系统设置">
            <el-card class="settings-card">
                <el-tabs v-model="activeTab">
                    <el-tab-pane label="基本设置" name="basic">
                        <el-form
                            ref="settingsForm"
                            :model="settingsData"
                            :rules="rules"
                            label-width="120px"
                        >
                            <el-form-item label="系统名称" prop="systemName">
                                <el-input v-model="settingsData.systemName" />
                            </el-form-item>
                            
                            <el-form-item label="系统Logo">
                                <el-upload
                                    class="logo-uploader"
                                    action="/api/settings/logo"
                                    :show-file-list="false"
                                    :on-success="handleLogoSuccess"
                                    :before-upload="beforeLogoUpload"
                                >
                                    <img v-if="settingsData.logo" :src="settingsData.logo" class="logo">
                                    <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
                                </el-upload>
                            </el-form-item>

                            <el-form-item label="系统主题色" prop="theme">
                                <el-color-picker v-model="settingsData.theme" />
                            </el-form-item>

                            <el-form-item label="导航模式" prop="navMode">
                                <el-radio-group v-model="settingsData.navMode">
                                    <el-radio label="side">侧边导航</el-radio>
                                    <el-radio label="top">顶部导航</el-radio>
                                </el-radio-group>
                            </el-form-item>

                            <el-form-item>
                                <el-button type="primary" @click="saveSettings">保存设置</el-button>
                                <el-button @click="resetSettings">重置</el-button>
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>

                    <el-tab-pane label="邮件设置" name="email">
                        <el-form
                            ref="emailForm"
                            :model="emailSettings"
                            :rules="emailRules"
                            label-width="120px"
                        >
                            <el-form-item label="SMTP服务器" prop="smtpServer">
                                <el-input v-model="emailSettings.smtpServer" />
                            </el-form-item>
                            
                            <el-form-item label="SMTP端口" prop="smtpPort">
                                <el-input-number v-model="emailSettings.smtpPort" :min="1" :max="65535" />
                            </el-form-item>

                            <el-form-item label="发件人邮箱" prop="senderEmail">
                                <el-input v-model="emailSettings.senderEmail" />
                            </el-form-item>

                            <el-form-item label="邮箱密码" prop="emailPassword">
                                <el-input
                                    v-model="emailSettings.emailPassword"
                                    type="password"
                                    show-password
                                />
                            </el-form-item>

                            <el-form-item>
                                <el-button type="primary" @click="saveEmailSettings">保存设置</el-button>
                                <el-button @click="testEmailSettings">测试连接</el-button>
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>

                    <el-tab-pane label="通知设置" name="notification">
                        <el-form
                            ref="notificationForm"
                            :model="notificationSettings"
                            label-width="120px"
                        >
                            <el-form-item label="测试执行通知">
                                <el-switch
                                    v-model="notificationSettings.testExecution"
                                    active-text="开启"
                                    inactive-text="关闭"
                                />
                            </el-form-item>

                            <el-form-item label="系统异常通知">
                                <el-switch
                                    v-model="notificationSettings.systemError"
                                    active-text="开启"
                                    inactive-text="关闭"
                                />
                            </el-form-item>

                            <el-form-item label="通知方式">
                                <el-checkbox-group v-model="notificationSettings.methods">
                                    <el-checkbox label="email">邮件通知</el-checkbox>
                                    <el-checkbox label="dingtalk">钉钉通知</el-checkbox>
                                    <el-checkbox label="wechat">企业微信通知</el-checkbox>
                                </el-checkbox-group>
                            </el-form-item>

                            <el-form-item>
                                <el-button type="primary" @click="saveNotificationSettings">保存设置</el-button>
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
import { Plus } from '@element-plus/icons-vue';
import Home from '@/components/HomePage.vue';
import PageContainer from '@/components/PageContainer.vue';

const activeTab = ref('basic');

// 基本设置
const settingsForm = ref(null);
const settingsData = ref({
    systemName: '',
    logo: '',
    theme: '#409EFF',
    navMode: 'side'
});

const rules = {
    systemName: [
        { required: true, message: '请输入系统名称', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ]
};

// 邮件设置
const emailForm = ref(null);
const emailSettings = ref({
    smtpServer: '',
    smtpPort: 465,
    senderEmail: '',
    emailPassword: ''
});

const emailRules = {
    smtpServer: [
        { required: true, message: '请输入SMTP服务器地址', trigger: 'blur' }
    ],
    smtpPort: [
        { required: true, message: '请输入SMTP端口', trigger: 'blur' }
    ],
    senderEmail: [
        { required: true, message: '请输入发件人邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
    ],
    emailPassword: [
        { required: true, message: '请输入邮箱密码', trigger: 'blur' }
    ]
};

// 通知设置
const notificationForm = ref(null);
const notificationSettings = ref({
    testExecution: true,
    systemError: true,
    methods: ['email']
});

// 获取设置
const getSettings = async () => {
    try {
        const response = await fetch('/api/settings', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        if (data.code === 200) {
            settingsData.value = { ...settingsData.value, ...data.data.basic };
            emailSettings.value = { ...emailSettings.value, ...data.data.email };
            notificationSettings.value = { ...notificationSettings.value, ...data.data.notification };
        }
    } catch (error) {
        console.error('获取设置失败:', error);
        ElMessage.error('获取设置失败');
    }
};

// 保存基本设置
const saveSettings = async () => {
    if (!settingsForm.value) return;
    
    await settingsForm.value.validate(async (valid) => {
        if (valid) {
            try {
                const response = await fetch('/api/settings/basic', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(settingsData.value)
                });
                
                const data = await response.json();
                if (data.code === 200) {
                    ElMessage.success('设置保存成功');
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('保存设置失败:', error);
                ElMessage.error(error.message || '保存设置失败');
            }
        }
    });
};

// 重置设置
const resetSettings = () => {
    settingsForm.value?.resetFields();
};

// 保存邮件设置
const saveEmailSettings = async () => {
    if (!emailForm.value) return;
    
    await emailForm.value.validate(async (valid) => {
        if (valid) {
            try {
                const response = await fetch('/api/settings/email', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(emailSettings.value)
                });
                
                const data = await response.json();
                if (data.code === 200) {
                    ElMessage.success('邮件设置保存成功');
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('保存邮件设置失败:', error);
                ElMessage.error(error.message || '保存邮件设置失败');
            }
        }
    });
};

// 测试邮件设置
const testEmailSettings = async () => {
    try {
        const response = await fetch('/api/settings/email/test', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailSettings.value)
        });
        
        const data = await response.json();
        if (data.code === 200) {
            ElMessage.success('邮件测试成功');
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('邮件测试失败:', error);
        ElMessage.error(error.message || '邮件测试失败');
    }
};

// 保存通知设置
const saveNotificationSettings = async () => {
    try {
        const response = await fetch('/api/settings/notification', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notificationSettings.value)
        });
        
        const data = await response.json();
        if (data.code === 200) {
            ElMessage.success('通知设置保存成功');
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('保存通知设置失败:', error);
        ElMessage.error(error.message || '保存通知设置失败');
    }
};

// Logo上传相关方法
const handleLogoSuccess = (response) => {
    if (response.code === 200) {
        settingsData.value.logo = response.data.url;
        ElMessage.success('Logo上传成功');
    } else {
        ElMessage.error(response.message || 'Logo上传失败');
    }
};

const beforeLogoUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    const isLt2M = file.size / 1024 / 1024 < 2;

    if (!isImage) {
        ElMessage.error('只能上传图片文件!');
        return false;
    }
    if (!isLt2M) {
        ElMessage.error('图片大小不能超过 2MB!');
        return false;
    }
    return true;
};

onMounted(() => {
    getSettings();
});
</script>

<style scoped>
.settings-card {
    margin: 0 auto;
    max-width: 800px;
}

.logo-uploader {
    text-align: center;
}

.logo-uploader .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s;
}

.logo-uploader .el-upload:hover {
    border-color: #409EFF;
}

.logo-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    line-height: 178px;
    text-align: center;
}

.logo {
    width: 178px;
    height: 178px;
    display: block;
}

.el-form {
    max-width: 500px;
    margin: 0 auto;
}
</style> 