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
                    <div class="project-stats">
                        <div class="stat-item">
                            <span class="stat-value">{{ testCases.length }}</span>
                            <span class="stat-label">用例总数</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value success">{{ getStatusCount('通过') }}</span>
                            <span class="stat-label">通过</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value danger">{{ getStatusCount('失败') }}</span>
                            <span class="stat-label">失败</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value info">{{ getStatusCount('未执行') }}</span>
                            <span class="stat-label">未执行</span>
                        </div>
                    </div>
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
                        <el-tooltip content="选择用例执行状态进行筛选" placement="top">
                            <el-select
                                v-model="statusFilter"
                                placeholder="状态筛选"
                                clearable
                                class="filter-select"
                                popper-class="status-filter-dropdown"
                            >
                                <template #prefix>
                                    <div v-if="statusFilter" class="selected-label">
                                        状态: {{ statusFilter }}
                                    </div>
                                </template>
                                <el-option label="未执行" value="未执行">
                                    <el-tooltip content="测试用例尚未执行" placement="right">
                                        <span>未执行</span>
                                    </el-tooltip>
                                </el-option>
                                <el-option label="通过" value="通过">
                                    <el-tooltip content="测试用例执行并通过" placement="right">
                                        <span>通过</span>
                                    </el-tooltip>
                                </el-option>
                                <el-option label="失败" value="失败">
                                    <el-tooltip content="测试用例执行但未通过" placement="right">
                                        <span>失败</span>
                                    </el-tooltip>
                                </el-option>
                            </el-select>
                        </el-tooltip>
                        <el-tooltip content="选择用例优先级进行筛选" placement="top">
                            <el-select
                                v-model="priorityFilter"
                                placeholder="优先级筛选"
                                clearable
                                class="filter-select"
                                popper-class="priority-filter-dropdown"
                            >
                                <template #prefix>
                                    <div v-if="priorityFilter" class="selected-label">
                                        优先级: {{ priorityFilter }}
                                    </div>
                                </template>
                                <el-option label="高" value="高">
                                    <el-tooltip content="高优先级任务，需要优先处理" placement="right">
                                        <span>高</span>
                                    </el-tooltip>
                                </el-option>
                                <el-option label="中" value="中">
                                    <el-tooltip content="中等优先级任务" placement="right">
                                        <span>中</span>
                                    </el-tooltip>
                                </el-option>
                                <el-option label="低" value="低">
                                    <el-tooltip content="低优先级任务，可延后处理" placement="right">
                                        <span>低</span>
                                    </el-tooltip>
                                </el-option>
                            </el-select>
                        </el-tooltip>
                        <el-button 
                            type="primary" 
                            @click="handleSearch"
                            :icon="Search"
                            class="action-button"
                        >
                            查询
                        </el-button>
                        <el-button 
                            @click="resetSearch"
                            :icon="Refresh"
                            class="action-button"
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
                            <el-button 
                                type="success" 
                                @click="showEnvSuitesDialog"
                                :icon="List"
                            >
                                查看环境套
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
                top="5vh"
                :fullscreen="isSmallScreen"
            >
                <div class="dialog-wrapper">
                    <el-scrollbar height="calc(90vh - 200px)">
                        <div class="dialog-content">
                            <el-form 
                                ref="testCaseFormRef"
                                :model="testCaseForm"
                                :rules="rules"
                                label-position="top"
                                class="test-case-form"
                            >
                                <!-- 基本信息部分 -->
                                <div class="form-section">
                                    <h3 class="section-title">基本信息</h3>
                                    <el-row :gutter="20">
                                        <el-col :xs="24" :sm="12">
                                            <el-form-item label="用例标题" prop="title">
                                                <el-input 
                                                    v-model="testCaseForm.title" 
                                                    placeholder="输入测试用例标题" 
                                                    clearable
                                                />
                                            </el-form-item>
                                        </el-col>
                                        <el-col :xs="24" :sm="12">
                                            <el-form-item label="优先级" prop="priority">
                                                <el-select v-model="testCaseForm.priority" placeholder="请选择优先级" class="w-100">
                                                    <el-option label="高" value="高" />
                                                    <el-option label="中" value="中" />
                                                    <el-option label="低" value="低" />
                                                </el-select>
                                            </el-form-item>
                                        </el-col>
                                    </el-row>
                                    
                                    <el-row :gutter="20">
                                        <el-col :xs="24" :sm="8">
                                            <el-form-item label="请求方法" prop="method">
                                                <el-select v-model="testCaseForm.method" placeholder="请选择方法" class="w-100">
                                                    <el-option label="GET" value="GET" />
                                                    <el-option label="POST" value="POST" />
                                                    <el-option label="PUT" value="PUT" />
                                                    <el-option label="DELETE" value="DELETE" />
                                                    <el-option label="PATCH" value="PATCH" />
                                                    <el-option label="OPTIONS" value="OPTIONS" />
                                                    <el-option label="HEAD" value="HEAD" />
                                                </el-select>
                                            </el-form-item>
                                        </el-col>
                                        <el-col :xs="24" :sm="16">
                                            <el-form-item label="API路径" prop="api_path">
                                                <el-input 
                                                    v-model="testCaseForm.api_path" 
                                                    placeholder="输入API路径，例如：/api/user" 
                                                    clearable
                                                />
                                            </el-form-item>
                                        </el-col>
                                    </el-row>
                                </div>
                                
                                <!-- 请求配置部分 -->
                                <div class="form-section">
                                    <h3 class="section-title">请求配置</h3>
                                    <el-tabs v-model="activeTab" class="custom-tabs">
                                        <!-- 参数标签页 -->
                                        <el-tab-pane label="Params" name="params"></el-tab-pane>
                                        <!-- 请求头标签页 -->
                                        <el-tab-pane label="Headers" name="headers"></el-tab-pane>
                                        <!-- Body标签页 -->
                                        <el-tab-pane label="Body" name="body"></el-tab-pane>
                                        <!-- 提取器标签页 -->
                                        <el-tab-pane label="Extractors" name="extractors"></el-tab-pane>
                                        <!-- 测试标签页 -->
                                        <el-tab-pane label="Tests" name="tests"></el-tab-pane>
                                    </el-tabs>
                                    
                                    <!-- 参数内容 -->
                                    <div v-if="activeTab === 'params'" class="tab-content">
                                        <div class="params-toolbar">
                                            <el-button 
                                                type="primary" 
                                                size="small" 
                                                @click="addParam"
                                                plain
                                                icon="Plus"
                                            >
                                                添加参数
                                            </el-button>
                                        </div>
                                        
                                        <el-table 
                                            :data="paramsTableData"
                                            border
                                            style="width: 100%"
                                            size="small"
                                            class="params-table"
                                        >
                                            <el-table-column width="50">
                                                <template #default="scope">
                                                    <el-checkbox v-model="scope.row.enabled" />
                                                </template>
                                            </el-table-column>
                                            <el-table-column label="参数名" prop="key">
                                                <template #default="scope">
                                                    <el-input 
                                                        v-model="scope.row.key" 
                                                        placeholder="参数名"
                                                        size="small"
                                                    />
                                                </template>
                                            </el-table-column>
                                            <el-table-column label="参数值" prop="value">
                                                <template #default="scope">
                                                    <el-input 
                                                        v-model="scope.row.value" 
                                                        placeholder="参数值"
                                                        size="small"
                                                    />
                                                </template>
                                            </el-table-column>
                                            <el-table-column label="描述" prop="description">
                                                <template #default="scope">
                                                    <el-input 
                                                        v-model="scope.row.description" 
                                                        placeholder="描述"
                                                        size="small"
                                                    />
                                                </template>
                                            </el-table-column>
                                            <el-table-column width="60">
                                                <template #default="scope">
                                                    <el-button 
                                                        type="danger" 
                                                        circle
                                                        size="small"
                                                        @click="removeParam(scope.$index)"
                                                        icon="Delete"
                                                    />
                                                </template>
                                            </el-table-column>
                                        </el-table>
                                    </div>
                                    
                                    <!-- 请求头内容 -->
                                    <div v-if="activeTab === 'headers'" class="tab-content">
                                        <div class="headers-content">
                                            <div class="headers-toolbar">
                                                <el-button 
                                                    type="primary" 
                                                    size="small" 
                                                    @click="addHeader"
                                                    plain
                                                    icon="Plus"
                                                >
                                                    添加请求头
                                                </el-button>
                                            </div>
                                            
                                            <el-table 
                                                :data="headersTableData"
                                                border
                                                style="width: 100%"
                                                size="small"
                                                class="headers-table"
                                            >
                                                <el-table-column width="50">
                                                    <template #default="scope">
                                                        <el-checkbox v-model="scope.row.enabled" />
                                                    </template>
                                                </el-table-column>
                                                <el-table-column label="Header名" prop="key">
                                                    <template #default="scope">
                                                        <el-input 
                                                            v-model="scope.row.key" 
                                                            placeholder="Header名"
                                                            size="small"
                                                        />
                                                    </template>
                                                </el-table-column>
                                                <el-table-column label="Header值" prop="value">
                                                    <template #default="scope">
                                                        <el-input 
                                                            v-model="scope.row.value" 
                                                            placeholder="Header值"
                                                            size="small"
                                                        />
                                                    </template>
                                                </el-table-column>
                                                <el-table-column label="描述" prop="description">
                                                    <template #default="scope">
                                                        <el-input 
                                                            v-model="scope.row.description" 
                                                            placeholder="描述"
                                                            size="small"
                                                        />
                                                    </template>
                                                </el-table-column>
                                                <el-table-column width="60">
                                                    <template #default="scope">
                                                        <el-button 
                                                            type="danger" 
                                                            circle
                                                            size="small"
                                                            @click="removeHeader(scope.$index)"
                                                            icon="Delete"
                                                        />
                                                    </template>
                                                </el-table-column>
                                            </el-table>
                                        </div>
                                    </div>
                                    
                                    <!-- Body内容 -->
                                    <div v-if="activeTab === 'body'" class="tab-content">
                                        <div class="body-content">
                                            <!-- Body类型选择 -->
                                            <el-radio-group v-model="bodyType" class="body-type-selector" @change="handleBodyTypeChange">
                                                <el-radio-button label="none">none</el-radio-button>
                                                <el-radio-button label="form-data">form-data</el-radio-button>
                                                <el-radio-button label="x-www-form-urlencoded">x-www-form-urlencoded</el-radio-button>
                                                <el-radio-button label="raw">raw</el-radio-button>
                                            </el-radio-group>
                                            
                                            <!-- raw类型的内容类型显示，仅显示但不可编辑 -->
                                            <div v-if="bodyType === 'raw'" class="content-type-display">
                                                <span>Content-Type: {{ rawContentType }}</span>
                                            </div>
                                            
                                            <!-- JSON编辑器(Raw - JSON) -->
                                            <div v-if="bodyType === 'raw' && rawContentType === 'application/json'" class="json-editor-container">
                                                <div class="editor-toolbar">
                                                    <el-button size="small" @click="formatJson" plain>
                                                        <el-icon><Document /></el-icon> 格式化JSON
                                                    </el-button>
                                                </div>
                                                <div class="editor-wrapper" style="position: relative; display: flex;">
                                                    <div class="line-numbers" style="padding: 8px 0; width: 40px; background-color: #f5f7fa; border-right: 1px solid #dcdfe6; text-align: center; user-select: none; position: absolute; left: 0; top: 0; bottom: 0; z-index: 0;">
                                                        <div v-for="i in rawBodyLines" :key="i" class="line-number">{{ i }}</div>
                                                    </div>
                                                    <el-input
                                                        v-model="rawBody"
                                                        type="textarea"
                                                        :rows="10"
                                                        resize="none"
                                                        class="json-editor"
                                                        style="flex: 1; width: 100%; padding-left: 40px; position: relative; z-index: 1;"
                                                        @input="countRawBodyLines"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <!-- 普通文本编辑器(Raw - Text) -->
                                            <div v-else-if="bodyType === 'raw'" class="text-editor-container">
                                                <el-input
                                                    v-model="rawBody"
                                                    type="textarea"
                                                    :rows="10"
                                                    resize="vertical"
                                                    class="text-editor"
                                                />
                                            </div>
                                            
                                            <!-- 表单数据(form-data或x-www-form-urlencoded) -->
                                            <div v-else-if="bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded'" class="form-data-container">
                                                <div class="form-data-toolbar">
                                                    <el-button 
                                                        type="primary" 
                                                        size="small" 
                                                        @click="addFormItem"
                                                        plain
                                                        icon="Plus"
                                                    >
                                                        添加表单项
                                                    </el-button>
                                                </div>
                                                
                                                <el-table 
                                                    :data="formDataTableData"
                                                    border
                                                    style="width: 100%"
                                                    size="small"
                                                    class="form-data-table"
                                                >
                                                    <!-- 启用/禁用列 -->
                                                    <el-table-column width="60">
                                                        <template #default="scope">
                                                            <el-checkbox v-model="scope.row.enabled" />
                                                        </template>
                                                    </el-table-column>
                                                    
                                                    <!-- 参数名列 -->
                                                    <el-table-column label="参数名" prop="name">
                                                        <template #default="scope">
                                                            <el-input 
                                                                v-model="scope.row.name" 
                                                                placeholder="参数名"
                                                                size="small"
                                                            />
                                                        </template>
                                                    </el-table-column>
                                                    
                                                    <!-- 参数值列 -->
                                                    <el-table-column label="参数值" prop="value">
                                                        <template #default="scope">
                                                            <el-input 
                                                                v-model="scope.row.value" 
                                                                placeholder="参数值"
                                                                size="small"
                                                            />
                                                        </template>
                                                    </el-table-column>
                                                    
                                                    <!-- 描述列 -->
                                                    <el-table-column label="描述" prop="description">
                                                        <template #default="scope">
                                                            <el-input 
                                                                v-model="scope.row.description" 
                                                                placeholder="描述"
                                                                size="small"
                                                            />
                                                        </template>
                                                    </el-table-column>
                                                    
                                                    <!-- 操作列 -->
                                                    <el-table-column width="70">
                                                        <template #default="scope">
                                                            <el-button
                                                                type="danger"
                                                                size="small"
                                                                circle
                                                                @click.prevent="removeFormItem(scope.$index)"
                                                            >
                                                                <el-icon><Delete /></el-icon>
                                                            </el-button>
                                                        </template>
                                                    </el-table-column>
                                                </el-table>
                                            </div>
                                            
                                            <!-- 无Body内容时的提示 -->
                                            <div v-else-if="bodyType === 'none'" class="no-body-message">
                                                <el-empty description="请求不包含任何Body内容" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- 提取器内容 -->
                                    <div v-if="activeTab === 'extractors'" class="tab-content">
                                        <div class="extractors-content">
                                            <div class="extractors-toolbar">
                                                <el-button 
                                                    type="primary" 
                                                    size="small" 
                                                    @click="addExtractor"
                                                    plain
                                                    icon="Plus"
                                                >
                                                    添加提取器
                                                </el-button>
                                                <el-popover
                                                    placement="top"
                                                    width="300"
                                                    trigger="hover"
                                                >
                                                    <template #reference>
                                                        <el-button size="small" icon="QuestionFilled" circle style="display: flex; align-items: center; justify-content: center;"></el-button>
                                                    </template>
                                                    <div>
                                                        <h4>提取器使用说明</h4>
                                                        <p>提取器允许从响应中提取值并保存为变量，以便在后续请求中使用。</p>
                                                        <ul>
                                                            <li><b>JSON提取器:</b> 使用JSONPath表达式提取JSON值</li>
                                                            <li><b>正则提取器:</b> 使用正则表达式提取文本</li>
                                                            <li><b>XPath提取器:</b> 使用XPath表达式提取XML值</li>
                                                        </ul>
                                                        <p>提取的变量可以在其他请求中通过 <code>{{变量名}}</code> 引用</p>
                                                    </div>
                                                </el-popover>
                                            </div>
                                            
                                            <el-empty v-if="!extractors || extractors.length === 0" description="暂无提取器" />
                                            
                                            <div v-else class="extractors-list">
                                                <el-collapse accordion>
                                                    <el-collapse-item v-for="(extractor, index) in extractors" :key="index" :name="index">
                                                        <template #title>
                                                            <div class="extractor-item-header">
                                                                <el-tag :type="extractor.enabled ? 'success' : 'info'" size="small">
                                                                    {{ extractor.type }}
                                                                </el-tag>
                                                                <span class="extractor-name">{{ extractor.name || '未命名提取器' }}</span>
                                                            </div>
                                                        </template>
                                                        <div class="extractor-form">
                                                            <el-form label-position="top" size="small">
                                                                <div class="extractor-form-row">
                                                                    <el-form-item label="启用">
                                                                        <el-switch v-model="extractor.enabled" />
                                                                    </el-form-item>
                                                                    <el-form-item label="提取器名称" class="flex-grow">
                                                                        <el-input v-model="extractor.name" placeholder="变量名称" />
                                                                    </el-form-item>
                                                                </div>
                                                                <div class="extractor-form-row">
                                                                    <el-form-item label="提取器类型">
                                                                        <el-select v-model="extractor.type" placeholder="选择提取器类型">
                                                                            <el-option label="JSONPath" value="jsonpath" />
                                                                            <el-option label="正则表达式" value="regex" />
                                                                            <el-option label="XPath" value="xpath" />
                                                                        </el-select>
                                                                    </el-form-item>
                                                                    <el-form-item label="默认值 (提取失败时)" class="flex-grow">
                                                                        <el-input v-model="extractor.defaultValue" placeholder="默认值" />
                                                                    </el-form-item>
                                                                </div>
                                                                <el-form-item label="提取表达式">
                                                                    <el-input 
                                                                        v-model="extractor.expression" 
                                                                        :placeholder="getExpressionPlaceholder(extractor.type)"
                                                                    />
                                                                </el-form-item>
                                                                <el-form-item>
                                                                    <div class="extractor-buttons">
                                                                        <el-button 
                                                                            type="primary" 
                                                                            @click="testExtractor(extractor)" 
                                                                            size="small"
                                                                            :disabled="!hasResponseData"
                                                                        >
                                                                            测试提取器
                                                                        </el-button>
                                                                        <el-button 
                                                                            type="danger" 
                                                                            @click="removeExtractor(index)" 
                                                                            size="small"
                                                                        >
                                                                            删除提取器
                                                                        </el-button>
                                                                    </div>
                                                                </el-form-item>
                                                                <el-form-item v-if="extractor.extractedValue !== null">
                                                                    <div class="extracted-value">
                                                                        <div class="extracted-value-label">提取结果:</div>
                                                                        <div class="extracted-value-content">
                                                                            <el-input
                                                                                type="textarea"
                                                                                v-model="extractor.extractedValue"
                                                                                readonly
                                                                                rows="3"
                                                                            ></el-input>
                                                                            <el-button
                                                                                size="small"
                                                                                type="primary"
                                                                                @click="copyExtractedValue(extractor.extractedValue)"
                                                                                icon="Document"
                                                                                circle
                                                                            ></el-button>
                                                                        </div>
                                                                    </div>
                                                                </el-form-item>
                                                            </el-form>
                                                        </div>
                                                    </el-collapse-item>
                                                </el-collapse>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- 测试内容 -->
                                    <div v-if="activeTab === 'tests'" class="tab-content">
                                        <div class="tests-content">
                                            <div class="tests-toolbar">
                                                <el-button 
                                                    type="primary" 
                                                    size="small" 
                                                    @click="addTest"
                                                    plain
                                                    icon="Plus"
                                                >
                                                    添加测试
                                                </el-button>
                                                <el-popover
                                                    placement="top"
                                                    width="300"
                                                    trigger="hover"
                                                >
                                                    <template #reference>
                                                        <el-button size="small" icon="QuestionFilled" circle style="display: flex; align-items: center; justify-content: center;"></el-button>
                                                    </template>
                                                    <div>
                                                        <h4>测试使用说明</h4>
                                                        <p>测试允许您验证API响应是否符合预期。</p>
                                                        <p>常用测试类型:</p>
                                                        <ul>
                                                            <li><b>状态码测试:</b> 验证HTTP状态码</li>
                                                            <li><b>响应时间测试:</b> 验证响应时间</li>
                                                            <li><b>JSON值测试:</b> 验证JSON响应中的值</li>
                                                            <li><b>包含文本测试:</b> 验证响应中是否包含特定文本</li>
                                                        </ul>
                                                    </div>
                                                </el-popover>
                                            </div>
                                            
                                            <el-empty v-if="!tests || tests.length === 0" description="暂无测试" />
                                            
                                            <div v-else class="tests-list">
                                                <el-collapse accordion>
                                                    <el-collapse-item v-for="(test, index) in tests" :key="index" :name="index">
                                                        <template #title>
                                                            <div class="test-item-header">
                                                                <el-tag :type="test.enabled ? 'success' : 'info'" size="small">
                                                                    {{ test.type === 'statusCode' ? '状态码测试' : 
                                                                       test.type === 'responseTime' ? '响应时间测试' : 
                                                                       test.type === 'jsonValue' ? 'JSON值测试' : 
                                                                       test.type === 'containsText' ? '包含文本测试' : 
                                                                       test.type === 'customScript' ? '自定义脚本测试' : test.type }}
                                                                </el-tag>
                                                                <span class="test-name">{{ test.name || '未命名测试' }}</span>
                                                                <el-tag 
                                                                    v-if="test.lastResult" 
                                                                    :type="test.lastResult.passed ? 'success' : 'danger'" 
                                                                    size="small"
                                                                    class="test-result-tag"
                                                                >
                                                                    {{ test.lastResult.passed ? '通过' : '失败' }}
                                                                </el-tag>
                                                            </div>
                                                        </template>
                                                        <div class="test-form">
                                                            <el-form label-position="top" size="small">
                                                                <div class="test-form-row">
                                                                    <el-form-item label="启用">
                                                                        <el-switch v-model="test.enabled" />
                                                                    </el-form-item>
                                                                    <el-form-item label="测试名称" class="flex-grow">
                                                                        <el-input v-model="test.name" placeholder="测试名称" />
                                                                    </el-form-item>
                                                                </div>
                                                                <div class="test-form-row">
                                                                    <el-form-item label="测试类型">
                                                                        <el-select v-model="test.type" placeholder="选择测试类型">
                                                                            <el-option label="状态码测试" value="statusCode" />
                                                                            <el-option label="响应时间测试" value="responseTime" />
                                                                            <el-option label="JSON值测试" value="jsonValue" />
                                                                            <el-option label="包含文本测试" value="containsText" />
                                                                            <el-option label="自定义脚本测试" value="customScript" />
                                                                        </el-select>
                                                                    </el-form-item>
                                                                </div>
                                                                
                                                                <!-- 状态码测试 -->
                                                                <template v-if="test.type === 'statusCode'">
                                                                    <div class="test-form-row">
                                                                        <el-form-item label="条件">
                                                                            <el-select v-model="test.condition" placeholder="选择条件">
                                                                                <el-option label="等于" value="equals" />
                                                                                <el-option label="不等于" value="notEquals" />
                                                                                <el-option label="大于" value="greaterThan" />
                                                                                <el-option label="小于" value="lessThan" />
                                                                            </el-select>
                                                                        </el-form-item>
                                                                        <el-form-item label="预期状态码" class="flex-grow">
                                                                            <el-input-number v-model="test.expected" :min="100" :max="599" />
                                                                        </el-form-item>
                                                                    </div>
                                                                </template>
                                                                
                                                                <!-- 响应时间测试 -->
                                                                <template v-if="test.type === 'responseTime'">
                                                                    <div class="test-form-row">
                                                                        <el-form-item label="条件">
                                                                            <el-select v-model="test.condition" placeholder="选择条件">
                                                                                <el-option label="小于" value="lessThan" />
                                                                                <el-option label="大于" value="greaterThan" />
                                                                            </el-select>
                                                                        </el-form-item>
                                                                        <el-form-item label="预期响应时间(毫秒)" class="flex-grow">
                                                                            <el-input-number v-model="test.expected" :min="1" :step="100" />
                                                                        </el-form-item>
                                                                    </div>
                                                                </template>
                                                                
                                                                <!-- JSON值测试 -->
                                                                <template v-if="test.type === 'jsonValue'">
                                                                    <div class="test-form-row">
                                                                        <el-form-item label="JSONPath表达式" class="flex-grow">
                                                                            <el-input 
                                                                                v-model="test.jsonPath" 
                                                                                placeholder="$.data.id"
                                                                            />
                                                                        </el-form-item>
                                                                    </div>
                                                                    <div class="test-form-row">
                                                                        <el-form-item label="条件">
                                                                            <el-select v-model="test.condition" placeholder="选择条件">
                                                                                <el-option label="等于" value="equals" />
                                                                                <el-option label="不等于" value="notEquals" />
                                                                                <el-option label="包含" value="contains" />
                                                                                <el-option label="存在" value="exists" />
                                                                                <el-option label="不存在" value="notExists" />
                                                                            </el-select>
                                                                        </el-form-item>
                                                                        <el-form-item v-if="test.condition !== 'exists' && test.condition !== 'notExists'" label="预期值" class="flex-grow">
                                                                            <el-input v-model="test.expected" placeholder="预期值" />
                                                                        </el-form-item>
                                                                    </div>
                                                                </template>
                                                                
                                                                <!-- 包含文本测试 -->
                                                                <template v-if="test.type === 'containsText'">
                                                                    <div class="test-form-row">
                                                                        <el-form-item label="条件">
                                                                            <el-select v-model="test.condition" placeholder="选择条件">
                                                                                <el-option label="包含" value="contains" />
                                                                                <el-option label="不包含" value="notContains" />
                                                                            </el-select>
                                                                        </el-form-item>
                                                                    </div>
                                                                    <el-form-item label="文本内容">
                                                                        <el-input 
                                                                            v-model="test.text" 
                                                                            placeholder="要检查的文本"
                                                                            type="textarea"
                                                                            :rows="3"
                                                                        />
                                                                    </el-form-item>
                                                                </template>
                                                                
                                                                <!-- 自定义脚本测试 -->
                                                                <template v-if="test.type === 'customScript'">
                                                                    <el-form-item label="自定义JavaScript脚本">
                                                                        <el-input 
                                                                            v-model="test.script" 
                                                                            type="textarea"
                                                                            :rows="5"
                                                                            placeholder="// 变量 response 包含响应对象&#10;// 返回true表示测试通过，false表示失败&#10;return response.status === 200 && response.data.success === true;"
                                                                        />
                                                                    </el-form-item>
                                                                </template>
                                                                
                                                                <el-form-item>
                                                                    <div class="test-buttons">
                                                                        <el-button 
                                                                            type="primary" 
                                                                            @click="saveTest(test, index)" 
                                                                            size="small"
                                                                            :disabled="!test.name"
                                                                        >
                                                                            保存测试
                                                                        </el-button>
                                                                        <el-button 
                                                                            type="danger" 
                                                                            @click="removeTest(index)" 
                                                                            size="small"
                                                                        >
                                                                            删除测试
                                                                        </el-button>
                                                                    </div>
                                                                </el-form-item>
                                                            </el-form>
                                                        </div>
                                                    </el-collapse-item>
                                                </el-collapse>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </el-form>
                            
                            <!-- 响应结果 -->
                            <div v-if="showResponse" class="response-container">
                                <div class="response-header">
                                    <h3 class="response-title">响应结果</h3>
                                    <div class="response-status">
                                        <el-tag 
                                            :type="responseData.status >= 200 && responseData.status < 300 ? 'success' : 'danger'"
                                        >
                                            {{ responseData.status }} {{ responseData.statusText }}
                                        </el-tag>
                                        <span class="response-time">{{ responseData.time }}ms</span>
                                    </div>
                                </div>
                                
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
                                        <div class="headers-wrapper">
                                            <div class="header-item" v-for="(value, key) in responseData.headers" :key="key">
                                                <div class="header-key">{{ key }}:</div>
                                                <div class="header-value">{{ value }}</div>
                                            </div>
                                        </div>
                                    </el-tab-pane>
                                    <el-tab-pane label="Test Results">
                                        <div class="test-results-container">
                                            <!-- 测试结果统计 -->
                                            <div class="test-results-summary">
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
                            </div>
                        </div>
                    </el-scrollbar>
                </div>
                
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="showAddDialog = false">取消</el-button>
                        <el-button type="primary" @click="submitTestCase" :loading="loading">
                            运行
                        </el-button>
                        <el-button type="success" @click="saveTestCase" :loading="loading">
                            保存
                        </el-button>
                    </span>
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
                                        <span>{{ row.value }}</span>
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
                <template #footer>
                    <div class="dialog-footer">
                        <el-button @click="showEnvListDialog = false">关闭</el-button>
                        <el-button type="primary" @click="handleCreateEnv">新建环境变量</el-button>
                    </div>
                </template>
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

            <!-- 环境套列表对话框 -->
            <el-dialog
                title="环境套列表"
                v-model="showEnvSuitesListDialog"
                width="50%"
                class="env-suites-dialog"
            >
                <el-table
                    :data="envSuites"
                    border
                    stripe
                    style="width: 100%"
                    v-loading="loading"
                >
                    <el-table-column prop="id" label="ID" width="80" align="center" />
                    <el-table-column prop="name" label="环境套名称" min-width="150" />
                    <el-table-column prop="description" label="描述" min-width="200" />
                    <el-table-column label="操作" width="120" align="center">
                        <template #default="{ row }">
                            <el-button
                                type="danger"
                                size="small"
                                @click="deleteEnvSuite(row)"
                                :icon="Delete"
                                circle
                            />
                        </template>
                    </el-table-column>
                </el-table>
                <div v-if="envSuites.length === 0" class="empty-data">
                    <el-empty description="暂无环境套数据" />
                </div>
                <template #footer>
                    <div class="dialog-footer">
                        <el-button @click="showEnvSuitesListDialog = false">关闭</el-button>
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
import PageContainer from '@/components/PageContainer.vue';
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
            // 处理注释
            const [fullAssertion] = assertion.split('#').map(s => s.trim());
            
            // 检查是否为自定义脚本
            if (fullAssertion.includes('$.code') || fullAssertion.includes('$.status') || fullAssertion.includes('response.status')) {
                // 自定义脚本断言
                let passed = false;
                let actualValue;
                let expectedValue;
                
                try {
                    // 创建一个安全的执行环境
                    const $ = {
                        // code指向响应体中的code字段
                        code: response.data.data.response.body?.code,
                        // status指向HTTP状态码
                        status: response.data.data.response.status_code,
                        data: response.data.data.response.body,
                        body: response.data.data.response.body,
                        headers: response.data.data.response.headers
                    };
                    
                    // 响应对象
                    const responseObj = {
                        status: response.data.data.response.status_code,
                        headers: response.data.data.response.headers,
                        body: response.data.data.response.body,
                        data: response.data.data.response.body
                    };
                    
                    // 执行脚本，使用Function构造器创建函数
                    const scriptFn = new Function('$', 'response', `return (${fullAssertion})`);
                    passed = scriptFn($, responseObj);
                    
                    // 记录实际值和预期值（对于自定义脚本，可以是简化的描述）
                    actualValue = passed ? 'true' : 'false';
                    expectedValue = 'true';
                } catch (error) {
                    console.error('自定义脚本执行错误:', error);
                    passed = false;
                    actualValue = '脚本执行错误';
                    expectedValue = '脚本执行成功';
                }
                
                return {
                    passed,
                    message: `${fullAssertion} ${passed ? '✓' : '✗'}`,
                    assertion: fullAssertion,
                    actualValue,
                    expectedValue,
                    path: '自定义脚本'
                };
            } else if (fullAssertion.includes('=')) {
                // 标准断言处理
                const [path, expectedValue] = fullAssertion.split('=').map(s => s.trim());
                let actualValue;

                // 处理不同类型的断言
                if (path === '$.code') {
                    // 从响应体中获取code字段
                    actualValue = response.data.data.response.body?.code;
                } else if (path === '$.status' || path === '$.statusCode') {
                    // 获取HTTP状态码
                    actualValue = response.data.data.response.status_code;
                } else if (path.startsWith('$.data.')) {
                    const dataPath = path.replace('$.data.', '');
                    actualValue = getValueByPath(response.data.data.response.body, dataPath);
                } else if (path.startsWith('$headers.')) {
                    const headerName = path.replace('$headers.', '');
                    actualValue = response.data.data.response.headers[headerName];
                } else {
                    // 尝试从响应体中获取值
                    actualValue = getValueByPath(response.data.data.response.body, path);
                }

                console.log('Assertion check:', {
                    path,
                    expectedValue,
                    actualValue,
                    fullAssertion,
                    responseData: response.data.data.response, 
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
            } else {
                // 其他类型断言处理
                return {
                    passed: false,
                    message: `断言格式无法识别: ${fullAssertion}`,
                    assertion: fullAssertion,
                    actualValue: '未知',
                    expectedValue: '未知',
                    path: '未知'
                };
            }
        } catch (e) {
            console.error('Assertion evaluation error:', e, {
                response: response.data.data.response
            });
            return {
                passed: false,
                message: `断言格式错误: ${assertion} (${e.message})`,
                assertion,
                error: e.message,
                actualValue: '错误',
                expectedValue: '正确格式',
                path: '未知'
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
        console.log('Test case execution response:', data);
        
        if (data.success === true) {
            // 找到当前执行的测试用例
            const testCase = testCases.value.find(tc => tc.case_id === caseId);
            if (testCase) {
                // 更新测试用例状态和执行时间
                testCase.status = data.data.status === 'FAIL' ? '失败' : '通过';
                testCase.last_execution_time = data.data.execution_time;
                
                // 记录响应数据
                testCase.last_response = {
                    status_code: data.data.response.status_code,
                    duration: data.data.duration,
                    body: data.data.response.body
                };
            }
            
            ElMessage({
                type: 'success',
                message: data.message || '测试用例执行成功',
                duration: 3000
            });
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
        
        const response = await fetch(`http://localhost:8081/api/testcases/${row.case_id}`, {
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
    console.log('Original test case data:', row);
    
    // 处理 body 内容格式化
    const formattedBody = formatRequestBody(row.body);
    
    // 重置表单数据
    testCaseForm.value = {
        case_id: row.case_id,
        title: row.title,
        api_path: row.api_path,
        method: row.method,
        priority: row.priority,
        // body处理放到下面
        assertions: row.assertions || '',
        expected_result: typeof row.expected_result === 'string' 
            ? row.expected_result 
            : JSON.stringify(row.expected_result, null, 2),
        tests: row.tests || [] // 保存原始测试数据
    };
    
    // 设置 body 类型
    bodyType.value = row.body_type || 'raw';
    rawContentType.value = row.content_type || 'application/json';
    
    // 初始化rawBody值
    rawBody.value = formattedBody;
    if (rawBody.value) {
        countRawBodyLines();
    }
    
    // 设置表单的body值
    testCaseForm.value.body = formattedBody;
    
    // 设置请求头数据
    if (row.headers) {
        try {
            const headers = typeof row.headers === 'string' 
                ? JSON.parse(row.headers) 
                : row.headers;
            
            // 转换为表格数据格式
            headersTableData.value = Object.entries(headers).map(([key, value]) => ({
                enabled: true,
                key,
                value: typeof value === 'object' ? JSON.stringify(value) : value,
                description: ''
            }));
        } catch (error) {
            console.error('Failed to parse headers:', error);
            headersTableData.value = [];
        }
    } else {
        headersTableData.value = [];
    }
    
    // 设置参数数据
    if (row.params) {
        try {
            const params = typeof row.params === 'string' 
                ? JSON.parse(row.params) 
                : row.params;
            
            // 转换为表格数据格式
            paramsTableData.value = Object.entries(params).map(([key, value]) => ({
                enabled: true,
                key,
                value: typeof value === 'object' ? JSON.stringify(value) : value,
                description: ''
            }));
        } catch (error) {
            console.error('Failed to parse params:', error);
            paramsTableData.value = [];
        }
    } else {
        paramsTableData.value = [];
    }
    
    // 设置 Form Data
    if (row.form_data && Array.isArray(row.form_data)) {
        formDataTableData.value = row.form_data.map(item => ({
            enabled: true,
            key: item.key,
            value: item.value,
            description: item.description || ''
        }));
    } else {
        formDataTableData.value = [];
    }
    
    // 设置提取器数据
    if (row.extractors && Array.isArray(row.extractors)) {
        extractors.value = row.extractors.map(item => ({
            name: item.name,
            type: item.type || 'jsonpath',
            expression: item.expression || '',
            defaultValue: item.defaultValue || '',
            enabled: item.enabled !== undefined ? item.enabled : true,
            extractedValue: null
        }));
    } else {
        extractors.value = [];
    }
    
    // 设置测试断言数据
    if (row.tests && Array.isArray(row.tests)) {
        tests.value = row.tests.map(item => ({
            ...item,
            saved: true, // 标记为已保存
            lastResult: null
        }));
    } else {
        tests.value = [];
    }
    
    // 显示对话框
    showAddDialog.value = true;
};

// 添加格式化请求体的方法
const formatRequestBody = (body) => {
    if (!body) return '';
    
    try {
        // 如果是字符串，尝试解析为对象后再格式化
        if (typeof body === 'string') {
            if (body.trim() === '') return '';
            
            try {
                const parsed = JSON.parse(body);
                return JSON.stringify(parsed, null, 2);
            } catch {
                // 如果解析失败，直接返回原字符串
                return body;
            }
        }
        
        // 如果是对象但没有内容
        if (typeof body === 'object' && Object.keys(body).length === 0) {
            return '';
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
    
    // 重置rawBody
    rawBody.value = '';
    rawBodyLines.value = 1;
    
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
    
    // 重置rawBody
    rawBody.value = '';
    rawBodyLines.value = 1;
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
// 添加tests响应式变量
const tests = ref([]);
// 添加extractors响应式变量
const extractors = ref([]);
// 添加rawBody相关变量
const rawBody = ref('');
const rawBodyLines = ref(1);

// 添加countRawBodyLines方法
const countRawBodyLines = () => {
    rawBodyLines.value = getLineCount(rawBody.value);
};

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
const addFormItem = () => {
    formDataTableData.value.push({ enabled: true, key: '', value: '', description: '' });
};

const removeFormItem = (index) => {
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
    
    // 确保测试断言数据已更新到表单中
    updateTestsInForm();
    
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
                        })),
                    // 添加提取器数据
                    extractors: extractors.value
                        .filter(item => item.name.trim()) // 只保存有名称的提取器
                        .map(item => ({
                            name: item.name.trim(),
                            type: item.type,
                            expression: item.expression,
                            defaultValue: item.defaultValue || '',
                            enabled: item.enabled
                        })),
                    // 添加测试断言数据
                    tests: testCaseForm.value.tests || []
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
                // 构建请求数据，确保包含所有已填写的字段
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


// 添加提取器相关方法
const addExtractor = () => {
    extractors.value.push({
        enabled: true,
        name: '',
        type: 'jsonpath',
        expression: '',
        defaultValue: '',
        extractedValue: null
    });
};

const removeExtractor = (index) => {
    extractors.value.splice(index, 1);
};

// 添加获取表达式占位符的方法
const getExpressionPlaceholder = (type) => {
    switch (type) {
        case 'jsonpath':
            return '$.data.id';
        case 'regex':
            return '正则表达式，例如：value":"(.*?)"';
        case 'xpath':
            return '/root/data/item[1]';
        default:
            return '请输入提取表达式';
    }
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
        
        let jsonStr = testCaseForm.value.body.trim();
        
        // 修复常见的JSON错误格式
        // 如果开头是 [ 但内容没有包装在 {} 中
        if (jsonStr.startsWith('[') && !jsonStr.includes('{')) {
            // 检查是否包含键值对格式 (如 "key":value)
            if (/"[^"]+"\s*:/.test(jsonStr)) {
                // 将内容包装在 {} 中
                jsonStr = jsonStr.replace(/^\[\s*/, '[{\n  ').replace(/\s*\]$/, '\n}]');
                // 修复可能的逗号缺失
                jsonStr = jsonStr.replace(/("\w+"\s*:\s*[^,{}\[\]]+)(?=\s*"\w+"\s*:)/g, '$1,');
            }
        }
        
        // 先解析成对象
        const parsed = JSON.parse(jsonStr);
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
        
        // 尝试修复常见错误
        let jsonText = text.trim();
        // 对于简单的错误进行自动修复 (仅用于验证，不修改实际内容)
        
        // 检查有无包裹对象的数组
        if (jsonText.startsWith('[') && /"[^"]+"\s*:/.test(jsonText) && !jsonText.includes('{')) {
            jsonError.value = '数组格式错误，请使用 [{...}] 格式';
            return false;
        }
        
        // 检查缺少逗号的情况
        if (/"[^"]+"\s*:\s*[^,{}\[\]]+\s*"[^"]+"\s*:/.test(jsonText)) {
            jsonError.value = '属性之间缺少逗号分隔';
            return false;
        }
        
        // 尝试解析
        JSON.parse(jsonText);
        jsonError.value = '';
        return true;
    } catch (e) {
        jsonError.value = e.message;
        // 获取错误位置以便高亮
        const match = e.message.match(/position\s+(\d+)/i);
        if (match && match[1]) {
            jsonErrorPosition.value = parseInt(match[1]);
        }
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
    // 计算行数并确保至少有1行
    return Math.max(str.split('\n').length, 1);
};

// 添加处理 Body 类型变更的方法
const handleBodyTypeChange = (value) => {
    if (value === 'raw') {
        // 默认使用 application/json
        rawContentType.value = 'application/json';
        
        // 如果表单中有 Content-Type 的请求头，更新它
        const contentTypeHeader = headersTableData.value.find(h => h.key.toLowerCase() === 'content-type');
        if (contentTypeHeader) {
            contentTypeHeader.value = rawContentType.value;
        } else {
            // 如果没有 Content-Type 请求头，添加一个
            headersTableData.value.push({
                enabled: true,
                key: 'Content-Type',
                value: rawContentType.value,
                description: '自动设置的内容类型'
            });
        }
    }
};

// 监听rawBody变化，同步到testCaseForm.body
watch(rawBody, (newValue) => {
    if (bodyType.value === 'raw') {
        testCaseForm.value.body = newValue;
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
    if (!suiteId) return '未分配';
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
        if (extractor.expression === item.value) {
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
        console.log('Using expression:', extractor.expression);
        
        let value;
        
        // 根据提取器类型处理
        if (extractor.type === 'jsonpath') {
            // 处理 JSONPath 表达式
            const path = extractor.expression.replace(/^\$\./, '').split('.');
            value = jsonData;
            
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
        } else if (extractor.type === 'regex') {
            // 处理正则表达式提取
            const contentStr = typeof jsonData === 'object' ? JSON.stringify(jsonData) : String(jsonData);
            const regex = new RegExp(extractor.expression);
            const match = contentStr.match(regex);
            
            if (match && match.length > 1) {
                value = match[1]; // 获取第一个捕获组
            }
        } else if (extractor.type === 'xpath') {
            // 处理 XPath 提取 (这里只是一个简化实现，实际需要使用XPath库)
            ElMessage.warning('XPath提取器暂未实现');
            return;
        }
        
        // 更新提取到的值
        if (value !== undefined && value !== null) {
            extractor.extractedValue = typeof value === 'object' 
                ? JSON.stringify(value) 
                : String(value);
            console.log(`Successfully extracted value:`, extractor.extractedValue);
            ElMessage.success('提取成功');
        } else {
            extractor.extractedValue = extractor.defaultValue || null;
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
        await axios.put('http://localhost:8081/api/environment/current/', {
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

// 修复 getStatusCount 计算属性
const getStatusCount = (status) => {
    if (!testCases.value || !Array.isArray(testCases.value)) {
        return 0;
    }
    
    // 状态映射，确保匹配不同格式的状态值
    const statusMap = {
        '通过': ['通过', 'pass'],
        '失败': ['失败', 'fail'],
        '未执行': ['未执行', 'pending', null, undefined, '']
    };
    
    // 获取状态对应的可能值数组
    const validStatusValues = statusMap[status] || [status];
    
    // 统计符合状态的用例数量
    return testCases.value.filter(item => 
        validStatusValues.includes(item.status)
    ).length;
};

// 添加响应式变量
const isSmallScreen = ref(window.innerWidth < 768);
const activeTab = ref('params');

// 将handleResize窗口大小调整函数重命名，避免重复声明
const handleWindowResize = () => {
    isSmallScreen.value = window.innerWidth < 768;
};

// 修改监听窗口大小变化，使用重命名后的函数
onMounted(() => {
    window.addEventListener('resize', handleWindowResize);
    document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleWindowResize);
    document.removeEventListener('keydown', handleKeydown);
});

// 添加JSON格式化方法
const formatJson = () => {
    try {
        if (!rawBody.value) return;
        
        // 解析并格式化JSON
        const parsedJson = JSON.parse(rawBody.value);
        rawBody.value = JSON.stringify(parsedJson, null, 2);
        
        // 更新行数
        countRawBodyLines();
        
        ElMessage.success('JSON格式化成功');
    } catch (error) {
        console.error('JSON格式化失败:', error);
        ElMessage.error('JSON格式化失败: ' + error.message);
    }
};

// 添加查看环境变量的方法
const handleViewEnv = async () => {
    try {
        loading.value = true;
        
        // 1. 获取环境套列表
        const suitesResponse = await axios.get(
            `http://localhost:8081/api/env-suite/list/${projectId.value}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        if (suitesResponse.data.code === 200) {
            // 保存环境套数据
            const suites = suitesResponse.data.data.items || [];
            console.log('Environment suites:', suites);
            
            // 更新环境套的全局状态
            envSuites.value = suites;
            
            // 2. 获取环境变量列表 - 使用正确的API
            const variablesResponse = await axios.get(
                `http://localhost:8081/api/env/variable/${projectId.value}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            
            if (variablesResponse.data.code === 200) {
                // 新的响应格式处理
                const envItems = Array.isArray(variablesResponse.data.data) 
                    ? variablesResponse.data.data 
                    : [variablesResponse.data.data];
                
                console.log('Environment variable response:', envItems);
                
                // 3. 将环境变量按环境套分组并格式化
                const formattedEnvList = envItems.map(env => ({
                    id: env.id,
                    name: env.name,
                    description: env.description || '',
                    envSuiteId: env.env_suite_id,
                    variables: env.variables || []
                }));
                
                // 打印调试信息
                console.log('Formatted environment list:', formattedEnvList);
                
                // 更新环境变量列表
                envList.value = formattedEnvList;
                
                // 如果没有数据，显示提示
                if (formattedEnvList.length === 0) {
                    console.log('No environment variables found');
                }
            } else {
                ElMessage.error(variablesResponse.data.message || '获取环境变量列表失败');
            }
            
            // 打开环境变量列表对话框
            showEnvListDialog.value = true;
        } else {
            ElMessage.error(suitesResponse.data.message || '获取环境套列表失败');
        }
    } catch (error) {
        console.error('获取环境变量列表失败:', error);
        ElMessage.error('获取环境变量列表失败，请检查网络连接');
    } finally {
        loading.value = false;
    }
};

// 添加测试相关方法
const addTest = () => {
    tests.value.push({
        enabled: true,
        name: '',
        type: 'statusCode',
        condition: 'equals',
        expected: 200,
        jsonPath: '',
        text: '',
        script: '',
        saved: false,
        lastResult: null
    });
};

const removeTest = (index) => {
    tests.value.splice(index, 1);
};

const saveTest = (test, index) => {
    if (!test.name) {
        ElMessage.warning('请先填写测试名称');
        return;
    }
    
    // 验证测试必填字段
    if (!validateTest(test)) {
        return;
    }
    
    // 标记为已保存
    test.saved = true;
    
    // 更新主表单中的测试数据
    updateTestsInForm();
    
    ElMessage.success(`测试 "${test.name}" 已保存`);
};

// 验证测试数据
const validateTest = (test) => {
    if (!test.type) {
        ElMessage.warning('请选择测试类型');
        return false;
    }
    
    if (test.type === 'statusCode') {
        if (!test.condition) {
            ElMessage.warning('请选择状态码条件');
            return false;
        }
        if (test.expected === undefined || test.expected === null) {
            ElMessage.warning('请输入预期状态码');
            return false;
        }
    } else if (test.type === 'responseTime') {
        if (!test.condition) {
            ElMessage.warning('请选择响应时间条件');
            return false;
        }
        if (test.expected === undefined || test.expected === null) {
            ElMessage.warning('请输入预期响应时间');
            return false;
        }
    } else if (test.type === 'jsonValue') {
        if (!test.jsonPath) {
            ElMessage.warning('请输入JSONPath表达式');
            return false;
        }
        if (!test.condition) {
            ElMessage.warning('请选择JSON值条件');
            return false;
        }
        if ((test.condition !== 'exists' && test.condition !== 'notExists') && 
            (test.expected === undefined || test.expected === null || test.expected === '')) {
            ElMessage.warning('请输入预期JSON值');
            return false;
        }
    } else if (test.type === 'containsText') {
        if (!test.condition) {
            ElMessage.warning('请选择文本条件');
            return false;
        }
        if (!test.text) {
            ElMessage.warning('请输入要检查的文本');
            return false;
        }
    } else if (test.type === 'customScript') {
        if (!test.script) {
            ElMessage.warning('请输入自定义脚本');
            return false;
        }
    }
    
    return true;
};

// 将测试数据更新到主表单中
const updateTestsInForm = () => {
    // 过滤出启用和已保存的测试，格式化为断言字符串
    const assertions = tests.value
        .filter(test => test.enabled && test.saved)
        .map(test => {
            // 根据测试类型生成断言字符串
            if (test.type === 'statusCode') {
                return `$.code ${getOperator(test.condition)} ${test.expected}  # ${test.name}`;
            } else if (test.type === 'responseTime') {
                return `$.responseTime ${getOperator(test.condition)} ${test.expected}  # ${test.name}`;
            } else if (test.type === 'jsonValue') {
                if (test.condition === 'exists') {
                    return `$.exists(${test.jsonPath})  # ${test.name}`;
                } else if (test.condition === 'notExists') {
                    return `$.notExists(${test.jsonPath})  # ${test.name}`;
                } else {
                    return `${test.jsonPath} ${getOperator(test.condition)} ${test.expected}  # ${test.name}`;
                }
            } else if (test.type === 'containsText') {
                const operator = test.condition === 'contains' ? 'contains' : 'notContains';
                return `$.${operator}("${test.text}")  # ${test.name}`;
            } else if (test.type === 'customScript') {
                // 自定义脚本直接使用脚本内容，不添加包装
                return `${test.script}  # ${test.name}`;
            }
            return null;
        })
        .filter(Boolean)
        .join('\n');
    
    // 更新主表单中的断言字段
    testCaseForm.value.assertions = assertions;
    
    // 保存测试列表到表单的tests字段（可选，如果后端需要原始测试数据）
    testCaseForm.value.tests = formatTestsForSaving(tests.value);
    
    console.log('Updated assertions in form:', testCaseForm.value.assertions);
    console.log('Updated tests in form:', testCaseForm.value.tests);
};

// 格式化测试数据用于保存
const formatTestsForSaving = (testsArray) => {
    return testsArray
        .filter(test => test.enabled && test.saved)
        .map(test => {
            // 移除UI相关的临时属性
            const { lastResult, ...cleanTest } = test;
            return cleanTest;
        });
};

// 获取条件操作符
const getOperator = (condition) => {
    const operatorMap = {
        'equals': '==',
        'notEquals': '!=',
        'greaterThan': '>',
        'lessThan': '<',
        'contains': 'contains',
        'notContains': 'notContains'
    };
    return operatorMap[condition] || '==';
};

// 环境套相关数据
const showEnvSuitesListDialog = ref(false);

// 显示环境套列表对话框
const showEnvSuitesDialog = () => {
    fetchEnvSuites().then(() => {
        showEnvSuitesListDialog.value = true;
    });
};

// 删除环境套
const deleteEnvSuite = async (suite) => {
    try {
        await ElMessageBox.confirm(`确定要删除环境套 "${suite.name}" 吗？删除后无法恢复！`, '警告', {
            type: 'warning',
            confirmButtonText: '确定',
            cancelButtonText: '取消'
        });
        
        loading.value = true;
        const response = await axios.delete(
            `http://localhost:8081/api/env-suite/delete/${suite.id}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );
        
        if (response.data.code === 200) {
            ElMessage.success('环境套删除成功');
            // 重新获取环境套列表
            await fetchEnvSuites();
            // 如果当前选中的是被删除的环境套，清空选择
            if (currentEnvId.value === suite.id) {
                currentEnvId.value = '';
            }
        } else {
            ElMessage.error(response.data.message || '删除环境套失败');
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除环境套失败:', error);
            ElMessage.error('删除环境套失败，请重试');
        }
    } finally {
        loading.value = false;
    }
};
  </script>

  <style scoped>

/* 环境变量列表样式 */
.env-list-container {
    max-height: 60vh;
    overflow-y: auto;
}

.env-item {
    margin-bottom: 20px;
    padding: 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    background-color: var(--el-fill-color-lighter);
}

.env-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.env-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.env-name {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-color-primary);
}

.env-suite-tag {
    background-color: var(--el-color-info-light-9);
}

.env-description {
    color: var(--el-text-color-secondary);
    font-size: 14px;
}

.variable-key {
    font-weight: 500;
    color: var(--el-color-primary);
}

/* 确保环境变量列表对话框有足够的空间 */
.env-list-dialog :deep(.el-dialog__body) {
    padding: 15px;
    max-height: 70vh;
    overflow-y: auto;
}

/* 红框区域的搜索栏样式 */
.el-card .el-input,
.el-card .el-select {
    margin-bottom: 10px;
    width: 100%;
}

@media (min-width: 768px) {
    .el-card .el-input,
    .el-card .el-select {
        margin-bottom: 0;
        margin-right: 10px;
        width: auto;
    }
    
    .el-card .el-button-group {
        display: inline-flex;
    }
    
    /* 红框内的搜索区域水平排列 */
    .el-card > div > .el-input,
    .el-card > div > .el-select,
    .el-card > div > .el-button-group {
        display: inline-flex;
        vertical-align: middle;
        margin-right: 10px;
    }
}

/* 普通文本编辑器样式 */
.text-editor-container {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 16px;
}

.text-editor-container :deep(.el-textarea__inner) {
    padding: 8px;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    line-height: 1.5;
    font-size: 13px;
    box-shadow: none !important;
    border: none;
}

/* 标签页样式 */
.custom-tabs :deep(.el-tabs__header) {
    margin-bottom: 12px;
}

.custom-tabs :deep(.el-tabs__item) {
    height: 40px;
    line-height: 40px;
    font-size: 14px;
}

.custom-tabs :deep(.el-tabs__item.is-active) {
    font-weight: 600;
}

/* 表格工具栏 */
.params-toolbar,
.headers-toolbar,
.form-data-toolbar,
.extractors-toolbar {
    margin-bottom: 12px;
    display: flex;
    justify-content: flex-start;
}

/* 表格样式 */
.params-table,
.headers-table,
.form-data-table {
    margin-bottom: 16px;
}

/* JSON编辑器样式 */
.body-type-selector {
    margin-bottom: 12px;
    display: flex;
    align-items: center;
}

.body-type-radio {
    margin-right: 8px;
}

/* 提取器卡片样式 */
.extractors-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 16px;
    margin-top: 16px;
}

.extractors-list .el-collapse {
    width: 100%;
    border: none;
}

.extractors-list .el-collapse-item {
    background-color: var(--el-bg-color);
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    overflow: hidden;
    transition: all 0.3s ease;
    margin-bottom: 16px;
}

.extractors-list .el-collapse-item:hover {
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
}

.extractors-list .el-collapse-item__header {
    background-color: var(--el-fill-color-light);
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.extractors-list .el-collapse-item__content {
    padding: 0;
}

/* 提取器表单样式优化 */
.extractor-form {
    padding: 16px;
    background-color: var(--el-bg-color);
    border-radius: 0 0 8px 8px;
    border: 1px solid var(--el-border-color);
    margin-bottom: 16px;
}

.extractor-form-row {
    display: flex;
    gap: 16px;
    margin-bottom: 8px;
}

.extractor-form-row .el-form-item {
    margin-bottom: 8px;
}

.extractor-form-row .flex-grow {
    flex-grow: 1;
}

.extractor-form .el-form {
    display: flex;
    flex-direction: column;
}

.extractor-item-header {
    display: flex;
    align-items: center;
    gap: 12px;
}

.extractor-name {
    font-weight: 500;
    color: var(--el-text-color-primary);
}

.extractor-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 8px;
}

.extracted-value {
    background-color: var(--el-fill-color-light);
    border-radius: 6px;
    padding: 12px;
    margin-top: 12px;
}

.extracted-value-label {
    font-weight: 600;
    color: var(--el-color-primary);
    margin-bottom: 8px;
}

.extracted-value-content {
    display: flex;
    gap: 8px;
    align-items: flex-start;
}

.extracted-value-content .el-input {
    flex-grow: 1;
}

.extracted-value-content .el-button {
    flex-shrink: 0;
    margin-top: 8px;
}

/* 响应容器样式 */
.response-container {
    margin-top: 20px;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    overflow: hidden;
}

.response-header {
    padding: 12px 16px;
    background-color: var(--el-fill-color-light);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--el-border-color);
}

.response-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

.response-status {
    display: flex;
    align-items: center;
    gap: 12px;
}

.response-time {
    color: var(--el-text-color-secondary);
    font-size: 13px;
}

.response-body-wrapper {
    position: relative;
}

.response-toolbar {
    padding: 8px 12px;
    background-color: var(--el-fill-color-light);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.content-type {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    font-family: monospace;
}

.response-body {
    padding: 12px;
    margin: 0;
    max-height: 300px;
    overflow: auto;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    background-color: var(--el-bg-color);
}

.resize-handle {
    height: 6px;
    background-color: var(--el-border-color-lighter);
    cursor: ns-resize;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
}

.resize-handle:hover {
    background-color: var(--el-color-primary-light-7);
}

.headers-wrapper {
    padding: 12px;
    max-height: 300px;
    overflow: auto;
}

.header-item {
    display: flex;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.header-key {
    font-weight: 600;
    color: var(--el-text-color-primary);
    min-width: 200px;
    padding-right: 12px;
}

.header-value {
    color: var(--el-text-color-regular);
    word-break: break-all;
}

/* 测试结果样式 */
.test-results-container {
    padding: 12px;
}

.test-results-summary {
    margin-bottom: 16px;
    padding: 12px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
}

.summary-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.summary-stats .stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.summary-stats .stat-label {
    font-weight: 600;
    color: var(--el-text-color-regular);
}

.summary-stats .stat-value {
    font-size: 16px;
    font-weight: 600;
}

.summary-stats .stat-value.pass {
    color: var(--el-color-success);
}

.summary-stats .stat-value.fail {
    color: var(--el-color-danger);
}

.test-result-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.test-result-item {
    display: flex;
    padding: 12px;
    border-radius: 4px;
    background-color: var(--el-fill-color-light);
}

.test-result-item.passed {
    border-left: 4px solid var(--el-color-success);
}

.test-result-item.failed {
    border-left: 4px solid var(--el-color-danger);
}

.result-icon {
    margin-right: 12px;
    display: flex;
    align-items: flex-start;
}

.success-icon {
    color: var(--el-color-success);
    font-size: 18px;
}

.error-icon {
    color: var(--el-color-danger);
    font-size: 18px;
}

.result-content {
    flex: 1;
}

.result-assertion {
    font-weight: 600;
    margin-bottom: 8px;
}

.result-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
}

/* 响应式适配 */
@media screen and (max-width: 768px) {
    .body-type-selector {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .body-type-radio {
        margin-bottom: 8px;
    }
    
    .response-header,
    .response-toolbar {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
    
    .summary-stats {
        flex-direction: column;
        gap: 8px;
    }
}

/* 项目信息样式 */
.project-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
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

.project-stats {
    display: flex;
    gap: 24px;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-value {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 4px;
}

.stat-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.stat-value.success {
    color: var(--el-color-success);
}

.stat-value.danger {
    color: var(--el-color-danger);
}

.stat-value.info {
    color: var(--el-color-info);
}

/* 表格顶部操作栏样式 */
.table-header {
    margin-bottom: 16px;
}

/* 搜索区域和查询按钮样式 */
.search-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: nowrap;
    width: 100%;
    margin-bottom: 10px;
}

.search-input {
    width: 260px;
    margin-right: 10px;
}

.filter-select {
    width: 220px;
    margin-right: 10px;
}

.selected-label {
    display: inline-block;
    font-size: 14px;
    color: var(--el-color-primary);
    margin-right: 5px;
}

/* 确保下拉选项有足够的空间 */
.status-filter-dropdown .el-select-dropdown__item,
.priority-filter-dropdown .el-select-dropdown__item {
    padding: 0 12px;
    height: auto;
    line-height: 34px;
}

/* 修复选择后显示问题 */
.filter-select :deep(.el-input__inner) {
    overflow: visible;
    white-space: nowrap;
}

.action-button {
    margin-left: 0 !important;
    margin-right: 10px;
    white-space: nowrap;
}

/* 操作按钮容器样式 */
.operation-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
}

.left-operations,
.right-operations {
    display: flex;
    align-items: center;
    gap: 12px;
}

.env-label {
    color: var(--el-text-color-secondary);
    white-space: nowrap;
}

/* 上传按钮样式 */
.upload-button {
    display: inline-block;
}

/* 表格内容样式 */
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
}

.api-path {
    color: var(--el-text-color-regular);
    word-break: break-all;
}

.status-tag {
    min-width: 60px;
    text-align: center;
}

/* 分页容器样式 */
.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

/* 内容类型显示 */
.content-type-display {
    margin-top: 10px;
    margin-bottom: 10px;
    padding: 8px 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
    color: #606266;
    font-size: 14px;
    border-left: 3px solid #409eff;
}

/* 标签页样式 */
.extractors-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.extractor-item-header {
    display: flex;
    align-items: center;
    gap: 8px;
}

.extractor-name {
    font-weight: 500;
    font-size: 14px;
}

.extractor-buttons {
    display: flex;
    gap: 8px;
}

.extracted-value {
    margin-top: 8px;
    padding: 8px;
    border-radius: 4px;
    background-color: #f8f8f8;
}

.extracted-value-label {
    font-weight: 500;
    margin-bottom: 4px;
    color: #409EFF;
}

.extracted-value-content {
    display: flex;
    align-items: flex-start;
    gap: 8px;
}

/* 状态类型相关 */

/* 提取器表单样式优化 */
.extractor-form {
    padding: 16px;
    background-color: var(--el-fill-color-lighter);
    border-radius: 8px;
    margin-bottom: 16px;
}

.extractor-form .el-form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
}

.extractor-form .el-form-item:last-child {
    grid-column: 1 / -1;
}

.extractor-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 8px;
}

.extracted-value {
    background-color: var(--el-fill-color-light);
    border-radius: 6px;
    padding: 12px;
    margin-top: 8px;
}

.extracted-value-label {
    font-weight: 600;
    color: var(--el-color-primary);
    margin-bottom: 8px;
}

.extracted-value-content {
    display: flex;
    gap: 8px;
    align-items: flex-start;
}

.extracted-value-content .el-input {
    flex-grow: 1;
}

.extracted-value-content .el-button {
    flex-shrink: 0;
    margin-top: 8px;
}

.extractor-item-header {
    display: flex;
    align-items: center;
    gap: 12px;
}

.extractor-name {
    font-weight: 500;
    color: var(--el-text-color-primary);
}

/* 为提取器添加的样式 */
.extractors-content, .tests-content {
    border: 1px solid #ebeef5;
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 15px;
}

.extractors-toolbar, .tests-toolbar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
}

.extractors-list, .tests-list {
    margin-top: 10px;
}

.extractor-item-header, .test-item-header {
    display: flex;
    align-items: center;
    gap: 10px;
}

.extractor-name, .test-name {
    font-weight: 500;
    margin-left: 10px;
    flex-grow: 1;
}

.extractor-form, .test-form {
    padding: 10px;
}

.extractor-form-row, .test-form-row {
    display: flex;
    gap: 20px;
    width: 100%;
}

.flex-grow {
    flex-grow: 1;
}

.extractor-buttons, .test-buttons {
    display: flex;
    gap: 10px;
    margin-top: 10px;
}

.extracted-value {
    margin-top: 15px;
    border-top: 1px solid #ebeef5;
    padding-top: 15px;
}

.extracted-value-label {
    font-weight: bold;
    margin-bottom: 5px;
}

.extracted-value-content {
    display: flex;
    gap: 10px;
    align-items: flex-start;
}

.test-result-tag {
    margin-left: auto;
}

/* 测试卡片样式与提取器一致 */
.tests-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 16px;
    margin-top: 16px;
    width: 100%;
}

.tests-content {
    padding: 10px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    margin-bottom: 15px;
    width: 100%;
}

.tests-list .el-collapse {
    width: 100%;
    border: none;
}

.tests-list .el-collapse-item {
    background-color: var(--el-bg-color);
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    overflow: hidden;
    transition: all 0.3s ease;
    margin-bottom: 16px;
    width: 100%;
}

.tests-list .el-collapse-item:hover {
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
}

.tests-list .el-collapse-item__header {
    background-color: var(--el-fill-color-light);
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    width: 100%;
}

.tests-list .el-collapse-item__content {
    padding: 0;
    width: 100%;
}

.test-form {
    padding: 16px;
    background-color: var(--el-bg-color);
    border-radius: 0 0 8px 8px;
    border: 1px solid var(--el-border-color);
    margin-bottom: 0;
    width: 100%;
}

.test-form-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 8px;
    width: 100%;
}

.test-form-row .el-form-item {
    margin-bottom: 8px;
    min-width: 200px;
}

.test-form-row .flex-grow {
    flex: 1;
    min-width: 200px;
}

.test-form .el-form {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.test-item-header {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
}

.test-name {
    font-weight: 500;
    color: var(--el-text-color-primary);
    flex: 1;
}

.test-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
    width: 100%;
}

.test-result-tag {
    margin-left: auto;
}

/* 确保测试和提取器区域具有相同的父容器宽度 */
.tab-content {
    overflow: visible;
    width: 100%;
}

/* 工具栏样式统一 */
.tests-toolbar, .extractors-toolbar {
    margin-bottom: 15px;
    display: flex;
    justify-content: flex-start;
    width: 100%;
}

/* 测试卡片样式，与提取器卡片相同 */
.tests-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
    gap: 12px;
    margin-top: 16px;
    width: 100%;
}

.tests-content {
    padding: 12px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    margin-bottom: 15px;
    width: 100%;
}

.tests-list .el-collapse {
    width: 100%;
    border: none;
}

.tests-list .el-collapse-item {
    background-color: var(--el-bg-color);
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    overflow: hidden;
    transition: all 0.3s ease;
    margin-bottom: 16px;
    width: 100%;
}

.tests-list .el-collapse-item:hover {
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
}

.tests-list .el-collapse-item__header {
    background-color: var(--el-fill-color-light);
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    width: 100%;
}

.tests-list .el-collapse-item__content {
    padding: 0;
    width: 100%;
}

.test-form {
    padding: 16px;
    background-color: var(--el-bg-color);
    border-radius: 0 0 8px 8px;
    border: 1px solid var(--el-border-color);
    margin-bottom: 0;
    width: 100%;
    box-sizing: border-box;
}

.test-form-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 8px;
    width: 100%;
    box-sizing: border-box;
}

.test-form-row .el-form-item {
    margin-bottom: 8px;
    min-width: 150px;
    width: calc(50% - 8px);
    box-sizing: border-box;
}

.test-form-row .flex-grow {
    flex: 1;
    min-width: 150px;
    box-sizing: border-box;
}

.test-form .el-form {
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
}

.test-item-header {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
}

.test-name {
    font-weight: 500;
    color: var(--el-text-color-primary);
    flex: 1;
}

.test-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
    width: 100%;
}

.test-result-tag {
    margin-left: auto;
}

/* 确保测试和提取器区域具有相同的父容器宽度 */
.tab-content {
    overflow: visible;
    width: 100%;
    box-sizing: border-box;
    padding: 0;
}

/* 工具栏样式统一 */
.tests-toolbar, .extractors-toolbar {
    margin-bottom: 15px;
    display: flex;
    justify-content: flex-start;
    width: 100%;
    box-sizing: border-box;
}

/* 修复滚动问题 */
.el-form-item__content {
    width: 100%;
    overflow: visible;
}

/* 优化表单样式 */
.test-form .el-input, 
.test-form .el-select,
.test-form .el-input-number {
    width: 100%;
}

/* 环境套对话框样式 */
.env-suites-dialog {
    max-width: 800px;
}

.empty-data {
    padding: 20px 0;
    text-align: center;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
}

:deep(.el-dialog__header) {
    border-bottom: 1px solid #eee;
    padding-bottom: 15px;
    margin-bottom: 15px;
}

:deep(.el-table .el-button.is-circle) {
    margin-right: 0;
}

/* 其他已有的样式 */
</style>