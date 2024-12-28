<template>
  <Home>
    <PageContainer title="接口自动化测试脑图">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="left-tools">
          <el-button-group>
            <el-button 
              type="primary" 
              @click="saveMap"
              :icon="Save"
            >
              保存脑图
            </el-button>
            <el-button 
              @click="exportMap"
              :icon="Download"
            >
              导出
            </el-button>
          </el-button-group>

          <el-divider direction="vertical" />

          <el-button-group>
            <el-button 
              @click="addNode"
              :icon="Plus"
            >
              添加子节点
            </el-button>
            <el-button 
              @click="addParentNode"
              :icon="Plus"
              :disabled="!selectedNode || selectedNode.id === 'root'"
            >
              添加父节点
            </el-button>
            <el-button 
              @click="removeNode"
              :icon="Delete"
              :disabled="!selectedNode"
            >
              删除节点
            </el-button>
          </el-button-group>

          <el-divider direction="vertical" />

          <el-button-group>
            <el-button 
              @click="executeSelected"
              type="success"
              :icon="VideoPlay"
              :disabled="!selectedNode"
            >
              执行选中用例
            </el-button>
            <el-button 
              @click="executeAll"
              type="warning"
              :icon="VideoPlay"
            >
              执行全部
            </el-button>
          </el-button-group>
        </div>

        <div class="right-tools">
          <el-button-group>
            <el-button 
              @click="zoomIn"
              :icon="ZoomIn"
            >
              放大
            </el-button>
            <el-button 
              @click="zoomOut"
              :icon="ZoomOut"
            >
              缩小
            </el-button>
            <el-button 
              @click="resetZoom"
              :icon="FullScreen"
            >
              重置
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="content-container">
        <!-- 左侧测试用例列表 -->
        <div class="case-list">
          <div class="list-header">
            <h3>测试用例列表</h3>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索用例"
              prefix-icon="Search"
              clearable
            />
          </div>
          <div class="list-content">
            <el-tree
              :data="testCases"
              :props="{ 
                label: 'title',
                children: 'children'
              }"
              draggable
              @node-drag-start="handleDragStart"
              @node-drag-end="handleDragEnd"
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <div class="case-info">
                    <span class="case-title">{{ data.title }}</span>
                    <el-tag size="small" :type="getMethodType(data.method)">
                      {{ data.method }}
                    </el-tag>
                  </div>
                </div>
              </template>
            </el-tree>
          </div>
        </div>

        <!-- 中间脑图区域 -->
        <div class="mind-map" ref="mindMapContainer">
          <!-- 这里将使用 G6 渲染脑图 -->
        </div>

        <!-- 右侧属性面板 -->
        <div class="properties-panel" v-if="selectedNode">
          <div class="panel-header">
            <h3>节点属性</h3>
          </div>
          <div class="panel-content">
            <el-form label-position="top">
              <el-form-item label="节点名称">
                <el-input 
                  v-model="selectedNode.data.text" 
                  @input="handleNodeNameChange"
                  placeholder="请输入节点名称"
                />
              </el-form-item>
              
              <el-form-item label="关联用例">
                <el-select 
                  v-model="selectedNode.data.testCase"
                  filterable
                  clearable
                  placeholder="选择关联的测试用例"
                >
                  <el-option
                    v-for="item in testCases"
                    :key="item.id"
                    :label="item.title"
                    :value="item.id"
                  >
                    <div class="case-option">
                      <span>{{ item.title }}</span>
                      <el-tag size="small" :type="getMethodType(item.method)">
                        {{ item.method }}
                      </el-tag>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>

              <el-form-item label="执行条件">
                <el-select 
                  v-model="selectedNode.data.condition"
                  placeholder="选择执行条件"
                >
                  <el-option label="无条件" value="none" />
                  <el-option label="上级成功后" value="parent_success" />
                  <el-option label="上级失败" value="parent_fail" />
                  <el-option label="自定义条件" value="custom" />
                </el-select>
              </el-form-item>

              <el-form-item 
                label="自定义条件" 
                v-if="selectedNode.data.condition === 'custom'"
              >
                <el-input
                  type="textarea"
                  v-model="selectedNode.data.customCondition"
                  placeholder="请输入条件表达式"
                  :rows="3"
                />
              </el-form-item>

              <el-form-item label="优先级">
                <el-select v-model="selectedNode.data.priority">
                  <el-option label="高" value="high" />
                  <el-option label="中" value="medium" />
                  <el-option label="低" value="low" />
                </el-select>
              </el-form-item>

              <el-form-item label="备注">
                <el-input
                  type="textarea"
                  v-model="selectedNode.data.notes"
                  :rows="3"
                />
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </PageContainer>
  </Home>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  Document as Save,
  Download,
  CirclePlus as Plus,
  Delete,
  VideoPlay,
  ZoomIn,
  ZoomOut,
  FullScreen,
  Search 
} from '@element-plus/icons-vue';
import Home from '@/components/HomePage.vue';
import PageContainer from '@/components/PageContainer.vue';
import request from '@/utils/request';
import { useRoute } from 'vue-router';
import * as G6 from '@antv/g6';

const route = useRoute();

const projectId = ref(null);
const mindMapContainer = ref(null);
const graph = ref(null);
const selectedNode = ref(null);
const testCases = ref([]);
const searchKeyword = ref('');

// 添加一个临时存储拖拽数据的变量
const dragData = ref(null);

// 修改初始化思维导图的部分
const initMindMap = () => {
  nextTick(() => {
    if (!mindMapContainer.value) return;
    
    try {
      // 注册自定义节点
      G6.registerNode('mindmap-node', {
        draw: (cfg, group) => {
          const keyShape = group.addShape('rect', {
            attrs: {
              x: -90,
              y: -25,
              width: 180,
              height: 50,
              radius: 4,
              fill: cfg.id === 'root' ? '#e6f7ff' : '#fff',
              stroke: cfg.id === 'root' ? '#1890ff' : '#91d5ff',
              lineWidth: cfg.id === 'root' ? 2 : 1,
              cursor: 'pointer',
            },
          });

          group.addShape('text', {
            attrs: {
              text: cfg.label || '',
              x: -80,
              y: 0,
              fontSize: cfg.id === 'root' ? 16 : 14,
              fontWeight: cfg.id === 'root' ? 'bold' : 'normal',
              fill: cfg.id === 'root' ? '#1890ff' : '#333',
              cursor: 'pointer',
              textBaseline: 'middle',
            },
          });

          return keyShape;
        },
      });

      // 创建图实例
      graph.value = new G6.TreeGraph({
        container: mindMapContainer.value,
        width: mindMapContainer.value.offsetWidth,
        height: mindMapContainer.value.offsetHeight,
        modes: {
          default: ['drag-canvas', 'zoom-canvas', 'drag-node'],
        },
        defaultNode: {
          type: 'mindmap-node',
          size: [180, 50],
        },
        defaultEdge: {
          type: 'cubic-horizontal',
          style: {
            stroke: '#91d5ff',
            lineWidth: 1.5,
            endArrow: true,
          },
        },
        layout: {
          type: 'indented',  // 使用缩进树布局
          direction: 'LR',   // 从左到右
          dropCap: false,    // 不使用首字母下沉
          indent: 200,       // 缩进距离
          getHeight: () => 60,
          getWidth: () => 180,
        },
        animate: true,
        fitView: true,
        fitViewPadding: [20, 40, 20, 40],
      });

      // 初始化数据
      const data = {
        id: 'root',
        label: '接口自动化测试',
        children: [],
        style: {
          fill: '#e6f7ff',
          stroke: '#1890ff',
        }
      };

      // 设置数据并渲染
      graph.value.data(data);
      graph.value.render();
      graph.value.fitView();

      // 监听节点点击事件
      graph.value.on('node:click', (evt) => {
        try {
          const { item } = evt;
          if (item) {
            selectedNode.value = item.getModel();
          }
        } catch (error) {
          console.error('节点点击处理失败:', error);
        }
      });

      // 自适应窗口大小
      window.addEventListener('resize', () => {
        if (graph.value) {
          graph.value.changeSize(
            mindMapContainer.value.offsetWidth,
            mindMapContainer.value.offsetHeight
          );
          graph.value.fitView();
        }
      });

    } catch (error) {
      console.error('初始化思维导图失败:', error);
      ElMessage.error('初始化思维导图失败');
    }
  });
};

// 获取测试用例列表
const fetchTestCases = async () => {
  try {
    // 检查 projectId 是否存在
    if (!projectId.value) {
      ElMessage.warning('请先选择项目');
      return;
    }
    
    const response = await request.get(`http://localhost:8081/api/testcase/list/${projectId.value}`);
    if (response.data.code === 200) {
      // 修改数据结构以匹配后端返回的格式
      testCases.value = response.data.data.testCases.map(testCase => ({
        id: testCase.case_id,
        title: testCase.title,
        method: testCase.method,
        api_path: testCase.api_path,
        priority: testCase.priority,
        status: testCase.status,
        creator: testCase.creator,
        create_time: testCase.create_time,
        update_time: testCase.update_time
      }));
    }
  } catch (error) {
    console.error('获取测试用例失败:', error);
    ElMessage.error('获取测试用例失败');
  }
};

// 添加节点
const addNode = () => {
  if (!selectedNode.value) {
    ElMessage.warning('请先选择一个节点');
    return;
  }

  try {
    // 创建新节点
    const newNode = {
      id: `node-${Date.now()}`,
      label: '新建节点',
      type: 'mindmap-node',
      data: {
        type: 'case',
        testCase: null,
        condition: 'none',
        priority: 'medium',
        notes: '',
        text: '新建节点'
      }
    };

    // 创建边
    const newEdge = {
      source: selectedNode.value.id,
      target: newNode.id,
      type: 'cubic-horizontal'
    };

    // 获取当前数据
    const data = graph.value.save();
    
    // 添加新节点和边
    data.nodes.push(newNode);
    data.edges.push(newEdge);

    // 更新图数据
    graph.value.changeData(data);

    // 自选中新节点
    const newNodeModel = graph.value.findById(newNode.id);
    if (newNodeModel) {
      selectedNode.value = newNodeModel.getModel();
      graph.value.emit('node:click', { item: newNodeModel });
    }

    ElMessage.success('添加节点成功');
  } catch (error) {
    console.error('添加节点失败:', error);
    ElMessage.error('添加节点失败');
  }
};

// 删除节点
const removeNode = () => {
  if (!selectedNode.value || selectedNode.value.id === 'root') {
    ElMessage.warning('无法删除节点');
    return;
  }

  const data = graph.value.save();
  removeNodeById(data, selectedNode.value.id);
  graph.value.changeData(data);
  selectedNode.value = null;
};

// 辅助函数：查找节点
const findNode = (tree, id) => {
  if (tree.id === id) return tree;
  if (tree.children) {
    for (const child of tree.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
};

// 辅助函数：删除节点
const removeNodeById = (tree, id) => {
  if (tree.children) {
    tree.children = tree.children.filter(child => {
      if (child.id === id) return false;
      removeNodeById(child, id);
      return true;
    });
  }
};

// 执行测试方法
const executeSelected = async () => {
  if (!selectedNode.value || !selectedNode.value.data.testCase) {
    ElMessage.warning('请先选择含测试用例的节点');
    return;
  }

  try {
    const response = await request.post(`/api/testcase/execute/${selectedNode.value.data.testCase}`);
    if (response.data.code === 200) {
      ElMessage.success('执行成功');
    }
  } catch (error) {
    console.error('执行失败:', error);
    ElMessage.error('执行失败');
  }
};

const executeAll = async () => {
  const nodes = graph.value.save().children.filter(node => node.data.testCase);
  if (nodes.length === 0) {
    ElMessage.warning('没有可执行的测试用例');
    return;
  }

  try {
    const response = await request.post('/api/testcase/batch-execute', {
      caseIds: nodes.map(node => node.data.testCase)
    });
    if (response.data.code === 200) {
      ElMessage.success('批量执行成功');
    }
  } catch (error) {
    console.error('批量执行失败:', error);
    ElMessage.error('批量执行失败');
  }
};

// 保存和导出方法
const saveMap = async () => {
  try {
    const data = graph.value.save();
    const response = await request.post('/api/mindmap/save', {
      data: JSON.stringify(data)
    });
    if (response.data.code === 200) {
      ElMessage.success('保存成功');
    }
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error('保存失败');
  }
};

const exportMap = () => {
  const data = graph.value.save();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '接口自动化测试脑图.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 缩放控制
const zoomIn = () => graph.value.execCommand('ZoomIn');
const zoomOut = () => graph.value.execCommand('ZoomOut');
const resetZoom = () => graph.value.execCommand('Zoom', 100);

// 拖拽处理
const handleDragStart = (node) => {
  // 将数据存储到临时变量中
  dragData.value = {
    id: node.case_id || node.id, // 兼容后端返回 case_id
    title: node.title,
    method: node.method,
    api_path: node.api_path,
    priority: node.priority,
    status: node.status
  };
};

const handleDragEnd = () => {
  try {
    if (!dragData.value) {
      ElMessage.warning('无效的拖拽数据');
      return;
    }

    // 获取当前图数据
    const data = graph.value.save();
    
    // 创建新节点
    const newNode = {
      id: `node-${Date.now()}`,
      label: dragData.value.title,
      children: [],
      data: {
        type: 'case',
        testCase: dragData.value.id,
        method: dragData.value.method,
        api_path: dragData.value.api_path,
        priority: dragData.value.priority,
        status: dragData.value.status,
        condition: 'none',
        notes: '',
        text: dragData.value.title
      }
    };

    // 找到目标父节点
    const parentNode = selectedNode.value ? findNode(data, selectedNode.value.id) : findNode(data, 'root');
    
    if (parentNode) {
      // 确保 children 数组存在
      if (!parentNode.children) {
        parentNode.children = [];
      }
      
      // 添加新节点到父节点的 children 中
      parentNode.children.push(newNode);

      // 更新图数据
      graph.value.changeData(data);

      // 等待布局完成后再选中节点
      setTimeout(() => {
        const newNodeModel = graph.value.findById(newNode.id);
        if (newNodeModel) {
          selectedNode.value = newNodeModel.getModel();
          graph.value.emit('node:click', { 
            item: newNodeModel,
            target: newNodeModel
          });
        }
        // 适应视图
        graph.value.fitView();
      }, 200);
    }

    // 清除拖拽数据
    dragData.value = null;

    ElMessage.success('添加测试用例成功');
  } catch (error) {
    console.error('处理拖拽失败:', error);
    ElMessage.error('添加测试用例失败');
  }
};

// 获取请求方法的样式
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

// 添加节点名称变更处理方法
const handleNodeNameChange = (value) => {
  if (selectedNode.value) {
    // 更新节点标签
    const data = graph.value.save();
    const node = findNode(data, selectedNode.value.id);
    if (node) {
      node.label = value;
      graph.value.changeData(data);
    }
  }
};

// 添加父节点方法
const addParentNode = () => {
  if (!selectedNode.value || selectedNode.value.id === 'root') {
    ElMessage.warning('根节点不能添加父节点');
    return;
  }

  try {
    // 创建新的父节点
    const newParentNode = {
      id: `node-${Date.now()}`,
      label: '新建父节点',
      children: [], // 存放当前选中的节点
      data: {
        type: 'case',
        testCase: null,
        condition: 'none',
        priority: 'medium',
        notes: '',
        text: '新建父节点'
      }
    };

    // 获取当前图数据
    const data = graph.value.save();
    
    // 找到当前节点的父节点
    let currentParent = null;
    const findParentNode = (tree, targetId) => {
      if (tree.children) {
        for (const child of tree.children) {
          if (child.id === targetId) {
            currentParent = tree;
            return true;
          }
          if (findParentNode(child, targetId)) {
            return true;
          }
        }
      }
      return false;
    };
    
    findParentNode(data, selectedNode.value.id);
    
    if (currentParent) {
      // 找到当前节点在父节点children中的索引
      const index = currentParent.children.findIndex(
        child => child.id === selectedNode.value.id
      );
      
      if (index !== -1) {
        // 从原父节点中移除当前节点
        const currentNode = currentParent.children.splice(index, 1)[0];
        
        // 将当前节点添加为新父节点的子节点
        newParentNode.children.push(currentNode);
        
        // 将新父节点加到原父节点的children中的相同位置
        currentParent.children.splice(index, 0, newParentNode);
        
        // 更新图数据
        graph.value.changeData(data);
        
        // 自动选中新创建的父节点
        const newNodeModel = graph.value.findById(newParentNode.id);
        if (newNodeModel) {
          selectedNode.value = newNodeModel.getModel();
          // 触发点击事件以显示属性面板
          graph.value.emit('node:click', { item: newNodeModel });
        }
        
        ElMessage.success('添加父节点成功');
      }
    }
  } catch (error) {
    console.error('添加父节点失败:', error);
    ElMessage.error('添加父节点失败');
  }
};

onMounted(async () => {
  // 可以从路由参数或者存储中获取项目ID
  projectId.value = route.params.projectId || localStorage.getItem('currentProjectId');
  
  console.log('当前项目ID:', projectId.value); // 添加调试日志
  
  if (projectId.value) {
    await fetchTestCases();
  } else {
    ElMessage.warning('未找到项目ID，请先选择项目');
  }
  
  initMindMap();
});

onUnmounted(() => {
  if (graph.value) {
    graph.value.destroy();
  }
  window.removeEventListener('resize', () => {});
});
</script>

<style scoped>
.toolbar {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

.left-tools,
.right-tools {
  display: flex;
  align-items: center;
  gap: 16px;
}

.content-container {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 16px;
  height: calc(100vh - 200px);
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

.case-list {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.list-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.list-header h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.list-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.custom-tree-node {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.case-info {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.case-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mind-map {
  height: 100%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  overflow: hidden;
  background-color: #fafafa;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.properties-panel {
  border-left: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.case-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

:deep(.el-tree-node__content) {
  height: 40px;
}

:deep(.el-tree-node.is-drop-inner > .el-tree-node__content) {
  background-color: var(--el-color-primary-light-9);
}

.el-button-group {
  margin-right: 8px;
}

.el-button-group .el-button {
  margin-left: -1px;
}

.el-button-group .el-button:first-child {
  margin-left: 0;
}
</style> 