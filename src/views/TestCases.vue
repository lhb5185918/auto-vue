<template>
    <Home>
        <PageContainer :title="`${projectName} - 测试用例管理`">
            <el-card shadow="hover" class="table-card">
                <!-- 添加项目名称显示区域 -->
                <div class="project-info">
                    <h3 class="project-title">
                        <el-icon><Folder /></el-icon>
                        {{ projectName }}
                    </h3>
                </div>
                
                <!-- 搜索和操作栏 -->
                <div class="table-header">
                    <!-- 左侧搜索区域 -->
                    <div class="search-bar">
                        <el-input
                            v-model="searchKeyword"
                            placeholder="请输入用例名称"
                            prefix-icon="Search"
                            clearable
                            class="search-input"
                        />
                        <el-select
                            v-model="statusFilter"
                            placeholder="状态筛选"
                            clearable
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
                            class="filter-select"
                        >
                            <el-option label="高" value="高" />
                            <el-option label="中" value="中" />
                            <el-option label="低" value="低" />
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

                <!-- 添加操作按钮容器 -->
                <div class="operation-container">
                    <el-button-group>
                        <el-button 
                            type="primary" 
                            @click="handleCreateTestCase"
                            :icon="Plus"
                        >
                            新建接口测试用例
                        </el-button>
                        <el-upload
                            class="upload-button"
                            action="/api/testcase/import/"
                            :headers="uploadHeaders"
                            :data="{
                                project_id: Number(projectId)  // 确保转换为数字
                            }"
                            :show-file-list="false"
                            :on-success="handleUploadSuccess"
                            :on-error="handleUploadError"
                            :before-upload="beforeUpload"
                            accept=".xlsx,.xls"
                            name="file"
                        >
                            <el-button 
                                type="warning"
                                :icon="Upload"
                            >
                                上传测试用例
                            </el-button>
                        </el-upload>
                        <el-button 
                            type="success" 
                            @click="handleCreateEnv"
                            :icon="Setting"
                        >
                            新建环境变量
                        </el-button>
                        <el-button 
                            type="info" 
                            @click="handleViewEnv"
                            :icon="List"
                        >
                            查看环境变量
                        </el-button>
                    </el-button-group>
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
                    <el-table-column prop="last_run_time" label="最后执行时间" width="160">
                        <template #default="{ row }">
                            {{ row.last_run_time ? formatDate(row.last_run_time) : '-' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="280" fixed="right">
                        <template #default="{ row }">
                            <el-button-group>
                                <el-button 
                                    type="primary"
                                    @click="executeTestCase(row)"
                                    :loading="row.executing"
                                >
                                    执行
                                </el-button>
                                <el-button 
                                    type="primary" 
                                    plain
                                    @click="editTestCase(row)"
                                >
                                    编辑
                                </el-button>
                                <el-button 
                                    type="danger" 
                                    plain
                                    @click="deleteTestCase(row)"
                                >
                                    删除
                                </el-button>
                            </el-button-group>
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
                                                style="width: 120px; margin-left: 8px;"
                                            >
                                                <el-option label="JSON" value="application/json" />
                                                <el-option label="Text" value="text/plain" />
                                                <el-option label="XML" value="application/xml" />
                                            </el-select>
                                        </div>
                                        
                                        <div class="json-editor-container" v-if="bodyType === 'raw'">
                                            <div class="editor-toolbar">
                                                <el-tooltip content="格式化 JSON (Ctrl+Alt+A)" placement="top">
                                                    <el-button 
                                                        type="primary" 
                                                        link 
                                                        :icon="Document"
                                                        @click="formatJsonInput"
                                                        :disabled="rawContentType !== 'application/json'"
                                                    >
                                                        格式化
                                                    </el-button>
                                                </el-tooltip>
                                            </div>
                                            <div class="editor-content">
                                                <div class="line-numbers">
                                                    <div v-for="i in getLineCount(testCaseForm.body)" :key="i" class="line-number">
                                                        {{ i }}
                                                    </div>
                                                </div>
                                                <div class="editor-wrapper">
                                                    <el-input
                                                        v-model="testCaseForm.body"
                                                        type="textarea"
                                                        :rows="10"
                                                        :placeholder="getBodyPlaceholder()"
                                                        @input="handleBodyInput"
                                                        :class="{ 'has-error': jsonError }"
                                                    />
                                                    <div v-if="jsonError" class="json-error-message">
                                                        <el-alert
                                                            :title="jsonError"
                                                            type="error"
                                                            :closable="false"
                                                            show-icon
                                                        />
                                                    </div>
                                                </div>
                                            </div>
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
$headers.Content-Type=application/json  # ��查响���头"
                                        />
                                    </div>
                                </el-tab-pane>
                            </el-tabs>
                        </el-form>
                    </div>

                    <!-- 可拖动分隔 -->
                    <div class="resizer" @mousedown="startResize"></div>

                    <!-- 方响应面板 -->
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
                        
                        <!-- 有响应数据时显示应 -->
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
                                    <p>点击"发送请求"钮获取响应数据</p>
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

            <!-- 修改环境变量弹窗结构和样式 -->
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
                                <el-table-column prop="value" label="变量值" min-width="200">
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

            <!-- 查看环境变量的对话框 -->
            <el-dialog
                title="环境变量列表"
                v-model="showEnvListDialog"
                width="800px"
                class="env-list-dialog"
            >
                <div class="env-list-container">
                    <el-empty v-if="envList.length === 0" description="暂无环境变量">
                        <el-button type="primary" @click="handleCreateEnv">
                            新建环境变量
                        </el-button>
                    </el-empty>
                    
                    <template v-else>
                        <div v-for="env in envList" :key="env.id" class="env-item">
                            <div class="env-header">
                                <h3 class="env-name">{{ env.name }}</h3>
                            </div>
                            
                            <el-table 
                                :data="env.variables" 
                                border 
                                style="width: 100%"
                                :header-cell-style="{
                                    background: '#f5f7fa',
                                    color: '#606266'
                                }"
                            >
                                <el-table-column prop="key" label="变量名" width="180" />
                                <el-table-column prop="value" label="变量值" min-width="200">
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
                                <el-table-column prop="description" label="描述" min-width="180" />
                                <el-table-column label="操作" width="150" align="center" fixed="right">
                                    <template #default="{ row }">
                                        <div class="operation-buttons">
                                            <el-button
                                                type="primary"
                                                link
                                                size="small"
                                                @click="editEnvVariable(row)"
                                                :icon="Edit"
                                            >
                                                编辑
                                            </el-button>
                                            <el-button
                                                type="danger"
                                                link
                                                size="small"
                                                @click="deleteEnvVariable(row)"
                                                :icon="Delete"
                                            >
                                                删除
                                            </el-button>
                                        </div>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>
                    </template>
                </div>
            </el-dialog>

            <!-- 添加环境变量编辑对话框 -->
            <el-dialog
                title="编辑环境变量"
                v-model="showEditVarDialog"
                width="500px"
                :close-on-click-modal="false"
            >
                <el-form
                    ref="editVarFormRef"
                    :model="editVarForm"
                    :rules="varRules"
                    label-width="80px"
                >
                    <el-form-item label="变量名" prop="key">
                        <el-select
                            v-model="editVarForm.key"
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
                            </el-option-group>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="变量值" prop="value">
                        <el-input 
                            v-model="editVarForm.value" 
                            :placeholder="getValuePlaceholder(editVarForm.key)"
                        >
                            <template #prefix v-if="getValuePrefix(editVarForm.key)">
                                {{ getValuePrefix(editVarForm.key) }}
                            </template>
                        </el-input>
                    </el-form-item>
                    <el-form-item label="描述" prop="description">
                        <el-input 
                            v-model="editVarForm.description" 
                            placeholder="请输入变量描述"
                        />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <div class="dialog-footer">
                        <el-button @click="showEditVarDialog = false">取消</el-button>
                        <el-button type="primary" @click="submitEditVar">确定</el-button>
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
    Setting, 
    List, 
    Search, 
    Refresh, 
    Upload,
    Folder 
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
const projectId = ref(route.query.projectId);
const projectName = ref(route.query.projectName || '未知项目');

// 据相
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
    title: [{ required: true, message: '请输入用例题', trigger: 'blur' }],
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
                    callback(new Error('请输入有��的JSON格式'));
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

// 添加应相关的应式据
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
        // 如果不JSON格式，直接返回原始内容
        return data;
    }
};

// 添加格式化响应体的方
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

// 修改提交试例的方法
const submitTestCase = async () => {
    if (!testCaseFormRef.value) return;
    
    // 如果是 JSON 类型，先验证格式
    if (bodyType.value === 'raw' && rawContentType.value === 'application/json' && testCaseForm.value.body) {
        if (!validateJson(testCaseForm.value.body)) {
            ElMessage.error('请先修正 JSON 格式错误');
            return;
        }
    }
    
    await testCaseFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                loading.value = true;
                
                // 构建请求数据，添提取器配置
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
        await ElMessageBox.confirm('确定要删除该测试用例？', '提示', {
            type: 'warning',
        });
        
        const response = await fetch(`http://localhost:8000/api/testcases/${row.case_id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            ElMessage.success('删���成功');
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
    dialogTitle.value = '编辑接口试用例';
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

// 添加状态类型判断方法
const getStatusType = (status) => {
    const types = {
        '通过': 'success',
        '失败': 'danger',
        '未执行': 'warning',
    };
    return types[status] || 'info';
};

// 添加请求方法类型判断方法
const getMethodType = (method) => {
    const types = {
        'GET': 'success',
        'POST': 'primary',
        'PUT': 'warning',
        'DELETE': 'danger',
        'PATCH': 'info'
    };
    return types[method] || 'info';
};

// 格式化日期
const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
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
    // 重其他数据
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
    // 重置页码
    currentPage.value = 1;
    // 执行搜索
    fetchTestCases();
};

// 添加重置搜索方法
const resetSearch = () => {
    searchKeyword.value = '';
    statusFilter.value = '';
    priorityFilter.value = '';
    handleSearch();
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
    
    // 如果是 JSON 类型，先验证格式
    if (bodyType.value === 'raw' && rawContentType.value === 'application/json' && testCaseForm.value.body) {
        if (!validateJson(testCaseForm.value.body)) {
            ElMessage.error('请先修正 JSON 格���错误');
            return;
        }
    }
    
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
                    ElMessage.success('测试���例保存��功');
                    showAddDialog.value = false;
                    fetchTestCases();
                } else {
                    ElMessage.error(response.data.message);
                }
            } catch (error) {
                console.error('存失败:', error);
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

// 件卸载时清理件监
onUnmounted(() => {
    if (isResizing.value) {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
        document.body.classList.remove('resizing');
    }
});

onMounted(async () => {
    console.log('TestCases mounted with projectId:', projectId.value);
    console.log('TestCases mounted with projectName:', projectName.value); // 添加日志
    
    // 确保有项目ID
    if (!projectId.value) {
        console.error('No project ID provided');
        ElMessage.error('请选择项目');
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

// 添加环境变相关方法
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

// 添加查看环境变量对话框
const showEnvListDialog = ref(false);
const envList = ref([]);

// 添加查看环境变量方法
const handleViewEnv = async () => {
    try {
        const response = await axios.get(
            `http://localhost:8081/api/env/list/${projectId.value}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        if (response.data.code === 200) {
            envList.value = response.data.data || [];
            showEnvListDialog.value = true;
        } else {
            ElMessage.error(response.data.message);
        }
    } catch (error) {
        console.error('获取环境变量失败:', error);
        ElMessage.error('获取环境变量失败，请检查网络连接');
    }
};

// 添加编辑变量相关的响应式数据
const showEditVarDialog = ref(false);
const editVarForm = ref({
    id: '',
    key: '',
    value: '',
    description: ''
});

// 修改环境变量编辑方法
const editEnvVariable = async (variable) => {
    // 打开编辑弹窗并填充数据
    editVarForm.value = {
        id: variable.id,
        key: variable.key,
        value: variable.value,
        description: variable.description,
        env_id: variable.env_id || variable.id,  // 保存环境ID
        project_id: projectId.value  // 从当前件获取project_id
    };
    showEditVarDialog.value = true;
};

// 添加提交编辑的方法
const submitEditVar = async () => {
    try {
        const response = await axios.put(
            `http://localhost:8081/api/env/variable/${projectId.value}`,
            {
                id: editVarForm.value.id,
                key: editVarForm.value.key,
                value: editVarForm.value.value,
                description: editVarForm.value.description,
                env_id: editVarForm.value.env_id,  // 传递环境ID
                project_id: projectId.value  // 传项目ID
            },
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        if (response.data.code === 200) {
            ElMessage.success('更新成功');
            showEditVarDialog.value = false;
            handleViewEnv(); // 刷新环境变量列表
        } else {
            ElMessage.error(response.data.message);
        }
    } catch (error) {
        console.error('更新变量失败:', error);
        ElMessage.error('更新变量失败，请检查网络连接');
    }
};

// 添加环境变量删除方法
const deleteEnvVariable = async (variable) => {
    try {
        await ElMessageBox.confirm(
            '确定要删除该变量吗？删除后无法恢复。',
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );

        const response = await axios.delete(
            `http://localhost:8081/api/env/variable/${variable.id}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        if (response.data.code === 200) {
            ElMessage.success('删除成功');
            handleViewEnv(); // 刷新环境变量列表
        } else {
            ElMessage.error(response.data.message);
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除变量失败:', error);
            ElMessage.error('删除变量失败，请检查网络连接');
        }
    }
};

// 添加 JSON 格式化方法
const formatJsonInput = () => {
    if (bodyType.value === 'raw' && rawContentType.value === 'application/json') {
        try {
            const jsonObj = JSON.parse(testCaseForm.value.body);
            testCaseForm.value.body = JSON.stringify(jsonObj, null, 2);
            ElMessage.success('JSON 格式化成功');
        } catch (e) {
            ElMessage.warning('无效的 JSON 格式');
        }
    }
};

// 添加键盘事件监听
const handleKeydown = (e) => {
    // 检查是否按下 Ctrl+Alt+A
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault(); // 阻止默认行为
        formatJsonInput();
    }
};

// 在组挂载时添加事件监听
onMounted(() => {
    document.addEventListener('keydown', handleKeydown);
    // ... 其他已有的 onMounted 代码
});

// 在组件卸载时移除事件监听
onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
    // ... 其他已有的 onUnmounted 代码
});

// 在 script setup 部分添加 JSON 校验相关的函数
const jsonError = ref('');
const jsonErrorPosition = ref(null);

// 添加 JSON 格式校验函数
const validateJson = (jsonString) => {
    if (!jsonString) {
        jsonError.value = '';
        return true;
    }

    try {
        JSON.parse(jsonString);
        jsonError.value = '';
        return true;
    } catch (e) {
        // 获取错误位置和内容
        const lines = jsonString.split('\n');
        let lineNumber = 1;
        let columnNumber = 0;
        let errorLine = '';
        
        // 分析错误信息
        const errorMessage = e.message;
        if (errorMessage.includes('Unexpected token')) {
            const match = errorMessage.match(/Unexpected token '(.+?)'(,|\s+)(.*)/);
            if (match) {
                const [_, token, , context] = match;
                
                // 找到错误所在行
                const contextStart = jsonString.indexOf(context);
                if (contextStart !== -1) {
                    // 计算行号和列号
                    const beforeError = jsonString.substring(0, contextStart);
                    const beforeLines = beforeError.split('\n');
                    lineNumber = beforeLines.length;
                    columnNumber = beforeLines[beforeLines.length - 1].length;
                    errorLine = lines[lineNumber - 1];

                    // 生成更友好的错误信息
                    let errorDesc = '';
                    if (token === ',') {
                        errorDesc = '多余逗号';
                    } else if (token === '}' || token === ']') {
                        errorDesc = '缺少值或提前结束';
                    } else if (token === ':') {
                        errorDesc = '缺少键名或键值';
                    } else {
                        errorDesc = `无效的字符 '${token}'`;
                    }

                    // 构建错误提示
                    jsonError.value = `第 ${lineNumber} 行出现语法错误: ${errorDesc}\n`;
                    jsonError.value += `${errorLine}\n`;
                    jsonError.value += `${' '.repeat(columnNumber)}^ 此处有误`;
                    return false;
                }
            }
        }

        // 如果无法解析具体错误，返回通用错误信息
        jsonError.value = `JSON 格式错误: ${e.message}`;
        return false;
    }
};

// 修改 handleBodyInput 函数，添加错误位置高亮
const handleBodyInput = (value) => {
    if (bodyType.value === 'raw' && rawContentType.value === 'application/json') {
        validateJson(value);
    }
};

// 添加错误位置高亮函数
const highlightError = () => {
    if (!jsonErrorPosition.value) return;
    
    const textarea = document.querySelector('.json-editor-container textarea');
    if (!textarea) return;
    
    // 设置选区到错误位置
    textarea.setSelectionRange(jsonErrorPosition.value, jsonErrorPosition.value + 1);
    textarea.focus();
};

// 添加获取行数的方法
const getLineCount = (text) => {
    return text ? text.split('\n').length : 1;
};

// 添加执行测试用例的方法
const executeTestCase = async (row) => {
    try {
        // 设置执行状态
        row.executing = true;
        
        // 调用执行接口
        const response = await axios.post(`/api/testcases/${row.id}/execute`, {
            project_id: projectId.value
        });
        
        if (response.data.code === 200) {
            ElMessage.success('执行成功');
            // ��新测��用例状���和最���执行时间
            row.status = response.data.data.status;
            row.last_run_time = response.data.data.executed_at;
        } else {
            ElMessage.error(response.data.message || '执行失败');
        }
    } catch (error) {
        console.error('执行失败:', error);
        ElMessage.error(error.response?.data?.message || '执行失败');
    } finally {
        row.executing = false;
    }
};

// 添加上传相关的方法
const uploadHeaders = computed(() => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
}));

// 修改上传失败的处理方法
const handleUploadError = (error, file) => {
    console.error('上传失败:', error);
    
    // 关闭所有现有的消息提示
    ElMessage.closeAll();
    
    try {
        // 处理 UploadAjaxError 错误
        if (error.name === 'UploadAjaxError') {
            const response = JSON.parse(error.message);
            ElMessage({
                message: response.message,
                type: 'error',
                duration: 2000,
                showClose: true
            });
            return;
        }
        
        // 处理其他类型的错误
        let response;
        if (error.currentTarget?.response) {
            response = JSON.parse(error.currentTarget.response);
        } else if (error.response?.data) {
            response = error.response.data;
        } else if (typeof error === 'string') {
            response = JSON.parse(error);
        }

        if (response?.message) {
            ElMessage({
                message: response.message,
                type: 'error',
                duration: 2000,
                showClose: true
            });
        }
    } catch (e) {
        console.error('解析错误信息失败:', e);
    }
};

// 修改上传前的验证方法
const beforeUpload = (file) => {
    // 关闭所有现有的消息提示
    ElMessage.closeAll();
    
    // 检查文件扩展名
    const isExcel = /\.(xlsx|xls)$/.test(file.name.toLowerCase());
    const isLt2M = file.size / 1024 / 1024 < 2;

    if (!isExcel) {
        ElMessage.error('只能上传 Excel 文件 (.xlsx, .xls)!');
        return false;
    }
    if (!isLt2M) {
        ElMessage.error('文件大小不能超过 2MB!');
        return false;
    }
    
    // 显示加载提示
    ElMessage({
        message: '正在上传文件，请稍候...',
        type: 'info',
        duration: 0,
        showClose: true
    });
    
    return true;
};

// 修改上传成功的处理方法
const handleUploadSuccess = (response, file) => {
    // 关闭所有消息提示
    ElMessage.closeAll();
    
    if (response.code === 200) {
        ElMessage({
            message: `成功导入 ${response.data.imported_count} 条测试用例`,
            type: 'success',
            duration: 2000
        });
        // 刷新列表
        fetchTestCases();
    } else {
        ElMessage({
            message: response.message || '导入失败',
            type: 'error',
            duration: 2000,
            showClose: true
        });
    }
};
</script>

<style scoped>
/* 表格卡片样式 */
.table-card {
    margin-top: 20px;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
    background-color: var(--el-bg-color);
}

/* 搜索栏样式 */
.search-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.search-input {
    width: 240px;
}

.filter-select {
    width: 160px;
}

/* 操作按钮容器样式 */
.operation-container {
    margin: 20px 0;
    display: flex;
    justify-content: flex-end;
}

.operation-container :deep(.el-button-group) {
    display: flex;
    gap: 1px;
}

/* 修改按钮样式，确保图标居中 */
.operation-container :deep(.el-button) {
    display: inline-flex;  /* 改为 inline-flex */
    align-items: center;
    justify-content: center; /* 添水平居中 */
    gap: 8px;
    padding: 8px 16px;
    font-size: 14px;
    height: 32px;  /* 添固定高度 */
}

/* 修改图标样式 */
.operation-container :deep(.el-button .el-icon) {
    margin: 0;
    font-size: 16px;
    display: inline-flex;  /* 添加 inline-flex 布局 */
    align-items: center;
    justify-content: center;
    width: 16px;  /* 给定固定宽度 */
    height: 16px; /* 给定固定高度 */
}

/* 确保按钮内容整体居中 */
.operation-container :deep(.el-button span) {
    display: inline-flex;
    align-items: center;
}

/* 表格中圆形按钮样式 */
:deep(.el-button.is-circle) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
}

:deep(.el-button.is-circle .el-icon) {
    margin: 0;
    font-size: 16px;
}

/* 分页器样式 */
.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

/* 环境变量表样式 */
.env-list-container {
    max-height: 600px;
    overflow-y: auto;
    padding: 0 16px;
}

.env-item {
    margin-bottom: 24px;
    padding: 16px;
    border-radius: 8px;
    background-color: var(--el-fill-color-light);
}

.env-item:last-child {
    margin-bottom: 0;
}

/* 表格中的操作按钮样式 */
.env-item :deep(.el-table .cell) {
    display: flex;
    justify-content: center;
    gap: 8px;
}

.env-item :deep(.el-button.is-link) {
    height: 28px;
    padding: 4px 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.env-item :deep(.el-button.is-link .el-icon) {
    margin-right: 4px;
    font-size: 14px;
}

/* 表格样式优化 */
.env-item :deep(.el-table) {
    --el-table-border-color: var(--el-border-color-lighter);
}

.env-item :deep(.el-table__cell) {
    padding: 8px;
}

/* 表头样式 */
.env-item :deep(.el-table__header) {
    background-color: var(--el-fill-color-light);
}

/* 修改表格中的操作按钮样式 */
.operation-buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;  /* 减小按钮之间的间距 */
}

.operation-buttons .el-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 4px 8px;
    min-width: 52px;  /* 减小按钮的最小宽度 */
}

.operation-icon {
    margin: 0;
    font-size: 14px;
}

/* 调整按钮内部图标和文字的间距 */
.env-item :deep(.el-button.is-link) {
    height: 28px;
    padding: 4px;  /* 减小内边距 */
    white-space: nowrap;
}

.env-item :deep(.el-button.is-link .el-icon) {
    margin-right: 2px;  /* 减小图标和文字的间距 */
    font-size: 14px;
}

/* 确保钮文字不换行且对齐 */
.env-item :deep(.el-button.is-link span) {
    vertical-align: middle;
    white-space: nowrap;
}

/* 修改固定样式 */
.env-item :deep(.el-table__fixed-right) {
    height: 100% !important;
    background-color: var(--el-bg-color);
    box-shadow: -6px 0 6px -4px rgba(0,0,0,0.12);
}

/* 确保表格内不会被遮挡 */
.env-item :deep(.el-table__body-wrapper) {
    overflow: visible;
}

.env-item :deep(.el-table__fixed-right-patch) {
    background-color: var(--el-fill-color-light);
}

/* 调整格单元格内容对齐 */
.env-item :deep(.el-table .cell) {
    white-space: nowrap;
    overflow: visible;
}

/* 调整钮容对齐 */
.env-item :deep(.el-button.is-link) {
    height: 28px;
    white-space: nowrap;
}

/* 确保图标和文字对齐 */
.env-item :deep(.el-button.is-link .el-icon) {
    vertical-align: middle;
}

/* 确保按钮文字不换行 */
.env-item :deep(.el-button.is-link span) {
    vertical-align: middle;
    white-space: nowrap;
}

/* 变量值输入框样式 */
.env-item :deep(.el-input__wrapper) {
    padding: 0 8px;
}

.env-item :deep(.el-input__prefix) {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.env-item :deep(.el-input.is-focus .el-input__wrapper) {
    box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

/* Body 编辑器工具栏样式 */
.body-editor {
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative; /* 添加相对定位 */
    padding-bottom: 16px; /* 底部添加间距 */
}

.editor-toolbar {
    display: flex;
    justify-content: flex-end;
    padding: 4px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
}

.editor-toolbar .el-button {
    font-size: 12px;
}

.editor-toolbar .el-button .el-icon {
    margin-right: 4px;
    font-size: 14px;
}

/* 修改 JSON 编辑器相关样式 */
.json-editor-container {
    position: relative;
    margin-bottom: 60px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.editor-toolbar {
    display: flex;
    justify-content: flex-end;
    padding: 4px 8px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
}

.editor-content {
    display: flex;
    position: relative;
}

.line-numbers {
    padding: 12px 0;
    background-color: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color);
    border-right: none;
    border-radius: 4px 0 0 4px;
    user-select: none;
}

.line-number {
    min-width: 40px;
    padding: 0 8px;
    color: var(--el-text-color-secondary);
    font-family: monospace;
    font-size: 13px;
    line-height: 21px;
    text-align: right;
}

.editor-wrapper {
    flex: 1;
    position: relative;
}

.editor-wrapper :deep(.el-textarea__inner) {
    font-family: monospace;
    line-height: 21px;
    font-size: 13px;
    tab-size: 2;
    padding: 12px;
    border-radius: 0 4px 4px 0;
    min-height: 100%;
    resize: vertical;
}

.editor-wrapper :deep(.el-textarea__inner.has-error) {
    border-color: var(--el-color-danger);
    background-color: var(--el-color-danger-light-9);
}

.json-error-message {
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    margin-top: 8px;
    z-index: 1;
}

/* 修改底部按钮样式 */
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 16px;
}

.dialog-footer .el-button {
    min-width: 80px;
}

/* 添加请求 URL 区域的样式 */
.request-url-section {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
}

.method-select {
    width: 120px;
    margin-bottom: 0;  /* 覆盖 form-item 的默认下边距 */
}

.api-input {
    flex: 1;
    margin-bottom: 0;  /* 覆盖 form-item 的默认下边距 */
}

.send-button {
    min-width: 80px;
    height: 32px;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

/* 请求方法下拉框样式 */
.method-select :deep(.el-input__wrapper) {
    padding: 0 8px;
}

.method-select :deep(.el-select-dropdown__item) {
    padding: 0 12px;
    height: 32px;
    line-height: 32px;
}

/* 请求方法颜色样式 */
.method-get {
    color: #67C23A;
}

.method-post {
    color: #409EFF;
}

.method-put {
    color: #E6A23C;
}

.method-delete {
    color: #F56C6C;
}

.method-patch {
    color: #909399;
}

/* API 输入框样式 */
.api-input :deep(.el-input__wrapper) {
    padding: 0 12px;
}

.api-input :deep(.el-input__prefix) {
    margin-right: 8px;
}

/* 修改 body 类型选择器的样式 */
.body-type-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
}

.body-type-selector :deep(.el-radio-group) {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.body-type-selector :deep(.el-radio-button__inner) {
    padding: 8px 16px;
    height: 32px;
    line-height: 1;
}

/* 调整 JSON 选择器的样式 */
.body-type-selector :deep(.el-select) {
    margin-left: 8px;
}

.body-type-selector :deep(.el-select .el-input__wrapper) {
    height: 32px;  /* 与 radio button 保持相同高度 */
    line-height: 32px;
    padding: 0 8px;
}

.body-type-selector :deep(.el-select .el-input__inner) {
    height: 32px;
    line-height: 32px;
}

/* 确保下拉选项的样式统一 */
.body-type-selector :deep(.el-select-dropdown__item) {
    height: 32px;
    line-height: 32px;
    padding: 0 12px;
}

/* 添加表格相关样式 */
.case-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.api-path {
    display: flex;
    align-items: center;
    gap: 8px;
}

.api-path .el-tag {
    min-width: 60px;
    text-align: center;
}

/* 操作按钮组样式 */
.el-button-group {
    display: flex;
    gap: 4px;
}

.el-button-group .el-button {
    margin-left: 0 !important;
}

/* 添加上传按钮样式 */
.upload-button {
    display: inline-block;
}

.upload-button :deep(.el-upload) {
    display: block;
}

/* 确保上传按钮与其他按钮样式一致 */
.upload-button :deep(.el-button) {
    margin-left: 0;
}

/* 调整按钮组样式 */
.operation-container .el-button-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* 添加标题样式 */
.page-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.project-name {
    font-weight: 600;
    color: var(--el-color-primary);
}

.title-divider {
    color: var(--el-text-color-secondary);
    margin: 0 4px;
}

.page-type {
    color: var(--el-text-color-regular);
}

/* 添加项目名称显示区域 */
.project-info {
    margin-bottom: 20px;
    padding: 16px;
    border-radius: 8px;
    background-color: var(--el-fill-color-light);
}

.project-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* 项目信息样式 */
.project-info {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.project-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 18px;
    color: var(--el-text-color-primary);
}

.project-title .el-icon {
    font-size: 20px;
    color: var(--el-color-primary);
}
</style>