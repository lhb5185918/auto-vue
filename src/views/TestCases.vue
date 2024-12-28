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
                                                    <el-input v-model="row.key" placeholder="����数��" />
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
                                                        >
                                                            <template #prefix>
                                                                <el-icon><Key /></el-icon>
                                                            </template>
                                                            <template #default="{ item }">
                                                                <div class="suggestion-item">
                                                                    <span class="path">{{ item.path }}</span>
                                                                    <span class="value">{{ item.value }}</span>
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
                                                            :content="extractor.extractedValue ? '提取的值' : '未提取到��'" 
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
                                        <!-- 添加测试结果统计 -->
                                        <div class="test-summary" v-if="responseData.testResults && responseData.testResults.length">
                                            <div class="summary-stats">
                                                <div class="stat-item">
                                                    <span class="stat-label">总断言数:</span>
                                                    <span class="stat-value">{{ responseData.testResults.length }}</span>
                                                </div>
                                                <div class="stat-item">
                                                    <span class="stat-label">通过数:</span>
                                                    <span class="stat-value pass">
                                                        {{ responseData.testResults.filter(r => r.passed).length }}
                                                    </span>
                                                </div>
                                                <div class="stat-item">
                                                    <span class="stat-label">失败数:</span>
                                                    <span class="stat-value fail">
                                                        {{ responseData.testResults.filter(r => !r.passed).length }}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 测试结果列表 -->
                                        <div class="test-result-list">
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
                                新建环境���
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
                                            <el-option-group label="认证��息">
                                                <el-option value="username" label="用户�����(username)" />
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
                                            placeholder="请输入变��值"
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
                            <el-option-group label="认证信">
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
const dialogTitle = ref('新建接���测试用例');
const testCaseFormRef = ref(null);

// 表单验证规则
const rules = {
    title: [{ required: true, message: '请输入用例题', trigger: 'blur' }],
    api_path: [{ required: true, message: '请输入接口路径', trigger: 'blur' }],
    method: [{ required: true, message: '请选择请求方法', trigger: 'change' }],
    priority: [{ required: true, message: '请选���优先级', trigger: 'change' }],
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
                actualValue = response.data.data.response.status_code;
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

// 修改 handleResponse 方法
const handleResponse = (response) => {
    console.log('Raw response:', response);
    
    if (response.data.success) {
        const apiResponse = response.data.data;
        
        // 构建响应数据对象，只使用 response.body 部分
        const processedResponse = {
            status: apiResponse.response.status_code,
            statusText: apiResponse.status,
            time: apiResponse.duration * 1000,
            headers: apiResponse.response.headers,
            body: apiResponse.response.body, // 只使用 response.body
            contentType: apiResponse.response.content_type,
            testResults: evaluateAssertions(response)
        };
        
        // 处理变量提取
        extractors.value.forEach(extractor => {
            try {
                // 直接从 response.body 中提取数据
                let jsonData = apiResponse.response.body;
                console.log('Response data for extraction:', jsonData);
                
                // 处理 jsonPath
                const path = extractor.jsonPath.replace(/^\$\./, '').split('.');
                let value = jsonData;
                
                // 遍历路径获取值
                for (const key of path) {
                    if (value === undefined || value === null) break;
                    value = value[key];
                    console.log(`Extracting ${key}:`, value);
                }
                
                // 更新提取到的值
                if (value !== undefined && value !== null) {
                    extractor.extractedValue = typeof value === 'object' 
                        ? JSON.stringify(value) 
                        : String(value);
                    console.log(`Successfully extracted value for ${extractor.variableName}:`, extractor.extractedValue);
                } else {
                    extractor.extractedValue = null;
                    console.warn(`No value found for path ${extractor.jsonPath}`);
                }
            } catch (error) {
                console.error(`提取变量 ${extractor.variableName} 失败:`, error);
                extractor.extractedValue = null;
            }
        });
        
        // 更新响应数据
        responseData.value = processedResponse;
        showResponse.value = true;
        
        // 显示测试结果摘要
        const failedTests = processedResponse.testResults.filter(r => !r.passed).length;
        if (failedTests > 0) {
            ElMessage.warning(`${failedTests} 个断言失败`);
        } else if (processedResponse.testResults.length > 0) {
            ElMessage.success('所有断言通过');
        }
    } else {
        console.warn('Response not successful:', response.data);
    }
};

// 修改提交测试用例的方法
const submitTestCase = async () => {
    try {
        // 处理请求体数据
        let requestBody = testCaseForm.value.body; // 修改这里，使用 testCaseForm.value

        // 如果是 JSON 类型，需要特殊处理
        if (bodyType.value === 'raw' && rawContentType.value === 'application/json') {
            try {
                // 检查是否为空
                if (!requestBody) {
                    ElMessage.error('请输入 JSON 数据');
                    return;
                }
                // 先解析成对象，再转换回字符串，去除格式化带来的换行和空格
                const parsedBody = JSON.parse(requestBody);
                requestBody = JSON.stringify(parsedBody);
            } catch (e) {
                console.error('JSON parse error:', e);
                ElMessage.error('JSON 格式错误，请检查输入');
                return;
            }
        }

        // 构建请求数据
        const requestData = {
            ...testCaseForm.value, // 修改这里，使用 testCaseForm.value
            body: requestBody
        };

        // 发送请求
        const response = await axios.post('/api/testcase/execute_direct/', requestData, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': rawContentType.value || 'application/json'
            }
        });

        // 处理响应
        handleResponse(response);
    } catch (error) {
        console.error('执行测试用例失败:', error);
        ElMessage.error('执行失败: ' + error.message);
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

// 添加执行测试用例的方法
const executeTestCase = async (caseId) => {
  try {
    // 显示加载状态
    loading.value = true;
    
    const response = await fetch(`http://localhost:8081/api/testcase/execute/${caseId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        project_id: route.query.projectId
      })
    });

    const data = await response.json();
    if (data.code === 200) {
      ElMessage.success('测试用例执行成功');
      // 可以在这里更新用例状态或刷新列表
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
    
    // 设置表单数据
    testCaseForm.value = {
        ...row,
        expected_result: typeof row.expected_result === 'string' 
            ? row.expected_result 
            : JSON.stringify(row.expected_result, null, 2)
    };
    
    // 设置请求体类型
    bodyType.value = row.body_type || 'none';
    rawContentType.value = row.raw_content_type || 'application/json';
    
    // 设置请求头数据
    if (row.headers && Object.keys(row.headers).length > 0) {
        headersTableData.value = Object.entries(row.headers).map(([key, value]) => ({
            enabled: true,
            key,
            value: String(value),
            description: ''
        }));
    } else {
        headersTableData.value = [{ enabled: true, key: '', value: '', description: '' }];
    }
    
    // 设置 form-data 数据
    if (row.form_data && row.form_data.length > 0) {
        formDataTableData.value = row.form_data.map(item => ({
            enabled: true,
            ...item
        }));
    } else {
        formDataTableData.value = [{ enabled: true, key: '', value: '', description: '' }];
    }
    
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
        '��': 'danger',
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

// 添加 Body 类相关的响应式数���
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
                    ElMessage.success(testCaseForm.value.case_id ? '测试用例更���成功' : '测试用例保存成功');
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

// 添加动相关方法
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
const envDialogTitle = ref('新建环境变量');
const envFormRef = ref(null);
const envForm = ref({
  name: '',
  description: '',
  envSuiteId: '',
  variables: [{ key: '', value: '', description: '' }] // 初始化一个空变量
});
const envVars = ref([{ key: '', value: '', description: '' }]);

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
  
  // 如果已���环境套，直接打开环境变量对话框
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

// 添加获取环境变量列表的方法
const fetchEnvList = async () => {
    try {
        // 确保先获取环境套列表
        await fetchEnvSuites();
        
        const response = await axios.get(
            `http://localhost:8081/api/env/list/${projectId.value}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        if (response.data.code === 200) {
            // 确保数据包含所需字段
            envList.value = (response.data.data || []).map(env => ({
                ...env,
                envSuiteId: env.envSuiteId || env.env_suite_id, // 兼容不同的字段
            }));
            console.log('Environment list updated:', envList.value);
        } else {
            ElMessage.error(response.data.message || '获取环境变量列表失败');
        }
    } catch (error) {
        console.error('获取环境变量列表失败:', error);
        ElMessage.error('获取环境变量列表失，请检查网连接');
    }
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
                    // 过滤掉空的变��
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
        'port': '例��: 8080',
        'base_url': '���如: /api/v1',
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

// 修改 handleViewEnv 方法，确保在打开对话框时获取最新数据
const handleViewEnv = async () => {
    try {
        await fetchEnvList(); // 使用新的 fetchEnvList 方法
        showEnvListDialog.value = true;
    } catch (error) {
        console.error('获取环境变量失���:', error);
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
    // 打�����辑弹窗并填��数据
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
                project_id: projectId.value  // ��项目ID
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

// 在组件卸载������移除事件监听
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
        ElMessage.error('获取环境套列表失败，请检查��络连接');
    }
};

// 显示创建环境��对话框
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

// ��加表单数据变化的监听（用于调试）
watch(() => envForm.value, (newVal) => {
    console.log('Environment form data changed:', newVal);
}, { deep: true });

// 添加获取环境套名称的方法
const getEnvSuiteName = (suiteId) => {
    const suite = envSuites.value.find(s => s.id === suiteId);
    return suite ? suite.name : '未知环境套';
};

// 修改格式化响应内容的方法
const formatResponse = (data) => {
    console.log('Formatting response data:', data);
    
    if (!data) {
        console.log('No data to format');
        return '';
    }
    
    try {
        // 如果是字符串，尝试解析为 JSON
        if (typeof data === 'string') {
            console.log('Formatting string data');
            try {
                const parsed = JSON.parse(data);
                return JSON.stringify(parsed, null, 2);
            } catch (e) {
                // 如果不是 JSON 字符串，直接返回
                return data;
            }
        }
        
        // 如果是对象，直接格式化
        console.log('Formatting object data');
        return JSON.stringify(data, null, 2);
    } catch (e) {
        console.warn('Format error:', e);
        // 如果发生错误，返回原始内容
        return String(data);
    }
};

// ���改格式化响应体的方法
const formatResponseBody = () => {
    try {
        // 检查内容类型
        const contentType = responseData.value.contentType.toLowerCase();
        console.log('Content type:', contentType);
        console.log('Response body type:', typeof responseData.value.body);
        console.log('Response body:', responseData.value.body);
        
        // 如果是 JSON 类型
        if (contentType.includes('application/json')) {
            // 如果响应体是字符串，尝试解析
            let jsonData = responseData.value.body;
            if (typeof jsonData === 'string') {
                try {
                    jsonData = JSON.parse(jsonData);
                } catch (e) {
                    console.warn('Failed to parse JSON string:', e);
                }
            }
            
            // 确保是格式化的 JSON 字符串
            responseData.value.body = JSON.stringify(jsonData, null, 2);
            ElMessage.success('JSON 格式化成功');
        }
        // 如果是 HTML 类型
        else if (contentType.includes('text/html')) {
            // 确保响应体是字符串
            const htmlString = String(responseData.value.body);
            const formatted = htmlString
                .replace(/></g, '>\n<')  // 在标签之间添加换行
                .replace(/\n\s*\n/g, '\n')  // 删除多余的空行
                .split('\n')
                .map(line => line.trim())  // 清理每行的空白
                .join('\n')
                .replace(/<([^/].*?)>/g, (match) => '  ' + match);  // 添加缩进
            
            responseData.value.body = formatted;
            ElMessage.success('HTML 格式化成功');
        }
        // 如果是 XML 类型
        else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
            // 确保响应体是字符串
            const xmlString = String(responseData.value.body);
            const formatted = xmlString
                .replace(/></g, '>\n<')
                .replace(/\n\s*\n/g, '\n')
                .split('\n')
                .map(line => line.trim())
                .join('\n')
                .replace(/<([^/].*?)>/g, (match) => '  ' + match);
            
            responseData.value.body = formatted;
            ElMessage.success('XML 格式化成功');
        }
        // 其���类型
        else {
            ElMessage.warning(`不支持格式化 ${contentType} 类型的内容`);
        }
    } catch (e) {
        console.error('Format error:', e);
        ElMessage.error('格式化失败：' + e.message);
    }
};

// 修���复制响应内容的方法
const copyResponseBody = () => {
    if (!responseData.value.body) {
        ElMessage.warning('没有可复制的内容');
        return;
    }

    try {
        navigator.clipboard.writeText(responseData.value.body)
            .then(() => {
                ElMessage.success('已复制到剪贴板');
            })
            .catch((err) => {
                console.error('Copy failed:', err);
                ElMessage.error('复制失败');
            });
    } catch (e) {
        console.error('Copy error:', e);
        ElMessage.error('复制失败');
    }
};

// 添加获取响应内容类型的计算属性
const responseContentType = computed(() => {
    const contentType = responseData.value.contentType || '';
    if (contentType.includes('application/json')) return 'json';
    if (contentType.includes('text/html')) return 'html';
    if (contentType.includes('application/xml') || contentType.includes('text/xml')) return 'xml';
    return 'text';
});

// 在 script 部分添加相关方法
const queryJsonPaths = (query, cb) => {
    axios.get(`/api/json-paths?query=${encodeURIComponent(query)}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` // 添加认证头
        }
    })
    .then(response => {
        cb(response.data.map(item => ({
            value: item.path,
            path: item.path,
            previewValue: item.previewValue
        })));
    })
    .catch(error => {
        console.error('Error fetching JSON paths:', error);
        if (error.response?.status === 401) {
            ElMessage.error('认证失败，请重新登录');
            // 可以在这里添加重定向到登录页面的逻辑
        } else {
            ElMessage.error('获取路径建议失败');
        }
        cb([]);
    });
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
        
        // 遍历路径获取值
        for (const key of path) {
            if (value === undefined || value === null) break;
            value = value[key];
            console.log(`Extracting ${key}:`, value);
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

/* 操作按钮容器样��� */
.operation-container {
    margin-bottom: 20px;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: flex-end; /* 修改为 flex-end 使���钮靠右对齐 */
    width: 100%;
}

/* 修改按钮组样式 */
.operation-container .el-button-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end; /* 修改为 flex-end 使按钮组��部靠右对齐 */
    width: auto; /* 修��为 auto，���再占满整行 */
}

/* 修改上传按钮容器样式 */
.upload-button {
    display: inline-flex;
    align-items: center;
}

.upload-button :deep(.el-upload) {
    display: inline-flex;
    align-items: center;
}

/* 确保���钮样式一致 */
.operation-container :deep(.el-button) {
    margin: 0;
}

/* 修���按钮样式，确保图标居中 */
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
    border: 1px solid var(--el-border-color-lighter);
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
    margin-top: 12px;
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

/* 调整按钮内部图标和文字��间距 */
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
}

.method-select {
    width: 120px;
}

.api-input {
    flex: 1;
}

/* 修复表单项的样式 */
.request-url-section :deep(.el-form-item) {
    margin-bottom: 0;  /* 移除表单项的下边距 */
}

/* 确保所有元素垂直居中对齐 */
.request-url-section :deep(.el-form-item__content) {
    display: flex;
    align-items: center;
}

.send-button {
    min-width: 80px;
    height: 32px;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 0;  /* 移除顶部边距 */
    margin-bottom: 0;  /* 移除底部边距 */
}

/* 请求方法下拉框样式 */
.method-select :deep(.el-input__wrapper) {
    padding: 0 8px;
    height: 32px;  /* 确保高度一致 */
}

/* API 输入框样式 */
.api-input :deep(.el-input__wrapper) {
    padding: 0 12px;
    height: 32px;  /* 确保高度一致 */
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

/* 添加表格相关样 */
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

.action-buttons {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

/* 环境套对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

/* 添加新的样式 */
.env-suite-section {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
}

.env-suite-section :deep(.el-select) {
    flex: 1;
}

.env-vars-table {
    margin-top: 8px;
}

.table-actions {
    margin-top: 12px;
    display: flex;
    justify-content: flex-end;
}

/* 确保表格内的选择器和输入框样式正确 */
.env-vars-table :deep(.el-select),
.env-vars-table :deep(.el-input) {
    width: 100%;
}

.env-vars-table :deep(.el-table) {
    margin-bottom: 12px;
}

/* 修改环境变量对话框样式 */
.env-dialog {
    :deep(.el-dialog__body) {
        padding: 20px 24px;
        max-height: calc(90vh - 150px);
        overflow-y: auto;
    }
}

/* 环��套选��器样式 */
:deep(.env-suite-select) {
    max-width: none !important;
}

/* 变量名选择器样式 */
:deep(.var-name-select) {
    max-width: none !important;
}

.env-vars-table {
    margin-top: 8px;
    border-radius: 4px;
    overflow: hidden;
}

.env-vars-table :deep(.el-table) {
    --el-table-border-color: var(--el-border-color-lighter);
    margin-bottom: 12px;
}

.env-vars-table :deep(.el-table__header) {
    background-color: var(--el-fill-color-light);
}

.env-vars-table :deep(.el-table__cell) {
    padding: 8px;
}

/* 确保表格内的选择器和输入框不被遮挡 */
.env-vars-table :deep(.el-select),
.env-vars-table :deep(.el-input) {
    width: 100%;
    z-index: 1;
}

/* 调整表格内的下拉选择器样式 */
.env-vars-table :deep(.el-select .el-input__wrapper) {
    padding: 0 8px;
    background-color: var(--el-bg-color);
}

/* 确保固��列的��式正确 */
.env-vars-table :deep(.el-table__fixed-right) {
    height: 100% !important;
    background-color: var(--el-bg-color);
    box-shadow: -6px 0 6px -4px rgba(0,0,0,0.12);
    right: 0; /* 确保固定列位置正确 */
}

/* 调整表格高度和滚动 */
.env-vars-table :deep(.el-table__body-wrapper) {
    overflow-y: auto;
    max-height: 400px;
}

/* 优化表格内容布局 */
.env-vars-table :deep(.el-table__row) {
    height: 48px; /* 增加行高，给按钮留出足够空间 */
}

/* 确保删除按钮始终可见 */
.env-vars-table :deep(.el-table__fixed-right-patch) {
    background-color: var(--el-fill-color-light);
}

.table-actions {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
}

.table-actions .el-button {
    padding: 8px 16px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

/* 修改表格内按钮样式 */
.env-vars-table :deep(.el-button.is-circle) {
    padding: 6px;
    margin: 0;
    position: relative; /* 添加相对定位 */
    z-index: 2; /* 确保按钮在最上层 */
}

/* 确保表单项之间有合适的间距 */
.el-form-item {
    margin-bottom: 20px;
}

/* 优化对话框底部按钮样式 */
.dialog-footer {
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
}

/* 添加环境套选择相关样式 */
.env-suite-section {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
}

.env-suite-section :deep(.el-select) {
    flex: 1;
}

/* ��保下拉框内容样式正确 */
:deep(.env-suite-select) {
    width: auto !important;
    min-width: 200px !important;
}

.env-suite-option {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px 0;
}

.suite-name {
    font-size: 14px;
    color: var(--el-text-color-primary);
}

.suite-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    word-break: break-all;
}

/* 调整表单项样式 */
:deep(.el-form-item__content) {
    flex: 1;
    min-width: 0;
}

/* 确保选择框有合适���高度 */
.env-suite-section :deep(.el-input__wrapper) {
    height: 32px;
    line-height: 32px;
}

/* 调整选项样式 */
:deep(.el-select-dropdown__item) {
    padding: 8px 12px;
}

/* 确保新建按钮样式正确 */
.env-suite-section .el-button {
    flex-shrink: 0;
    white-space: nowrap;
}

/* 添加环境变量��表相关样式 */
.env-header {
    margin-bottom: 16px;
}

.env-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
}

.env-name {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.env-suite-tag {
    font-weight: normal;
}

.env-description {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
}

/* 优化环境变量列表样式 */
.env-list-dialog :deep(.el-dialog__body) {
    padding: 20px;
    max-height: 70vh;
    overflow-y: auto;
}

.env-list-container {
    padding: 0;
}

.env-item {
    margin-bottom: 24px;
    padding: 16px;
    border-radius: 8px;
    background-color: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.env-item:last-child {
    margin-bottom: 0;
}

.env-header {
    margin-bottom: 16px;
}

.env-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
}

.env-name {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.env-suite-tag {
    padding: 0 8px;
    height: 24px;
    line-height: 22px;
    font-size: 12px;
    border-radius: 4px;
    font-weight: normal;
}

.env-description {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
}

/* 表格样式��化 */
.env-item :deep(.el-table) {
    --el-table-border-color: var(--el-border-color-lighter);
    border-radius: 4px;
    overflow: hidden;
}

.env-item :deep(.el-table__header-wrapper) {
    background-color: var(--el-fill-color-light);
}

.env-item :deep(.el-table__cell) {
    padding: 8px;
}

/* 变量名样式 */
.variable-key {
    font-family: monospace;
    font-size: 13px;
    color: var(--el-text-color-primary);
    background-color: var(--el-fill-color-light);
    padding: 2px 6px;
    border-radius: 4px;
}

/* 操作按钮样式 */
.env-item :deep(.el-button--small) {
    padding: 4px 8px;
    font-size: 12px;
}

.env-item :deep(.el-button.is-link) {
    height: 24px;
}

/* 输入框样式 */
.env-item :deep(.el-input__wrapper) {
    padding: 0 8px;
}

.env-item :deep(.el-input__inner) {
    height: 28px;
    line-height: 28px;
    font-size: 13px;
}

/* 确保表格内容垂直居中 */
.env-item :deep(.el-table .cell) {
    display: flex;
    align-items: center;
    justify-content: flex-start;
}

.env-item :deep(.el-table__fixed-right-patch) {
    background-color: var(--el-fill-color-light);
}

/* 操作列样式 */
.env-item :deep(.el-table__fixed-right) {
    height: 100% !important;
    background-color: var(--el-bg-color);
    box-shadow: -6px 0 6px -4px rgba(0,0,0,0.12);
}

/* 表格hover效果 */
.env-item :deep(.el-table__row:hover) {
    background-color: var(--el-table-row-hover-bg-color);
}

/* 响应内容样式 */
.response-body {
    padding: 12px;
    margin: 0;
    background-color: var(--el-bg-color-page);
    border-radius: 4px;
    font-family: monospace;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-x: auto;
}

.response-body.html-content {
    white-space: pre;
    font-family: monospace;
}

.response-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px 4px 0 0;
}

.content-type {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

/* 响应面板样式 */
.response-panel {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 50vh; /* 改用视窗高度的百分比 */
    min-height: 200px; /* 添加最小高度 */
}

.response-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px; /* 增加左右内边距 */
    background-color: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-lighter);
    flex-shrink: 0; /* 防止头部被压缩 */
}

.response-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
}

.status-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.time-info {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

/* 响应内容区域样式 */
.response-body-wrapper {
    position: relative;
    flex: 1;
    overflow: auto; /* 改为 auto，允许内容滚动 */
    display: flex;
    flex-direction: column;
    height: calc(100% - 48px); /* 减去头部高度 */
}

.response-toolbar {
    padding: 8px 16px; /* 增加左右内边距 */
    background-color: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-lighter);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0; /* 防止工具栏被压缩 */
}

.content-type {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

/* 修改响应内容区域的样式 */
.response-body {
    height: 100%;
    overflow: auto;
    margin: 0;
    padding: 16px;
    background-color: var(--el-bg-color-page);
    font-family: monospace;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    border: none;
    box-sizing: border-box;
}

/* 响应标签页样式 */
.response-tabs {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.response-tabs :deep(.el-tabs__header) {
    margin: 0;
    flex-shrink: 0;
}

.response-tabs :deep(.el-tabs__content) {
    flex: 1;
    overflow: auto;
    padding: 0;
    height: calc(100% - 40px); /* 减去标签头部高度 */
}

.response-tabs :deep(.el-tab-pane) {
    height: 100%;
    overflow: auto;
    display: flex;
    flex-direction: column;
}

/* 调整对话框内容区域的样式 */
.test-case-dialog {
    :deep(.el-dialog__body) {
        padding: 0;
        height: 80vh; /* 使用视窗高度 */
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }
}

/* 调整 Postman 布局样式 */
.postman-layout {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
}

/* 优化请求面板样式 */
.request-panel {
    flex: 1;
    min-height: 0;
    padding: 20px;
    overflow-y: auto;
    position: relative;
    z-index: 1;
}

.response-panel {
    border-top: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-bg-color);
}

/* 调整分隔线样式 */
.resizer {
    height: 4px;
    background-color: var(--el-border-color-lighter);
    cursor: row-resize;
    transition: background-color 0.2s;
    position: relative;
    z-index: 2;
    
    &:hover {
        background-color: var(--el-color-primary-light-7);
    }
    
    &:active {
        background-color: var(--el-color-primary-light-5);
    }
}

/* 拖动时的全局样式 */
:global(body.resizing) {
    cursor: row-resize;
    user-select: none;
}

/* 添加不同内容类型的样式 */
.response-body.json-content {
    color: var(--el-text-color-primary);
}

.response-body.html-content {
    color: #e34c26;
    white-space: pre;
}

.response-body.xml-content {
    color: #2f6f9f;
}

/* 测试结果样式 */
.test-results {
    padding: 16px;
}

.test-summary {
    background: var(--el-bg-color-page);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    border: 1px solid var(--el-border-color-lighter);
}

.summary-stats {
    display: flex;
    gap: 24px;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.stat-label {
    color: var(--el-text-color-secondary);
    font-size: 14px;
}

.stat-value {
    font-size: 16px;
    font-weight: 600;
}

.stat-value.pass {
    color: var(--el-color-success);
}

.stat-value.fail {
    color: var(--el-color-danger);
}

.test-result-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.test-result-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s ease;
}

.test-result-item.passed {
    background-color: var(--el-color-success-light-9);
    border-color: var(--el-color-success-light-5);
}

.test-result-item.failed {
    background-color: var(--el-color-danger-light-9);
    border-color: var(--el-color-danger-light-5);
}

.result-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
}

.success-icon {
    color: var(--el-color-success);
    font-size: 20px;
}

.error-icon {
    color: var(--el-color-danger);
    font-size: 20px;
}

.result-content {
    flex: 1;
}

.result-assertion {
    font-weight: 500;
    margin-bottom: 4px;
    color: var(--el-text-color-primary);
}

.result-details {
    display: flex;
    gap: 16px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
}

.actual-value, .expected-value {
    display: flex;
    align-items: center;
    gap: 4px;
}

.actual-value::before {
    content: "•";
    color: var(--el-text-color-secondary);
}

.expected-value::before {
    content: "•";
    color: var(--el-text-color-secondary);
}

/* 变量提取器样式 */
.extractors-section {
    padding: 16px;
    background-color: var(--el-bg-color);
    border-radius: 4px;
}

.section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.section-title h4 {
    margin: 0;
    font-size: 16px;
    color: var(--el-text-color-primary);
}

.extractor-item {
    margin-bottom: 12px;
    padding: 12px;
    background-color: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    transition: all 0.3s;
}

.extractor-item:hover {
    border-color: var(--el-border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* 修改行间距和对齐 */
.extractor-item .el-row {
    margin-bottom: 0 !important;
    align-items: center;
}

/* 输入框样式 */
.extractor-item :deep(.el-input__wrapper),
.extractor-item :deep(.el-autocomplete .el-input__wrapper) {
    box-shadow: none;
    background-color: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    height: 32px;
    line-height: 32px;
}

/* 变量名输入框前缀样式 */
.extractor-item :deep(.el-input__prefix) {
    color: var(--el-text-color-secondary);
    font-size: 14px;
    font-weight: bold;
}

/* 自动完成下拉框样式 */
.suggestion-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
}

.suggestion-item .path {
    font-family: monospace;
    color: var(--el-text-color-primary);
}

.suggestion-item .value {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 预览值标签样式 */
.extractor-item :deep(.el-tag) {
    width: 100%;
    text-align: center;
    margin: 0;
    font-size: 12px;
    height: 32px;
    line-height: 30px;
    background-color: var(--el-bg-color);
    border-color: var(--el-border-color);
    color: var(--el-text-color-secondary);
}

/* 删除按钮样式 */
.extractor-item :deep(.el-button.is-circle) {
    width: 32px;
    height: 32px;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 确保所有列对齐 */
.extractor-item .el-col {
    display: flex;
    align-items: center;
}

.input-with-button {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%; /* 添加固定宽度 */
    position: relative; /* 添加相对定位 */
}

.json-path-input {
    flex: 1;
    width: 100%; /* 添加固定宽度 */
}

.delete-button {
    flex-shrink: 0;
}

/* 修改提取器项样式 */
.extractor-item {
    margin-bottom: 12px;
    padding: 12px;
    background-color: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    transition: all 0.3s;
}

/* 确保行对齐 */
.extractor-item .el-row {
    align-items: center;
}

/* 调整自动完成输入框样式 */
.json-path-input :deep(.el-input__wrapper) {
    width: 100%;
}

/* 删除按钮样式调整 */
.delete-button {
    margin-left: 8px;
    padding: 8px;
}

/* 确保预览标签垂直居中 */
.el-col:last-child {
    display: flex;
    align-items: center;
}

.extractor-value {
    display: flex;
    align-items: center;
    gap: 8px;
}

.value-tag {
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    background-color: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
}

/* 提取值显示样式 */
.extractor-value {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
}

.value-tag {
    flex: 1;
    text-align: center;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.extractor-value :deep(.el-button--small) {
    padding: 4px;
    height: 24px;
}

.extractor-value :deep(.el-button--small .el-icon) {
    font-size: 14px;
}

.test-button {
    flex-shrink: 0;
    margin-left: 8px;
}

.test-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* 调整按钮大小保持一致 */
.test-button,
.delete-button {
    width: 32px;
    height: 32px;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 确保下拉选项不会超出容器 */
:deep(.el-autocomplete-suggestion) {
    width: 100% !important;
}

:deep(.el-autocomplete-suggestion__wrap) {
    width: 100%;
}
</style>