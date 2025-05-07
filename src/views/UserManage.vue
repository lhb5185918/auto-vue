<template>
  <Home>
    <PageContainer title="用户管理">
      <!-- 搜索和操作栏 -->
      <div class="table-header">
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入用户名/邮箱"
            prefix-icon="Search"
            clearable
            class="search-input"
          />
          <el-select
            v-model="roleFilter"
            placeholder="角色筛选"
            clearable
            class="filter-select"
          >
            <el-option label="管理员" value="admin" />
            <el-option label="测试员" value="tester" />
            <el-option label="开发者" value="developer" />
            <el-option label="普通用户" value="user" />
          </el-select>
          <el-button 
            type="primary" 
            @click="handleSearch"
            :icon="Search"
          >
            查询
          </el-button>
          <el-button 
            @click="resetSearch"
            :icon="Refresh"
          >
            重置
          </el-button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="operation-container">
        <el-button-group>
          <el-button 
            type="primary" 
            @click="showCreateDialog"
            :icon="Plus"
          >
            新增用户
          </el-button>
          <el-button 
            type="danger" 
            @click="batchDelete"
            :icon="Delete"
            :disabled="!selectedUsers.length"
          >
            批量删除
          </el-button>
        </el-button-group>
      </div>

      <!-- 用户表格 -->
      <el-table 
        :data="users" 
        border 
        style="width: 100%" 
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getRoleType(row.role)"
              effect="light"
            >
              {{ getRoleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.active"
              @change="(val) => toggleUserStatus(row, val)"
              :active-value="true"
              :inactive-value="false"
              :loading="row.statusLoading"
            />
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.create_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="last_login_time" label="最后登录" width="180">
          <template #default="{ row }">
            {{ row.last_login_time ? formatDate(row.last_login_time) : '从未登录' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-tooltip content="编辑" placement="top">
                <el-button 
                  type="primary" 
                  plain
                  @click="editUser(row)"
                  :icon="Edit"
                  circle
                />
              </el-tooltip>
              <el-tooltip content="重置密码" placement="top">
                <el-button 
                  type="warning" 
                  plain
                  @click="resetPassword(row)"
                  :icon="Key"
                  circle
                />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button 
                  type="danger" 
                  plain
                  @click="deleteUser(row)"
                  :icon="Delete"
                  circle
                />
              </el-tooltip>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页器 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>

      <!-- 新建/编辑用户对话框 -->
      <el-dialog
        :title="dialogTitle"
        v-model="showDialog"
        width="500px"
        :close-on-click-modal="false"
      >
        <el-form
          ref="userFormRef"
          :model="userForm"
          :rules="rules"
          label-width="100px"
        >
          <el-form-item label="用户名" prop="username">
            <el-input 
              v-model="userForm.username" 
              placeholder="请输入用户名"
              :disabled="isEdit"
            />
          </el-form-item>
          
          <el-form-item label="邮箱" prop="email">
            <el-input 
              v-model="userForm.email"
              placeholder="请输入邮箱"
            />
          </el-form-item>

          <el-form-item label="手机号" prop="phone">
            <el-input 
              v-model="userForm.phone"
              placeholder="请输入手机号"
            />
          </el-form-item>

          <el-form-item label="角色" prop="role">
            <el-select v-model="userForm.role" placeholder="请选择角色" style="width: 100%">
              <el-option label="管理员" value="admin" />
              <el-option label="测试员" value="tester" />
              <el-option label="开发者" value="developer" />
              <el-option label="普通用户" value="user" />
            </el-select>
          </el-form-item>

          <el-form-item label="密码" prop="password" v-if="!isEdit">
            <el-input 
              v-model="userForm.password"
              type="password"
              placeholder="请输入密码"
              show-password
            />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword" v-if="!isEdit">
            <el-input 
              v-model="userForm.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              show-password
            />
          </el-form-item>

          <el-form-item label="状态" prop="active">
            <el-switch
              v-model="userForm.active"
              :active-value="true"
              :inactive-value="false"
              active-text="启用"
              inactive-text="禁用"
            />
          </el-form-item>
        </el-form>

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="showDialog = false">取消</el-button>
            <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 重置密码对话框 -->
      <el-dialog
        title="重置密码"
        v-model="showResetDialog"
        width="500px"
      >
        <el-form
          ref="resetFormRef"
          :model="resetForm"
          :rules="resetRules"
          label-width="100px"
        >
          <el-form-item label="新密码" prop="password">
            <el-input 
              v-model="resetForm.password"
              type="password"
              placeholder="请输入新密码"
              show-password
            />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input 
              v-model="resetForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              show-password
            />
          </el-form-item>
        </el-form>

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="showResetDialog = false">取消</el-button>
            <el-button type="primary" @click="submitResetPassword" :loading="resetting">确定</el-button>
          </div>
        </template>
      </el-dialog>
    </PageContainer>
  </Home>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Plus, 
  Edit, 
  Delete, 
  Search,
  Refresh,
  Key
} from '@element-plus/icons-vue';
import Home from '@/components/HomePage.vue';
import PageContainer from '@/components/PageContainer.vue';
import request from '@/utils/request';
import { formatDate } from '@/utils/format';

// 数据相关
const loading = ref(false);
const users = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const searchKeyword = ref('');
const roleFilter = ref('');
const selectedUsers = ref([]);
const submitting = ref(false);
const resetting = ref(false);

// 表单相关
const showDialog = ref(false);
const dialogTitle = ref('新增用户');
const userFormRef = ref(null);
const isEdit = ref(false);
const userForm = ref({
  username: '',
  email: '',
  phone: '',
  role: 'user',
  password: '',
  confirmPassword: '',
  active: true
});

// 重置密码相关
const showResetDialog = ref(false);
const resetFormRef = ref(null);
const currentUserId = ref(null);
const resetForm = ref({
  password: '',
  confirmPassword: ''
});

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  password: [
    { 
      required: true, 
      message: '请输入密码', 
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (!isEdit.value && !value) {
          callback(new Error('请输入密码'));
        } else {
          callback();
        }
      }
    },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    {
      required: true,
      message: '请再次输入密码',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (!isEdit.value && !value) {
          callback(new Error('请再次输入密码'));
        } else if (!isEdit.value && value !== userForm.value.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      }
    }
  ]
};

// 重置密码的验证规则
const resetRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { 
      required: true, 
      message: '请再次输入新密码', 
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('请再次输入新密码'));
        } else if (value !== resetForm.value.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      }
    }
  ]
};

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await request.get('/api/users', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        keyword: searchKeyword.value,
        role: roleFilter.value
      }
    });

    if (response.data.code === 200) {
      users.value = response.data.data.list;
      total.value = response.data.data.total;
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 处理表格选择
const handleSelectionChange = (selection) => {
  selectedUsers.value = selection;
};

// 获取角色标签类型
const getRoleType = (role) => {
  const types = {
    'admin': 'danger',
    'tester': 'warning',
    'developer': 'success',
    'user': 'info'
  };
  return types[role] || 'info';
};

// 获取角色显示文本
const getRoleText = (role) => {
  const texts = {
    'admin': '管理员',
    'tester': '测试员',
    'developer': '开发者',
    'user': '普通用户'
  };
  return texts[role] || role;
};

// 切换用户状态
const toggleUserStatus = async (user, status) => {
  try {
    user.statusLoading = true;
    const response = await request.put(`/api/users/${user.id}/status`, {
      active: status
    });

    if (response.data.code === 200) {
      ElMessage.success(`用户已${status ? '启用' : '禁用'}`);
    } else {
      user.active = !status;
      throw new Error(response.data.message || '操作失败');
    }
  } catch (error) {
    console.error('切换用户状态失败:', error);
    ElMessage.error('切换用户状态失败');
  } finally {
    user.statusLoading = false;
  }
};

// 新增用户
const showCreateDialog = () => {
  dialogTitle.value = '新增用户';
  isEdit.value = false;
  userForm.value = {
    username: '',
    email: '',
    phone: '',
    role: 'user',
    password: '',
    confirmPassword: '',
    active: true
  };
  showDialog.value = true;
};

// 编辑用户
const editUser = (user) => {
  dialogTitle.value = '编辑用户';
  isEdit.value = true;
  userForm.value = {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    active: user.active
  };
  showDialog.value = true;
};

// 提交表单
const submitForm = async () => {
  if (!userFormRef.value) return;
  
  try {
    await userFormRef.value.validate();
    
    submitting.value = true;
    const method = isEdit.value ? 'put' : 'post';
    const url = isEdit.value ? `/api/users/${userForm.value.id}` : '/api/users';
    
    // 移除确认密码字段，避免提交到后端
    const formData = { ...userForm.value };
    delete formData.confirmPassword;

    if (isEdit.value) {
      delete formData.password; // 编辑模式下不提交密码字段
    }
    
    const response = await request[method](url, formData);
    
    if (response.data.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
      showDialog.value = false;
      fetchUsers(); // 刷新用户列表
    } else {
      throw new Error(response.data.message || '操作失败');
    }
  } catch (error) {
    console.error('提交表单失败:', error);
    ElMessage.error(error.message || '提交失败');
  } finally {
    submitting.value = false;
  }
};

// 重置密码
const resetPassword = (user) => {
  currentUserId.value = user.id;
  resetForm.value = {
    password: '',
    confirmPassword: ''
  };
  showResetDialog.value = true;
};

// 提交重置密码
const submitResetPassword = async () => {
  if (!resetFormRef.value) return;
  
  try {
    await resetFormRef.value.validate();
    
    resetting.value = true;
    const response = await request.put(`/api/users/${currentUserId.value}/password`, {
      password: resetForm.value.password
    });
    
    if (response.data.code === 200) {
      ElMessage.success('密码重置成功');
      showResetDialog.value = false;
    } else {
      throw new Error(response.data.message || '重置密码失败');
    }
  } catch (error) {
    console.error('重置密码失败:', error);
    ElMessage.error(error.message || '重置密码失败');
  } finally {
    resetting.value = false;
  }
};

// 删除用户
const deleteUser = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const response = await request.delete(`/api/users/${user.id}`);
    
    if (response.data.code === 200) {
      ElMessage.success('删除成功');
      fetchUsers(); // 刷新用户列表
    } else {
      throw new Error(response.data.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error);
      ElMessage.error(error.message || '删除失败');
    }
  }
};

// 批量删除用户
const batchDelete = async () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请先选择要删除的用户');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedUsers.value.length} 个用户吗？此操作不可恢复。`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const response = await request.post('/api/users/batch-delete', {
      userIds: selectedUsers.value.map(user => user.id)
    });

    if (response.data.code === 200) {
      ElMessage.success(`成功删除${selectedUsers.value.length}个用户`);
      fetchUsers(); // 刷新用户列表
    } else {
      throw new Error(response.data.message || '批量删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除用户失败:', error);
      ElMessage.error(error.message || '批量删除失败');
    }
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchUsers();
};

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = '';
  roleFilter.value = '';
  handleSearch();
};

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchUsers();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchUsers();
};

// 在组件挂载时获取用户列表
onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
/* 卡片样式优化 */
:deep(.el-card) {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

:deep(.el-card:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

/* 搜索栏样式优化 */
.table-header {
  margin-bottom: 24px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-input {
  width: 300px;
}

.filter-select {
  width: 180px;
}

/* 操作按钮区域样式 */
.operation-container {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.operation-container .el-button-group {
  display: flex;
  gap: 12px;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
  height: 50px;
}

:deep(.el-table td) {
  padding: 12px 0;
}

/* 状态标签样式 */
:deep(.el-tag) {
  border-radius: 4px;
  padding: 0 8px;
  height: 24px;
  line-height: 22px;
}

/* 表格操作按钮样式 */
:deep(.el-button.is-circle) {
  width: 32px;
  height: 32px;
  padding: 8px;
  margin: 0 4px;
}

/* 分页器样式 */
.pagination-container {
  margin-top: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  justify-content: flex-end;
}
</style> 