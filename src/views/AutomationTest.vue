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
                        <h2>{{ currentReport.suiteName }} - 测试报告</h2>
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
                            <el-table-column prop="message" label="详细信息" min-width="200" />
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

            <!-- 响应数据详情对话框 -->
            <el-dialog
                title="接口响应详情"
                v-model="showResponseDialog"
                width="85%"
                append-to-body
                class="response-dialog"
            >
                <div v-if="currentCaseResponse" class="response-content">
                    <el-tabs v-model="responseTabActive">
                        <el-tab-pane label="请求数据" name="request">
                            <div class="tab-header">
                                <el-button 
                                    type="primary" 
                                    size="small" 
                                    @click="toggleFormatRequest" 
                                    :icon="formatRequestActive ? Check : MagicStick"
                                >
                                    {{ formatRequestActive ? '已格式化' : '格式化JSON' }}
                                </el-button>
                                <el-button 
                                    type="info" 
                                    size="small" 
                                    @click="copyToClipboard(parsedRequestData)" 
                                    :icon="CopyDocument"
                                >
                                    复制
                                </el-button>
                            </div>
                            <div class="json-viewer-container">
                                <pre v-if="parsedRequestData" class="json-viewer" :class="{'formatted': formatRequestActive}" v-html="formatRequestActive ? formatJson(parsedRequestData) : unformattedJson(parsedRequestData)"></pre>
                                <el-empty v-else description="无请求数据" />
                            </div>
                        </el-tab-pane>
                        <el-tab-pane label="响应数据" name="response">
                            <div class="tab-header">
                                <el-button 
                                    type="primary" 
                                    size="small" 
                                    @click="toggleFormatResponse" 
                                    :icon="formatResponseActive ? Check : MagicStick"
                                >
                                    {{ formatResponseActive ? '已格式化' : '格式化JSON' }}
                                </el-button>
                                <el-button 
                                    type="info" 
                                    size="small" 
                                    @click="copyToClipboard(parsedResponseData)" 
                                    :icon="CopyDocument"
                                >
                                    复制
                                </el-button>
                            </div>
                            <div class="json-viewer-container">
                                <pre v-if="parsedResponseData" class="json-viewer" :class="{'formatted': formatResponseActive}" v-html="formatResponseActive ? formatJson(parsedResponseData) : unformattedJson(parsedResponseData)"></pre>
                                <el-empty v-else description="无响应数据" />
                            </div>
                        </el-tab-pane>
                    </el-tabs>
                </div>
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
                <el-form :model="caseEditForm" label-width="120px">
                    <el-form-item label="用例名称">
                        <el-input v-model="caseEditForm.title" placeholder="请输入用例名称" />
                    </el-form-item>
                    <el-form-item label="请求方法">
                        <el-select v-model="caseEditForm.method">
                            <el-option label="GET" value="GET" />
                            <el-option label="POST" value="POST" />
                            <el-option label="PUT" value="PUT" />
                            <el-option label="DELETE" value="DELETE" />
                            <el-option label="PATCH" value="PATCH" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="接口路径">
                        <el-input v-model="caseEditForm.api_path" placeholder="请输入接口路径" />
                    </el-form-item>
                    <el-form-item label="请求头">
                        <el-input
                            v-model="caseEditForm.headers"
                            type="textarea"
                            :rows="4"
                            placeholder="请输入请求头 (JSON格式)"
                        />
                    </el-form-item>
                    <el-form-item label="请求参数">
                        <el-input
                            v-model="caseEditForm.params"
                            type="textarea"
                            :rows="6"
                            placeholder="请输入请求参数 (JSON格式)"
                        />
                    </el-form-item>
                    <!--移除请求体表单项-->
                    <el-form-item label="预期结果">
                        <el-input
                            v-model="caseEditForm.expected"
                            type="textarea"
                            :rows="4"
                            placeholder="请输入预期结果 (JSON格式)"
                        />
                    </el-form-item>
                    
                    <!-- 添加提取器配置部分 -->
                    <el-form-item label="提取器配置">
                        <div class="extractors-container">
                            <div class="help-text">
                                <p><el-icon><Document /></el-icon> 提取器用于从接口响应中提取数据，并在后续接口中使用</p>
                                <p>变量使用方法：在URL、请求参数或请求头中使用 <code>${变量名}</code> 格式引用变量</p>
                                <p>JSONPath示例：<code>$.data.id</code>、<code>$.data.list[0].name</code></p>
                            </div>
                            
                            <div v-for="(extractor, index) in caseEditForm.extractors" :key="index" class="extractor-item">
                                <el-row :gutter="10">
                                    <el-col :span="8">
                                        <el-input v-model="extractor.name" placeholder="变量名" size="small" />
                                    </el-col>
                                    <el-col :span="12">
                                        <el-input v-model="extractor.jsonPath" placeholder="JSONPath表达式 (如: $.data.id)" size="small" />
                                    </el-col>
                                    <el-col :span="4">
                                        <el-button type="danger" @click="removeExtractor(index)" :icon="Delete" circle size="small"></el-button>
                                    </el-col>
                                </el-row>
                            </div>
                            
                            <div class="add-extractor">
                                <el-button type="primary" @click="addExtractor" plain :icon="Plus" size="small">添加提取器</el-button>
                            </div>
                        </div>
                    </el-form-item>
                </el-form>
                <template #footer>
                    <div class="dialog-footer">
                        <el-button @click="showCaseEditDialog = false">取消</el-button>
                        <el-button type="primary" @click="saveCase">保存</el-button>
                    </div>
                </template>
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
    CopyDocument
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
            `http://47.94.195.221:8000/api/suite/list/${projectId}`,
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
                executing: false
            }));
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

// 获取环境列表
const fetchEnvironments = async () => {
    const projectId = route.query.projectId;
    if (!projectId) {
        ElMessage.warning('请先选择项目');
        return;
    }
    
    try {
        const response = await axios.get(
            `http://47.94.195.221:8000/api/env-suite/list/${projectId}`,
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
        const response = await fetch(`http://47.94.195.221:8000/api/testcase/list/${projectId}`, {
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
                    project_id: projectId.value
                };
                
                try {
                    // 根据是否有currentEditingSuiteId决定是更新还是创建
                    if (currentEditingSuiteId.value) {
                        // 更新测试套件
                        console.log('更新测试套件:', currentEditingSuiteId.value, requestData);
                        response = await axios.put(
                            `http://47.94.195.221:8000/api/suite/update/${currentEditingSuiteId.value}`,
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
                            'http://47.94.195.221:8000/api/suite/create',
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
                        // 刷新测试套件列表
                        fetchTestSuites();
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
                `http://47.94.195.221:8000/api/suite/detail/${suiteId}`,
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
                `http://47.94.195.221:8000/api/suite/execute/${suiteId}`,
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
            `http://47.94.195.221:8000/api/report/list/${projectId.value}`,
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
            `http://47.94.195.221:8000/api/report/detail/${report.id}`,
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
                `http://47.94.195.221:8000/api/report/latest/${suiteId}`,
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
            `http://47.94.195.221:8000/api/suite/detail/${suiteId}`,
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
                envId: suiteData.env_id,
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
    await fetchTestSuites();
    await fetchEnvironments(); // 添加获取环境列表
    await fetchTestReports(); // 添加获取测试报告
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
            `http://47.94.195.221:8000/api/report/delete/${report.id}`,
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
                `http://47.94.195.221:8000/api/suite/delete/${suiteId}`,
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
                `http://47.94.195.221:8000/api/testcase/update/${caseId}`,
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
    
    // 填充表单数据
    caseEditForm.value = {
        title: caseItem.title || '',
        method: caseItem.method || 'GET',
        api_path: caseItem.api_path || '',
        headers: caseItem.headers ? JSON.stringify(caseItem.headers, null, 2) : '',
        // 如果有body数据则用body数据填充params，否则使用params数据
        params: caseItem.body && Object.keys(caseItem.body).length > 0 
            ? JSON.stringify(caseItem.body, null, 2) 
            : (caseItem.params ? JSON.stringify(caseItem.params, null, 2) : ''),
        expected: caseItem.expected ? JSON.stringify(caseItem.expected, null, 2) : '',
        case_id: caseItem.case_id,
        index: index,
        extractors: extractors // 使用确保是数组的extractors
    };

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
                    `http://47.94.195.221:8000/api/report/delete/${report.id}`,
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
                    `http://47.94.195.221:8000/api/suite/delete/${suiteId}`,
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

// 实现查看响应数据的方法
const viewCaseResponse = (caseResult) => {
    try {
        currentCaseResponse.value = caseResult;
        
        // 解析请求数据
        if (caseResult.requestData) {
            try {
                // 首先尝试作为JSON字符串解析
                parsedRequestData.value = JSON.parse(caseResult.requestData);
            } catch (e) {
                // 如果解析失败，使用更安全的方式处理
                try {
                    // 尝试修复可能的JSON格式问题
                    const fixedJson = caseResult.requestData
                        .replace(/'/g, '"')
                        .replace(/(\w+):/g, '"$1":');
                    parsedRequestData.value = JSON.parse(fixedJson);
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
                // 首先尝试作为JSON字符串解析
                parsedResponseData.value = JSON.parse(caseResult.responseData);
            } catch (e) {
                // 如果解析失败，使用更安全的方式处理
                try {
                    // 尝试修复可能的JSON格式问题
                    const fixedJson = caseResult.responseData
                        .replace(/'/g, '"')
                        .replace(/(\w+):/g, '"$1":');
                    parsedResponseData.value = JSON.parse(fixedJson);
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
        const formatted = JSON.stringify(data, null, 2);
        
        // 简单的语法高亮处理
        return formatted.replace(
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
        return String(data);
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
        // 返回一行的JSON字符串，但需要转义HTML特殊字符
        const jsonString = JSON.stringify(data);
        return jsonString
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    } catch (error) {
        console.error('格式化JSON失败:', error);
        return String(data)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};
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
</style> 