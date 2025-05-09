<template>
    <Home>
        <PageContainer :title="`${projectName} - 接口自动化测试`">
            <el-card shadow="hover" class="automation-card">
                <!-- 项目信息 -->
                <div class="project-info">
                    <h3 class="project-title">
                        <el-icon><Folder /></el-icon>
                        {{ projectName }}
                    </h3>
                </div>

                <!-- 测试套件配置区域 -->
                <div class="suite-config">
                    <div class="section-header">
                        <h4>测试套件配置</h4>
                        <div class="actions">
                            <el-button type="primary" @click="createNewSuite" :icon="Plus">
                                新建测试套件
                            </el-button>
                            <el-button type="success" @click="runSelectedSuite" :icon="VideoPlay">
                                执行测试
                            </el-button>
                            <el-button type="danger" @click="deleteSelectedSuites" :icon="Delete" :disabled="!hasSelectedSuites">
                                批量删除
                            </el-button>
                        </div>
                    </div>

                    <!-- 测试套件卡片展示 -->
                    <div class="suite-cards">
                        <div class="suite-row" v-if="testSuites && testSuites.length > 0">
                            <div class="suite-card-wrapper" v-for="suite in testSuites" :key="suite.suite_id">
                                <el-card shadow="hover" class="suite-card">
                                    <template #header>
                                        <div class="card-header">
                                            <el-checkbox v-model="suite.selected" @change="updateSuiteSelection"></el-checkbox>
                                            <span class="suite-name">{{ suite.name }}</span>
                                            <el-tag v-if="suite.last_execution_status" 
                                                :type="getStatusType(suite.last_execution_status)" 
                                                size="small"
                                                class="status-tag"
                                            >
                                                {{ getStatusText(suite.last_execution_status) }}
                                            </el-tag>
                                        </div>
                                    </template>
                                    <div class="card-content">
                                        <div class="suite-description" v-if="suite.description">
                                            {{ suite.description }}
                                        </div>
                                        <div class="suite-description" v-else>
                                            <el-text type="info" size="small">无描述</el-text>
                                        </div>
                                        <div class="suite-info">
                                            <div class="info-item">
                                                <el-icon><Document /></el-icon>
                                                <span>{{ suite.case_count }}个用例</span>
                                            </div>
                                            <div class="info-item">
                                                <el-icon><Stopwatch /></el-icon>
                                                <span>{{ suite.last_executed_at ? formatDate(suite.last_executed_at) : '未执行' }}</span>
                                            </div>
                                        </div>
                                        <div class="suite-info secondary-info">
                                            <div class="info-item">
                                                <el-icon><User /></el-icon>
                                                <span>{{ suite.creator?.username || 'admin' }}</span>
                                            </div>
                                            <div class="info-item">
                                                <el-icon><Monitor /></el-icon>
                                                <span>{{ suite.env_name || '默认环境' }}</span>
                                            </div>
                                        </div>
                                        <div class="card-actions">
                                            <el-button-group>
                                                <el-tooltip content="执行" placement="top">
                                                    <el-button 
                                                        type="primary"
                                                        @click="runSuite(suite)"
                                                        :loading="suite.executing"
                                                        :icon="VideoPlay"
                                                        circle
                                                        size="small"
                                                    />
                                                </el-tooltip>
                                                <el-tooltip content="查看结果" placement="top">
                                                    <el-button 
                                                        type="success"
                                                        @click="viewSuiteResults(suite)"
                                                        :disabled="suite.last_execution_status === 'not_run' || !suite.last_execution_status"
                                                        :icon="Document"
                                                        circle
                                                        size="small"
                                                    />
                                                </el-tooltip>
                                                <el-tooltip content="编辑" placement="top">
                                                    <el-button 
                                                        type="primary" 
                                                        plain
                                                        @click="editSuite(suite)"
                                                        :icon="Edit"
                                                        circle
                                                        size="small"
                                                    />
                                                </el-tooltip>
                                                <el-tooltip content="删除" placement="top">
                                                    <el-button 
                                                        type="danger" 
                                                        plain
                                                        @click="deleteSuite(suite)"
                                                        :icon="Delete"
                                                        circle
                                                        size="small"
                                                    />
                                                </el-tooltip>
                                            </el-button-group>
                                        </div>
                                    </div>
                                </el-card>
                            </div>
                        </div>
                        <el-empty v-else description="暂无测试套件" />
                    </div>
                </div>

                <!-- 测试报告列表 -->
                <div class="report-list">
                    <div class="section-header">
                        <h4>测试报告</h4>
                        <div class="actions">
                            <el-button type="danger" plain size="small" @click="deleteSelectedReports" :icon="Delete" :disabled="!hasSelectedReports">
                                批量删除
                            </el-button>
                        </div>
                    </div>
                    <el-table :data="paginatedReports" style="width: 100%" @selection-change="handleReportSelectionChange">
                        <el-table-column type="selection" width="55" />
                        <el-table-column prop="suiteName" label="套件名称" min-width="180" />
                        <el-table-column prop="executionTime" label="执行时间" width="160">
                            <template #default="{ row }">
                                {{ formatDate(row.executionTime) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="执行结果" width="120" align="center">
                            <template #default="{ row }">
                                <el-tag :type="getResultType(row.result)" effect="light">
                                    {{ row.result }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="duration" label="耗时" width="100" align="center">
                            <template #default="{ row }">
                                {{ row.duration }}秒
                            </template>
                        </el-table-column>
                        <el-table-column label="通过率" width="200">
                            <template #default="{ row }">
                                <el-progress 
                                    :percentage="row.passRate"
                                    :status="getProgressStatus(row.passRate)"
                                />
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="160" fixed="right">
                            <template #default="{ row }">
                                <div class="table-actions">
                                    <el-tooltip content="查看报告" placement="top">
                                        <el-button 
                                            type="primary" 
                                            @click="viewReport(row)"
                                            :icon="Document"
                                            circle
                                            size="small"
                                        />
                                    </el-tooltip>
                                    <el-tooltip content="删除报告" placement="top">
                                        <el-button 
                                            type="danger" 
                                            @click="deleteReport(row)"
                                            :icon="Delete"
                                            circle
                                            size="small"
                                        />
                                    </el-tooltip>
                                </div>
                            </template>
                        </el-table-column>
                    </el-table>
                    
                    <!-- 分页控件 -->
                    <div class="pagination-container">
                        <el-pagination
                            v-model:current-page="currentPage"
                            :page-size="pageSize"
                            :total="testReports.length"
                            layout="total, prev, pager, next"
                            @current-change="handlePageChange"
                        />
                    </div>
                </div>
            </el-card>

            <!-- 测试套件配置对话框 -->
            <el-dialog
                :title="dialogTitle"
                v-model="showSuiteDialog"
                width="90%"
                :close-on-click-modal="false"
                @closed="resetSuiteForm"
                class="suite-dialog"
            >
                <el-form :model="suiteForm" :rules="suiteRules" ref="suiteFormRef" label-width="100px">
                    <!-- 基本信息区域 -->
                    <div class="basic-info-section">
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item label="套件名称" prop="name">
                                    <el-input v-model="suiteForm.name" placeholder="请输入测试套件名称" />
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item label="执行环境" prop="envId">
                                    <el-select 
                                        v-model="suiteForm.envId" 
                                        placeholder="请选择执行环境套" 
                                        style="width: 100%"
                                        filterable
                                        clearable
                                    >
                                        <el-option 
                                            v-for="env in environments" 
                                            :key="env.id" 
                                            :label="env.name" 
                                            :value="env.id"
                                        >
                                            <div class="env-option">
                                                <span class="env-name">{{ env.name }}</span>
                                                <span class="env-desc" v-if="env.description">{{ env.description }}</span>
                                            </div>
                                        </el-option>
                                    </el-select>
                                    <div v-if="environments.length === 0" class="no-env-tip">
                                        <el-alert
                                            title="未找到环境套配置"
                                            type="warning"
                                            :closable="false"
                                            show-icon
                                        >
                                            <template #default>
                                                请先在 <el-link type="primary" @click="goToEnvSettings">环境配置</el-link> 中添加环境套
                                            </template>
                                        </el-alert>
                                    </div>
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-form-item label="描述" prop="description">
                            <el-input 
                                v-model="suiteForm.description" 
                                type="textarea" 
                                :rows="3"
                                placeholder="请输入测试套件描述"
                            />
                        </el-form-item>
                    </div>

                    <!-- 用例选择区域 -->
                    <div class="case-selection-section">
                        <div class="section-title">测试用例配置</div>
                        <el-row :gutter="20">
                            <!-- 左侧可选用例列表 -->
                            <el-col :span="12">
                                <div class="case-list-container">
                                    <div class="list-header">
                                        <div class="header-left">
                                            <span class="title">可选用例</span>
                                            <el-tag type="info">{{ filteredAvailableCases.length }}个用例</el-tag>
                                        </div>
                                        <el-input
                                            v-model="searchQuery"
                                            placeholder="搜索用例"
                                            prefix-icon="Search"
                                            clearable
                                            class="search-input"
                                        />
                                    </div>
                                    <el-scrollbar>
                                        <draggable
                                            :list="filteredAvailableCases"
                                            :group="{ name: 'cases', pull: 'clone', put: false }"
                                            :clone="cloneCase"
                                            item-key="case_id"
                                            :sort="false"
                                            ghost-class="ghost"
                                            chosen-class="chosen"
                                            @end="handleDragEnd"
                                        >
                                            <template #item="{ element }">
                                                <div class="case-item">
                                                    <div class="case-main">
                                                        <el-tag 
                                                            size="small" 
                                                            :type="getMethodType(element.method)" 
                                                            class="method-tag"
                                                        >
                                                            {{ element.method }}
                                                        </el-tag>
                                                        <span class="case-title" @click.stop="editCase(element, index)">{{ element.title }}</span>
                                                        <el-tag 
                                                            size="small" 
                                                            :type="getPriorityType(element.priority)"
                                                            class="priority-tag"
                                                        >
                                                            {{ element.priority }}
                                                        </el-tag>
                                                    </div>
                                                    <div class="case-info">
                                                        <span class="api-path">{{ element.api_path }}</span>
                                                        <div class="case-meta">
                                                            <span class="meta-item">
                                                                <el-icon><User /></el-icon>
                                                                {{ element.creator?.username || '未知' }}
                                                            </span>
                                                            <span class="meta-item">
                                                                <el-icon><Timer /></el-icon>
                                                                {{ formatDate(element.create_time) }}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </template>
                                        </draggable>
                                    </el-scrollbar>
                                </div>
                            </el-col>

                            <!-- 右侧测试流程列表 -->
                            <el-col :span="12">
                                <div class="case-list-container">
                                    <div class="list-header">
                                        <div class="header-left">
                                            <span class="title">测试流程</span>
                                            <el-tag type="success">{{ suiteForm.selectedCases.length }}个用例</el-tag>
                                        </div>
                                        <el-button 
                                            type="danger" 
                                            size="small" 
                                            plain
                                            @click="clearSelectedCases"
                                            :disabled="!suiteForm.selectedCases.length"
                                        >
                                            清空
                                        </el-button>
                                    </div>
                                    <el-scrollbar>
                                        <draggable
                                            v-model="suiteForm.selectedCases"
                                            :group="{ name: 'cases', put: true }"
                                            item-key="case_id"
                                            ghost-class="ghost"
                                            chosen-class="chosen"
                                            handle=".drag-handle"
                                            @change="handleSelectedCasesChange"
                                        >
                                            <template #item="{ element, index }">
                                                <div class="case-item selected">
                                                    <div class="case-main">
                                                        <el-icon class="drag-handle"><Rank /></el-icon>
                                                        <span class="case-order">#{{ index + 1 }}</span>
                                                        <el-tag 
                                                            size="small" 
                                                            :type="getMethodType(element.method)"
                                                            class="method-tag"
                                                        >
                                                            {{ element.method }}
                                                        </el-tag>
                                                        <span class="case-title" @click.stop="editCase(element, index)">{{ element.title }}</span>
                                                    </div>
                                                    <div class="case-actions">
                                                        <el-button
                                                            type="danger"
                                                            size="small"
                                                            circle
                                                            plain
                                                            :icon="Delete"
                                                            @click="removeSelectedCase(index)"
                                                        />
                                                    </div>
                                                </div>
                                            </template>
                                        </draggable>
                                    </el-scrollbar>
                                </div>
                            </el-col>
                        </el-row>
                    </div>
                </el-form>

                <template #footer>
                    <div class="dialog-footer">
                        <el-button @click="showSuiteDialog = false">取消</el-button>
                        <el-button type="primary" @click="saveSuite">确定</el-button>
                    </div>
                </template>
            </el-dialog>

            <!-- 测试报告详情对话框 -->
            <el-dialog
                title="测试报告详情"
                v-model="showReportDialog"
                width="80%"
                class="report-dialog"
            >
                <div class="report-content" v-if="currentReport">
                    <div class="report-header">
                        <div class="report-title-row">
                            <h2>{{ currentReport.suiteName }} - 测试报告</h2>
                            <el-button type="primary" @click="viewExecutionLog(currentReport)" size="small">
                                <el-icon><Document /></el-icon> 查看执行日志
                            </el-button>
                        </div>
                        <div class="report-meta">
                            <div class="meta-item">
                                <span class="label">执行时间：</span>
                                <span>{{ formatDate(currentReport.executionTime) }}</span>
                            </div>
                            <div class="meta-item">
                                <span class="label">总耗时：</span>
                                <span>{{ currentReport.duration }}秒</span>
                            </div>
                            <div class="meta-item">
                                <span class="label">执行环境：</span>
                                <span>{{ currentReport.environment }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="report-summary">
                        <el-row :gutter="20">
                            <el-col :span="6">
                                <div class="summary-card total">
                                    <div class="number">{{ currentReport.totalCases }}</div>
                                    <div class="label">总用例数</div>
                                </div>
                            </el-col>
                            <el-col :span="6">
                                <div class="summary-card passed">
                                    <div class="number">{{ currentReport.passedCases }}</div>
                                    <div class="label">通过用例数</div>
                                </div>
                            </el-col>
                            <el-col :span="6">
                                <div class="summary-card failed">
                                    <div class="number">{{ currentReport.failedCases }}</div>
                                    <div class="label">失败用例数</div>
                                </div>
                            </el-col>
                            <el-col :span="6">
                                <div class="summary-card rate">
                                    <div class="number">{{ currentReport.passRate }}%</div>
                                    <div class="label">通过率</div>
                                </div>
                            </el-col>
                        </el-row>
                    </div>

                    <!-- 添加变量展示部分 -->
                    <div class="variables-section" v-if="currentReport.variables && Object.keys(currentReport.variables).length > 0">
                        <h3>测试变量</h3>
                        <el-table :data="Object.entries(currentReport.variables).map(([key, value]) => ({key, value}))" border>
                            <el-table-column prop="key" label="变量名" width="200" />
                            <el-table-column prop="value" label="变量值" />
                        </el-table>
                    </div>

                    <div class="case-details">
                        <h3>用例执行详情</h3>
                        <el-table :data="currentReport.caseResults" border>
                            <el-table-column prop="title" label="用例名称" min-width="200" />
                            <el-table-column prop="api" label="接口" min-width="200">
                                <template #default="{ row }">
                                    <div class="api-info">
                                        <el-tag :type="getMethodType(row.method)" size="small">
                                            {{ row.method }}
                                        </el-tag>
                                        <span>{{ row.api }}</span>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="duration" label="耗时" width="100" align="center">
                                <template #default="{ row }">
                                    {{ row.duration }}ms
                                </template>
                            </el-table-column>
                            <el-table-column label="状态" width="100" align="center">
                                <template #default="{ row }">
                                    <el-tag :type="getStatusType(row.status)">
                                        {{ row.status }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="详细信息" min-width="200">
                                <template #default="{ row }">
                                    <div v-if="row.message">
                                        <el-tooltip 
                                            v-if="isJsonString(row.message)" 
                                            placement="top" 
                                            :content="'查看完整详情'" 
                                            :show-after="300"
                                        >
                                            <div class="formatted-message" @click="showMessageDetail(row.message)">
                                                {{ getFormattedMessage(row.message, true) }}
                                            </div>
                                        </el-tooltip>
                                        <span v-else>{{ row.message }}</span>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="120" align="center">
                                <template #default="{ row }">
                                    <el-button 
                                        type="primary" 
                                        size="small" 
                                        @click="viewCaseResponse(row)"
                                        :icon="Document"
                                        circle
                                    />
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                </div>
            </el-dialog>

            <!-- 响应数据对话框 -->
            <el-dialog
                v-model="showResponseDialog"
                title="测试结果详情"
                width="80%"
                class="response-dialog"
                append-to-body
            >
                <el-tabs v-model="responseTabActive">
                    <el-tab-pane label="响应数据" name="response">
                        <div class="response-toolbar">
                            <el-button 
                                size="small" 
                                @click="toggleFormatResponse"
                                :icon="formatResponseActive ? Check : MagicStick"
                                type="primary"
                            >
                                {{ formatResponseActive ? '已格式化' : '格式化JSON' }}
                            </el-button>
                            <el-button size="small" @click="copyToClipboard(parsedResponseData)" icon="CopyDocument">
                                复制
                            </el-button>
                        </div>
                        <div class="json-viewer-container">
                            <pre v-if="parsedResponseData" class="json-viewer json-text" :class="{'formatted': formatResponseActive}">{{ formatResponseActive ? (typeof parsedResponseData === 'string' ? parsedResponseData : JSON.stringify(parsedResponseData, null, 2)) : (typeof parsedResponseData === 'string' ? parsedResponseData : JSON.stringify(parsedResponseData)) }}</pre>
                            <el-empty v-else description="无响应数据" />
                        </div>
                    </el-tab-pane>
                    
                    <el-tab-pane label="请求数据" name="request">
                        <div class="response-toolbar">
                            <el-button 
                                size="small" 
                                @click="toggleFormatRequest"
                                :icon="formatRequestActive ? Check : MagicStick"
                                type="primary"
                            >
                                {{ formatRequestActive ? '已格式化' : '格式化JSON' }}
                            </el-button>
                            <el-button size="small" @click="copyToClipboard(parsedRequestData)" icon="CopyDocument">
                                复制
                            </el-button>
                        </div>
                        <div class="json-viewer-container">
                            <pre v-if="parsedRequestData" class="json-viewer json-text" :class="{'formatted': formatRequestActive}">{{ formatRequestActive ? (typeof parsedRequestData === 'string' ? parsedRequestData : JSON.stringify(parsedRequestData, null, 2)) : (typeof parsedRequestData === 'string' ? parsedRequestData : JSON.stringify(parsedRequestData)) }}</pre>
                            <el-empty v-else description="无请求数据" />
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </el-dialog>

            <!-- 用例编辑弹窗 -->
            <el-dialog
                title="编辑测试用例"
                v-model="showCaseEditDialog"
                width="80%"
                :close-on-click-modal="false"
                class="case-edit-dialog"
                append-to-body
            >
                <el-form :model="caseEditForm" label-width="120px" class="test-case-edit-form">
                    <el-row :gutter="20">
                        <el-col :span="16">
                            <el-form-item label="用例名称" required>
                                <el-input v-model="caseEditForm.title" placeholder="请输入用例名称" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item label="请求方法" required>
                                <el-select v-model="caseEditForm.method" class="full-width">
                                    <el-option label="GET" value="GET" />
                                    <el-option label="POST" value="POST" />
                                    <el-option label="PUT" value="PUT" />
                                    <el-option label="DELETE" value="DELETE" />
                                    <el-option label="PATCH" value="PATCH" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                    </el-row>
                    
                    <el-form-item label="接口路径" required>
                        <el-input 
                            v-model="caseEditForm.api_path" 
                            placeholder="请输入接口路径，例如: /api/users?id=1" 
                            @input="autoExtractQueryParams"
                        />
                        <div class="form-item-tip">
                            <el-icon><InfoFilled /></el-icon>
                            <span>支持URL参数自动提取，URL中的查询参数会自动填充到请求参数中</span>
                        </div>
                    </el-form-item>
                    
                    <el-tabs type="border-card" class="request-tabs">
                        <el-tab-pane label="请求头">
                            <el-form-item class="no-margin">
                                <el-input
                                    v-model="caseEditForm.headers"
                                    type="textarea"
                                    :rows="6"
                                    placeholder="请输入请求头 (JSON格式)"
                                    class="code-textarea"
                                />
                                <div class="form-item-tip">
                                    <el-icon><Document /></el-icon>
                                    <span>格式示例: {"Content-Type": "application/json", "Authorization": "Bearer ${token}"}</span>
                                </div>
                            </el-form-item>
                        </el-tab-pane>
                        
                        <el-tab-pane label="请求参数">
                            <el-form-item class="no-margin">
                                <!-- 参数类型选择 -->
                                <div class="param-type-selector">
                                    <el-radio-group v-model="paramType" size="small" @change="handleParamTypeChange">
                                        <el-radio-button label="query">查询参数</el-radio-button>
                                        <el-radio-button label="form">表单参数</el-radio-button>
                                        <el-radio-button label="json">JSON参数</el-radio-button>
                                        <el-radio-button label="none">无参数</el-radio-button>
                                    </el-radio-group>
                                </div>

                                <!-- 不同参数类型的输入区域 -->
                                <!-- 查询参数 -->
                                <div v-if="paramType === 'query'" class="params-container">
                                    <div class="params-header">
                                        <div class="param-row header">
                                            <div class="param-name">参数名</div>
                                            <div class="param-value">参数值</div>
                                            <div class="param-desc">描述</div>
                                            <div class="param-action">操作</div>
                                        </div>
                                    </div>
                                    <div class="params-body">
                                        <div v-for="(param, index) in queryParams" :key="index" class="param-row">
                                            <div class="param-name">
                                                <el-input v-model="param.key" placeholder="参数名" size="default" />
                                            </div>
                                            <div class="param-value">
                                                <el-input v-model="param.value" placeholder="参数值" size="default" />
                                            </div>
                                            <div class="param-desc">
                                                <el-input v-model="param.description" placeholder="描述(可选)" size="default" />
                                            </div>
                                            <div class="param-action">
                                                <el-button type="danger" @click="removeParam('query', index)" :icon="Delete" circle size="small"></el-button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="add-param-btn">
                                        <el-button type="primary" @click="addParam('query')" plain :icon="Plus" size="small">添加参数</el-button>
                                    </div>
                                </div>

                                <!-- 表单参数 -->
                                <div v-if="paramType === 'form'" class="params-container">
                                    <div class="params-header">
                                        <div class="param-row header">
                                            <div class="param-name">参数名</div>
                                            <div class="param-value">参数值</div>
                                            <div class="param-desc">描述</div>
                                            <div class="param-action">操作</div>
                                        </div>
                                    </div>
                                    <div class="params-body">
                                        <div v-for="(param, index) in formParams" :key="index" class="param-row">
                                            <div class="param-name">
                                                <el-input v-model="param.key" placeholder="参数名" size="default" />
                                            </div>
                                            <div class="param-value">
                                                <el-input v-model="param.value" placeholder="参数值" size="default" />
                                            </div>
                                            <div class="param-desc">
                                                <el-input v-model="param.description" placeholder="描述(可选)" size="default" />
                                            </div>
                                            <div class="param-action">
                                                <el-button type="danger" @click="removeParam('form', index)" :icon="Delete" circle size="small"></el-button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="add-param-btn">
                                        <el-button type="primary" @click="addParam('form')" plain :icon="Plus" size="small">添加参数</el-button>
                                    </div>
                                </div>

                                <!-- JSON参数 -->
                                <div v-if="paramType === 'json'" class="params-container">
                                    <el-input
                                        v-model="jsonParams"
                                        type="textarea"
                                        :rows="10"
                                        placeholder="请输入JSON格式参数"
                                        class="code-textarea"
                                    />
                                </div>
                                
                                <div v-if="paramType !== 'none'" class="form-item-tip">
                                    <el-icon><InfoFilled /></el-icon>
                                    <span>
                                        {{ 
                                            paramType === 'query' ? 'GET请求通常使用查询参数，这些参数会附加到URL中' : 
                                            paramType === 'form' ? '表单参数通常用于POST请求，Content-Type为application/x-www-form-urlencoded' : 
                                            '对于JSON参数，Content-Type为application/json'
                                        }}
                                    </span>
                                </div>
                            </el-form-item>
                        </el-tab-pane>
                        
                        <el-tab-pane label="预期结果">
                            <el-form-item class="no-margin">
                                <el-input
                                    v-model="caseEditForm.expected"
                                    type="textarea"
                                    :rows="8"
                                    placeholder="请输入预期结果 (JSON格式)"
                                    class="code-textarea"
                                />
                                <div class="form-item-tip">
                                    <el-icon><CircleCheck /></el-icon>
                                    <span>用于验证响应结果，可以指定部分字段进行验证，例如: {"code": 200, "message": "success"}</span>
                                </div>
                            </el-form-item>
                        </el-tab-pane>
                    </el-tabs>
                    
                    <!-- 优化提取器配置部分 -->
                    <el-divider content-position="left">
                        <el-tooltip content="提取器可以从响应中提取数据作为变量，在后续用例中使用" placement="top">
                            <div class="divider-title">
                                <el-icon><MagicStick /></el-icon>
                                <span>提取器配置</span>
                            </div>
                        </el-tooltip>
                    </el-divider>
                    
                    <div class="extractors-container">
                        <div class="help-card">
                            <el-alert
                                type="info"
                                :closable="false"
                                show-icon
                            >
                                <template #title>
                                    <div class="help-title">提取器使用说明</div>
                                </template>
                                <div class="help-content">
                                    <p><b>作用</b>：从当前接口响应中提取数据，并在后续接口中使用</p>
                                    <p><b>变量使用</b>：在URL、请求参数或请求头中使用 <code>${变量名}</code> 格式引用变量</p>
                                    <p><b>JSONPath示例</b>：</p>
                                    <ul>
                                        <li><code>$.data.id</code> - 提取data对象中的id字段</li>
                                        <li><code>$.data.list[0].name</code> - 提取data.list数组第一项的name字段</li>
                                        <li><code>$.data.items[*].id</code> - 提取所有items的id字段数组</li>
                                    </ul>
                                </div>
                            </el-alert>
                        </div>
                        
                        <div class="extractors-list">
                            <div v-for="(extractor, index) in caseEditForm.extractors" :key="index" class="extractor-item">
                                <el-card shadow="hover">
                                    <el-row :gutter="10">
                                        <el-col :span="7">
                                            <el-form-item label="变量名" class="no-margin">
                                                <el-input v-model="extractor.name" placeholder="变量名 (如: userId)" size="default" />
                                            </el-form-item>
                                        </el-col>
                                        <el-col :span="14">
                                            <el-form-item label="JSONPath表达式" class="no-margin">
                                                <el-input v-model="extractor.jsonPath" placeholder="JSONPath表达式 (如: $.data.id)" size="default" />
                                            </el-form-item>
                                        </el-col>
                                        <el-col :span="3" class="flex-center">
                                            <el-button type="danger" @click="removeExtractor(index)" :icon="Delete" circle></el-button>
                                        </el-col>
                                    </el-row>
                                </el-card>
                            </div>
                            
                            <div class="add-extractor" v-if="caseEditForm.extractors.length === 0">
                                <el-empty description="暂无提取器配置">
                                    <el-button type="primary" @click="addExtractor" :icon="Plus">添加提取器</el-button>
                                </el-empty>
                            </div>
                            <div class="add-extractor-btn" v-else>
                                <el-button type="primary" @click="addExtractor" :icon="Plus">添加提取器</el-button>
                            </div>
                        </div>
                    </div>
                </el-form>
                <template #footer>
                    <div class="dialog-footer">
                        <el-button @click="showCaseEditDialog = false">取消</el-button>
                        <el-button type="primary" @click="saveCase">保存</el-button>
                    </div>
                </template>
            </el-dialog>

            <!-- 执行日志对话框 -->
            <el-dialog
                title="执行日志"
                v-model="showLogDialog"
                width="85%"
                class="log-dialog"
                append-to-body
                fullscreen
            >
                <div class="log-content" v-if="currentExecutionLog">
                    <!-- 执行概览 -->
                    <div class="log-overview">
                        <el-row :gutter="20">
                            <el-col :span="8">
                                <div class="overview-item">
                                    <span class="label">执行时间:</span>
                                    <span>{{ currentExecutionLog.execution_time }}</span>
                                </div>
                            </el-col>
                            <el-col :span="8">
                                <div class="overview-item">
                                    <span class="label">总耗时:</span>
                                    <span>{{ currentExecutionLog.duration }}秒</span>
                                </div>
                            </el-col>
                            <el-col :span="8">
                                <div class="overview-item">
                                    <span class="label">执行环境:</span>
                                    <span>{{ currentExecutionLog.environment?.name || '默认环境' }}</span>
                                </div>
                            </el-col>
                        </el-row>
                        
                        <el-row :gutter="20" class="stats-row">
                            <el-col :span="6">
                                <div class="stat-card total">
                                    <div class="stat-number">{{ getCurrentTotalCases() }}</div>
                                    <div class="stat-label">总用例数</div>
                                </div>
                            </el-col>
                            <el-col :span="6">
                                <div class="stat-card passed">
                                    <div class="stat-number">{{ getPassedCases() }}</div>
                                    <div class="stat-label">通过用例数</div>
                                </div>
                            </el-col>
                            <el-col :span="6">
                                <div class="stat-card failed">
                                    <div class="stat-number">{{ getFailedCases() }}</div>
                                    <div class="stat-label">失败/错误用例数</div>
                                </div>
                            </el-col>
                            <el-col :span="6">
                                <div class="stat-card rate">
                                    <div class="stat-number">{{ getPassRate() }}</div>
                                    <div class="stat-label">通过率</div>
                                </div>
                            </el-col>
                        </el-row>
                        
                        <div class="log-message" v-if="currentExecutionLog.log_detail">
                            <el-alert
                                :title="currentExecutionLog.log_detail"
                                :type="getLogAlertType()"
                                :closable="false"
                                show-icon
                            />
                        </div>
                        
                        <div class="log-error" v-if="currentExecutionLog.error_message">
                            <el-alert
                                :title="currentExecutionLog.error_message"
                                type="error"
                                :closable="false"
                                show-icon
                            />
                        </div>
                    </div>
                    
                    <!-- 测试用例详情 -->
                    <div class="cases-detail" v-if="currentExecutionLog.response && currentExecutionLog.response.body">
                        <h3>测试用例执行详情</h3>
                        
                        <el-collapse accordion>
                            <el-collapse-item v-for="(caseItem, index) in currentExecutionLog.response.body" :key="index" 
                                :title="`${index + 1}. ${caseItem.title} (${caseItem.method} ${caseItem.api_path})`"
                                :name="index"
                                :class="{'error-case': caseItem.status === 'ERROR' || caseItem.status === 'FAIL'}"
                            >
                                <template #extra>
                                    <el-tag :type="getCaseStatusType(caseItem.status)" size="small">
                                        {{ caseItem.status }}
                                    </el-tag>
                                    <span class="case-duration">{{ caseItem.duration }}秒</span>
                                </template>
                                
                                <el-tabs>
                                    <el-tab-pane label="请求详情">
                                        <div class="detail-section">
                                            <div class="detail-item">
                                                <div class="detail-label">请求URL:</div>
                                                <div class="detail-value">{{ caseItem.api_path }}</div>
                                            </div>
                                            <div class="detail-item">
                                                <div class="detail-label">请求方法:</div>
                                                <div class="detail-value">{{ caseItem.method }}</div>
                                            </div>
                                            
                                            <div class="detail-item" v-if="caseItem.request && caseItem.request.headers">
                                                <div class="detail-label">请求头:</div>
                                                <div class="detail-value">
                                                    <el-button size="small" @click="toggleJsonFormat(index, 'reqHeaders')" type="info" plain>
                                                        {{ isJsonFormatted(index, 'reqHeaders') ? '收起' : '展开格式化' }}
                                                    </el-button>
                                                    <pre v-if="isJsonFormatted(index, 'reqHeaders')" class="json-text">{{ formatRawJson(caseItem.request.headers) }}</pre>
                                                    <div v-else class="truncated-json">{{ JSON.stringify(caseItem.request.headers) }}</div>
                                                </div>
                                            </div>
                                            
                                            <div class="detail-item" v-if="caseItem.request && (caseItem.request.body || caseItem.request.params)">
                                                <div class="detail-label">请求参数:</div>
                                                <div class="detail-value">
                                                    <el-button size="small" @click="toggleJsonFormat(index, 'reqBody')" type="info" plain>
                                                        {{ isJsonFormatted(index, 'reqBody') ? '收起' : '展开格式化' }}
                                                    </el-button>
                                                    <pre v-if="isJsonFormatted(index, 'reqBody')" class="json-text">{{ formatRawJson(caseItem.request.body || caseItem.request.params) }}</pre>
                                                    <div v-else class="truncated-json">{{ JSON.stringify(caseItem.request.body || caseItem.request.params) }}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </el-tab-pane>
                                    
                                    <el-tab-pane label="响应详情">
                                        <div class="detail-section">
                                            <div class="detail-item" v-if="caseItem.response && caseItem.response.status_code !== undefined">
                                                <div class="detail-label">状态码:</div>
                                                <div class="detail-value">{{ caseItem.response.status_code }}</div>
                                            </div>
                                            
                                            <div class="detail-item" v-if="caseItem.response && caseItem.response.headers">
                                                <div class="detail-label">响应头:</div>
                                                <div class="detail-value">
                                                    <el-button size="small" @click="toggleJsonFormat(index, 'respHeaders')" type="info" plain>
                                                        {{ isJsonFormatted(index, 'respHeaders') ? '收起' : '展开格式化' }}
                                                    </el-button>
                                                    <pre v-if="isJsonFormatted(index, 'respHeaders')" class="json-text">{{ formatRawJson(caseItem.response.headers) }}</pre>
                                                    <div v-else class="truncated-json">{{ JSON.stringify(caseItem.response.headers) }}</div>
                                                </div>
                                            </div>
                                            
                                            <div class="detail-item" v-if="caseItem.response && caseItem.response.body">
                                                <div class="detail-label">响应体:</div>
                                                <div class="detail-value">
                                                    <el-button size="small" @click="toggleJsonFormat(index, 'respBody')" type="info" plain>
                                                        {{ isJsonFormatted(index, 'respBody') ? '收起' : '展开格式化' }}
                                                    </el-button>
                                                    <pre v-if="isJsonFormatted(index, 'respBody')" class="json-text">{{ formatRawJson(caseItem.response.body) }}</pre>
                                                    <div v-else class="truncated-json">{{ JSON.stringify(caseItem.response.body) }}</div>
                                                </div>
                                            </div>
                                            
                                            <div class="detail-item error-item" v-if="caseItem.error">
                                                <div class="detail-label">错误信息:</div>
                                                <div class="detail-value error-message">
                                                    <el-tooltip 
                                                        v-if="isJsonString(caseItem.error)" 
                                                        placement="top" 
                                                        :content="'查看完整错误'" 
                                                        :show-after="300"
                                                    >
                                                        <div class="formatted-message error-link" @click="showMessageDetail(caseItem.error)">
                                                            {{ getFormattedMessage(caseItem.error, true) }}
                                                        </div>
                                                    </el-tooltip>
                                                    <span v-else>{{ caseItem.error }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </el-tab-pane>
                                    
                                    <el-tab-pane label="变量提取" v-if="caseItem.extractors && caseItem.extractors.extracted_variables">
                                        <div class="detail-section">
                                            <div class="detail-item">
                                                <div class="detail-label">提取变量:</div>
                                                <div class="detail-value">
                                                    <el-button size="small" @click="toggleJsonFormat(index, 'extractors')" type="info" plain>
                                                        {{ isJsonFormatted(index, 'extractors') ? '收起' : '展开格式化' }}
                                                    </el-button>
                                                    <pre v-if="isJsonFormatted(index, 'extractors')" class="json-text">{{ formatRawJson(caseItem.extractors.extracted_variables) }}</pre>
                                                    <div v-else class="truncated-json">{{ JSON.stringify(caseItem.extractors.extracted_variables) }}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </el-tab-pane>
                                </el-tabs>
                            </el-collapse-item>
                        </el-collapse>
                    </div>
                </div>
                <div v-else class="empty-log">
                    <el-empty description="暂无执行日志" />
                </div>
            </el-dialog>
            
            <!-- 消息详情对话框 -->
            <el-dialog
                v-model="showMessageDetailDialog"
                title="详细信息"
                width="60%"
                class="message-detail-dialog"
                append-to-body
            >
                <pre class="formatted-json">{{ currentMessageDetail }}</pre>
            </el-dialog>
        </PageContainer>
    </Home>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';
import Home from '@/components/HomePage.vue';
import { 
    Plus, 
    VideoPlay, 
    Edit, 
    Delete, 
    Document,
    Folder,
    Search,
    Rank,
    User,
    Timer,
    Stopwatch,
    Monitor,
    Refresh,
    Check,
    MagicStick,
    CopyDocument,
    InfoFilled,
    CircleCheck
} from '@element-plus/icons-vue';
import axios from 'axios';
import draggable from 'vuedraggable/src/vuedraggable';

const router = useRouter();
const route = useRoute();

// 项目信息
const projectId = ref(route.query.projectId);
const projectName = ref(route.query.projectName || '未知项目');

// 测试套件相关数据
const testSuites = ref([]);
const selectedSuites = ref([]);
const showSuiteDialog = ref(false);
const dialogTitle = ref('新建测试套件');
const suiteFormRef = ref(null);
const currentEditingSuiteId = ref(null);

// 测试套件表单
const suiteForm = ref({
    name: '',
    description: '',
    envId: '',
    selectedCases: []
});

// 环境和用例数据
const environments = ref([]);
const availableCases = ref([]);
const loading = ref(false);

// 测试报告相关数据
const testReports = ref([]);
const showReportDialog = ref(false);
const currentReport = ref(null);
const selectedReports = ref([]); // 添加存储选中的报告数组

// 表单验证规则
const suiteRules = {
    name: [
        { required: true, message: '请输入套件名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    envId: [
        { required: true, message: '请选择执行环境', trigger: 'change' }
    ]
};

// 添加搜索和过滤相关的响应式数据
const searchQuery = ref('')
const filteredAvailableCases = computed(() => {
    // 先过滤掉已选择的用例
    const unusedCases = availableCases.value.filter(availableCase => 
        !suiteForm.value.selectedCases.some(selectedCase => 
            selectedCase.case_id === availableCase.case_id ||
            selectedCase.case_id.startsWith(availableCase.case_id + '_')
        )
    );
    
    // 再根据搜索条件过滤
    if (!searchQuery.value) {
        return unusedCases;
    }
    
    const query = searchQuery.value.toLowerCase();
    return unusedCases.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.path?.toLowerCase().includes(query) ||
        item.method?.toLowerCase().includes(query)
    );
});

// 过滤可用用例
const filterAvailableCases = () => {
    // 使用计算属性，不需要在这里实现
};

// 克隆用例方法
const cloneCase = (item) => {
    console.log('Cloning case:', item);
    return {
        ...JSON.parse(JSON.stringify(item)),
        case_id: `${item.case_id}_${Date.now()}`,
        _isClone: true,
        original_id: item.case_id // 保存原始ID，用于恢复显示
    };
};

// 处理拖拽结束
const handleDragEnd = (evt) => {
    console.log('Drag end:', evt);
};

// 处理已选用例变化
const handleSelectedCasesChange = (evt) => {
    console.log('Selection change:', evt);
    if (evt.added) {
        // 添加用例
        const addedCase = evt.added.element;
        console.log('Added case:', addedCase);
        // 确保不重复添加相同的用例
        if (!suiteForm.value.selectedCases.some(c => c.case_id === addedCase.case_id)) {
            ElMessage.success('用例添加成功');
        }
    } else if (evt.removed) {
        // 移除用例 - 不需要特殊处理，因为计算属性会自动更新可用列表
        console.log('Removed case:', evt.removed.element);
        ElMessage.success('用例移除成功');
    } else if (evt.moved) {
        // 调整顺序
        console.log('Moved case:', evt.moved);
        ElMessage.success('用例顺序已更新');
    }
};

// 移除选中的用例
const removeSelectedCase = (index) => {
    suiteForm.value.selectedCases.splice(index, 1);
    ElMessage.success('用例已移除');
};

// 清空选中的用例
const clearSelectedCases = () => {
    ElMessageBox.confirm('确定要清空所有已选用例吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        suiteForm.value.selectedCases = [];
        ElMessage.success('已清空所有用例');
    }).catch(() => {});
};

// 重置表单时清空选中的用例
const resetSuiteForm = () => {
    suiteForm.value = {
        name: '',
        description: '',
        envId: '',
        selectedCases: []
    };
    currentEditingSuiteId.value = null; // 确保重置表单时清空当前编辑的套件ID
};

// 监听选中用例的变化
watch(() => suiteForm.value.selectedCases, (newValue) => {
    console.log('Selected cases changed:', newValue);
}, { deep: true });

// 监听搜索词变化
watch(searchQuery, () => {
    filterAvailableCases()
})

// 初始化过滤后的用例列表
onMounted(() => {
    filteredAvailableCases.value = availableCases.value
})

// 获取测试套件列表
const fetchTestSuites = async () => {
    const projectId = route.query.projectId;
    if (!projectId) {
        ElMessage.warning('请先选择项目');
        return;
    }
    
    loading.value = true;
    try {
        const response = await axios.get(
            `http://localhost:8081/api/suite/list/${projectId}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        if (response.data.code === 200) {
            // 处理响应数据，添加selected属性用于多选
            testSuites.value = response.data.data.suites.map(suite => ({
                ...suite,
                id: suite.suite_id, // 确保id字段存在，映射suite_id到id
                selected: false,
                executing: false,
                // 确保环境ID信息被正确映射，优先使用environment_cover_id
                env_id: suite.environment_cover_id || suite.env_id
            }));
            
            // 确保环境数据已加载
            if (environments.value.length === 0) {
                await fetchEnvironments();
            } else {
                // 如果环境已加载，直接更新环境名称
                updateSuiteEnvironmentNames();
            }
            
            console.log('Fetched test suites:', testSuites.value);
        } else {
            throw new Error(response.data.message || '获取测试套件失败');
        }
    } catch (error) {
        console.error('获取测试套件失败:', error);
        ElMessage.error('获取测试套件失败，请检查网络连接');
    } finally {
        loading.value = false;
    }
};

// 更新测试套件的环境名称
const updateSuiteEnvironmentNames = () => {
    if (environments.value.length === 0 || testSuites.value.length === 0) return;
    
    console.log('正在更新套件环境名称，环境列表:', environments.value);
    console.log('套件列表:', testSuites.value);
    
    // 创建环境ID到名称的映射
    const envMap = {};
    environments.value.forEach(env => {
        envMap[env.id] = env.name;
    });
    
    // 更新每个套件的环境名称
    testSuites.value.forEach(suite => {
        // 优先使用environment_cover_id作为环境ID
        const envId = suite.environment_cover_id || suite.env_id;
        console.log(`套件[${suite.name}]的环境ID: ${envId}, 映射的环境名称: ${envMap[envId] || '默认环境'}`);
        suite.env_name = envMap[envId] || '默认环境';
    });
};

// 当环境列表加载完成后更新套件的环境名称
watch(() => environments.value, () => {
    updateSuiteEnvironmentNames();
}, { immediate: true });

// 获取环境列表
const fetchEnvironments = async () => {
    const projectId = route.query.projectId;
    if (!projectId) {
        ElMessage.warning('请先选择项目');
        return;
    }
    
    try {
        const response = await axios.get(
            `http://localhost:8081/api/env-suite/list/${projectId}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        console.log('环境列表响应:', response.data);

        if (response.data.code === 200) {
            // 根据实际返回的数据结构进行映射
            environments.value = response.data.data.items.map(env => ({
                id: env.id,
                name: env.name,
                description: env.description || '',
                create_time: env.create_time,
                update_time: env.update_time
            }));
            
            console.log('解析后的环境列表:', environments.value);
            
            // 如果已经加载了测试套件，则更新环境名称
            if (testSuites.value.length > 0) {
                updateSuiteEnvironmentNames();
            }
        } else {
            throw new Error(response.data.message || '获取环境列表失败');
        }
    } catch (error) {
        console.error('获取环境套列表失败:', error);
        ElMessage.error('获取环境套列表失败，请检查网络连接');
    }
};

// 获取测试用例列表
const fetchTestCases = async () => {
    const projectId = route.query.projectId;
    if (!projectId) {
        ElMessage.warning('请先选择项目');
        return;
    }

    loading.value = true;
    try {
        const response = await fetch(`http://localhost:8081/api/testcase/list/${projectId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();
        if (data.code === 200) {
            // 确保每个用例都有唯一的 case_id
            availableCases.value = data.data.testCases.map(item => ({
                ...item,
                case_id: item.case_id.toString()
            }));
        } else {
            ElMessage.error(data.message || '获取测试用例失败');
        }
    } catch (error) {
        console.error('获取测试用例失败:', error);
        ElMessage.error('获取测试用例失败');
    } finally {
        loading.value = false;
    }
};

// 获取请求方法对应的类型
const getMethodType = (method) => {
    const methodMap = {
        'GET': 'success',
        'POST': 'primary',
        'PUT': 'warning',
        'DELETE': 'danger',
        'PATCH': 'info'
    };
    return methodMap[method?.toUpperCase()] || 'info';
};

// 在组件挂载时获取测试用例
onMounted(() => {
    fetchTestCases();
});

// 监听路由参数变化，当项目ID变化时重新获取用例
watch(
    () => route.query.projectId,
    (newProjectId) => {
        if (newProjectId) {
            fetchTestCases();
        } else {
            availableCases.value = [];
        }
    }
);

// 创建新的测试套件
const createNewSuite = async () => {
    dialogTitle.value = '新建测试套件';
    resetSuiteForm();
    currentEditingSuiteId.value = null; // 清空编辑ID，表示这是新建操作
    
    // 确保环境数据已加载
    if (environments.value.length === 0) {
        await fetchEnvironments();
    }
    
    showSuiteDialog.value = true;
};

// 保存测试套件
const saveSuite = async () => {
    if (!suiteFormRef.value) return;
    
    await suiteFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                // 显示加载状态
                const loadingInstance = ElLoading.service({
                    lock: true,
                    text: currentEditingSuiteId.value ? '更新中...' : '创建中...',
                    background: 'rgba(0, 0, 0, 0.7)'
                });
                
                let response;
                const requestData = {
                    ...suiteForm.value,
                    project_id: projectId.value,
                    environment_cover_id: suiteForm.value.envId // 添加environment_cover_id字段
                };
                
                try {
                    // 根据是否有currentEditingSuiteId决定是更新还是创建
                    if (currentEditingSuiteId.value) {
                        // 更新测试套件
                        console.log('更新测试套件:', currentEditingSuiteId.value, requestData);
                        response = await axios.put(
                            `http://localhost:8081/api/suite/update/${currentEditingSuiteId.value}`,
                            requestData,
                            {
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                }
                            }
                        );
                    } else {
                        // 创建测试套件
                        console.log('创建测试套件:', requestData);
                        response = await axios.post(
                            'http://localhost:8081/api/suite/create',
                            requestData,
                            {
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                }
                            }
                        );
                    }
                    
                    if (response.data.code === 200) {
                        ElMessage.success(currentEditingSuiteId.value ? '测试套件更新成功' : '测试套件创建成功');
                        showSuiteDialog.value = false;
                        // 重置当前编辑的套件ID
                        currentEditingSuiteId.value = null;
                        // 刷新测试套件列表并确保环境名称正确显示
                        await fetchTestSuites();
                    } else {
                        throw new Error(response.data.message || '操作失败');
                    }
                } finally {
                    loadingInstance.close();
                }
            } catch (error) {
                console.error('保存测试套件失败:', error);
                ElMessage.error(`${currentEditingSuiteId.value ? '更新' : '创建'}测试套件失败: ${error.message || '未知错误'}`);
            }
        }
    });
};

// 执行测试套件
const runSuite = async (suite) => {
    try {
        suite.executing = true;
        // 确保suite.id存在，如果不存在则尝试使用suite_id
        const suiteId = suite.id || suite.suite_id;
        
        if (!suiteId) {
            ElMessage.error('测试套件ID不存在');
            return;
        }
        
        // 显示加载中状态
        const loadingInstance = ElLoading.service({
            lock: true,
            text: '执行测试套件中...',
            background: 'rgba(0, 0, 0, 0.7)'
        });
        
        try {
            // 先获取测试套件详情，确保有最新的用例数据
            const detailResponse = await axios.get(
                `http://localhost:8081/api/suite/detail/${suiteId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            
            if (detailResponse.data.code !== 200) {
                throw new Error('获取测试套件详情失败');
            }
            
            const suiteDetail = detailResponse.data.data;
            console.log('获取到的测试套件详情:', suiteDetail);
            
            // 发送执行测试套件请求，添加启用提取器的参数和完整的用例数据
            const response = await axios.post(
                `http://localhost:8081/api/suite/execute/${suiteId}`,
                { 
                    enable_extractors: true, // 启用提取器功能
                    env_id: suiteDetail.env_id,
                    cases: suiteDetail.cases // 传递完整的用例数据
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.code === 200) {
                ElMessage.success('测试套件执行成功');
                // 刷新测试报告列表
                fetchTestReports();
            } else {
                throw new Error(response.data.message || '执行测试套件失败');
            }
        } finally {
            loadingInstance.close();
        }
    } catch (error) {
        console.error('执行测试套件失败:', error);
        ElMessage.error('执行测试套件失败: ' + (error.message || '未知错误'));
    } finally {
        suite.executing = false;
    }
};

// 执行选中的测试套件
const runSelectedSuite = async () => {
    const selectedSuitesList = testSuites.value.filter(suite => suite.selected);
    
    if (selectedSuitesList.length === 0) {
        ElMessage.warning('请先选择要执行的测试套件');
        return;
    }
    
    try {
        for (const suite of selectedSuitesList) {
            await runSuite(suite);
        }
        ElMessage.success(`${selectedSuitesList.length}个测试套件执行完成`);
    } catch (error) {
        console.error('批量执行测试套件失败:', error);
        ElMessage.error('批量执行测试套件失败');
    }
};

// 获取测试报告列表
const fetchTestReports = async () => {
    try {
        const response = await axios.get(
            `http://localhost:8081/api/report/list/${projectId.value}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        if (response.data.code === 200) {
            // 修改这里以正确获取报告列表数据
            testReports.value = response.data.data.reports || [];
            console.log('获取到的测试报告列表:', testReports.value);
        }
    } catch (error) {
        console.error('获取测试报告失败:', error);
        ElMessage.error('获取测试报告失败');
    }
};

// 查看测试报告
const viewReport = async (report) => {
    try {
        const response = await axios.get(
            `http://localhost:8081/api/report/detail/${report.id}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        if (response.data.code === 200) {
            currentReport.value = response.data.data;
            showReportDialog.value = true;
        }
    } catch (error) {
        console.error('获取报告详情失败:', error);
        ElMessage.error('获取报告详情失败');
    }
};

// 查看测试套件的最新执行结果
const viewSuiteResults = async (suite) => {
    try {
        // 先查找这个测试套件的最新报告
        const suiteId = suite.id || suite.suite_id;
        
        if (!suiteId) {
            ElMessage.error('测试套件ID不存在');
            return;
        }
        
        // 显示加载中提示
        const loadingInstance = ElLoading.service({
            lock: true,
            text: '加载执行结果中...',
            background: 'rgba(0, 0, 0, 0.7)'
        });
        
        try {
            const response = await axios.get(
                `http://localhost:8081/api/report/latest/${suiteId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            
            if (response.data.code === 200) {
                if (response.data.data) {
                    currentReport.value = response.data.data;
                    showReportDialog.value = true;
                } else {
                    ElMessage.info('该测试套件暂无执行结果');
                }
            } else {
                throw new Error(response.data.message || '获取执行结果失败');
            }
        } finally {
            // 关闭加载提示
            loadingInstance.close();
        }
    } catch (error) {
        console.error('获取测试套件执行结果失败:', error);
        ElMessage.error('获取测试套件执行结果失败');
    }
};

// 编辑测试套件
const editSuite = async (suite) => {
    dialogTitle.value = '编辑测试套件';
    
    // 确保环境数据已加载
    if (environments.value.length === 0) {
        await fetchEnvironments();
    }
    
    // 填充表单数据
    const suiteId = suite.id || suite.suite_id;
    
    try {
        const response = await axios.get(
            `http://localhost:8081/api/suite/detail/${suiteId}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );
        
        if (response.data.code === 200) {
            const suiteData = response.data.data;
            console.log('获取到的套件详情:', suiteData); // 添加日志
            suiteForm.value = {
                name: suiteData.name,
                description: suiteData.description || '',
                // 优先使用environment_cover_id，如果不存在再使用env_id
                envId: suiteData.environment_cover_id || suiteData.env_id,
                selectedCases: suiteData.cases?.map(c => ({
                    ...c,
                    case_id: c.case_id.toString(), // 确保case_id是字符串类型
                    method: c.method || 'GET',     // 确保method字段存在
                    priority: c.priority || '中',   // 确保priority字段存在
                    api_path: c.api_path || ''     // 确保api_path字段存在
                })) || []
            };
            
            currentEditingSuiteId.value = suiteId;
            
            showSuiteDialog.value = true;
        } else {
            throw new Error(response.data.message || '获取测试套件详情失败');
        }
    } catch (error) {
        console.error('获取测试套件详情失败:', error);
        ElMessage.error('获取测试套件详情失败');
    }
};

// 工具方法
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

// 获取状态类型
const getStatusType = (status) => {
    const statusMap = {
        'pass': 'success',
        'fail': 'danger',
        'not_run': 'info',
        '通过': 'success',
        '失败': 'danger',
        '未执行': 'info'
    };
    return statusMap[status] || 'info';
};

const getResultType = (result) => {
    return result === '通过' ? 'success' : 'danger';
};

const getProgressStatus = (rate) => {
    if (rate >= 90) return 'success';
    if (rate >= 60) return 'warning';
    return 'exception';
};

// 在组件挂载时获取测试套件和报告
onMounted(async () => {
    // 先加载环境列表，确保在获取测试套件时能正确显示环境名称
    await fetchEnvironments(); 
    await fetchTestSuites();
    await fetchTestReports(); 
    console.log('组件挂载完成，环境列表:', environments.value);
});

// 获取优先级对应的类型
const getPriorityType = (priority) => {
    const types = {
        '高': 'danger',
        '中': 'warning',
        '低': 'info'
    };
    return types[priority] || 'info';
};

// 获取状态文本
const getStatusText = (status) => {
    const statusText = {
        'pass': '通过',
        'fail': '失败',
        'not_run': '未执行',
        '通过': '通过',
        '失败': '失败',
        '未执行': '未执行'
    };
    return statusText[status] || status;
};

// 更新套件选择状态
const updateSuiteSelection = () => {
    // 实现更新套件选择状态的逻辑
    console.log('已选择的测试套件:', testSuites.value.filter(suite => suite.selected));
};

// 添加跳转到环境设置的方法
const goToEnvSettings = () => {
    const projectId = route.query.projectId;
    const projectName = route.query.projectName;
    showSuiteDialog.value = false; // 关闭当前对话框
    
    // 跳转到测试用例页面，因为环境配置在那里
    router.push({
        path: '/testcases',
        query: { 
            projectId,
            projectName
        }
    });
    
    // 提示用户如何添加环境套
    ElMessage({
        message: '请在测试用例页面点击"新建环境套"按钮添加环境',
        type: 'info',
        duration: 5000
    });
};

// 添加分页相关的响应式数据
const currentPage = ref(1);
const pageSize = ref(5);
const paginatedReports = computed(() => {
    const startIndex = (currentPage.value - 1) * pageSize.value;
    return testReports.value.slice(startIndex, startIndex + pageSize.value);
});

// 添加处理分页变化的逻辑
const handlePageChange = (newPage) => {
    currentPage.value = newPage;
};

// 添加删除报告的逻辑
const deleteReport = async (report) => {
    try {
        // 添加确认对话框
        await ElMessageBox.confirm(
            `确定要删除"${report.suiteName}"的测试报告吗？此操作不可恢复。`,
            '删除确认',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );
        
        const response = await axios.delete(
            `http://localhost:8081/api/report/delete/${report.id}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        if (response.data.code === 200) {
            ElMessage.success('报告删除成功');
            // 如果删除后当前页没有数据了，且不是第一页，则跳转到前一页
            if (paginatedReports.value.length === 1 && currentPage.value > 1) {
                currentPage.value--;
            }
            await fetchTestReports();
        }
    } catch (error) {
        if (error === 'cancel') {
            // 用户取消删除操作
            return;
        }
        console.error('删除报告失败:', error);
        ElMessage.error('删除报告失败');
    }
};

// 添加删除测试套件的逻辑
const deleteSuite = async (suite) => {
    try {
        // 添加确认对话框
        await ElMessageBox.confirm(
            `确定要删除测试套件"${suite.name}"吗？此操作不可恢复，且会同时删除该套件的所有测试报告。`,
            '删除确认',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );
        
        // 显示加载中状态
        const loadingInstance = ElLoading.service({
            lock: true,
            text: '删除中...',
            background: 'rgba(0, 0, 0, 0.7)'
        });
        
        try {
            // 获取套件ID
            const suiteId = suite.id || suite.suite_id;
            
            if (!suiteId) {
                throw new Error('测试套件ID不存在');
            }
            
            // 调用删除接口
            const response = await axios.delete(
                `http://localhost:8081/api/suite/delete/${suiteId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.code === 200) {
                ElMessage.success('测试套件删除成功');
                // 重新获取测试套件列表
                await fetchTestSuites();
                // 更新测试报告列表
                await fetchTestReports();
            } else {
                throw new Error(response.data.message || '删除测试套件失败');
            }
        } finally {
            loadingInstance.close();
        }
    } catch (error) {
        if (error === 'cancel') {
            // 用户取消删除操作
            return;
        }
        console.error('删除测试套件失败:', error);
        ElMessage.error('删除测试套件失败: ' + (error.message || '未知错误'));
    }
};

// 添加用例编辑弹窗和相关变量
const showCaseEditDialog = ref(false);
const caseEditForm = ref({
    title: '',
    method: 'GET',
    api_path: '',
    headers: '',
    params: '',
    expected: '',
    case_id: '',
    index: -1, // 用于跟踪正在编辑的用例索引
    extractors: [] // 添加提取器数组
});

// 添加提取器的方法
const addExtractor = () => {
    // 确保extractors是一个数组
    if (!caseEditForm.value.extractors) {
        caseEditForm.value.extractors = [];
    } else if (!Array.isArray(caseEditForm.value.extractors)) {
        console.warn('extractors 不是数组类型，重置为空数组');
        caseEditForm.value.extractors = [];
    }
    
    caseEditForm.value.extractors.push({
        name: '',
        jsonPath: '', // 使用jsonPath与验证逻辑一致
        type: 'json'
    });
};

// 移除提取器的方法
const removeExtractor = (index) => {
    caseEditForm.value.extractors.splice(index, 1);
};

// 实现编辑用例的方法
const saveCase = async () => {
    try {
        // 验证表单数据
        if (!caseEditForm.value.title) {
            ElMessage.warning('用例名称不能为空');
            return;
        }

        const index = caseEditForm.value.index;
        if (index === -1) {
            ElMessage.error('无法确定要编辑的用例');
            return;
        }

        // 保存当前参数到caseEditForm.params
        try {
            saveCurrentParams();
        } catch (e) {
            return; // 参数格式错误，提前返回
        }

        // 验证提取器配置
        const invalidExtractors = caseEditForm.value.extractors.filter(
            e => (e.name && !e.jsonPath) || (!e.name && e.jsonPath)
        );
        
        if (invalidExtractors.length > 0) {
            ElMessage.warning('提取器配置不完整，请填写变量名和JSONPath');
            return;
        }

        // 构建更新的用例数据
        const updatedCase = {
            ...suiteForm.value.selectedCases[index],
            title: caseEditForm.value.title,
            method: caseEditForm.value.method,
            api_path: caseEditForm.value.api_path,
            // 转换JSON字符串为对象
            headers: caseEditForm.value.headers ? JSON.parse(caseEditForm.value.headers) : {},
            // 将params中的数据解析为body字段
            body: caseEditForm.value.params ? JSON.parse(caseEditForm.value.params) : {},
            params: {}, // 清空params
            expected: caseEditForm.value.expected ? JSON.parse(caseEditForm.value.expected) : {},
            extractors: caseEditForm.value.extractors // 保存提取器配置
        };

        // 调用后端更新接口
        const loadingInstance = ElLoading.service({
            lock: true,
            text: '正在保存...',
            background: 'rgba(0, 0, 0, 0.7)'
        });

        try {
            // 获取原始用例ID
            const originalCaseId = caseEditForm.value.case_id;
            // 如果ID包含下划线，说明是克隆的用例，需要从selectedCases中找回原始ID
            const caseId = originalCaseId.includes('_') 
                ? suiteForm.value.selectedCases[index].original_id || originalCaseId.split('_')[0]
                : originalCaseId;

            console.log('更新用例ID:', caseId, '更新数据:', updatedCase);

            // 调用后端接口更新用例
            const response = await axios.put(
                `http://localhost:8081/api/testcase/update/${caseId}`,
                {
                    title: updatedCase.title,
                    method: updatedCase.method,
                    api_path: updatedCase.api_path,
                    headers: updatedCase.headers,
                    params: updatedCase.params,
                    body: updatedCase.body,
                    expected: updatedCase.expected,
                    extractors: updatedCase.extractors, // 添加提取器配置
                    suite_id: currentEditingSuiteId.value // 添加当前编辑的测试套件ID
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.code === 200) {
                // 更新前端用例列表
                suiteForm.value.selectedCases.splice(index, 1, updatedCase);
                ElMessage.success('用例更新成功');
                showCaseEditDialog.value = false;
            } else {
                throw new Error(response.data.message || '更新用例失败');
            }
        } finally {
            loadingInstance.close();
        }
    } catch (error) {
        console.error('保存用例失败:', error);
        ElMessage.error('保存失败: ' + (error.message || '参数格式错误'));
    }
};

// 添加编辑用例的方法
const editCase = (caseItem, index) => {
    // 调试日志
    console.log('editCase方法被调用，用例数据:', caseItem, '索引:', index);
    
    // 确保extractors是一个数组
    let extractors = [];
    if (caseItem.extractors && Array.isArray(caseItem.extractors)) {
        extractors = caseItem.extractors;
    } else if (caseItem.extractors) {
        console.warn('extractors 不是数组类型:', caseItem.extractors);
    }
    
    // 处理参数数据，确保是有效的JSON字符串
    let paramsData = '';
    if (caseItem.body && Object.keys(caseItem.body).length > 0) {
        // 如果body是对象，转为JSON字符串
        if (typeof caseItem.body === 'object') {
            paramsData = JSON.stringify(caseItem.body, null, 2);
        } else if (typeof caseItem.body === 'string') {
            // 如果已经是字符串，确保是有效的JSON
            try {
                // 尝试解析再格式化，确保格式正确
                const parsed = JSON.parse(caseItem.body);
                paramsData = JSON.stringify(parsed, null, 2);
            } catch (e) {
                // 如果解析失败，直接使用字符串
                paramsData = caseItem.body;
            }
        }
    } else if (caseItem.params) {
        // 同样处理params
        if (typeof caseItem.params === 'object') {
            paramsData = JSON.stringify(caseItem.params, null, 2);
        } else if (typeof caseItem.params === 'string') {
            try {
                const parsed = JSON.parse(caseItem.params);
                paramsData = JSON.stringify(parsed, null, 2);
            } catch (e) {
                paramsData = caseItem.params;
            }
        }
    }
    
    // 填充表单数据
    caseEditForm.value = {
        title: caseItem.title || '',
        method: caseItem.method || 'GET',
        api_path: caseItem.api_path || '',
        headers: caseItem.headers ? JSON.stringify(caseItem.headers, null, 2) : '',
        params: paramsData,
        expected: caseItem.expected ? JSON.stringify(caseItem.expected, null, 2) : '',
        case_id: caseItem.case_id,
        index: index,
        extractors: extractors // 使用确保是数组的extractors
    };

    // 初始化参数类型相关数据
    initParamData();

    // 打开编辑弹窗
    showCaseEditDialog.value = true;
    console.log('弹窗状态:', showCaseEditDialog.value);
    
    // 确保在DOM更新后弹窗正确显示
    setTimeout(() => {
        if (!showCaseEditDialog.value) {
            console.log('尝试再次打开弹窗');
            showCaseEditDialog.value = true;
        }
    }, 100);
};

// 处理参数类型变化
const handleParamTypeChange = (type) => {
    if (type === paramType.value) return;
    
    try {
        // 在切换类型前，保存当前参数到caseEditForm.params
        saveCurrentParams();
        
        // 切换到新类型后，从caseEditForm.params加载参数
        loadParamsFromForm();
    } catch (error) {
        console.error('切换参数类型失败:', error);
        ElMessage.warning('切换参数类型时出现错误，部分数据可能没有正确保存');
    }
};

// 初始化参数数据
const initParamData = () => {
    // 根据请求方法设置默认参数类型
    if (caseEditForm.value.method === 'GET') {
        paramType.value = 'query';
    } else {
        paramType.value = 'json';
    }
    
    // 加载参数数据
    loadParamsFromForm();
};

// 保存当前参数到caseEditForm.params
const saveCurrentParams = () => {
    let paramsValue = null;
    
    if (paramType.value === 'query') {
        // 查询参数转换为对象
        paramsValue = {};
        queryParams.value.forEach(param => {
            if (param.key) {
                paramsValue[param.key] = param.value;
            }
        });
    } else if (paramType.value === 'form') {
        // 表单参数转换为对象
        paramsValue = {};
        formParams.value.forEach(param => {
            if (param.key) {
                paramsValue[param.key] = param.value;
            }
        });
    } else if (paramType.value === 'json') {
        // JSON参数直接使用
        try {
            if (jsonParams.value) {
                paramsValue = JSON.parse(jsonParams.value);
            } else {
                paramsValue = {};
            }
        } catch (e) {
            console.error('解析JSON参数失败:', e);
            ElMessage.warning('JSON格式不正确，请检查');
            throw e;
        }
    } else {
        // 无参数
        paramsValue = {};
    }
    
    // 更新caseEditForm.params
    caseEditForm.value.params = JSON.stringify(paramsValue, null, 2);
};

// 从caseEditForm.params加载参数
const loadParamsFromForm = () => {
    let params = {};
    
    try {
        if (caseEditForm.value.params) {
            params = JSON.parse(caseEditForm.value.params);
            
            // 检查params是否是字符串，如果是，尝试再次解析
            if (typeof params === 'string') {
                try {
                    params = JSON.parse(params);
                } catch (e) {
                    // 如果还是无法解析，则创建一个包含该字符串的临时对象
                    params = { "value": params };
                }
            }
            
            // 确保params是一个对象
            if (typeof params !== 'object' || params === null || Array.isArray(params)) {
                params = {};
            }
        }
    } catch (e) {
        console.error('解析参数失败:', e);
        params = {};
    }
    
    if (paramType.value === 'query') {
        // 将对象转换为查询参数数组
        queryParams.value = Object.entries(params).map(([key, value]) => ({
            key,
            value: String(value),
            description: ''
        }));
        
        // 如果没有参数，添加一个空行
        if (queryParams.value.length === 0) {
            addParam('query');
        }
    } else if (paramType.value === 'form') {
        // 将对象转换为表单参数数组
        formParams.value = Object.entries(params).map(([key, value]) => ({
            key,
            value: String(value),
            description: ''
        }));
        
        // 如果没有参数，添加一个空行
        if (formParams.value.length === 0) {
            addParam('form');
        }
    } else if (paramType.value === 'json') {
        // 将对象转换为格式化的JSON字符串
        jsonParams.value = JSON.stringify(params, null, 2);
    }
};

// 添加参数
const addParam = (type) => {
    if (type === 'query') {
        queryParams.value.push({
            key: '',
            value: '',
            description: ''
        });
    } else if (type === 'form') {
        formParams.value.push({
            key: '',
            value: '',
            description: ''
        });
    }
};

// 删除参数
const removeParam = (type, index) => {
    if (type === 'query') {
        queryParams.value.splice(index, 1);
    } else if (type === 'form') {
        formParams.value.splice(index, 1);
    }
};

// 计算属性 - 是否有选中的测试套件
const hasSelectedSuites = computed(() => {
    return testSuites.value.some(suite => suite.selected);
});

// 计算属性 - 是否有选中的测试报告
const hasSelectedReports = computed(() => {
    return selectedReports.value.length > 0;
});

// 处理报告选择变化
const handleReportSelectionChange = (selection) => {
    selectedReports.value = selection;
    console.log('已选择的报告:', selectedReports.value);
};

// 批量删除测试报告
const deleteSelectedReports = async () => {
    if (selectedReports.value.length === 0) {
        ElMessage.warning('请先选择要删除的报告');
        return;
    }

    try {
        await ElMessageBox.confirm(
            `确定要删除选中的 ${selectedReports.value.length} 个测试报告吗？此操作不可恢复。`,
            '批量删除确认',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );

        // 显示加载状态
        const loadingInstance = ElLoading.service({
            lock: true,
            text: '批量删除中...',
            background: 'rgba(0, 0, 0, 0.7)'
        });

        try {
            // 并行删除所有选中的报告
            const deletePromises = selectedReports.value.map(report => 
                axios.delete(
                    `http://localhost:8081/api/report/delete/${report.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                )
            );

            const results = await Promise.allSettled(deletePromises);
            
            // 检查删除结果
            const successCount = results.filter(result => result.status === 'fulfilled' && result.value.data.code === 200).length;
            const failCount = selectedReports.value.length - successCount;

            if (successCount > 0) {
                ElMessage.success(`成功删除 ${successCount} 个报告`);
                // 刷新报告列表
                await fetchTestReports();
                // 清空选中
                selectedReports.value = [];
            }

            if (failCount > 0) {
                ElMessage.warning(`${failCount} 个报告删除失败`);
            }
        } finally {
            loadingInstance.close();
        }
    } catch (error) {
        if (error === 'cancel') {
            // 用户取消删除操作
            return;
        }
        console.error('批量删除报告失败:', error);
        ElMessage.error('批量删除报告失败');
    }
};

// 批量删除测试套件
const deleteSelectedSuites = async () => {
    const selectedSuitesList = testSuites.value.filter(suite => suite.selected);
    
    if (selectedSuitesList.length === 0) {
        ElMessage.warning('请先选择要删除的测试套件');
        return;
    }

    try {
        await ElMessageBox.confirm(
            `确定要删除选中的 ${selectedSuitesList.length} 个测试套件吗？此操作不可恢复，且会同时删除相关的测试报告。`,
            '批量删除确认',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );

        // 显示加载状态
        const loadingInstance = ElLoading.service({
            lock: true,
            text: '批量删除中...',
            background: 'rgba(0, 0, 0, 0.7)'
        });

        try {
            // 并行删除所有选中的测试套件
            const deletePromises = selectedSuitesList.map(suite => {
                const suiteId = suite.id || suite.suite_id;
                if (!suiteId) {
                    return Promise.reject(new Error(`套件 ${suite.name} 的 ID 不存在`));
                }
                
                return axios.delete(
                    `http://localhost:8081/api/suite/delete/${suiteId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );
            });

            const results = await Promise.allSettled(deletePromises);
            
            // 检查删除结果
            const successCount = results.filter(result => result.status === 'fulfilled' && result.value.data.code === 200).length;
            const failCount = selectedSuitesList.length - successCount;

            if (successCount > 0) {
                ElMessage.success(`成功删除 ${successCount} 个测试套件`);
                // 刷新测试套件列表
                await fetchTestSuites();
                // 刷新测试报告列表
                await fetchTestReports();
            }

            if (failCount > 0) {
                ElMessage.warning(`${failCount} 个测试套件删除失败`);
            }
        } finally {
            loadingInstance.close();
        }
    } catch (error) {
        if (error === 'cancel') {
            // 用户取消删除操作
            return;
        }
        console.error('批量删除测试套件失败:', error);
        ElMessage.error('批量删除测试套件失败: ' + (error.message || '未知错误'));
    }
};

// 添加响应数据详情对话框和相关变量
const showResponseDialog = ref(false);
const currentCaseResponse = ref(null);
const responseTabActive = ref('request');
const parsedRequestData = ref(null);
const parsedResponseData = ref(null);
const formatRequestActive = ref(false);
const formatResponseActive = ref(false);

// 添加执行日志对话框和相关变量
const showLogDialog = ref(false);
const currentExecutionLog = ref('');
const formattedSections = ref({}); // 存储各部分是否格式化

// 实现查看响应数据的方法
const viewCaseResponse = (caseResult) => {
    try {
        currentCaseResponse.value = caseResult;
        
        // 解析请求数据
        if (caseResult.requestData) {
            try {
                // 尝试确定是否已经是对象
                if (typeof caseResult.requestData === 'object' && caseResult.requestData !== null) {
                    parsedRequestData.value = caseResult.requestData;
                } else {
                    // 首先尝试作为JSON字符串解析
                    parsedRequestData.value = JSON.parse(caseResult.requestData);
                }
            } catch (e) {
                // 如果解析失败，尝试修复格式问题
                try {
                    // 检查是否为JavaScript对象字符串表示
                    const isObjectStr = /^\s*\{.*\}\s*$/.test(caseResult.requestData);
                    if (isObjectStr) {
                        // 尝试进行JSON修复
                        const fixedJson = caseResult.requestData
                            .replace(/'/g, '"')
                            .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
                        
                        parsedRequestData.value = JSON.parse(fixedJson);
                    } else {
                        // 如果还是失败，尝试eval (仅用于前端显示，不要用于执行代码)
                        try {
                            // 注意：这是不安全的，但在受控环境中仅用于显示数据可以考虑
                            parsedRequestData.value = eval('(' + caseResult.requestData + ')');
                        } catch (evalError) {
                            // 最后，如果所有尝试都失败，将其作为字符串显示
                            parsedRequestData.value = caseResult.requestData;
                        }
                    }
                } catch (error) {
                    console.error('解析请求数据失败:', error);
                    parsedRequestData.value = caseResult.requestData;
                }
            }
        } else {
            parsedRequestData.value = null;
        }
        
        // 解析响应数据
        if (caseResult.responseData) {
            try {
                // 尝试确定是否已经是对象
                if (typeof caseResult.responseData === 'object' && caseResult.responseData !== null) {
                    parsedResponseData.value = caseResult.responseData;
                } else {
                    // 首先尝试作为JSON字符串解析
                    parsedResponseData.value = JSON.parse(caseResult.responseData);
                }
            } catch (e) {
                // 如果解析失败，尝试修复格式问题
                try {
                    // 检查是否为JavaScript对象字符串表示
                    const isObjectStr = /^\s*\{.*\}\s*$/.test(caseResult.responseData);
                    if (isObjectStr) {
                        // 尝试进行JSON修复
                        const fixedJson = caseResult.responseData
                            .replace(/'/g, '"')
                            .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
                        
                        parsedResponseData.value = JSON.parse(fixedJson);
                    } else {
                        // 如果还是失败，尝试eval (仅用于前端显示，不要用于执行代码)
                        try {
                            // 注意：这是不安全的，但在受控环境中仅用于显示数据可以考虑
                            parsedResponseData.value = eval('(' + caseResult.responseData + ')');
                        } catch (evalError) {
                            // 最后，如果所有尝试都失败，将其作为字符串显示
                            parsedResponseData.value = caseResult.responseData;
                        }
                    }
                } catch (error) {
                    console.error('解析响应数据失败:', error);
                    parsedResponseData.value = caseResult.responseData;
                }
            }
        } else {
            parsedResponseData.value = null;
        }
        
        // 默认显示响应数据标签页
        responseTabActive.value = 'response';
        
        // 默认开启格式化显示
        formatRequestActive.value = true;
        formatResponseActive.value = true;
        
        showResponseDialog.value = true;
    } catch (error) {
        console.error('处理响应数据失败:', error);
        ElMessage.error('处理响应数据失败');
    }
};

// 格式化JSON数据
const formatJson = (data) => {
    try {
        // 检查数据类型
        if (data === null || data === undefined) {
            return '空数据';
        }
        
        // 如果已经是字符串，尝试解析为JSON
        if (typeof data === 'string') {
            try {
                // 检查是否本身是JSON字符串
                if ((/^\s*[\{\[]/.test(data) && /[\}\]]\s*$/.test(data)) || 
                    /^".*"$/.test(data) || 
                    /^-?\d+(\.\d+)?$/.test(data) || 
                    /^(true|false)$/.test(data) || 
                    data === 'null') {
                    
                    // 尝试解析JSON字符串
                    data = JSON.parse(data);
                } else {
                    // 不是JSON格式字符串，原样返回并进行HTML转义
                    return String(data)
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#039;');
                }
            } catch (e) {
                // 解析失败，尝试修复JSON格式
                try {
                    // 检查是否为JavaScript对象字符串表示
                    const isObjectStr = /^\s*\{.*\}\s*$/.test(data);
                    if (isObjectStr) {
                        // 尝试修复常见的JSON格式问题
                        const fixedJson = data
                            .replace(/'/g, '"')
                            .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
                        
                        data = JSON.parse(fixedJson);
                    } else {
                        // 如果还是无法解析，原样返回并进行HTML转义
                        return String(data)
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;')
                            .replace(/'/g, '&#039;');
                    }
                } catch (error) {
                    // 所有尝试都失败，原样返回并进行HTML转义
                    return String(data)
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#039;');
                }
            }
        }
        
        // 此时data应该是一个对象，进行格式化
        const formatted = JSON.stringify(data, null, 2);
        
        // 将HTML标签和特殊字符转义，防止被浏览器解析为HTML
        const escaped = formatted
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // 简单的语法高亮处理
        return escaped.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            function (match) {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            }
        );
    } catch (error) {
        console.error('格式化JSON失败:', error);
        // 返回转义后的字符串
        return String(data)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};

// 添加格式化请求和响应数据的逻辑
const toggleFormatRequest = () => {
    formatRequestActive.value = !formatRequestActive.value;
};

const toggleFormatResponse = () => {
    formatResponseActive.value = !formatResponseActive.value;
};

// 添加复制到剪贴板的逻辑
const copyToClipboard = (data) => {
    if (data) {
        try {
            // 根据当前标签页的格式化状态决定复制格式化或非格式化的JSON
            let textToCopy;
            if (responseTabActive.value === 'request') {
                textToCopy = formatRequestActive.value ? formatJson(data) : unformattedJson(data);
            } else {
                textToCopy = formatResponseActive.value ? formatJson(data) : unformattedJson(data);
            }
            
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    ElMessage.success('数据已复制到剪贴板');
                })
                .catch(err => {
                    console.error('复制失败:', err);
                    
                    // 降级方案
                    const textArea = document.createElement('textarea');
                    textArea.value = textToCopy;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    ElMessage.success('数据已复制到剪贴板');
                });
        } catch (error) {
            console.error('复制失败:', error);
            ElMessage.error('复制失败');
        }
    } else {
        ElMessage.warning('没有可复制的数据');
    }
};

// 添加未格式化的JSON字符串逻辑
const unformattedJson = (data) => {
    try {
        // 检查数据类型
        if (data === null || data === undefined) {
            return '空数据';
        }
        
        // 如果是字符串，检查是否是JSON字符串
        if (typeof data === 'string') {
            try {
                // 验证是否为有效的JSON字符串
                JSON.parse(data);
                // 如果有效，直接返回这个字符串，但需要进行HTML转义
                return String(data)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
            } catch (e) {
                // 不是有效的JSON字符串，直接进行HTML转义返回
                return String(data)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
            }
        }
        
        // 如果是对象，转换为JSON字符串并转义
        const jsonString = JSON.stringify(data);
        return jsonString
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    } catch (error) {
        console.error('处理JSON字符串失败:', error);
        // 出错时返回转义后的原始数据
        return String(data)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};

// 获取测试用例总数
const getCurrentTotalCases = () => {
    if (!currentExecutionLog.value || !currentExecutionLog.value.response || !currentExecutionLog.value.response.body) {
        return 0;
    }
    return currentExecutionLog.value.response.body.length;
};

// 获取通过的测试用例数
const getPassedCases = () => {
    if (!currentExecutionLog.value || !currentExecutionLog.value.response || !currentExecutionLog.value.response.body) {
        return 0;
    }
    return currentExecutionLog.value.response.body.filter(item => item.status === 'PASS').length;
};

// 获取失败的测试用例数
const getFailedCases = () => {
    if (!currentExecutionLog.value || !currentExecutionLog.value.response || !currentExecutionLog.value.response.body) {
        return 0;
    }
    return currentExecutionLog.value.response.body.filter(item => item.status === 'FAIL' || item.status === 'ERROR').length;
};

// 获取通过率
const getPassRate = () => {
    if (!currentExecutionLog.value || !currentExecutionLog.value.response || !currentExecutionLog.value.response.headers) {
        return '0%';
    }
    return currentExecutionLog.value.response.headers.pass_rate || '0%';
};

// 获取日志提示类型
const getLogAlertType = () => {
    if (!currentExecutionLog.value) return 'info';
    
    const passRate = parseFloat(getPassRate());
    if (passRate === 100) return 'success';
    if (passRate >= 60) return 'warning';
    return 'error';
};

// 获取测试用例状态类型
const getCaseStatusType = (status) => {
    const statusMap = {
        'PASS': 'success',
        'FAIL': 'danger',
        'ERROR': 'danger',
        'SKIP': 'info'
    };
    return statusMap[status] || 'info';
};

// 切换JSON格式化状态
const toggleJsonFormat = (caseIndex, section) => {
    const key = `${caseIndex}_${section}`;
    if (!formattedSections.value[key]) {
        formattedSections.value[key] = true;
    } else {
        formattedSections.value[key] = !formattedSections.value[key];
    }
};

// 检查是否已格式化
const isJsonFormatted = (caseIndex, section) => {
    const key = `${caseIndex}_${section}`;
    return !!formattedSections.value[key];
};

// 查看执行日志的函数
const viewExecutionLog = async (report) => {
    try {
        // 显示加载中提示
        const loadingInstance = ElLoading.service({
            lock: true,
            text: '加载执行日志中...',
            background: 'rgba(0, 0, 0, 0.7)'
        });
        
        try {
            const response = await axios.get(
                `http://localhost:8081/api/log/${report.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            
            if (response.data.code === 200) {
                // 直接将完整的日志对象保存，不再仅保存字符串
                currentExecutionLog.value = response.data.data;
                
                // 重置格式化状态
                formattedSections.value = {};
                
                // 打开日志对话框
                showLogDialog.value = true;
            } else {
                throw new Error(response.data.message || '获取执行日志失败');
            }
        } finally {
            // 关闭加载提示
            loadingInstance.close();
        }
    } catch (error) {
        console.error('获取执行日志失败:', error);
        ElMessage.error('获取执行日志失败: ' + (error.message || '未知错误'));
    }
};

// 添加新的辅助函数，用于测试执行日志中的JSON格式化显示
const formatRawJson = (data) => {
    try {
        if (data === null || data === undefined) {
            return '空数据';
        }
        
        // 如果是字符串，尝试解析为JSON对象
        if (typeof data === 'string') {
            try {
                return JSON.stringify(JSON.parse(data), null, 2);
            } catch (e) {
                // 如果解析失败，可能是普通字符串，直接返回
                return data;
            }
        }
        
        // 如果是对象，直接格式化
        return JSON.stringify(data, null, 2);
    } catch (error) {
        console.error('JSON格式化失败:', error);
        // 出错时返回原始内容
        return String(data);
    }
};

// 添加到script setup部分（其他ref定义的地方）
const showMessageDetailDialog = ref(false);
const currentMessageDetail = ref('');

// 添加到其他函数后面
// 检查字符串是否为JSON
const isJsonString = (str) => {
    if (!str || typeof str !== 'string') return false;
    try {
        // 检查是否包含典型的JSON结构（{} 或 [] 开头结尾）
        // 或者含有Unicode转义序列 \u
        return (
            (/^\s*[\{\[]/.test(str) && /[\}\]]\s*$/.test(str)) || 
            /\\u[\da-f]{4}/i.test(str)
        );
    } catch (e) {
        return false;
    }
};

// 格式化消息文本
const getFormattedMessage = (message, truncate = false) => {
    try {
        if (!message) return '';
        
        // 处理Unicode转义
        let decodedMessage = message.replace(/\\u([\da-f]{4})/gi, (match, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
        });
        
        // 尝试解析为JSON
        try {
            let jsonObj = JSON.parse(decodedMessage);
            let formatted = JSON.stringify(jsonObj, null, 2);
            
            // 如果需要截断
            if (truncate && formatted.length > 100) {
                return formatted.substring(0, 100) + '...';
            }
            
            return formatted;
        } catch (e) {
            // 不是有效JSON，直接返回解码后的字符串
            if (truncate && decodedMessage.length > 100) {
                return decodedMessage.substring(0, 100) + '...';
            }
            return decodedMessage;
        }
    } catch (e) {
        console.error('格式化消息失败:', e);
        return message; // 出错时返回原始消息
    }
};

// 显示消息详情
const showMessageDetail = (message) => {
    currentMessageDetail.value = getFormattedMessage(message);
    showMessageDetailDialog.value = true;
};

// URL查询参数自动提取函数
const autoExtractQueryParams = () => {
    try {
        const url = caseEditForm.value.api_path;
        if (!url || !url.includes('?')) return;
        
        // 分离基础URL和查询字符串
        const [basePath, queryString] = url.split('?');
        if (!queryString) return;
        
        // 更新表单的API路径为基础路径
        caseEditForm.value.api_path = basePath;
        
        // 解析查询参数
        const params = {};
        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            if (key && value) {
                // 使用decodeURIComponent解码URL编码的参数
                params[decodeURIComponent(key)] = decodeURIComponent(value);
            }
        });
        
        // 检查现有的请求参数
        let existingParams = {};
        try {
            if (caseEditForm.value.params) {
                existingParams = JSON.parse(caseEditForm.value.params);
            }
        } catch (e) {
            // 如果现有参数不是有效的JSON，则使用空对象
            existingParams = {};
        }
        
        // 合并参数并更新表单
        const mergedParams = { ...existingParams, ...params };
        caseEditForm.value.params = JSON.stringify(mergedParams, null, 2);
        
        // 提示用户
        ElMessage.success('已自动提取URL查询参数到请求参数');
    } catch (error) {
        console.error('提取URL参数失败:', error);
    }
};

// 请求参数类型相关变量
const paramType = ref('json'); // 默认为JSON参数
const queryParams = ref([]);
const formParams = ref([]);
const jsonParams = ref('');

// 提取器配置相关变量
const extractors = ref([]);

// 参数类型选择器样式
const paramTypeSelectorStyle = computed(() => ({
    marginBottom: paramType === 'json' ? '15px' : '0'
}));

// 参数容器样式
const paramsContainerStyle = computed(() => ({
    marginTop: paramType === 'json' ? '10px' : '0',
    border: paramType === 'json' ? '1px solid var(--el-border-color-light)' : 'none',
    borderRadius: '4px',
    padding: '10px',
    backgroundColor: paramType === 'json' ? 'var(--el-fill-color-light)' : 'transparent'
}));

// 参数行样式
const paramRowStyle = computed(() => ({
    display: 'flex',
    marginBottom: '10px',
    alignItems: 'center'
}));

// 参数名称样式
const paramNameStyle = computed(() => ({
    flex: '2',
    paddingRight: '10px'
}));

// 参数值样式
const paramValueStyle = computed(() => ({
    flex: '3',
    paddingRight: '10px'
}));

// 参数描述样式
const paramDescStyle = computed(() => ({
    flex: '3',
    paddingRight: '10px'
}));

// 操作按钮样式
const paramActionStyle = computed(() => ({
    flex: '1',
    display: 'flex',
    justifyContent: 'center'
}));

// 添加参数按钮样式
const addParamBtnStyle = computed(() => ({
    marginTop: '15px',
    display: 'flex',
    justifyContent: 'center'
}));
</script>

<style scoped>
.automation-card {
    margin-top: 20px;
    padding: 24px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.section-header h4 {
    margin: 0;
    font-size: 16px;
    color: var(--el-text-color-primary);
}

.suite-config {
    margin-bottom: 24px;
}

.case-selection {
    margin-top: 20px;
}

.case-list-container {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    height: 600px;
    display: flex;
    flex-direction: column;
}

.no-env-tip {
    margin-top: 10px;
}

.env-option {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.suite-cards {
    margin-top: 20px;
    padding: 0 10px;
}

.suite-row {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 20px;
    padding: 10px 0;
}

.suite-card-wrapper {
    flex: 0 0 350px;
    width: 350px;
    min-width: 350px;
}

.suite-card {
    margin-bottom: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.card-header {
    display: flex;
    align-items: center;
    gap: 12px;
}

.suite-name {
    font-size: 16px;
    font-weight: 500;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.status-tag {
    flex-shrink: 0;
}

.card-content {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.suite-description {
    margin-bottom: 16px;
    min-height: 40px;
    max-height: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.suite-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
}

.secondary-info {
    margin-bottom: 16px;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
}

.card-actions {
    margin-top: auto;
    display: flex;
    justify-content: center;
}

/* Add styling for test case configuration section */
.basic-info-section {
    margin-bottom: 24px;
    padding: 16px;
    border-radius: 4px;
    background-color: #f8f9fa;
}

.case-selection-section {
    margin-top: 24px;
    padding: 16px;
    border-radius: 4px;
    background-color: #f8f9fa;
}

.section-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 16px;
    color: var(--el-text-color-primary);
}

.list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid var(--el-border-color-light);
}

.header-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.header-left .title {
    font-weight: 500;
}

.search-input {
    width: 220px;
}

.case-item {
    padding: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    display: flex;
    flex-direction: column;
    gap: 8px;
    cursor: pointer;
}

.case-item:hover {
    background-color: var(--el-fill-color-light);
}

.case-item.selected {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
}

.case-main {
    display: flex;
    align-items: center;
    gap: 8px;
}

.case-title {
    font-weight: 500;
    flex: 1;
    cursor: pointer;
}

.case-title:hover {
    color: var(--el-color-primary);
    text-decoration: underline;
}

.case-order {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    width: 30px;
}

.method-tag {
    width: 60px;
    text-align: center;
}

.priority-tag {
    width: 40px;
    text-align: center;
}

.case-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
}

.api-path {
    color: var(--el-color-primary-light-3);
}

.case-meta {
    display: flex;
    gap: 16px;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
}

.drag-handle {
    cursor: move;
    color: var(--el-text-color-secondary);
}

.ghost {
    opacity: 0.5;
    background: var(--el-color-primary-light-9);
}

.chosen {
    background: var(--el-color-primary-light-8);
}

/* Styles for report dialog */
.report-dialog .report-header {
    margin-bottom: 24px;
}

.report-meta {
    display: flex;
    margin-top: 16px;
    gap: 24px;
}

.report-meta .label {
    font-weight: 500;
}

.report-summary {
    margin-bottom: 32px;
}

.summary-card {
    padding: 16px;
    text-align: center;
    border-radius: 4px;
}

.summary-card .number {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 8px;
}

.summary-card.total {
    background-color: #e6f7ff;
    color: #1890ff;
}

.summary-card.passed {
    background-color: #f6ffed;
    color: #52c41a;
}

.summary-card.failed {
    background-color: #fff2f0;
    color: #ff4d4f;
}

.summary-card.rate {
    background-color: #fcfcfc;
    color: #595959;
}

.case-details {
    margin-top: 32px;
}

.case-details h3 {
    margin-bottom: 16px;
}

.api-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Fix icon centering in buttons */
.el-button.is-circle {
    display: flex;
    align-items: center;
    justify-content: center;
}

.el-button.is-circle .el-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
}

/* Improve button styling */
.el-button--danger.is-plain {
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Style for action buttons in item rows */
.case-actions .el-button {
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Ensure all icons are properly centered */
.el-icon {
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Styles for report list */
.report-list {
    margin-top: 24px;
}

.pagination-container {
    margin-top: 20px;
    text-align: right;
}

.table-actions {
    display: flex;
    gap: 8px;
}

/* Styles for response dialog */
.response-dialog .response-content {
    padding: 20px;
}

.tab-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 16px;
    gap: 10px;
}

.json-viewer-container {
    height: 500px;
    overflow: auto;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    padding: 10px;
    background-color: #f8f9fa;
}

.json-viewer {
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: 'Courier New', Courier, monospace;
    font-size: 14px;
    line-height: 1.5;
}

.json-viewer.formatted {
    color: #333;
}

/* JSON语法高亮样式 */
.json-viewer.formatted .json-key {
    color: #0451a5;
}

.json-viewer.formatted .json-string {
    color: #a31515;
}

.json-viewer.formatted .json-number {
    color: #098658;
}

.json-viewer.formatted .json-boolean {
    color: #0000ff;
}

.json-viewer.formatted .json-null {
    color: #0451a5;
}

.extractors-container {
    margin-top: 16px;
}

.help-text {
    margin-bottom: 16px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
}

.extractor-item {
    margin-bottom: 12px;
}

.add-extractor {
    margin-top: 16px;
}

/* Styles for log dialog */
.log-dialog :deep(.el-dialog__body) {
    padding: 0;
}

.log-content {
    padding: 20px;
}

.log-overview {
    margin-bottom: 24px;
}

.overview-item {
    margin-bottom: 16px;
}

.overview-item .label {
    font-weight: bold;
    margin-right: 8px;
}

.stats-row {
    margin: 24px 0;
}

.stat-card {
    text-align: center;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-card .stat-number {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 8px;
}

.stat-card .stat-label {
    font-size: 14px;
    color: #606266;
}

.stat-card.total {
    background-color: #e1f3ff;
    color: #1890ff;
}

.stat-card.passed {
    background-color: #f0f9eb;
    color: #67c23a;
}

.stat-card.failed {
    background-color: #fef0f0;
    color: #f56c6c;
}

.stat-card.rate {
    background-color: #f5f7fa;
    color: #303133;
}

.log-message {
    margin: 16px 0;
}

.log-error {
    margin: 16px 0;
}

.cases-detail {
    margin-top: 24px;
}

.cases-detail h3 {
    margin-bottom: 16px;
    font-size: 18px;
    font-weight: 500;
}

.case-duration {
    margin-left: 12px;
    color: #909399;
    font-size: 13px;
}

.detail-section {
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 4px;
}

.detail-item {
    margin-bottom: 16px;
}

.detail-label {
    font-weight: 500;
    margin-bottom: 8px;
    color: #303133;
}

.detail-value {
    font-family: 'Courier New', monospace;
    word-break: break-all;
}

.detail-value pre {
    margin-top: 12px;
    padding: 12px;
    border-radius: 4px;
    background-color: #f5f7fa;
    max-height: 400px;
    overflow: auto;
    white-space: pre-wrap;
    font-size: 14px;
    border: 1px solid #ebeef5;
}

.truncated-json {
    margin-top: 12px;
    padding: 12px;
    border-radius: 4px;
    background-color: #f5f7fa;
    max-height: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    border: 1px solid #ebeef5;
}

.error-item .error-message {
    color: #f56c6c;
    font-weight: 500;
}

.empty-log {
    padding: 40px 0;
}

:deep(.el-collapse-item__header) {
    font-size: 16px;
    font-weight: 500;
}

:deep(.el-collapse-item__content) {
    padding: 16px 0;
}

.detail-value pre :deep(.json-key) {
    color: #0451a5;
}

.detail-value pre :deep(.json-string) {
    color: #a31515;
}

.detail-value pre :deep(.json-number) {
    color: #098658;
}

.detail-value pre :deep(.json-boolean) {
    color: #0000ff;
}

.detail-value pre :deep(.json-null) {
    color: #0451a5;
}

/* 错误用例样式 */
:deep(.error-case) .el-collapse-item__header {
    background-color: rgba(245, 108, 108, 0.1);
    border-left: 4px solid #f56c6c;
    color: #f56c6c !important;
}

:deep(.error-case) .el-collapse-item__wrap {
    border-left: 4px solid #f56c6c;
}

/* 添加样式 */
.json-text {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 13px;
  line-height: 1.5;
  color: #333;
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 12px;
}

/* 添加的样式 */
.formatted-message {
  color: #409eff;
  cursor: pointer;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.formatted-message:hover {
  text-decoration: underline;
}

.message-detail-dialog .formatted-json {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Courier New', monospace;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  border: 1px solid #e0e0e0;
  max-height: 600px;
  overflow: auto;
  font-size: 14px;
  line-height: 1.5;
}

.error-link {
  color: #f56c6c !important;
}

.error-link:hover {
  color: #fa9898 !important;
}

/* 测试用例编辑对话框样式 */
.case-edit-dialog {
    --el-dialog-padding-primary: 20px;
}

.test-case-edit-form .full-width {
    width: 100%;
}

.test-case-edit-form .form-item-tip {
    margin-top: 5px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 5px;
}

.test-case-edit-form .code-textarea {
    font-family: "Courier New", monospace;
}

.request-tabs {
    margin-bottom: 20px;
}

.request-tabs .el-tabs__content {
    padding: 15px;
}

.no-margin {
    margin-bottom: 0;
}

.extractors-container {
    margin-top: 10px;
}

.help-card {
    margin-bottom: 20px;
}

.help-title {
    font-weight: bold;
}

.help-content {
    padding: 5px 0;
}

.help-content p {
    margin: 5px 0;
}

.help-content ul {
    margin: 5px 0;
    padding-left: 20px;
}

.extractors-list {
    margin-top: 15px;
}

.extractor-item {
    margin-bottom: 15px;
}

.extractor-item .el-card__body {
    padding: 15px;
}

.add-extractor {
    display: flex;
    justify-content: center;
    margin: 20px 0;
}

.add-extractor-btn {
    display: flex;
    justify-content: center;
    margin: 10px 0;
}

.divider-title {
    display: flex;
    align-items: center;
    gap: 5px;
    font-weight: bold;
}

.flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 参数类型选择器样式 */
.param-type-selector {
    margin-bottom: 15px;
}

/* 参数容器样式 */
.params-container {
    margin-top: 10px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
    padding: 10px;
    background-color: var(--el-fill-color-light);
}

/* 参数行样式 */
.param-row {
    display: flex;
    margin-bottom: 10px;
    align-items: center;
}

.param-row.header {
    font-weight: bold;
    color: var(--el-text-color-primary);
    padding-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color);
}

.param-name {
    flex: 2;
    padding-right: 10px;
}

.param-value {
    flex: 3;
    padding-right: 10px;
}

.param-desc {
    flex: 3;
    padding-right: 10px;
}

.param-action {
    flex: 1;
    display: flex;
    justify-content: center;
}

.add-param-btn {
    margin-top: 15px;
    display: flex;
    justify-content: center;
}
</style> 