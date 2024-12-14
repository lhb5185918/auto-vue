<template>
    <Home>
        <PageContainer :title="`${projectName || '未知项目'} - 测试用例管理`">
            <el-card shadow="hover" class="table-card">
                <!-- 搜索和操作栏 -->
                <div class="table-header">
                    <!-- 左侧搜索区域 -->
                    <div class="search-bar">
                        <el-input
                            v-model="searchKeyword"
                            placeholder="请输入"
                            prefix-icon="Search"
                            clearable
                            @clear="handleSearch"
                            @input="handleSearch"
                            class="search-input"
                        />
                        <el-select
                            v-model="statusFilter"
                            placeholder="状态筛选"
                            clearable
                            @change="handleSearch"
                            class="filter-select"
                        >
                            <el-option label="未执行" value="未执行" />
                            <el-option label="通过" value="通过" />
                            <el-option label="失败" value="失败" />
                        </el-select>
                        <el-select
                            v-model="priorityFilter"
                            placeholder="优先级筛选"
                            clearable
                            @change="handleSearch"
                            class="filter-select"
                        >
                            <el-option label="高" value="高" />
                            <el-option label="中" value="中" />
                            <el-option label="低" value="低" />
                        </el-select>
                    </div>
                    
                    <!-- 右侧操作按钮 -->
                    <div class="table-operations">
                        <el-button 
                            type="success" 
                            @click="handleCreateEnv"
                            :icon="Setting"
                            class="create-button"
                        >
                            新建环境变量
                        </el-button>
                        <el-button 
                            type="primary" 
                            @click="handleCreateTestCase"
                            :icon="Plus"
                            class="create-button"
                        >
                            新建接口测试用例
                        </el-button>
                    </div>
                </div>

                <!-- 表部分保持不变 -->
                <el-empty
                    v-if="testCases.length === 0"
                    description="暂无测试用例"
                    :image-size="200"
                >
                    <el-button type="primary" @click="handleCreateTestCase">
                        <el-icon><Plus /></el-icon>新建接口测试用例
                    </el-button>
                </el-empty>

                <el-table 
                    v-else
                    :data="testCases" 
                    border 
                    style="width: 100%" 
                    v-loading="loading"
                    :header-cell-style="{
                        background: '#f5f7fa',
                        color: '#606266',
                        fontWeight: 600
                    }"
                    row-key="case_id"
                    highlight-current-row
                >
                    <el-table-column prop="case_id" label="ID" width="80" align="center" />
                    <el-table-column prop="title" label="用例标题" min-width="180">
                        <template #default="{ row }">
                            <div class="case-title">
                                <span class="title-text">{{ row.title }}</span>
                                <el-tag 
                                    size="small" 
                                    :type="getPriorityType(row.priority)"
                                    effect="plain"
                                    class="priority-tag"
                                >
                                    {{ row.priority }}
                                </el-tag>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="api_path" label="接口路径" min-width="200">
                        <template #default="{ row }">
                            <div class="api-info">
                                <el-tag 
                                    :type="getMethodType(row.method)" 
                                    size="small" 
                                    class="method-tag"
                                >
                                    {{ row.method }}
                                </el-tag>
                                <span class="api-path">{{ row.api_path }}</span>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="状态" width="100" align="center">
                        <template #default="{ row }">
                            <el-tag 
                                :type="getStatusType(row.status)"
                                effect="light"
                                size="small"
                                class="status-tag"
                            >
                                {{ row.status }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="create_time" label="创建时间" width="160" align="center">
                        <template #default="{ row }">
                            <div class="time-info">
                                <el-icon><Timer /></el-icon>
                                <span>{{ formatDate(row.create_time) }}</span>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="200" fixed="right" align="center">
                        <template #default="{ row }">
                            <div class="action-buttons">
                                <el-tooltip content="执行测试" placement="top">
                                    <el-button 
                                        type="success" 
                                        :icon="VideoPlay"
                                        circle 
                                        @click="runTestCase(row)"
                                    />
                                </el-tooltip>
                                <el-tooltip content="编辑用例" placement="top">
                                    <el-button 
                                        type="primary" 
                                        :icon="Edit"
                                        circle 
                                        @click="editTestCase(row)"
                                    />
                                </el-tooltip>
                                <el-tooltip content="删除用例" placement="top">
                                    <el-button 
                                        type="danger" 
                                        :icon="Delete"
                                        circle 
                                        @click="deleteTestCase(row)"
                                    />
                                </el-tooltip>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>

                <!-- 分页器样式优化 -->
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
            </el-card>

            <!-- 新建/编辑测试用例对话框 -->
            <el-dialog
                :title="dialogTitle"
                v-model="showAddDialog"
                width="80%"
                :close-on-click-modal="false"
                @closed="resetForm"
                class="test-case-dialog"
            >
                <div class="postman-layout">
                    <!-- 上方请面板 -->
                    <div class="request-panel" :style="{ height: `calc(100% - ${responsePanelHeight}px - 8px)` }">
                        <el-form :model="testCaseForm" :rules="rules" ref="testCaseFormRef" label-width="0">
                            <!-- 请求 URL 区域 -->
                            <div class="request-url-section">
                                <el-form-item prop="method" class="method-select">
                                    <el-select v-model="testCaseForm.method" class="method-select">
                                        <el-option
                                            v-for="method in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']"
                                            :key="method"
                                            :label="method"
                                            :value="method"
                                            :class="`method-${method.toLowerCase()}`"
                                        />
                                    </el-select>
                                </el-form-item>
                                <el-form-item prop="api_path" class="api-input">
                                    <el-input 
                                        v-model="testCaseForm.api_path" 
                                        placeholder="请输入请求URL"
                                        :prefix-icon="Link"
                                    />
                                </el-form-item>
                                <el-button type="primary" @click="submitTestCase" class="send-button">
                                    发送
                                </el-button>
                            </div>

                            <!-- 添加用例基本信息区域 -->
                            <div class="case-info-section">
                                <el-form-item prop="title" class="case-title-input">
                                    <el-input 
                                        v-model="testCaseForm.title" 
                                        placeholder="请输入用例名称"
                                    >
                                        <template #prefix>
                                            <el-icon><Document /></el-icon>
                                        </template>
                                    </el-input>
                                </el-form-item>
                                <el-form-item prop="priority" class="case-priority-select">
                                    <el-select v-model="testCaseForm.priority" placeholder="优先级">
                                        <el-option label="高" value="高" />
                                        <el-option label="中" value="中" />
                                        <el-option label="低" value="低" />
                                    </el-select>
                                </el-form-item>
                            </div>

                            <!-- 请求配置区域 -->
                            <el-tabs type="border-card" class="request-tabs">
                                <el-tab-pane label="Params" name="params">
                                    <div class="params-table">
                                        <el-table :data="paramsTableData" border style="width: 100%">
                                            <el-table-column width="40">
                                                <template #default="{ row }">
                                                    <el-checkbox v-model="row.enabled" />
                                                </template>
                                            </el-table-column>
                                            <el-table-column label="KEY">
                                                <template #default="{ row }">
                                                    <el-input v-model="row.key" placeholder="参数名" />
                                                </template>
                                            </el-table-column>
                                            <el-table-column label="VALUE">
                                                <template #default="{ row }">
                                                    <el-input v-model="row.value" placeholder="参数值" />
                                                </template>
                                            </el-table-column>
                                            <el-table-column label="DESCRIPTION" width="200">
                                                <template #default="{ row }">
                                                    <el-input v-model="row.description" placeholder="描述" />
                                                </template>
                                            </el-table-column>
                                            <el-table-column width="50">
                                                <template #default="{ $index }">
                                                    <el-button 
                                                        type="danger" 
                                                        :icon="Delete" 
                                                        circle
                                                        @click="removeParam($index)"
                                                    />
                                                </template>
                                            </el-table-column>
                                        </el-table>
                                        <div class="table-actions">
                                            <el-button type="primary" plain @click="addParam">
                                                添加参数
                                            </el-button>
                                        </div>
                                    </div>
                                </el-tab-pane>

                                <el-tab-pane label="Headers" name="headers">
                                    <div class="headers-table">
                                        <el-table :data="headersTableData" border style="width: 100%">
                                            <el-table-column width="40">
                                                <template #default="{ row }">
                                                    <el-checkbox v-model="row.enabled" />
                                                </template>
                                            </el-table-column>
                                            <el-table-column label="KEY">
                                                <template #default="{ row }">
                                                    <el-input v-model="row.key" placeholder="Header名" />
                                                </template>
                                            </el-table-column>
                                            <el-table-column label="VALUE">
                                                <template #default="{ row }">
                                                    <el-input v-model="row.value" placeholder="Header值" />
                                                </template>
                                            </el-table-column>
                                            <el-table-column label="DESCRIPTION" width="200">
                                                <template #default="{ row }">
                                                    <el-input v-model="row.description" placeholder="描述" />
                                                </template>
                                            </el-table-column>
                                            <el-table-column width="50">
                                                <template #default="{ $index }">
                                                    <el-button 
                                                        type="danger" 
                                                        :icon="Delete" 
                                                        circle
                                                        @click="removeHeader($index)"
                                                    />
                                                </template>
                                            </el-table-column>
                                        </el-table>
                                        <div class="table-actions">
                                            <el-button type="primary" plain @click="addHeader">
                                                添加Header
                                            </el-button>
                                        </div>
                                    </div>
                                </el-tab-pane>

                                <el-tab-pane label="Body" name="body">
                                    <div class="body-content">
                                        <div class="body-type-selector">
                                            <el-radio-group v-model="bodyType">
                                                <el-radio-button label="none">none</el-radio-button>
                                                <el-radio-button label="form-data">form-data</el-radio-button>
                                                <el-radio-button label="x-www-form-urlencoded">x-www-form-urlencoded</el-radio-button>
                                                <el-radio-button label="raw">raw</el-radio-button>
                                            </el-radio-group>
                                            <el-select 
                                                v-if="bodyType === 'raw'"
                                                v-model="rawContentType"
                                                style="width: 120px"
                                            >
                                                <el-option label="JSON" value="application/json" />
                                                <el-option label="Text" value="text/plain" />
                                                <el-option label="XML" value="application/xml" />
                                            </el-select>
                                        </div>
                                        
                                        <div class="body-editor" v-if="bodyType === 'raw'">
                                            <el-input
                                                v-model="testCaseForm.body"
                                                type="textarea"
                                                :rows="10"
                                                :placeholder="getBodyPlaceholder()"
                                            />
                                        </div>
                                        
                                        <div class="form-data-table" v-else-if="bodyType === 'form-data'">
                                            <el-table :data="formDataTableData" border style="width: 100%">
                                                <el-table-column width="40">
                                                    <template #default="{ row }">
                                                        <el-checkbox v-model="row.enabled" />
                                                    </template>
                                                </el-table-column>
                                                <el-table-column label="KEY">
                                                    <template #default="{ row }">
                                                        <el-input v-model="row.key" placeholder="参数名" />
                                                    </template>
                                                </el-table-column>
                                                <el-table-column label="VALUE">
                                                    <template #default="{ row }">
                                                        <el-input v-model="row.value" placeholder="参数值" />
                                                    </template>
                                                </el-table-column>
                                                <el-table-column label="DESCRIPTION" width="200">
                                                    <template #default="{ row }">
                                                        <el-input v-model="row.description" placeholder="描述" />
                                                    </template>
                                                </el-table-column>
                                                <el-table-column width="50">
                                                    <template #default="{ $index }">
                                                        <el-button 
                                                            type="danger" 
                                                            :icon="Delete" 
                                                            circle
                                                            @click="removeFormData($index)"
                                                        />
                                                    </template>
                                                </el-table-column>
                                            </el-table>
                                            <div class="table-actions">
                                                <el-button type="primary" plain @click="addFormData">
                                                    添加参数
                                                </el-button>
                                            </div>
                                        </div>
                                    </div>
                                </el-tab-pane>

                                <!-- 新增 Extractors 标签页 -->
                                <el-tab-pane label="Extractors" name="extractors">
                                    <div class="extractors-section">
                                        <div class="section-title">
                                            <h4>变量提取器配置</h4>
                                            <el-button type="primary" link @click="addExtractor">
                                                <el-icon><Plus /></el-icon>添加提取器
                                            </el-button>
                                        </div>
                                        
                                        <div v-for="(extractor, index) in extractors" :key="index" class="extractor-item">
                                            <el-row :gutter="16">
                                                <el-col :span="8">
                                                    <el-input
                                                        v-model="extractor.variableName"
                                                        placeholder="变量名"
                                                        clearable
                                                    >
                                                        <template #prefix>$</template>
                                                    </el-input>
                                                </el-col>
                                                <el-col :span="12">
                                                    <el-input
                                                        v-model="extractor.jsonPath"
                                                        placeholder="JSONPath表达式 (例如: $.data.id)"
                                                        clearable
                                                    />
                                                </el-col>
                                                <el-col :span="4">
                                                    <el-button 
                                                        type="danger" 
                                                        circle
                                                        @click="removeExtractor(index)"
                                                        :icon="Delete"
                                                    />
                                                </el-col>
                                            </el-row>
                                        </div>
                                    </div>
                                </el-tab-pane>

                                <el-tab-pane label="Tests" name="tests">
                                    <div class="tests-editor">
                                        <div class="tests-toolbar">
                                            <el-button-group>
                                                <el-button @click="addAssertion('status')">
                                                    Status Code
                                                </el-button>
                                                <el-button @click="addAssertion('json')">
                                                    JSON Path
                                                </el-button>
                                                <el-button @click="addAssertion('header')">
                                                    Header
                                                </el-button>
                                            </el-button-group>
                                        </div>
                                        
                                        <el-input
                                            v-model="testCaseForm.assertions"
                                            type="textarea"
                                            :rows="8"
                                            placeholder="输入测试断言，例如：
$.code=200  # 检查响应状态码
$.data.id=1  # 检查JSON响应体
$headers.Content-Type=application/json  # 检查响应头"
                                        />
                                    </div>
                                </el-tab-pane>
                            </el-tabs>
                        </el-form>
                    </div>

                    <!-- 可拖动分隔线 -->
                    <div class="resizer" @mousedown="startResize"></div>

                    <!-- 下方响应面板 -->
                    <div class="response-panel" :style="{ height: `${responsePanelHeight}px` }">
                        <div class="response-header">
                            <h3 class="response-title">响应信息</h3>
                            <div class="status-info" v-if="showResponse">
                                <el-tag :type="getResponseStatusType()">
                                    {{ responseData.status }} {{ responseData.statusText }}
                                </el-tag>
                                <span class="time-info">{{ responseData.time }}ms</span>
                            </div>
                        </div>
                        
                        <!-- 有响应数据时显示响应内容 -->
                        <template v-if="showResponse">
                            <el-tabs type="border-card" class="response-tabs">
                                <el-tab-pane label="Body">
                                    <div class="response-body-wrapper">
                                        <div class="response-toolbar">
                                            <span class="content-type">
                                                Content-Type: {{ responseData.headers?.['content-type'] || 'unknown' }}
                                            </span>
                                            <el-button-group>
                                                <el-button size="small" @click="formatResponseBody">
                                                    Format
                                                </el-button>
                                                <el-button size="small" @click="copyResponseBody">
                                                    Copy
                                                </el-button>
                                            </el-button-group>
                                        </div>
                                        <pre class="response-body">{{ formatResponse(responseData.body) }}</pre>
                                    </div>
                                </el-tab-pane>
                                <el-tab-pane label="Headers">
                                    <el-table :data="responseHeadersList" border style="width: 100%">
                                        <el-table-column prop="key" label="Header" width="200" />
                                        <el-table-column prop="value" label="Value" />
                                    </el-table>
                                </el-tab-pane>
                                <el-tab-pane label="Test Results">
                                    <div class="test-results">
                                        <div v-for="(result, index) in responseData.testResults" :key="index"
                                            :class="['test-result', result.passed ? 'passed' : 'failed']">
                                            <el-icon :class="result.passed ? 'success' : 'error'">
                                                <component :is="result.passed ? 'SuccessFilled' : 'CircleCloseFilled'" />
                                            </el-icon>
                                            <span>{{ result.message }}</span>
                                        </div>
                                    </div>
                                </el-tab-pane>
                            </el-tabs>
                        </template>
                        
                        <!-- 无响应数据时显示空状态 -->
                        <div v-else class="empty-response">
                            <el-empty 
                                description="暂无响应数据" 
                                :image-size="100"
                            >
                                <template #description>
                                    <p>点击"发送请求"按钮获取响应数据</p>
                                </template>
                            </el-empty>
                        </div>
                    </div>
                </div>
                
                <!-- 添加底部操作按钮 -->
                <template #footer>
                    <div class="dialog-footer">
                        <el-button @click="showAddDialog = false">取消</el-button>
                        <el-button type="primary" @click="saveTestCase">保存</el-button>
                        <el-button type="success" @click="submitTestCase">发送请求</el-button>
                    </div>
                </template>
            </el-dialog>

            <!-- 修改环境变量弹窗的结构和样式 -->
            <el-dialog
                title="新建环境变量"
                v-model="showEnvDialog"
                width="800px"
                :close-on-click-modal="false"
                @closed="resetEnvForm"
                class="env-dialog"
            >
                <el-form
                    ref="envFormRef"
                    :model="envForm"
                    :rules="envRules"
                    label-width="100px"
                >
                    <el-form-item label="环境名称" prop="name" class="env-name-item">
                        <el-input 
                            v-model="envForm.name" 
                            placeholder="请输入环境名称"
                            clearable
                        />
                    </el-form-item>
                    
                    <el-form-item label="变量列表">
                        <div class="env-vars-table">
                            <el-table 
                                :data="envVars" 
                                border 
                                style="width: 100%"
                                :header-cell-style="{
                                    background: '#f5f7fa',
                                    color: '#606266'
                                }"
                            >
                                <el-table-column label="变量名" min-width="150">
                                    <template #default="{ row }">
                                        <el-select
                                            v-model="row.key"
                                            placeholder="请选择或输入变量名"
                                            filterable
                                            allow-create
                                            default-first-option
                                            clearable
                                        >
                                            <el-option-group label="服务器配置">
                                                <el-option value="host" label="服务器地址(host)" />
                                                <el-option value="port" label="端口号(port)" />
                                                <el-option value="base_url" label="基础URL(base_url)" />
                                                <el-option value="protocol" label="协议(protocol)" />
                                            </el-option-group>
                                            <el-option-group label="认证信息">
                                                <el-option value="username" label="用户名(username)" />
                                                <el-option value="password" label="密码(password)" />
                                                <el-option value="token" label="令牌(token)" />
                                                <el-option value="api_key" label="API密钥(api_key)" />
                                                <el-option value="access_token" label="访问令牌(access_token)" />
                                            </el-option-group>
                                            <el-option-group label="数据库配置">
                                                <el-option value="db_host" label="数据库地址(db_host)" />
                                                <el-option value="db_port" label="数据库端口(db_port)" />
                                                <el-option value="db_name" label="数据库名(db_name)" />
                                                <el-option value="db_user" label="数据库用户名(db_user)" />
                                                <el-option value="db_password" label="数据库密码(db_password)" />
                                            </el-option-group>
                                            <el-option-group label="请求配置">
                                                <el-option value="timeout" label="超时时间(timeout)" />
                                                <el-option value="content_type" label="内容类型(content_type)" />
                                                <el-option value="charset" label="字符编码(charset)" />
                                            </el-option-group>
                                            <el-option-group label="其他配置">
                                                <el-option value="env_name" label="环境名称(env_name)" />
                                                <el-option value="version" label="版本号(version)" />
                                                <el-option value="project_id" label="项目ID(project_id)" />
                                                <el-option value="tenant_id" label="租户ID(tenant_id)" />
                                            </el-option-group>
                                        </el-select>
                                    </template>
                                </el-table-column>
                                <el-table-column label="变量值" min-width="200">
                                    <template #default="{ row }">
                                        <el-input 
                                            v-model="row.value" 
                                            :placeholder="getValuePlaceholder(row.key)"
                                            clearable
                                        >
                                            <template #prefix v-if="getValuePrefix(row.key)">
                                                {{ getValuePrefix(row.key) }}
                                            </template>
                                        </el-input>
                                    </template>
                                </el-table-column>
                                <el-table-column label="描述" min-width="200">
                                    <template #default="{ row }">
                                        <el-input 
                                            v-model="row.description" 
                                            placeholder="请输入描述信息"
                                            clearable
                                        />
                                    </template>
                                </el-table-column>
                                <el-table-column width="80" align="center">
                                    <template #default="{ $index }">
                                        <el-button
                                            type="danger"
                                            :icon="Delete"
                                            circle
                                            @click="removeEnvVar($index)"
                                        />
                                    </template>
                                </el-table-column>
                            </el-table>
                            <div class="env-table-footer">
                                <el-button type="primary" plain @click="addEnvVar">
                                    <el-icon><Plus /></el-icon>添加变量
                                </el-button>
                            </div>
                        </div>
                    </el-form-item>
                </el-form>
                
                <template #footer>
                    <div class="dialog-footer">
                        <el-button @click="showEnvDialog = false">取消</el-button>
                        <el-button type="primary" @click="submitEnvForm">确定</el-button>
                    </div>
                </template>
            </el-dialog>
        </PageContainer>
    </Home>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted, defineProps } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import Home from '@/components/HomePage.vue';
import { 
    Plus, 
    VideoPlay, 
    Edit, 
    Delete, 
    Timer, 
    Link, 
    Document, 
    Setting 
} from '@element-plus/icons-vue';
import axios from 'axios';

const router = useRouter();
const route = useRoute();

// 定义 props
const props = defineProps({
    projectId: {
        type: [String, Number],
        required: true
    },
    projectName: {
        type: String,
        default: '未知项目'
    }
});

// 修改参数获取方式
const projectId = ref(props.projectId || route.query.projectId);
const projectName = ref(props.projectName || route.query.projectName);

// 数据相关
const testCases = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const showAddDialog = ref(false);
const dialogTitle = ref('新建接口测试用例');
const testCaseFormRef = ref(null);

// 表单验证规则
const rules = {
    title: [{ required: true, message: '请输入用例标题', trigger: 'blur' }],
    api_path: [{ required: true, message: '请输入接口路径', trigger: 'blur' }],
    method: [{ required: true, message: '请选择请求方法', trigger: 'change' }],
    priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
    headers: [{ 
        validator: (rule, value, callback) => {
            if (value) {
                try {
                    JSON.parse(value);
                    callback();
                } catch (e) {
                    callback(new Error('请输入有效的JSON格式'));
                }
            } else {
                callback();
            }
        },
        trigger: 'blur'
    }],
    body: [{ 
        validator: (rule, value, callback) => {
            if (value) {
                try {
                    JSON.parse(value);
                    callback();
                } catch (e) {
                    callback(new Error('请输入有效的JSON格式'));
                }
            } else {
                callback();
            }
        },
        trigger: 'blur'
    }]
};

// 表单数据
const testCaseForm = ref({
    title: '',
    api_path: '',
    method: 'GET',
    priority: '中',
    headers: '',
    params: '',
    body: '',
    expected_result: '',
    assertions: ''
});

// 添加响应相关的响应式数据
const showResponse = ref(false);
const responseData = ref({
    status: 200,
    statusText: 'OK',
    time: 0,
    body: null,
    headers: {},
    testResults: []
});

// 添加响应头列表计算属性
const responseHeadersList = computed(() => {
    return Object.entries(responseData.value.headers || {}).map(([key, value]) => ({
        key,
        value
    }));
});

// 添加获取响应状态类型的方法
const getResponseStatusType = () => {
    const status = responseData.value.status;
    if (status < 300) return 'success';
    if (status < 400) return 'warning';
    return 'danger';
};

// 添加格式化响应内容的方法
const formatResponse = (data) => {
    if (!data) return '';
    try {
        if (typeof data === 'string') {
            // 尝试解析JSON字符串
            const parsed = JSON.parse(data);
            return JSON.stringify(parsed, null, 2);
        }
        return JSON.stringify(data, null, 2);
    } catch (e) {
        // 如果不是JSON格式，直接返回原始内容
        return data;
    }
};

// 添加格式化响应体的方法
const formatResponseBody = () => {
    try {
        const parsed = JSON.parse(responseData.value.body);
        responseData.value.body = JSON.stringify(parsed, null, 2);
        ElMessage.success('格式化成功');
    } catch (e) {
        ElMessage.warning('响应内容不是有效的 JSON 格式');
    }
};

// 添加复制响应容的方法
const copyResponseBody = () => {
    try {
        navigator.clipboard.writeText(responseData.value.body);
        ElMessage.success('已复制到剪贴板');
    } catch (e) {
        ElMessage.error('复制失败');
    }
};

// 修改提交测试用例的方法
const submitTestCase = async () => {
    if (!testCaseFormRef.value) return;
    
    await testCaseFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                loading.value = true;
                
                // 构建请求数据，添加提取器配置
                const requestData = {
                    ...testCaseForm.value,
                    project_id: projectId.value,
                    params: paramsTableData.value.filter(item => item.enabled),
                    headers: headersTableData.value.filter(item => item.enabled),
                    body_type: bodyType.value,
                    raw_content_type: rawContentType.value,
                    form_data: formDataTableData.value.filter(item => item.enabled),
                    extractors: extractors.value.filter(e => e.variableName && e.jsonPath)
                };

                const response = await axios.post(
                    'http://localhost:8081/api/testcase/run/',
                    requestData,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                // 处理响应，包括提取的变量
                if (response.data.code === 200) {
                    responseData.value = {
                        ...response.data,
                        extractedVariables: response.data.extractedVariables || {}
                    };
                    showResponse.value = true;
                    
                    // 显示提取的变量
                    if (response.data.extractedVariables) {
                        const variables = Object.entries(response.data.extractedVariables)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join('\n');
                        ElMessage.success(`变量提取成功:\n${variables}`);
                    }
                } else {
                    ElMessage.error(response.data.message);
                }
            } catch (error) {
                console.error('请求发送失败:', error);
                ElMessage.error(error.response?.data?.message || '请求发送失败');
            } finally {
                loading.value = false;
            }
        }
    });
};

// 修改 fetchTestCases 方法
const fetchTestCases = async () => {
    console.log('Fetching test cases for project:', projectId.value);
    
    try {
        const response = await axios.get(
            `http://localhost:8081/api/testcase/list/${projectId.value}`,
            {
                params: {
                    page: currentPage.value,
                    pageSize: pageSize.value,
                    keyword: searchKeyword.value,
                    status: statusFilter.value,
                    priority: priorityFilter.value
                },
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        console.log('API response:', response.data);

        if (response.data.code === 200) {
            testCases.value = response.data.data.testCases || [];
            total.value = response.data.data.total || 0;
        } else {
            throw new Error(response.data.message || '获取测试用例失败');
        }
    } catch (error) {
        console.error('获取测试用例失败:', error);
        if (error.response) {
            console.error('Error response:', error.response.data);
        }
        ElMessage.error(error.message || '获取测试用例失败，请检查网络连接');
        throw error;
    }
};

// 行测试用例
const runTestCase = async (row) => {
    try {
        const response = await fetch(`http://localhost:8000/api/testcases/${row.case_id}/run`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const result = await response.json();
            ElMessage.success('测试用例执行成功');
            // 可以在这里处理测试结果
        }
    } catch (error) {
        ElMessage.error('测试用例执行失败');
        console.error(error);
    }
};

// 删除测试用例
const deleteTestCase = async (row) => {
    try {
        await ElMessageBox.confirm('确定要删除该测试用例吗？', '提示', {
            type: 'warning',
        });
        
        const response = await fetch(`http://localhost:8000/api/testcases/${row.case_id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            ElMessage.success('删除成功');
            fetchTestCases();
        }
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败');
            console.error(error);
        }
    }
};

// 编辑测试用例
const editTestCase = (row) => {
    dialogTitle.value = '编辑接口测试用例';
    testCaseForm.value = { ...row };
    showAddDialog.value = true;
};

// 分页处理
const handleSizeChange = (val) => {
    pageSize.value = val;
    fetchTestCases();
};

const handleCurrentChange = (val) => {
    currentPage.value = val;
    fetchTestCases();
};

// 标签类型处理
const getPriorityType = (priority) => {
    const types = {
        '高': 'danger',
        '中': 'warning',
        '低': 'info',
    };
    return types[priority] || 'info';
};

const getStatusType = (status) => {
    const types = {
        '通过': 'success',
        '失败': 'danger',
        '阻': 'warning',
        '未执行': 'info',
    };
    return types[status] || 'info';
};

const getMethodType = (method) => {
    const types = {
        'GET': 'info',
        'POST': 'success',
        'PUT': 'warning',
        'DELETE': 'danger',
        'PATCH': 'warning'
    };
    return types[method] || 'info';
};

// 格式化日期
const formatDate = (dateString) => {
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return new Date(dateString).toLocaleString('zh-CN', options);
};

// 处理新建测试用例
const handleCreateTestCase = () => {
    dialogTitle.value = '新建接口测试用例';
    // 重置表数据
    testCaseForm.value = {
        title: '',
        api_path: '',
        method: 'GET',
        priority: '中',
        headers: '',
        params: '',
        body: '',
        expected_result: '',
        assertions: ''
    };
    showAddDialog.value = true;
};

// 重置表单
const resetForm = () => {
    if (testCaseFormRef.value) {
        testCaseFormRef.value.resetFields();
    }
    testCaseForm.value = {
        title: '',
        api_path: '',
        method: 'GET',
        priority: '中',
        headers: '',
        params: '',
        body: '',
        expected_result: '',
        assertions: ''
    };
    // 重置其他数据
    bodyType.value = 'none';
    rawContentType.value = 'application/json';
    paramsTableData.value = [{ enabled: true, key: '', value: '', description: '' }];
    headersTableData.value = [{ enabled: true, key: '', value: '', description: '' }];
    formDataTableData.value = [{ enabled: true, key: '', value: '', description: '' }];
    showResponse.value = false;
    extractors.value = [];
};

// 添加搜索和筛选相关的响应式变量
const searchKeyword = ref('');
const statusFilter = ref('');
const priorityFilter = ref('');

// 添加搜索处理方法
const handleSearch = () => {
    currentPage.value = 1;  // 重置页码
    fetchTestCases();
};

// 添加 Body 类相关的响应式数据
const bodyType = ref('none');
const rawContentType = ref('application/json');
const paramsTableData = ref([{ enabled: true, key: '', value: '', description: '' }]);
const headersTableData = ref([{ enabled: true, key: '', value: '', description: '' }]);
const formDataTableData = ref([{ enabled: true, key: '', value: '', description: '' }]);

// 添加获取 Body 占位符的方法
const getBodyPlaceholder = () => {
    if (rawContentType.value === 'application/json') {
        return '{\n  "key": "value"\n}';
    } else if (rawContentType.value === 'application/xml') {
        return '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <key>value</key>\n</root>';
    }
    return '';
};

// 添加参数相关方法
const addParam = () => {
    paramsTableData.value.push({ enabled: true, key: '', value: '', description: '' });
};

const removeParam = (index) => {
    paramsTableData.value.splice(index, 1);
};

// 添加 Headers 相关方法
const addHeader = () => {
    headersTableData.value.push({ enabled: true, key: '', value: '', description: '' });
};

const removeHeader = (index) => {
    headersTableData.value.splice(index, 1);
};

// 添加 Form Data 相关方法
const addFormData = () => {
    formDataTableData.value.push({ enabled: true, key: '', value: '', description: '' });
};

const removeFormData = (index) => {
    formDataTableData.value.splice(index, 1);
};

// 添加断言相关方法
const addAssertion = (type) => {
    const templates = {
        status: '$.code=200  # 检查响应状态码',
        json: '$.data.id=1  # 检查JSON响应体',
        header: '$headers.Content-Type=application/json  # 检查响应头'
    };
    
    const currentAssertions = testCaseForm.value.assertions || '';
    testCaseForm.value.assertions = currentAssertions + 
        (currentAssertions ? '\n' : '') + 
        templates[type];
};

// 添加保存测试用例的方法
const saveTestCase = async () => {
    if (!testCaseFormRef.value) return;
    
    await testCaseFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                loading.value = true;
                
                // 构建请求数据
                const requestData = {
                    ...testCaseForm.value,
                    project_id: projectId.value,
                    params: paramsTableData.value.filter(item => item.enabled),
                    headers: headersTableData.value.filter(item => item.enabled),
                    body_type: bodyType.value,
                    raw_content_type: rawContentType.value,
                    form_data: formDataTableData.value.filter(item => item.enabled)
                };

                const response = await axios.post(
                    'http://localhost:8081/api/testcase/create/',
                    requestData,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.data.code === 200) {
                    ElMessage.success('测试用例保存成功');
                    showAddDialog.value = false;
                    fetchTestCases();
                } else {
                    ElMessage.error(response.data.message);
                }
            } catch (error) {
                console.error('保存失败:', error);
                ElMessage.error(error.response?.data?.message || '保存失败，请检查网络连接');
            } finally {
                loading.value = false;
            }
        }
    });
};

// 添加响应面板高度相关的响应式数据
const responsePanelHeight = ref(300);
const isResizing = ref(false);
const startY = ref(0);
const startHeight = ref(0);

// 添加拖动相关方法
const startResize = (e) => {
    isResizing.value = true;
    startY.value = e.clientY;
    startHeight.value = responsePanelHeight.value;
    
    // 添加全局事件监听
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    
    // 添加拖动时的样式
    document.body.classList.add('resizing');
};

const handleResize = (e) => {
    if (!isResizing.value) return;
    
    const diff = startY.value - e.clientY;
    const newHeight = Math.max(100, Math.min(600, startHeight.value + diff));
    responsePanelHeight.value = newHeight;
};

const stopResize = () => {
    isResizing.value = false;
    
    // 移除全局事件监听
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    
    // 移除拖动时的样式
    document.body.classList.remove('resizing');
};

// 组件卸载时清理件监
onUnmounted(() => {
    if (isResizing.value) {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
        document.body.classList.remove('resizing');
    }
});

onMounted(async () => {
    console.log('TestCases mounted with projectId:', projectId.value);
    
    // 确保有项目ID
    if (!projectId.value) {
        console.error('No project ID provided');
        ElMessage.error('请先选择项目');
        router.push('/project');
        return;
    }
    
    try {
        loading.value = true;
        await fetchTestCases();
    } catch (error) {
        console.error('加载测试用例失败:', error);
        ElMessage.error(error.message || '加载测试用例失败');
    } finally {
        loading.value = false;
    }
});

// 添加环境变量相关的响应式数据
const showEnvDialog = ref(false);
const envFormRef = ref(null);
const envForm = ref({
    name: ''
});
const envVars = ref([{ key: '', value: '', description: '' }]);

// 添加环境变量表单验证规则
const envRules = {
    name: [
        { required: true, message: '请输入环境名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ]
};

// 添加环境变量相关方法
const handleCreateEnv = () => {
    showEnvDialog.value = true;
};

const addEnvVar = () => {
    envVars.value.push({ key: '', value: '', description: '' });
};

const removeEnvVar = (index) => {
    envVars.value.splice(index, 1);
};

const resetEnvForm = () => {
    if (envFormRef.value) {
        envFormRef.value.resetFields();
    }
    envForm.value = {
        name: ''
    };
    envVars.value = [{ key: '', value: '', description: '' }];
};

const submitEnvForm = async () => {
    if (!envFormRef.value) return;
    
    await envFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                const response = await axios.post(
                    'http://localhost:8081/api/env/create',
                    {
                        ...envForm.value,
                        project_id: projectId.value,
                        variables: envVars.value.filter(v => v.key && v.value) // 只提交有效的变量
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.data.code === 200) {
                    ElMessage.success('环境变量创建成功');
                    showEnvDialog.value = false;
                } else {
                    ElMessage.error(response.data.message);
                }
            } catch (error) {
                console.error('创建环境变量失败:', error);
                ElMessage.error(error.response?.data?.message || '创建失败，请检查网络连接');
            }
        }
    });
};

// 添加提取器相关的响应式数据
const extractors = ref([]);

// 添加提取器相关方法
const addExtractor = () => {
    extractors.value.push({
        variableName: '',
        jsonPath: ''
    });
};

const removeExtractor = (index) => {
    extractors.value.splice(index, 1);
};

// 添加获取变量值提示的方法
const getValuePlaceholder = (key) => {
    const placeholders = {
        'host': '例如: api.example.com',
        'port': '例如: 8080',
        'base_url': '例如: /api/v1',
        'protocol': '例如: https',
        'username': '请输入用户名',
        'password': '请输入密码',
        'token': '请输入令牌值',
        'api_key': '请输入API密钥',
        'db_host': '例如: localhost',
        'db_port': '例如: 3306',
        'db_name': '请输入数据库名',
        'timeout': '例如: 5000',
        'version': '例如: v1.0.0'
    };
    return placeholders[key] || '请输入变量值';
};

// 添加获取变量值前缀的方法
const getValuePrefix = (key) => {
    const prefixes = {
        'port': ':', 
        'protocol': '://',
        'base_url': '/',
        'timeout': 'ms'
    };
    return prefixes[key] || '';
};

// 添加变量值验证的方法
const validateEnvValue = (key, value) => {
    const rules = {
        'port': /^\d+$/,
        'timeout': /^\d+$/,
        'protocol': /^(http|https)$/i,
        'email': /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    };
    
    if (rules[key]) {
        return rules[key].test(value);
    }
    return true;
};
</script>

<style scoped>
.table-card {
    margin-top: 20px;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
    background-color: var(--el-bg-color);
}

.search-bar {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    align-items: center;
}

.search-input {
    width: 300px;
    border-radius: 4px;
}

.filter-select {
    width: 150px;
    border-radius: 4px;
}

.case-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.title-text {
    color: var(--el-text-color-primary);
    font-weight: 500;
    cursor: pointer;
    transition: color 0.3s;
}

.title-text:hover {
    color: var(--el-color-primary);
}

.priority-tag {
    font-size: 12px;
    border-radius: 12px;
    padding: 0 8px;
}

.api-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.method-tag {
    min-width: 60px;
    text-align: center;
    border-radius: 12px;
}

.api-path {
    color: var(--el-text-color-regular);
    font-family: monospace;
    background: var(--el-fill-color-light);
    padding: 2px 8px;
    border-radius: 4px;
}

.status-tag {
    min-width: 70px;
    border-radius: 12px;
}

.time-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--el-text-color-secondary);
}

.action-buttons {
    display: flex;
    justify-content: center;
    gap: 12px;
}

:deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;
    --el-table-border-color: var(--el-border-color-lighter);
}

:deep(.el-table__row) {
    transition: all 0.3s;
}

:deep(.el-table__row:hover) {
    transform: translateY(-2px);
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
    z-index: 2;
    position: relative;
}

.pagination-container {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
}

:deep(.el-button.is-circle) {
    transition: transform 0.3s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

:deep(.el-button.is-circle:hover) {
    transform: scale(1.1);
}

:deep(.el-button.is-circle .el-icon) {
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.create-button {
    padding: 8px 16px;
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s;
}

.create-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.create-button .el-icon {
    font-size: 16px;
    margin-right: 4px;
}

:deep(.el-empty) {
    padding: 40px 0;
}

:deep(.el-empty .el-button) {
    margin-top: 20px;
}

.table-operations {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.test-case-dialog :deep(.el-dialog__body) {
    padding: 0 20px 20px;
}

.request-header {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    align-items: center;
}

.method-select {
    width: 120px;
    margin-bottom: 0;
}

.api-input {
    flex: 1;
    margin-bottom: 0;
}

.request-tabs {
    margin-bottom: 20px;
}

.request-tabs :deep(.el-tabs__content) {
    padding: 20px;
}

.case-info {
    display: flex;
    gap: 20px;
    align-items: center;
}

.case-info .el-form-item {
    margin-bottom: 0;
}

:deep(.el-select) {
    width: 100%;
}

:deep(.el-tabs--border-card) {
    border: 1px solid var(--el-border-color-light);
    box-shadow: none;
}

:deep(.el-textarea__inner) {
    font-family: monospace;
    font-size: 14px;
}

/* 新增的样式 */
.postman-layout {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 700px;
    overflow: hidden;
    position: relative;
}

.request-panel {
    flex: none;
    overflow-y: auto;
    min-height: 200px;
}

.response-panel {
    flex: none;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    padding: 20px;
    background-color: var(--el-bg-color);
    min-height: 100px;
    overflow-y: auto;
}

.request-url-section {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.method-select {
    width: 120px;
}

.api-input {
    flex: 1;
}

.send-button {
    width: 100px;
}

.body-type-selector {
    margin-bottom: 16px;
    display: flex;
    gap: 16px;
    align-items: center;
}

.table-actions {
    margin-top: 16px;
    display: flex;
    justify-content: center;
}

.tests-toolbar {
    margin-bottom: 16px;
}

.response-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.response-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.response-body-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.response-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background: var(--el-fill-color-light);
    border-radius: 4px 4px 0 0;
}

.content-type {
    font-family: monospace;
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.response-body {
    flex: 1;
    margin: 0;
    padding: 16px;
    background: var(--el-fill-color-light);
    border-radius: 0 0 4px 4px;
    font-family: monospace;
    font-size: 14px;
    line-height: 1.5;
    overflow: auto;
    white-space: pre-wrap;
}

.response-tabs {
    height: calc(100% - 50px);
}

.response-tabs :deep(.el-tabs__content) {
    height: calc(100% - 40px);
    overflow-y: auto;
}

.status-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.time-info {
    color: var(--el-text-color-secondary);
    font-size: 14px;
}

.test-results {
    padding: 16px;
}

.test-result {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    padding: 8px;
    border-radius: 4px;
}

.test-result.passed {
    background: var(--el-color-success-light-9);
}

.test-result.failed {
    background: var(--el-color-danger-light-9);
}

.method-get { color: var(--el-color-success); }
.method-post { color: var(--el-color-warning); }
.method-put { color: var(--el-color-primary); }
.method-delete { color: var(--el-color-danger); }
.method-patch { color: var(--el-color-info); }

:deep(.el-dialog__body) {
    padding: 0 20px 20px;
}

:deep(.el-tabs--border-card) {
    border: 1px solid var(--el-border-color-light);
    box-shadow: none;
}

/* 调整内容区域的滚动 */
.request-tabs :deep(.el-tabs__content) {
    height: calc(100% - 40px);
    overflow-y: auto;
}

/* 优化底部按钮样式 */
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.empty-response {
    height: calc(100% - 60px);
    display: flex;
    align-items: center;
    justify-content: center;
}

.empty-response :deep(.el-empty__description) {
    margin-top: 0;
}

.empty-response :deep(.el-empty__description p) {
    color: var(--el-text-color-secondary);
    font-size: 14px;
    margin: 8px 0 0;
}

/* 添加用例基本信息区域样式 */
.case-info-section {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
    padding: 16px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
}

.case-title-input {
    flex: 1;
    margin-bottom: 0;
}

.case-priority-select {
    width: 120px;
    margin-bottom: 0;
}

.case-info-section :deep(.el-input__prefix) {
    color: var(--el-text-color-secondary);
}

/* 修改请求方式颜色相关样式 */
:deep(.method-get) { 
    color: var(--el-color-success) !important;
}
:deep(.method-post) { 
    color: var(--el-color-warning) !important;
}
:deep(.method-put) { 
    color: var(--el-color-primary) !important;
}
:deep(.method-delete) { 
    color: var(--el-color-danger) !important;
}
:deep(.method-patch) { 
    color: var(--el-color-info) !important;
}

/* 确保选中后的颜色也保持一致 */
:deep(.el-select-dropdown__item.selected) {
    color: inherit;
    font-weight: bold;
}

/* 修改下拉框中选项hover状态的背景色，以保持文字颜色可见 */
:deep(.el-select-dropdown__item.hover),
:deep(.el-select-dropdown__item:hover) {
    background-color: var(--el-fill-color-light);
}

/* 确保选中的值在输入框中显示正确的颜色 */
.method-select :deep(.el-input__inner) {
    color: inherit;
}

/* 添加分隔线样式 */
.resizer {
    width: 100%;
    height: 8px;
    background-color: transparent;
    cursor: row-resize;
    position: relative;
}

.resizer::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 30px;
    height: 4px;
    background-color: var(--el-border-color-lighter);
    border-radius: 2px;
}

.resizer:hover::after {
    background-color: var(--el-color-primary);
}

/* 拖动时添加的样式 */
.resizing {
    user-select: none;
}

.resizing .resizer::after {
    background-color: var(--el-color-primary);
}

/* 添加环境变量相关样式 */
.env-vars-table {
    margin-bottom: 16px;
}

.env-vars-table :deep(.el-table) {
    margin-bottom: 16px;
}

.env-vars-table :deep(.el-input__wrapper) {
    box-shadow: none;
}

.env-vars-table :deep(.el-table__cell) {
    padding: 8px;
}

/* 调整按钮间距 */
.table-operations .create-button + .create-button {
    margin-left: 12px;
}

/* 添加和修改环境变量相关样式 */
.env-dialog :deep(.el-dialog__body) {
    padding: 20px;
}

.env-name-item {
    margin-bottom: 20px;
}

.env-vars-table {
    border-radius: 4px;
    overflow: hidden;
}

.env-vars-table :deep(.el-table) {
    margin-bottom: 16px;
}

.env-vars-table :deep(.el-table__header) {
    font-weight: 600;
}

.env-vars-table :deep(.el-input__wrapper) {
    box-shadow: none;
}

.env-vars-table :deep(.el-table__cell) {
    padding: 8px;
}

.env-vars-table :deep(.el-button.is-circle) {
    margin: 0;
}

.env-vars-table :deep(.el-button.is-circle:hover) {
    transform: scale(1);
}

.env-vars-table :deep(.el-button.is-circle) {
    margin: 0;
}

.env-vars-table :deep(.el-button.is-circle:hover) {
    transform: scale(1);
}

.env-vars-table :deep(.el-input__wrapper) {
    padding: 1px 8px;
}

.env-vars-table :deep(.el-input__inner) {
    height: 32px;
    line-height: 32px;
}

/* 优化表格hover效果 */
.env-vars-table :deep(.el-table__row:hover) {
    background-color: var(--el-fill-color-light);
}

/* 优化删除按钮样式 */
.env-vars-table :deep(.el-button.is-circle) {
    transform: scale(0.9);
}

.env-vars-table :deep(.el-button.is-circle:hover) {
    transform: scale(1);
}

.env-vars-table :deep(.el-input__wrapper) {
    padding: 1px 8px;
}

.env-vars-table :deep(.el-input__inner) {
    height: 32px;
    line-height: 32px;
}

/* 添加提取器相关样式 */
.extractors-section {
    margin: 20px 0;
    padding: 16px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
}

.section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.section-title h4 {
    margin: 0;
    font-size: 16px;
    color: var(--el-text-color-primary);
}

.extractor-item {
    margin-bottom: 16px;
    padding: 12px;
    background-color: var(--el-bg-color);
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.extractor-item:last-child {
    margin-bottom: 0;
}

.el-divider {
    margin: 24px 0;
}

/* 环境变量表格样式 */
.env-vars-table :deep(.el-table__row:hover) {
    background-color: var(--el-fill-color-light);
}

.env-vars-table :deep(.el-button.is-circle) {
    transform: scale(0.9);
}

.env-vars-table :deep(.el-button.is-circle:hover) {
    transform: scale(1);
}

.env-vars-table :deep(.el-input__wrapper) {
    padding: 1px 8px;
}

.env-vars-table :deep(.el-input__inner) {
    height: 32px;
    line-height: 32px;
}
</style>