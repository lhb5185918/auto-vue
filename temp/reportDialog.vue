<!-- 在测试报告详情对话框中添加提取的变量展示部分 -->
<div class="variables-section" v-if="currentReport.variables && Object.keys(currentReport.variables).length > 0">
    <h3>测试变量</h3>
    <el-table :data="Object.entries(currentReport.variables).map(([key, value]) => ({key, value}))" border>
        <el-table-column prop="key" label="变量名" width="200" />
        <el-table-column prop="value" label="变量值" />
    </el-table>
</div>

<style>
.variables-section {
    margin-top: 20px;
    margin-bottom: 20px;
}

.variables-section h3 {
    margin-bottom: 15px;
    font-size: 16px;
    color: #303133;
}
</style> 