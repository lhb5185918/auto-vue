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
                    <div class="left-operations">
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
                                @click="showEnvDialog = true"
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
                            <el-button 
                                type="primary" 
                                @click="showCreateEnvSuiteDialog"
                                :icon="Plus"
                            >
                                新建环境套
                            </el-button>
                        </el-button-group>
                    </div>
                    <div class="right-operations">
                        <span class="env-label">当前环境套：</span>
                        <el-select
                            v-model="currentEnvId"
                            placeholder="请选择环境套"
                            style="width: 200px"
                            @change="handleEnvChange"
                        >
                            <el-option
                                v-for="item in envList"
                                :key="item.id"
                                :label="item.name"
                                :value="item.id"
                            />
                        </el-select>
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
                                    :type="getPriorityTagType(row.priority)"
                                    effect="light"
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
                                :type="getStatusTagType(row.status)"
                                effect="light"
                                size="small"
                                class="status-tag"
                            >
                                {{ row.status }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="last_execution_time" label="最后执行时间" width="160">
                        <template #default="{ row }">
                            <el-tooltip 
                                v-if="row.last_execution_time" 
                                :content="formatDateTime(row.last_execution_time)"
                                placement="top"
                            >
                                <span>{{ formatDate(row.last_execution_time) }}</span>
                            </el-tooltip>
                            <span v-else>-</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="200" fixed="right">
                        <template #default="{ row }">
                            <el-button-group>
                                <el-tooltip content="执行" placement="top">
                                    <el-button 
                                        type="primary"
                                        @click="executeTestCase(row.case_id)"
                                        :loading="loading"
                                        :icon="VideoPlay"
                                        circle
                                    />
                                </el-tooltip>
                                <el-tooltip content="编辑" placement="top">
                                    <el-button 
                                        type="primary" 
                                        plain
                                        @click="editTestCase(row)"
                                        :icon="Edit"
                                        circle
                                    />
                                </el-tooltip>
                                <el-tooltip content="删除" placement="top">
                                    <el-button 
                                        type="danger" 
                                        plain
                                        @click="deleteTestCase(row)"
                                        :icon="Delete"
                                        circle
                                    />
                                </el-tooltip>
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
                                        <template #default>
                                            <el-option
                                                v-for="method in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']"
                                                :key="method"
                                                :label="method"
                                                :value="method"
                                                :class="`method-${method.toLowerCase()}`"
                                            >
                                                <span :class="`method-${method.toLowerCase()}`">{{ method }}</span>
                                            </el-option>
                                        </template>
                                        <template #selected>
                                            <span :class="`method-${testCaseForm.method.toLowerCase()}`">{{ testCaseForm.method }}</span>
                                        </template>
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
                                                    <el-input v-model="row.key" placeholder="数" />
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
                                                    <div 
                                                        v-for="i in getLineCount(testCaseForm.body || '')" 
                                                        :key="i" 
                                                        class="line-number"
                                                    >
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
                                            <el-row :gutter="16" align="middle">
                                                <el-col :span="6">
                                                    <el-input
                                                        v-model="extractor.variableName"
                                                        placeholder="变量名"
                                                        clearable
                                                    >
                                                        <template #prefix>$</template>
                                                    </el-input>
                                                </el-col>
                                                <el-col :span="14">
                                                    <div class="input-with-button">
                                                        <el-autocomplete
                                                            v-model="extractor.jsonPath"
                                                            :fetch-suggestions="queryJsonPaths"
                                                            placeholder="输入要提取的字段名"
                                                            clearable
                                                            class="json-path-input"
                                                            @select="handleJsonPathSelect"
                                                            :disabled="!hasResponseData"
                                                        >
                                                            <template #prefix>
                                                                <el-icon><Key /></el-icon>
                                                            </template>
                                                            <template #default="{ item }">
                                                                <div class="suggestion-item">
                                                                    <span class="path">{{ item.path }}</span>
                                                                    <span class="value" v-if="item.previewValue">
                                                                        值: {{ item.previewValue }}
                                                                    </span>
                                                                </div>
                                                            </template>
                                                        </el-autocomplete>
                                                        <el-button 
                                                            type="primary"
                                                            circle
                                                            @click="testExtractor(extractor)"
                                                            :icon="Monitor"
                                                            class="test-button"
                                                            :disabled="!hasResponseData"
                                                            :title="hasResponseData ? '测试提取' : '需要先发送请求'"
                                                        />
                                                        <el-button 
                                                            type="danger" 
                                                            circle
                                                            @click="removeExtractor(index)"
                                                            :icon="Delete"
                                                            class="delete-button"
                                                        />
                                                    </div>
                                                </el-col>
                                                <el-col :span="4">
                                                    <div class="extractor-value">
                                                        <el-tooltip 
                                                            :content="extractor.extractedValue ? '提取的值' : '未提取到'" 
                                                            placement="top"
                                                        >
                                                            <el-tag 
                                                                :type="extractor.extractedValue ? 'success' : 'info'"
                                                                size="small"
                                                                class="value-tag"
                                                            >
                                                                {{ extractor.extractedValue || '未提取' }}
                                                            </el-tag>
                                                        </el-tooltip>
                                                        <el-button
                                                            v-if="extractor.extractedValue"
                                                            type="primary"
                                                            link
                                                            size="small"
                                                            @click="copyExtractedValue(extractor.extractedValue)"
                                                        >
                                                            <el-icon><DocumentCopy /></el-icon>
                                                        </el-button>
                                                    </div>
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
$headers.Content-Type=application/json  # 查响头"
                                        />
                                    </div>
                                </el-tab-pane>
                            </el-tabs>
                        </el-form>
                    </div>

                    <!-- 下方响应面板 -->
                    <div class="response-panel">
                        <div class="response-header">
                            <h3 class="response-title">响应信息</h3>
                            <div class="status-info" v-if="showResponse">
                                <el-tag :type="getResponseStatusType()">
                                    {{ responseData.status }} {{ responseData.statusText }}
                                </el-tag>
                                <span class="time-info">{{ responseData.time }}ms</span>
                            </div>
                        </div>
                        
                        <!-- 有响应数据时显示响应 -->
                        <template v-if="showResponse">
                            <el-tabs type="border-card" class="response-tabs">
                                <el-tab-pane label="Body">
                                    <div class="response-body-wrapper">
                                        <div class="response-toolbar">
                                            <span class="content-type">
                                                Content-Type: {{ responseData.contentType || 'unknown' }}
                                            </span>
                                            <el-button-group>
                                                <el-button 
                                                    size="small" 
                                                    @click="formatResponseBody"
                                                >
                                                    Format
                                                </el-button>
                                                <el-button size="small" @click="copyResponseBody">
                                                    Copy
                                                </el-button>
                                            </el-button-group>
                                        </div>
                                        <pre 
                                            class="response-body"
                                            :style="{ height: `${responsePanelHeight}px` }"
                                        >{{ formatResponse(responseData.body) }}</pre>
                                        <div 
                                            class="resize-handle"
                                            @mousedown="startResize"
                                        ></div>
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
                                        <!-- 添加测试结果统计 -->
                                        <div class="test-summary" v-if="responseData.testResults?.length">
                                            <div class="summary-stats">
                                                <div class="stat-item">
                                                    <span class="stat-label">总断言数:</span>
                                                    <span class="stat-value">{{ responseData.testResults?.length || 0 }}</span>
                                                </div>
                                                <div class="stat-item">
                                                    <span class="stat-label">通过数:</span>
                                                    <span class="stat-value pass">
                                                        {{ responseData.testResults?.filter(r => r.passed)?.length || 0 }}
                                                    </span>
                                                </div>
                                                <div class="stat-item">
                                                    <span class="stat-label">失败数:</span>
                                                    <span class="stat-value fail">
                                                        {{ responseData.testResults?.filter(r => !r.passed)?.length || 0 }}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 测试结果列表 -->
                                        <div class="test-result-list">
                                            <template v-if="responseData.testResults?.length">
                                                <div v-for="(result, index) in responseData.testResults" 
                                                    :key="index"
                                                    :class="['test-result-item', result.passed ? 'passed' : 'failed']"
                                                >
                                                    <div class="result-icon">
                                                        <el-icon v-if="result.passed" class="success-icon">
                                                            <CircleCheckFilled />
                                                        </el-icon>
                                                        <el-icon v-else class="error-icon">
                                                            <CircleCloseFilled />
                                                        </el-icon>
                                                    </div>
                                                    <div class="result-content">
                                                        <div class="result-assertion">{{ result.assertion }}</div>
                                                        <div class="result-details">
                                                            <span class="actual-value">实际值: {{ result.actualValue }}</span>
                                                            <span class="expected-value">期望值: {{ result.expectedValue }}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </template>
                                            <el-empty v-else description="暂无测试结果" />
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

            <!-- 修改环境变量对话框 -->
            <el-dialog
                v-model="showEnvDialog"
                :title="envDialogTitle"
                width="900px"
                :close-on-click-modal="false"
                class="env-dialog"
            >
                <el-form
                    ref="envFormRef"
                    :model="envForm"
                    :rules="envRules"
                    label-width="100px"
                >
                    <!-- 环境套选择 -->
                    <el-form-item label="所属环境套" prop="envSuiteId">
                        <div class="env-suite-section">
                            <el-select 
                                v-model="envForm.envSuiteId"
                                placeholder="请选择环境套"
                                clearable
                                popper-class="env-suite-select"
                                style="width: 100%"
                            >
                                <el-option
                                    v-for="suite in envSuites"
                                    :key="suite.id"
                                    :label="suite.name"
                                    :value="suite.id"
                                >
                                    <div class="env-suite-option">
                                        <span class="suite-name">{{ suite.name }}</span>
                                        <span class="suite-desc" v-if="suite.description">{{ suite.description }}</span>
                                    </div>
                                </el-option>
                            </el-select>
                            <el-button 
                                type="primary" 
                                link 
                                @click="showCreateEnvSuiteDialog"
                                :icon="Plus"
                            >
                                新建环境
                            </el-button>
                        </div>
                    </el-form-item>

                    <!-- 环境变量名称 -->
                    <el-form-item label="变量名称" prop="name">
                        <el-input 
                            v-model="envForm.name" 
                            placeholder="请输入环境变量名称" 
                            clearable
                        />
                    </el-form-item>

                    <!-- 变量列表 -->
                    <el-form-item label="变量列表">
                        <div class="env-vars-table">
                            <el-table 
                                :data="envForm.variables" 
                                border 
                                style="width: 100%"
                                max-height="400"
                                :header-cell-style="{
                                    background: '#f5f7fa',
                                    color: '#606266'
                                }"
                            >
                                <el-table-column 
                                    label="变量名" 
                                    prop="key"
                                    min-width="200"
                                >
                                    <template #default="{ row }">
                                        <el-select
                                            v-model="row.key"
                                            placeholder="请选择或输入变量名"
                                            filterable
                                            allow-create
                                            clearable
                                            popper-class="var-name-select"
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
                                    </template>
                                </el-table-column>
                                <el-table-column 
                                    label="变量值" 
                                    prop="value"
                                    min-width="200"
                                >
                                    <template #default="{ row }">
                                        <el-input 
                                            v-model="row.value" 
                                            placeholder="请输入变量值"
                                        />
                                    </template>
                                </el-table-column>
                                <el-table-column 
                                    label="描述" 
                                    prop="description"
                                    min-width="200"
                                >
                                    <template #default="{ row }">
                                        <el-input 
                                            v-model="row.description" 
                                            placeholder="请输入描述"
                                        />
                                    </template>
                                </el-table-column>
                                <el-table-column 
                                    label="操作"
                                    width="70"
                                    fixed="right"
                                    align="center"
                                >
                                    <template #default="{ $index }">
                                        <el-button 
                                            type="danger" 
                                            :icon="Delete" 
                                            circle
                                            size="small"
                                            @click="removeVariable($index)"
                                        />
                                    </template>
                                </el-table-column>
                            </el-table>
                            <div class="table-actions">
                                <el-button type="primary" plain @click="addVariable">
                                    添加变量
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
                width="900px"
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
                                <div class="env-info">
                                    <h3 class="env-name">{{ env.name }}</h3>
                                    <el-tag 
                                        size="small" 
                                        type="info" 
                                        effect="plain"
                                        class="env-suite-tag"
                                    >
                                        {{ getEnvSuiteName(env.envSuiteId) }}
                                    </el-tag>
                                </div>
                                <div class="env-description" v-if="env.description">
                                    {{ env.description }}
                                </div>
                            </div>
                            
                            <el-table 
                                :data="env.variables" 
                                border 
                                style="width: 100%"
                                size="small"
                                :header-cell-style="{
                                    background: '#f5f7fa',
                                    color: '#606266'
                                }"
                            >
                                <el-table-column 
                                    prop="key" 
                                    label="变量名" 
                                    width="180"
                                    show-overflow-tooltip
                                >
                                    <template #default="{ row }">
                                        <span class="variable-key">{{ row.key }}</span>
                                    </template>
                                </el-table-column>
                                <el-table-column 
                                    prop="value" 
                                    label="变量值"
                                    min-width="200"
                                    show-overflow-tooltip
                                >
                                    <template #default="{ row }">
                                        <el-input
                                            v-model="row.value"
                                            size="small"
                                            :placeholder="getValuePlaceholder(row.key)"
                                            clearable
                                        />
                                    </template>
                                </el-table-column>
                                <el-table-column 
                                    prop="description" 
                                    label="描述"
                                    min-width="180"
                                    show-overflow-tooltip
                                />
                                <el-table-column 
                                    label="操作" 
                                    width="120"
                                    fixed="right"
                                    align="center"
                                >
                                    <template #default="{ row }">
                                        <el-button
                                            type="primary"
                                            link
                                            size="small"
                                            @click="editEnvVariable(row)"
                                        >
                                            编辑
                                        </el-button>
                                        <el-button
                                            type="danger"
                                            link
                                            size="small"
                                            @click="deleteEnvVariable(row)"
                                        >
                                            删除
                                        </el-button>
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

            <!-- 环境套配置对话框 -->
            <el-dialog
                v-model="showEnvSuiteDialog"
                :title="envSuiteDialogTitle"
                width="600px"
                :close-on-click-modal="false"
            >
                <el-form
                    ref="envSuiteFormRef"
                    :model="envSuiteForm"
                    :rules="envSuiteRules"
                    label-width="100px"
                >
                    <el-form-item label="环境套名称" prop="name">
                        <el-input v-model="envSuiteForm.name" placeholder="请输入环境套名称" />
                    </el-form-item>
                    <el-form-item label="描述" prop="description">
                        <el-input
                            v-model="envSuiteForm.description"
                            type="textarea"
                            :rows="3"
                            placeholder="请输入环境套描述"
                        />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <div class="dialog-footer">
                        <el-button @click="showEnvSuiteDialog = false">取消</el-button>
                        <el-button type="primary" @click="saveEnvSuite">确定</el-button>
                    </div>
                </template>
            </el-dialog>
        </PageContainer>
    </Home>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue';
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
    Folder,
    CircleCheckFilled,
    CircleCloseFilled,
    Key,
    DocumentCopy,
    Monitor
} from '@element-plus/icons-vue';
import axios from 'axios';

const router = useRouter();
const route = useRoute();

// 添加请求拦截器
axios.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// 添加响应拦截器
axios.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // token 过期或无效
                    ElMessage.error('登录已过期，请重新登录');
                    localStorage.removeItem('token'); // 清除失效的 token
                    router.push('/login'); // 重定向到登录页
                    break;
                case 403:
                    ElMessage.error('没有权限执行此操作');
                    break;
                default:
                    ElMessage.error(error.response.data.message || '请求失败');
            }
        } else {
            ElMessage.error('网络错误，请检查网络连接');
        }
        return Promise.reject(error);
    }
);

// 添加检查 token 是否存在的函数
const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        ElMessage.warning('请先登录');
        router.push('/login');
        return false;
    }
    return true;
};

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
const dialogTitle = ref('新建接测试用例');
const testCaseFormRef = ref(null);

// 表单验证规则
const rules = {
    title: [{ required: true, message: '请输入用例题', trigger: 'blur' }],
    api_path: [{ required: true, message: '请输入接口路径', trigger: 'blur' }],
    method: [{ required: true, message: '请选择请求方法', trigger: 'change' }],
    priority: [{ required: true, message: '请选优先级', trigger: 'change' }],
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
    status: null,
    statusText: '',
    time: 0,
    headers: {},
    body: null,
    contentType: ''
});

// 添加响应头列表计算属性
const responseHeadersList = computed(() => {
    const headers = responseData.value.headers || {};
    return Object.entries(headers).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : value
    }));
});

// 添加获取响应状态类型的方法
const getResponseStatusType = () => {
    const statusCode = responseData.value.status;
    if (statusCode >= 200 && statusCode < 300) {
        return 'success';
    }
    if (statusCode >= 300 && statusCode < 400) {
        return 'warning';
    }
    return 'danger';
};

// 修改断言处理相关方法
const evaluateAssertions = (response) => {
    // 如果没有断言，直接返回空数组
    if (!testCaseForm.value.assertions) {
        return [];
    }

    console.log('Response for assertions:', response);
    
    // 解析断言语句，过滤掉空行和注释
    const assertions = testCaseForm.value.assertions
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));

    return assertions.map(assertion => {
        try {
            // 分割断言语句为路径和期望值，并去除注释
            const [fullAssertion] = assertion.split('#').map(s => s.trim());
            const [path, expectedValue] = fullAssertion.split('=').map(s => s.trim());
            let actualValue;

            // 处理不同类型的断言
            if (path === '$.code') {
                // 从响应数据中获取 code
                actualValue = response.data.data.response.body.code;  // 修改这里，直接从response.body中获取code
            } else if (path.startsWith('$.data.')) {
                const dataPath = path.replace('$.data.', '');
                actualValue = getValueByPath(response.data.data, dataPath);
            } else if (path.startsWith('$headers.')) {
                const headerName = path.replace('$headers.', '');
                actualValue = response.data.data.response.headers[headerName];
            }

            console.log('Assertion check:', {
                path,
                expectedValue,
                actualValue,
                fullAssertion,
                responseData: response.data.data.response, // 添加完整的响应数据日志
                passed: String(actualValue) === String(expectedValue)
            });

            // 比较值（将两边都转换为字符串进行比较）
            const passed = String(actualValue) === String(expectedValue);
            
            return {
                passed,
                message: `${path}=${expectedValue}${passed ? ' ✓' : ' ✗'} (实际值: ${actualValue})`,
                assertion: fullAssertion,
                actualValue,
                expectedValue,
                path
            };
        } catch (e) {
            console.error('Assertion evaluation error:', e, {
                response: response.data.data.response
            });
            return {
                passed: false,
                message: `断言格式错误: ${assertion} (${e.message})`,
                assertion,
                error: e.message
            };
        }
    });
};

// 添加获取对象路径值的辅助方法
const getValueByPath = (obj, path) => {
    return path.split('.').reduce((acc, part) => {
        return acc && acc[part];
    }, obj);
};

// 在 <script setup> 中添加 formatResponse 函数
const formatResponse = (data) => {
    if (!data) {
        return '';
    }
    
    try {
        // 如果是字符串，尝试解析为 JSON
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                return JSON.stringify(parsed, null, 2);
            } catch (e) {
                // 如果不是 JSON 字符串，直接返回
                return data;
            }
        }
        
        // 如果是对象，直接格式化
        return JSON.stringify(data, null, 2);
    } catch (e) {
        console.warn('Format error:', e);
        // 如果发生错误，返回原始内容
        return String(data);
    }
};

// 修改 handleResponse 方法
const handleResponse = (response) => {
    console.log('Raw response:', response);
    
    if (response.data.success) {
        console.log('Response data before processing:', response.data.data);
        
        // 构建响应数据对象
        const processedResponse = {
            status: response.data.data.response.status_code,
            statusText: response.data.data.response.status_code === 200 ? 'OK' : 'Error',
            time: response.data.data.duration || 0,
            headers: response.data.data.response.headers,
            contentType: response.data.data.response.headers['Content-Type'] || 'unknown',
            body: response.data.data.response.body
        };
        
        console.log('Processed response data:', processedResponse);
        
        // 更新响应数据
        responseData.value = processedResponse;
        showResponse.value = true;
        
        // 如果有断言，执行断言检查
        if (testCaseForm.value.assertions) {
            const assertionResults = evaluateAssertions(response);
            console.log('Assertion results:', assertionResults); // 添加调试日志
            
            // 更新响应数据中的测试结果
            responseData.value.testResults = assertionResults;
            
            // 显示断言结果统计
            const failedAssertions = assertionResults.filter(r => !r.passed).length;
            if (failedAssertions > 0) {
                ElMessage.error(`测试执行完成，但有 ${failedAssertions} 个断言失败`);
                // 更新测试用例状态为失败
                updateTestCaseStatus(testCaseForm.value.case_id, '失败');
            } else if (assertionResults.length > 0) {
                ElMessage.success('测试执行成功，所有断言通过');
                // 更新测试用例状态为通过
                updateTestCaseStatus(testCaseForm.value.case_id, '通过');
            }
        }
    } else {
        console.warn('Response not successful:', response.data);
        ElMessage.error(response.data.message || '请求失败');
    }
};

// 添加更新测试用例状态的方法
const updateTestCaseStatus = async (caseId, status) => {
    try {
        const response = await axios.put(
            `http://localhost:8081/api/testcase/status/${caseId}`,
            {
                status: status,
                project_id: projectId.value
            },
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        if (response.data.code === 200) {
            console.log(`Test case status updated to: ${status}`);
            // 刷新测试用例列表
            fetchTestCases();
        } else {
            console.error('Failed to update test case status:', response.data);
        }
    } catch (error) {
        console.error('Error updating test case status:', error);
    }
};

// 添加 handleBodyInput 方法
const handleBodyInput = (value) => {
    if (bodyType.value === 'raw' && rawContentType.value === 'application/json') {
        validateJson(value);
    }
};

// 修改 submitTestCase 方法
const submitTestCase = async () => {
    try {
        loading.value = true;
        const response = await axios.post(
            `http://localhost:8081/api/testcase/execute/${testCaseForm.value.case_id}`,
            {
                project_id: projectId.value
            }
        );

        if (response.data.success === true) {
            // 构建响应数据对象
            const processedResponse = {
                status: response.data.data.response.status_code,
                statusText: response.data.data.response.status_code === 200 ? 'OK' : 'Error',
                time: response.data.data.duration * 1000,
                headers: response.data.data.response.headers || {},
                body: response.data.data.response.body,
                contentType: response.data.data.response.headers['Content-Type'] || 'unknown',
                testResults: [] // 初始化测试结果数组
            };
            
            // 更新响应数据
            responseData.value = processedResponse;
            showResponse.value = true;

            // 如果有断言，执行断言检查
            if (testCaseForm.value.assertions) {
                const assertionResults = evaluateAssertions(response);
                console.log('Assertion results:', assertionResults);
                
                // 更新响应数据中的测试结果
                responseData.value.testResults = assertionResults;
                
                // 显示断言结果统计
                const failedAssertions = assertionResults.filter(r => !r.passed).length;
                if (failedAssertions > 0) {
                    ElMessage.error(`测试执行完成，但有 ${failedAssertions} 个断言失败`);
                    // 更新测试用例状态为失败
                    await updateTestCaseStatus(testCaseForm.value.case_id, '失败');
                } else if (assertionResults.length > 0) {
                    ElMessage.success('测试执行成功，所有断言通过');
                    // 更新测试用例状态为通过
                    await updateTestCaseStatus(testCaseForm.value.case_id, '通过');
                }
            } else {
                // 如果没有断言，显示执行成功的消息
                ElMessage.success('请求执行成功');
            }
        } else {
            // 只有在没有断言结果的情况下才显示请求失败的消息
            if (!testCaseForm.value.assertions) {
                ElMessage.error(response.data.message || '请求失败');
            }
        }
    } catch (error) {
        console.error('Request error:', error);
        // 只有在没有断言结果的情况下才显示请求失败的消息
        if (!testCaseForm.value.assertions) {
            ElMessage.error(error.response?.data?.message || error.message || '请求发送失败');
        }
    } finally {
        loading.value = false;
    }
};

// 修改 fetchTestCases 方法
const fetchTestCases = async () => {
    if (!checkAuth()) return;
    
    console.log('Fetching test cases for project:', projectId.value);
    
    try {
        loading.value = true;
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
    } finally {
        loading.value = false;
    }
};

// 修改执行测试用例的方法
const executeTestCase = async (caseId) => {
    if (!currentEnvId.value) {
        ElMessage.warning('请先选择环境套');
        return;
    }

    try {
        loading.value = true;
        
        const response = await fetch(`http://localhost:8081/api/testcase/execute/${caseId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                project_id: route.query.projectId,
                env_id: currentEnvId.value
            })
        });

        const data = await response.json();
        if (data.success === true) {
            ElMessage({
                type: 'success',
                message: data.message || '测试用例执行成功',
                duration: 3000
            });
            fetchTestCases();
        } else {
            ElMessage.error(data.message || '执行失败');
        }
    } catch (error) {
        console.error('执行测试用例失败:', error);
        ElMessage.error('执行测试用例失败');
    } finally {
        loading.value = false;
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
            ElMessage.success('删成功');
            fetchTestCases();
        }
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败');
            console.error(error);
        }
    }
};

// 修改编辑测试用例的方法
const editTestCase = (row) => {
    dialogTitle.value = '编辑接口测试用例';
    
    // 重置表单数据
    testCaseForm.value = {
        case_id: row.case_id,
        title: row.title,
        api_path: row.api_path,
        method: row.method,
        priority: row.priority,
        // 格式化 body 内容
        body: formatRequestBody(row.body),
        assertions: row.assertions || '',
        expected_result: typeof row.expected_result === 'string' 
            ? row.expected_result 
            : JSON.stringify(row.expected_result, null, 2)
    };
    
    // 设置 body 类型
    bodyType.value = row.body_type || 'raw';
    rawContentType.value = row.raw_content_type || 'application/json';
    
    // 设置请求头数据
    headersTableData.value = Array.isArray(row.headers) 
        ? row.headers.map(header => ({
            enabled: true,
            key: header.key || '',
            value: header.value || '',
            description: header.description || ''
        }))
        : [{ enabled: true, key: 'Content-Type', value: 'application/json', description: '' }];
    
    // 设置参数数据
    paramsTableData.value = Array.isArray(row.params)
        ? row.params.map(param => ({
            enabled: true,
            key: param.key || '',
            value: param.value || '',
            description: param.description || ''
        }))
        : [{ enabled: true, key: '', value: '', description: '' }];
    
    // 设置 form-data 数据
    formDataTableData.value = Array.isArray(row.form_data)
        ? row.form_data.map(item => ({
            enabled: true,
            key: item.key || '',
            value: item.value || '',
            description: item.description || ''
        }))
        : [{ enabled: true, key: '', value: '', description: '' }];
    
    // 打印调试信息
    console.log('Editing test case:', {
        testCaseForm: testCaseForm.value,
        bodyType: bodyType.value,
        rawContentType: rawContentType.value,
        headers: headersTableData.value,
        params: paramsTableData.value,
        formData: formDataTableData.value
    });
    
    showAddDialog.value = true;
};

// 添加格式化请求体的方法
const formatRequestBody = (body) => {
    if (!body) return '';
    
    try {
        // 如果是字符串，尝试解析为对象后再格式化
        if (typeof body === 'string') {
            try {
                const parsed = JSON.parse(body);
                return JSON.stringify(parsed, null, 2);
            } catch {
                // 如果解析失败，直接返回原字符串
                return body;
            }
        }
        
        // 如果是对象，直接格式化
        return JSON.stringify(body, null, 2);
    } catch (error) {
        console.error('Format body error:', error);
        // 如果发生错误，将对象转换为字符串
        return JSON.stringify(body) || '';
    }
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
        '': 'danger',
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
    const date = new Date(dateString.replace(/-/g, '/'));
    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

// 添加一个更详细的日期时间格式化方法（用于tooltip）
const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString.replace(/-/g, '/'));
    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(date);
};

// 处理新建测试用例
const handleCreateTestCase = () => {
    dialogTitle.value = '新建接口测试用例';
    // 置表数据
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

// 添加 Body 类相关的响应式数
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
        header: '$headers.Content-Type=application/json  # 查响头'
    };
    
    const currentAssertions = testCaseForm.value.assertions || '';
    testCaseForm.value.assertions = currentAssertions + 
        (currentAssertions ? '\n' : '') + 
        templates[type];
};

// 修改保存测试用例的方法
const saveTestCase = async () => {
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
                
                // 过滤有效的请求头数据
                const validHeaders = headersTableData.value
                    .filter(item => item.enabled && item.key.trim() && item.value.trim())
                    .reduce((acc, curr) => {
                        acc[curr.key.trim()] = curr.value.trim();
                        return acc;
                    }, {});

                // 构建请求数据
                const requestData = {
                    title: testCaseForm.value.title,
                    api_path: testCaseForm.value.api_path,
                    method: testCaseForm.value.method,
                    priority: testCaseForm.value.priority,
                    headers: validHeaders, // 使用过滤后的请求头
                    body: bodyType.value === 'raw' && testCaseForm.value.body 
                        ? JSON.parse(testCaseForm.value.body)
                        : {},
                    assertions: testCaseForm.value.assertions,
                    expected_result: testCaseForm.value.expected_result 
                        ? JSON.parse(testCaseForm.value.expected_result)
                        : {},
                    project_id: projectId.value,
                    body_type: bodyType.value,
                    raw_content_type: rawContentType.value,
                    // 过滤有效的 form-data
                    form_data: formDataTableData.value
                        .filter(item => item.enabled && item.key.trim())
                        .map(item => ({
                            key: item.key.trim(),
                            value: item.value.trim(),
                            description: item.description?.trim() || ''
                        }))
                };

                // 根据是否有 case_id 判断是新建还是编辑
                const url = testCaseForm.value.case_id
                    ? `http://localhost:8081/api/testcase/update/${testCaseForm.value.case_id}/`
                    : 'http://localhost:8081/api/testcase/create/';

                const response = await axios({
                    method: testCaseForm.value.case_id ? 'PUT' : 'POST',
                    url,
                    data: requestData,
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.code === 200) {
                    ElMessage.success(testCaseForm.value.case_id ? '测试用例更成功' : '测试用例保存成功');
                    showAddDialog.value = false;
                    fetchTestCases(); // 刷新列表
                } else {
                    throw new Error(response.data.message || '保存失败');
                }
            } catch (error) {
                console.error('保存失败:', error);
                ElMessage.error(error.response?.data?.message || error.message || '保存失败，请检查网络连接');
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

// 修改拖动相关方法
const startResize = (e) => {
    isResizing.value = true;
    startY.value = e.clientY;
    startHeight.value = responsePanelHeight.value;
    
    // 添加全局事件监听
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    
    // 添加拖动时的样式
    document.body.style.cursor = 'nw-resize';
    document.body.style.userSelect = 'none';
};

const handleResize = (e) => {
    if (!isResizing.value) return;
    
    const diff = startY.value - e.clientY; // 向上拖动为正（增大），向下拖动为负（减小）
    const newHeight = Math.max(100, Math.min(600, startHeight.value + diff));
    responsePanelHeight.value = newHeight;
};

const stopResize = () => {
    isResizing.value = false;
    
    // 移除全局事件监听
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    
    // 恢复默认样式
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
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
    if (!checkAuth()) return;
    
    console.log('TestCases mounted with projectId:', projectId.value);
    console.log('TestCases mounted with projectName:', projectName.value); // 添加日志
    
    // 确有项目ID
    if (!projectId.value) {
        console.error('No project ID provided');
        ElMessage.error('请选择项目');
        router.push('/project');
        return;
    }
    
    try {
        loading.value = true;
        await Promise.all([
            fetchTestCases(),
            fetchEnvList()  // 添加获取环境套列表
        ]);
    } catch (error) {
        console.error('初始化失败:', error);
        ElMessage.error(error.message || '加载失败');
    } finally {
        loading.value = false;
    }
});

// 添加环境变量相关的响应式数据
const showEnvDialog = ref(false);
const envDialogTitle = ref('新建环境变量');
const envFormRef = ref(null);
const envForm = ref({
  name: '',
  description: '',
  envSuiteId: '',
  variables: [{ key: '', value: '', description: '' }]
});

// 环境套相关的响应式数据
const currentEnvId = ref('');

// 修改现有的 envList 定义，合并环境变量列表和环境套列表的功能
const envList = ref([]);

// 获取环境套列表
const fetchEnvList = async () => {
    try {
        const response = await axios.get(
            `http://localhost:8081/api/env-suite/list/${projectId.value}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        if (response.data.code === 200) {
            envList.value = response.data.data.items || [];
            // 如果有默认环境套，自动选中
            if (envList.value.length > 0 && !currentEnvId.value) {
                currentEnvId.value = envList.value[0].id;
            }
        } else {
            ElMessage.error(response.data.message || '获取环境套列表失败');
        }
    } catch (error) {
        console.error('获取环境套列表失败:', error);
        ElMessage.error('获取环境套列表失败，请检查网络连接');
    }
};

// 修改环境变量表单验证规则
const envRules = {
  envSuiteId: [
    { required: true, message: '请选择环境套', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入环境变量名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
};

// 修改变量相关方法
const addVariable = () => {
  envForm.value.variables.push({ key: '', value: '', description: '' });
};

const removeVariable = (index) => {
  envForm.value.variables.splice(index, 1);
};

// 添加环境变相关方法
const handleCreateEnv = () => {
  // 重置环境变量表单
  envForm.value = {
    name: '',
    description: '',
    envSuiteId: '',
    variables: [{ key: '', value: '', description: '' }] // 初始化一个空变量
  };
  
  // 如果已环境套，直接打开环境变量对话框
  if (envSuites.value.length > 0) {
    showEnvDialog.value = true;
  } else {
    // 如果没有环境套，先创建环境套
    showEnvSuiteDialog.value = true;
  }
};

const addEnvVar = () => {
    envVars.value.push({ key: '', value: '', description: '' });
};

const removeEnvVar = (index) => {
    envVars.value.splice(index, 1);
};

const resetEnvForm = () => {
    envForm.value = {
        name: '',
        description: '',
        envSuiteId: '', // 确保重置时也清空环境套ID
        variables: [{ key: '', value: '', description: '' }]
    };
};

// 修改 submitEnvForm 方法中的相关部分
const submitEnvForm = async () => {
    if (!envFormRef.value) return;
    
    await envFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                // 构建求数据，确保包含所有已填写的字段
                const requestData = {
                    name: envForm.value.name,
                    description: envForm.value.description,
                    envSuiteId: envForm.value.envSuiteId,
                    project_id: projectId.value,
                    // 过滤掉空的变
                    variables: envForm.value.variables.filter(v => v.key || v.value || v.description)
                };

                console.log('Submitting env form data:', requestData); // 添加调试日志

                const response = await axios.post(
                    'http://localhost:8081/api/env/create',
                    requestData,
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
                    // 重置表单
                    resetEnvForm();
                    // 刷新环境变量列表
                    if (showEnvListDialog.value) {
                        // 只有当环境变量列表对话框打开时才刷新列表
                        await fetchEnvList();
                    }
                } else {
                    ElMessage.error(response.data.message || '创建失败');
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
        'port': '例: 8080',
        'base_url': '如: /api/v1',
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
    // 打辑弹窗并填数据
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
                project_id: projectId.value  // 项目ID
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
        ElMessage.error('新变失败，请检查网络连接');
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

// 修改 JSON 格式化方法
const formatJsonInput = () => {
    try {
        if (!testCaseForm.value.body) {
            ElMessage.warning('请先输入 JSON 数据');
            return;
        }
        
        // 先解析成对象
        const parsed = JSON.parse(testCaseForm.value.body);
        // 格式化显示用
        const formatted = JSON.stringify(parsed, null, 2);
        testCaseForm.value.body = formatted;
        
        // 清除错误提示
        jsonError.value = '';
        ElMessage.success('JSON 格式化成功');
    } catch (e) {
        console.error('JSON 格式化失败:', e);
        ElMessage.error('JSON 格式错误，请检查输入');
        validateJson(testCaseForm.value.body);
    }
};

// 添加 JSON 验证方法
const validateJson = (text) => {
    try {
        if (!text) return true;
        JSON.parse(text);
        jsonError.value = '';
        return true;
    } catch (e) {
        jsonError.value = e.message;
        return false;
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

// 在组件卸载移除事件监听
onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
    // ... 其他已有的 onUnmounted 代码
});

// 在 script setup 部分添加 JSON 校验相关的函数
const jsonError = ref('');
const jsonErrorPosition = ref(null);

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
    // 确保输入是字符串
    const str = String(text || '');
    return str ? str.split('\n').length : 1;
};

// 添加 body 类型切换处理
watch(bodyType, (newType) => {
    if (newType === 'raw') {
        // 确保 body 是字符串
        testCaseForm.body = testCaseForm.body || '';
    }
});

// 初始化表单时确保 body 是字符串
const initForm = () => {
    testCaseForm.value = {
        ...testCaseForm.value, // 保留其他字段
        body: '',  // 确保初始值是空字符串
    };
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

// 修改上传成功的理方法
const handleUploadSuccess = (response, file) => {
    // 关闭有消息提示
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

// 环境套相关数据
const showEnvSuiteDialog = ref(false);
const envSuiteDialogTitle = ref('新建环境套');
const envSuiteFormRef = ref(null);
const envSuites = ref([]);

const envSuiteForm = ref({
  name: '',
  description: '',
  projectId: route.query.projectId
});

const envSuiteRules = {
  name: [
    { required: true, message: '请输入环境套名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
};

// 修改已有的环境变量表单，添加环境套ID字段
envForm.value = {
  ...envForm.value,
  envSuiteId: '', // 新增环境套ID字段
};

// 修改获取环境套列表的方法，确保返回完整的环境套信息
const fetchEnvSuites = async () => {
    try {
        const response = await axios.get(
            `http://localhost:8081/api/env-suite/list/${projectId.value}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        if (response.data.code === 200) {
            // 确保数据包含必要的字段
            envSuites.value = (response.data.data.items || []).map(suite => ({
                id: suite.id,
                name: suite.name,
                description: suite.description || ''
            }));
            
            // 如果当前选中的环境套不在列表中，清空选择
            if (envForm.value.envSuiteId && 
                !envSuites.value.some(suite => suite.id === envForm.value.envSuiteId)) {
                envForm.value.envSuiteId = '';
            }
            
            // 添加调试日志
            console.log('Environment suites:', envSuites.value);
            console.log('Current selected suite:', envForm.value.envSuiteId);
        } else {
            ElMessage.error(response.data.message || '获取环境套列表失败');
        }
    } catch (error) {
        console.error('获取环境套列表失败:', error);
        ElMessage.error('获取环境套列表失败，请检查网络连接');
    }
};

// 显示创建环境套对话框
const showCreateEnvSuiteDialog = () => {
  envSuiteDialogTitle.value = '新建环境套';
  envSuiteForm.value = {
    name: '',
    description: '',
    projectId: route.query.projectId
  };
  showEnvSuiteDialog.value = true;
};

// 保存环境套
const saveEnvSuite = async () => {
  if (!envSuiteFormRef.value) return;
  
  await envSuiteFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await axios.post(
          'http://localhost:8081/api/env-suite/create',
          {
            ...envSuiteForm.value,
            project_id: projectId.value
          },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.code === 200) {
          ElMessage.success('环境套创建成功');
          showEnvSuiteDialog.value = false;
          await fetchEnvSuites(); // 刷新环境套列表
          
          // 修改这里：使用正确的属性路径设置新创建的环境套ID
          const newSuiteId = response.data.data.id;
          envForm.value.envSuiteId = newSuiteId;
          
          // 打开环境变量创建对话框
          showEnvDialog.value = true;
        } else {
          ElMessage.error(response.data.message || '环境套创建失败');
        }
      } catch (error) {
        console.error('创建环境套失败:', error);
        ElMessage.error('创建环境套失败');
      }
    }
  });
};

// 在组件挂载时获取环境套列表
onMounted(() => {
  fetchEnvSuites();
  // ... 其他已有的 onMounted 代码 ...
});

// 添加环境套选择变更处理方法
const handleEnvSuiteChange = (suiteId) => {
  envForm.value.envSuiteId = suiteId;
};

// 修改环境变量对话框的模板
watch(showEnvDialog, (newVal) => {
    if (!newVal) {
        resetEnvForm();
    }
});

// 添加环境套选择变更的监听
watch(() => envForm.value.envSuiteId, (newVal) => {
    console.log('Selected environment suite changed:', newVal);
});

// 添加表单数据变化的监听（用于调试）
watch(() => envForm.value, (newVal) => {
    console.log('Environment form data changed:', newVal);
}, { deep: true });

// 添加获取环境套名称的方法
const getEnvSuiteName = (suiteId) => {
    const suite = envSuites.value.find(s => s.id === suiteId);
    return suite ? suite.name : '未知环境套';
};

// 添加格式化响应内容的方法
const formatResponseBody = () => {
    if (!responseData.value.body) return;
    
    try {
        const formatted = formatResponse(responseData.value.body);
        responseData.value.body = formatted;
        ElMessage.success('格式化成功');
    } catch (e) {
        console.error('Format error:', e);
        ElMessage.warning('格式化失败');
    }
};

// 修改复制按钮的处理方法
const copyResponseBody = () => {
    if (!responseData.value.body) {
        ElMessage.warning('没有可复制的内容');
        return;
    }

    // 确保复制的内容是字符串格式
    const textToCopy = typeof responseData.value.body === 'object' 
        ? JSON.stringify(responseData.value.body, null, 2)
        : String(responseData.value.body);

    navigator.clipboard.writeText(textToCopy)
        .then(() => ElMessage.success('已复制到剪贴板'))
        .catch(() => ElMessage.error('复制失败'));
};

// 在 script 部分添加相关方法
const queryJsonPaths = (query, cb) => {
    if (!responseData.value || !responseData.value.body) {
        cb([]);
        return;
    }

    try {
        // 获取响应数据
        const response = responseData.value.body;
        const paths = [];
        
        // 递归遍历对象，生成所有可能的路径
        const traverse = (obj, path = '') => {
            if (!obj) return;
            
            if (typeof obj === 'object') {
                for (const key in obj) {
                    const currentPath = path ? `${path}.${key}` : key;
                    const fullPath = `$.${currentPath}`;
                    
                    // 如果路径包含查询字符串，则添加到结果中
                    if (!query || currentPath.toLowerCase().includes(query.toLowerCase())) {
                        paths.push({
                            value: fullPath,
                            path: fullPath,
                            previewValue: typeof obj[key] === 'object' 
                                ? JSON.stringify(obj[key])
                                : String(obj[key])
                        });
                    }
                    
                    // 继续遍历子对象
                    if (typeof obj[key] === 'object') {
                        traverse(obj[key], currentPath);
                    }
                }
            }
        };

        // 特殊处理 code 字段
        if (!query || 'code'.includes(query.toLowerCase())) {
            paths.push({
                value: '$.code',
                path: '$.code',
                previewValue: String(response.code || '')
            });
        }

        // 遍历响应数据
        traverse(response);

        // 返回过滤后的路径建议
        cb(paths);
    } catch (error) {
        console.error('生成路径建议失败:', error);
        cb([]);
    }
};

const handleJsonPathSelect = (item) => {
    extractors.value.forEach(extractor => {
        if (extractor.jsonPath === item.value) {
            extractor.previewValue = item.previewValue;
        }
    });
};

const copyExtractedValue = (value) => {
    if (!value) return;
    
    navigator.clipboard.writeText(value)
        .then(() => {
            ElMessage.success('已复制到剪贴板');
        })
        .catch(() => {
            ElMessage.error('复制失败');
        });
};

const testExtractor = (extractor) => {
    try {
        if (!responseData.value || !responseData.value.body) {
            ElMessage.warning('请先发送请求获取响应数据');
            return;
        }

        // 获取响应体数据
        let jsonData = responseData.value.body;
        console.log('Testing extractor with data:', jsonData);
        console.log('Using path:', extractor.jsonPath);
        
        // 处理 jsonPath
        const path = extractor.jsonPath.replace(/^\$\./, '').split('.');
        let value = jsonData;
        
        // 特殊处理 code 字段
        if (path[0] === 'code') {
            value = jsonData.code;
        } else if (path[0] === 'data') {
            // 如果路径以 data 开头，从 data 对象开始遍历
            value = jsonData.data;
            path.shift(); // 移除 'data'
            
            // 遍历剩余路径
            for (const key of path) {
                if (value === undefined || value === null) break;
                value = value[key];
                console.log(`Extracting ${key}:`, value);
            }
        } else {
            // 直接从根对象开始遍历
            for (const key of path) {
                if (value === undefined || value === null) break;
                value = value[key];
                console.log(`Extracting ${key}:`, value);
            }
        }
        
        // 更新提取到的值
        if (value !== undefined && value !== null) {
            extractor.extractedValue = typeof value === 'object' 
                ? JSON.stringify(value) 
                : String(value);
            console.log(`Successfully extracted value:`, extractor.extractedValue);
            ElMessage.success('提取成功');
        } else {
            extractor.extractedValue = null;
            ElMessage.warning('未找到匹配的值');
        }
    } catch (error) {
        console.error('提取测试失败:', error);
        ElMessage.error('提取测试失败: ' + error.message);
        extractor.extractedValue = null;
    }
};

const hasResponseData = computed(() => {
    return responseData.value && responseData.value.body;
});

// 获取优先级标签类型
const getPriorityTagType = (priority) => {
    switch (priority) {
        case '高':
            return 'danger';  // 红色
        case '中':
            return 'warning'; // 橙色
        case '低':
            return 'info';    // 灰色
        default:
            return '';
    }
};

// 获取状态标签类型
const getStatusTagType = (status) => {
    switch (status) {
        case 'pass':
        case '通过':
            return 'success'; // 绿色
        case 'fail':
        case '失败':
            return 'danger';  // 红色
        case '未执行':
            return 'info';    // 灰色
        default:
            return '';
    }
};

// 处理环境套变更
const handleEnvChange = async (value) => {
    try {
        await axios.put('/environment/current/', {
            env_id: value
        });
        ElMessage.success('环境套切换成功');
    } catch (error) {
        console.error('切换环境套失败:', error);
        ElMessage.error('切换环境套失败，请重试');
        // 恢复原值
        currentEnvId.value = '';
    }
};

</script>

<style scoped>
/* 基础布局样式 */
.table-card {
    margin: 16px;
}

.project-info {
    margin-bottom: 16px;
    padding: 8px 0;
}

.project-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    color: #303133;
}

/* 搜索栏样式 */
.table-header {
    margin-bottom: 16px;
}

.search-bar {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
}

.search-input {
    width: 240px;
}

.filter-select {
    width: 160px;
}

/* 操作按钮容器样式 */
.operation-container {
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.left-operations {
    display: flex;
    gap: 8px;
}

.right-operations {
    display: flex;
    align-items: center;
    gap: 8px;
}

.env-label {
    font-size: 14px;
    color: #606266;
}

/* 表格相关样式 */
.case-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.title-text {
    flex: 1;
}

.priority-tag {
    flex-shrink: 0;
}

.api-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.method-tag {
    flex-shrink: 0;
    min-width: 60px;
    text-align: center;
}

.api-path {
    flex: 1;
    color: #606266;
}

.status-tag {
    min-width: 60px;
}

/* 分页器样式 */
.pagination-container {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
}

/* 请求方法选择器样式 */
.method-select {
    :deep(.el-input__wrapper) {
        padding: 0 8px;
    }

    :deep(.el-input__inner) {
        font-weight: bold;
        text-align: center;
    }

    :deep(.el-select__selected-item) {
        font-weight: bold;
        text-align: center;
    }
}

/* 方法颜色样式 */
:deep(.method-get),
.method-get {
    color: #67C23A !important;
    font-weight: bold;
}

:deep(.method-post),
.method-post {
    color: #409EFF !important;
    font-weight: bold;
}

:deep(.method-put),
.method-put {
    color: #E6A23C !important;
    font-weight: bold;
}

:deep(.method-delete),
.method-delete {
    color: #F56C6C !important;
    font-weight: bold;
}

:deep(.method-patch),
.method-patch {
    color: #909399 !important;
    font-weight: bold;
}

/* 下拉选项样式 */
:deep(.el-select-dropdown__item) {
    padding: 0 20px !important;
    text-align: center !important;

    &.selected {
        background-color: var(--el-fill-color-light);
    
    &.method-get {
        background-color: #f0f9eb;
    }
    
    &.method-post {
        background-color: #ecf5ff;
    }
    
    &.method-put {
        background-color: #fdf6ec;
    }
    
    &.method-delete {
        background-color: #fef0f0;
    }
    
    &.method-patch {
        background-color: #f4f4f5;
        }
    }
}

/* 上传按钮样式 */
.upload-button {
    display: inline-block;
}

/* 表格内按钮组样式 */
.el-button-group {
    display: flex;
    gap: 4px;
}

/* 状态标签样式 */
.el-tag.status-tag {
    min-width: 60px;
    text-align: center;
}

/* 优先级标签样式 */
.el-tag.priority-tag {
    min-width: 40px;
    text-align: center;
}

/* 表格内图标按钮样式 */
.el-button.is-circle {
    margin: 0 4px;
}

/* 测试用例编辑对话框样式 */
.test-case-dialog {
    :deep(.el-dialog__body) {
        padding: 20px;
    }
}

/* 请求 URL 区域样式 */
.request-url-section {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    align-items: flex-start;
}

.method-select {
    width: 120px;
}

.api-input {
    flex: 1;
}

.send-button {
    width: 80px;
}

/* 用例基本信息区域样式 */
.case-info-section {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
}

.case-title-input {
    flex: 1;
}

.case-priority-select {
    width: 120px;
}

/* 请求配置标签页样式 */
.request-tabs {
    margin-bottom: 16px;
    
    :deep(.el-tabs__content) {
        padding: 16px;
    }
}

/* 参数表格样式 */
.params-table, .headers-table, .form-data-table {
    margin-bottom: 12px;

    :deep(.el-table) {
        margin-bottom: 12px;
    }
}

.table-actions {
    display: flex;
    justify-content: flex-start;
    padding: 8px 0;
}

/* Body 编辑器样式 */
.body-content {
    .body-type-selector {
        margin-bottom: 16px;
        display: flex;
        gap: 12px;
        align-items: center;
    }

    .json-editor-container {
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        
        .editor-toolbar {
            padding: 8px;
            border-bottom: 1px solid #dcdfe6;
            background-color: #f5f7fa;
        }

        .editor-content {
            display: flex;
            
            .line-numbers {
                padding: 8px;
                background-color: #f5f7fa;
                border-right: 1px solid #dcdfe6;
                text-align: right;
                color: #909399;
                user-select: none;
            }

            .editor-wrapper {
                flex: 1;
                position: relative;

                :deep(.el-textarea__inner) {
                    border: none;
                    padding: 8px;
                    font-family: monospace;
                    line-height: 1.6;
                    min-height: 200px;
                }

                .json-error-message {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                }
            }
        }
    }
}

/* 提取器区域样式 */
.extractors-section {
    .section-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .extractor-item {
        margin-bottom: 12px;
        padding: 12px;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        background-color: #f8f9fa;

        :deep(.el-row) {
            align-items: center;
        }

        .input-with-button {
            display: flex;
            gap: 8px;
            align-items: center;

            .json-path-input {
                flex: 1;
            }

            .test-button,
            .delete-button {
                flex-shrink: 0;
            }
        }

        .extractor-value {
            display: flex;
            align-items: center;
            gap: 8px;
            height: 32px;  /* 与输入框保持一致的高度 */

            .value-tag {
                flex: 1;
                text-overflow: ellipsis;
                overflow: hidden;
                display: flex;
                align-items: center;
            }
        }
    }
}

/* 确保自动完成建议框中的图标也垂直居中 */
:deep(.el-autocomplete-suggestion__list) {
    .suggestion-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 8px;
        
        .path {
            color: #409EFF;
            font-family: monospace;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .value {
            color: #909399;
            font-size: 12px;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
}

/* 调整输入框内图标的垂直对齐 */
:deep(.el-input__prefix) {
    display: flex;
    align-items: center;
}

/* 调整按钮内图标的垂直对齐 */
:deep(.el-button .el-icon) {
    vertical-align: middle;
}

/* 测试结果区域样式 */
.test-results {
    padding: 16px;

    .test-summary {
        margin-bottom: 16px;
        padding: 12px;
        background-color: #f8f9fa;
        border-radius: 4px;
        border: 1px solid #e4e7ed;

        .summary-stats {
            display: flex;
            gap: 24px;

            .stat-item {
                display: flex;
                align-items: center;
                gap: 8px;

                .stat-label {
                    color: #606266;
                    font-weight: 500;
                }

                .stat-value {
                    font-weight: bold;
                    font-size: 16px;
                    
                    &.pass { 
                        color: #67C23A; 
                    }
                    &.fail { 
                        color: #F56C6C; 
                    }
                }
            }
        }
    }

    .test-result-list {
        .test-result-item {
            display: flex;
            gap: 12px;
            padding: 16px;
            border: 1px solid #dcdfe6;
            border-radius: 4px;
            margin-bottom: 12px;
            transition: all 0.3s ease;

            &.passed {
                background-color: #f0f9eb;
                border-color: #e1f3d8;
            }

            &.failed {
                background-color: #fef0f0;
                border-color: #fde2e2;
            }

            .result-icon {
                display: flex;
                align-items: center;
                font-size: 20px;
                
                .success-icon { 
                    color: #67C23A; 
                }
                .error-icon { 
                    color: #F56C6C; 
                }
            }

            .result-content {
                flex: 1;

                .result-assertion {
                    font-weight: bold;
                    margin-bottom: 8px;
                    color: #303133;
                }

                .result-details {
                    display: flex;
                    gap: 24px;
                    color: #606266;
                    font-size: 14px;

                    .actual-value, .expected-value {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        
                        &::before {
                            content: '';
                            display: inline-block;
                            width: 6px;
                            height: 6px;
                            border-radius: 50%;
                            background-color: currentColor;
                        }
                    }
                }
            }
        }
    }
}

/* 响应面板样式 */
.response-panel {
    border-top: 2px solid #dcdfe6;
    background-color: #f8f9fa;

    .response-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #dcdfe6;

        .response-title {
            font-size: 16px;
            font-weight: bold;
            color: #303133;
        }

        .status-info {
            display: flex;
            align-items: center;
            gap: 12px;

            .time-info {
                color: #909399;
            }
        }
    }

    .response-body-wrapper {
        position: relative;
        
        .response-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            background-color: #f5f7fa;
            border-bottom: 1px solid #dcdfe6;

            .content-type {
                color: #606266;
            }
        }

        .response-body {
            padding: 16px;
            margin: 0;
            background-color: #fff;
            font-family: monospace;
            white-space: pre-wrap;
            overflow-y: auto;
            min-height: 100px;
            max-height: 600px;
            user-select: text;
            position: relative;
        }

        .resize-handle {
            position: absolute;
            right: 0;
            bottom: 0;
            width: 20px;
            height: 20px;
            cursor: nw-resize;
            background: linear-gradient(135deg, transparent 50%, #e4e7ed 50%);
            z-index: 1;
            
            &:hover {
                background: linear-gradient(135deg, transparent 50%, #c0c4cc 50%);
            }
        }
    }
}

/* 对话框底部按钮样式 */
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 20px;
}

/* 空状态样式 */
.empty-response {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    background-color: #fff;
}

/* 添加样式 */
.suggestion-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    
    .path {
        color: #409EFF;
        font-family: monospace;
    }
    
    .value {
        color: #909399;
        font-size: 12px;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

/* 圆形按钮中的图标居中样式 */
:deep(.el-button.is-circle) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    
    .el-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        margin: 0;
        vertical-align: middle;
    }
}

/* 确保所有按钮中的图标都垂直居中 */
:deep(.el-button) {
    .el-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        vertical-align: middle;
    }
}
</style>