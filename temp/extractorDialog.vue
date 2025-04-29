<!-- 提取器配置部分 -->
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

<style>
.extractors-container {
    padding: 10px;
    background-color: #f9f9f9;
    border-radius: 4px;
}

.help-text {
    margin-bottom: 15px;
    font-size: 13px;
    color: #606266;
    background-color: #ecf8ff;
    padding: 10px;
    border-radius: 4px;
    border-left: 3px solid #409eff;
}

.help-text p {
    margin: 5px 0;
}

.help-text code {
    background-color: #f0f9eb;
    padding: 2px 4px;
    border-radius: 3px;
    color: #409eff;
}

.extractor-item {
    margin-bottom: 10px;
}

.add-extractor {
    margin-top: 10px;
}
</style> 