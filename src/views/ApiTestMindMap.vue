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
              @input="filterTestCases"
            />
          </div>
          <div class="list-content">
            <div 
              v-for="testCase in filteredTestCases" 
              :key="testCase.id"
              class="case-item"
              draggable="true"
              @dragstart="handleDragStart($event, testCase)"
              @dragend="handleDragEnd"
            >
              <div class="case-info">
                <span class="case-title">{{ testCase.title }}</span>
                <el-tag size="small" :type="getMethodType(testCase.method)">
                  {{ testCase.method }}
                </el-tag>
              </div>
              <div class="case-path">{{ testCase.api_path }}</div>
            </div>
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
          <el-scrollbar class="panel-content">
            <el-form label-position="top" size="small">
              <el-form-item label="节点名称">
                <el-input 
                  v-model="selectedNode.label" 
                  @input="handleNodeNameChange"
                  placeholder="请输入节点名称"
                />
              </el-form-item>

              <!-- 非根节点才显示的属性 -->
              <template v-if="selectedNode.id !== 'root'">
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

                <el-form-item label="前置参数">
                  <div class="params-list">
                    <div 
                      v-for="(param, index) in selectedNode.data.params || []" 
                      :key="index"
                      class="param-item"
                    >
                      <el-row :gutter="10">
                        <el-col :span="8">
                          <el-input
                            v-model="param.name"
                            placeholder="参数名"
                          />
                        </el-col>
                        <el-col :span="8">
                          <el-select
                            v-model="param.source"
                            placeholder="选择来源变量"
                            filterable
                          >
                            <el-option
                              v-for="variable in availableVariables"
                              :key="variable.id"
                              :label="`${variable.nodeName} - ${variable.name}`"
                              :value="variable.id"
                            />
                          </el-select>
                        </el-col>
                        <el-col :span="6">
                          <el-input
                            v-model="param.defaultValue"
                            placeholder="默认值"
                          />
                        </el-col>
                        <el-col :span="2" class="flex-center">
                          <el-button
                            type="danger"
                            circle
                            @click="removeParam(index)"
                            :icon="Delete"
                          />
                        </el-col>
                      </el-row>
                    </div>
                    
                    <el-button
                      type="primary"
                      plain
                      @click="addParam"
                      :icon="Plus"
                    >
                      添加参数
                    </el-button>
                  </div>
                </el-form-item>

                <el-form-item label="优先级">
                  <el-select v-model="selectedNode.data.priority">
                    <el-option label="高" value="high" />
                    <el-option label="中" value="medium" />
                    <el-option label="低" value="low" />
                  </el-select>
                </el-form-item>
              </template>

              <el-form-item label="备注">
                <el-input
                  type="textarea"
                  v-model="selectedNode.data.notes"
                  :rows="3"
                />
              </el-form-item>

              <el-form-item label="后置提取">
                <div class="extractions-list">
                  <div 
                    v-for="(extraction, index) in selectedNode.data.extractions" 
                    :key="index"
                    class="extraction-item"
                  >
                    <el-row :gutter="10">
                      <el-col :span="8">
                        <el-input
                          v-model="extraction.name"
                          placeholder="变量名"
                          size="small"
                        />
                      </el-col>
                      <el-col :span="8">
                        <el-select
                          v-model="extraction.type"
                          placeholder="提取方式"
                          size="small"
                        >
                          <el-option label="JSON路径" value="jsonpath" />
                          <el-option label="正则表达式" value="regex" />
                          <el-option label="XPath" value="xpath" />
                        </el-select>
                      </el-col>
                      <el-col :span="6">
                        <el-input
                          v-model="extraction.expression"
                          placeholder="提取表达式"
                          size="small"
                        />
                      </el-col>
                      <el-col :span="2">
                        <el-button
                          type="danger"
                          size="small"
                          circle
                          @click="removeExtraction(index)"
                          :icon="Delete"
                        />
                      </el-col>
                    </el-row>
                  </div>
                  
                  <el-button
                    type="primary"
                    plain
                    size="small"
                    @click="addExtraction"
                    :icon="Plus"
                  >
                    添加提取规则
                  </el-button>
                </div>
              </el-form-item>
            </el-form>
          </el-scrollbar>
        </div>
      </div>
    </PageContainer>
  </Home>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
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

// 添加过滤后的用例列表
const filteredTestCases = ref([]);

// 添加过滤方法
const filterTestCases = () => {
  if (!searchKeyword.value) {
    filteredTestCases.value = testCases.value;
    return;
  }
  
  const keyword = searchKeyword.value.toLowerCase();
  filteredTestCases.value = testCases.value.filter(testCase => 
    testCase.title.toLowerCase().includes(keyword) ||
    testCase.api_path.toLowerCase().includes(keyword) ||
    testCase.method.toLowerCase().includes(keyword)
  );
};

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

      // 修改初始数据
      const data = {
        id: 'root',
        label: '接口自动化测试',
        children: [],
        data: {
          text: '接口自动化测试',
          notes: '',  // 添加备注字段
          type: 'root'  // 标识为根节点
        },
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
    
    const response = await request.get(`http://47.94.195.221:8000/api/testcase/list/${projectId.value}`);
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
      
      // 初始化过滤后的列表
      filterTestCases();
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
        text: '新建节点',
        extractions: [],  // 添加提取规则数组
        params: []       // 前置参数
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
      ElMessage.success('测试用例执行成功');
    } else {
      ElMessage.error(response.data.message || '执行失败');
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
    } else {
      ElMessage.error(response.data.message || '批量执行失败');
    }
  } catch (error) {
    console.error('批量执行失败:', error);
    ElMessage.error('批量执行失败');
  }
};

// 修改保存方法
const saveMap = async () => {
  try {
    const rawData = graph.value.save();
    
    // 格式化数据
    const formatNode = (node) => {
      return {
        id: node.id,
        label: node.label,
        type: node.type || 'mindmap-node',
        data: {
          ...node.data,
          position: {
            x: node.x || 0,
            y: node.y || 0,
            depth: node.depth || 0
          }
        },
        style: node.style || {},
        children: node.children ? node.children.map(child => formatNode(child)) : []
      };
    };

    // 构建格式化后的数据
    const formattedData = formatNode(rawData);

    // 构建要保存的数据结构
    const saveData = {
      name: formattedData.label,  // 使用根节点的标签作为脑图名称
      data: JSON.stringify(formattedData),
      project_id: projectId.value,
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString()
    };

    const response = await request.post('/api/mindmap/save', saveData);
    
    if (response.data.code === 200) {
      ElMessage.success('保存成功');
    } else {
      throw new Error(response.data.message || '保存失败');
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
const handleDragStart = (event, testCase) => {
  // 设置拖拽效果
  event.dataTransfer.effectAllowed = 'copy';
  
  // 将数据存储到临时变量中
  dragData.value = {
    id: testCase.case_id || testCase.id,
    title: testCase.title,
    method: testCase.method,
    api_path: testCase.api_path,
    priority: testCase.priority,
    status: testCase.status
  };
  
  // 添加拖拽时的视觉反馈
  event.target.classList.add('dragging');
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
        text: dragData.value.title,
        extractions: [],  // 后置提取
        params: []       // 前置参数
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

// 修改节点名称变更处理方法
const handleNodeNameChange = (value) => {
  if (selectedNode.value) {
    try {
      // 获取当前图数据
      const data = graph.value.save();
      
      // 找到并更新节点
      const node = findNode(data, selectedNode.value.id);
      if (node) {
        // 更新节点标签
        node.label = value;
        
        // 如果是根节点，同时更新数据中的文本属性
        if (node.id === 'root') {
          if (!node.data) node.data = {};
          node.data.text = value;
        }
        
        // 更新图数据
        graph.value.changeData(data);
        
        // 更新选中节点的数据
        selectedNode.value = {
          ...selectedNode.value,
          label: value,
          data: {
            ...selectedNode.value.data,
            text: value
          }
        };
      }
    } catch (error) {
      console.error('更新节点名称失败:', error);
      ElMessage.error('更新节点名称失败');
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

// 添加提取规则
const addExtraction = () => {
  if (!selectedNode.value.data.extractions) {
    selectedNode.value.data.extractions = [];
  }
  
  selectedNode.value.data.extractions.push({
    name: '',
    type: 'jsonpath',
    expression: ''
  });
  
  // 更新图数据
  const data = graph.value.save();
  const node = findNode(data, selectedNode.value.id);
  if (node) {
    node.data.extractions = selectedNode.value.data.extractions;
    graph.value.changeData(data);
  }
};

// 删除提取规则
const removeExtraction = (index) => {
  selectedNode.value.data.extractions.splice(index, 1);
  
  // 更新图数据
  const data = graph.value.save();
  const node = findNode(data, selectedNode.value.id);
  if (node) {
    node.data.extractions = selectedNode.value.data.extractions;
    graph.value.changeData(data);
  }
};

// 添加可用变量列表
const availableVariables = computed(() => {
  if (!selectedNode.value || !graph.value) {
    return [];
  }

  const variables = [];
  const data = graph.value.save();

  // 递归查找前置节点的提取变量
  const findPreviousVariables = (node, targetId) => {
    if (!node) return false;

    // 如果找到目标节点，返回true但不添加其变量
    if (node.id === targetId) {
      return true;
    }

    // 如果节点有提取规则，添加到变量列表
    if (node.data?.extractions) {
      node.data.extractions.forEach(extraction => {
        variables.push({
          id: `${node.id}-${extraction.name}`,
          nodeName: node.label,
          name: extraction.name,
          type: extraction.type
        });
      });
    }

    // 递归检查子节点
    if (node.children) {
      for (const child of node.children) {
        if (findPreviousVariables(child, targetId)) {
          return true;
        }
      }
    }

    return false;
  };

  // 从根节点开始查找
  findPreviousVariables(data, selectedNode.value.id);

  return variables;
});

// 添加参数相关方法
const addParam = () => {
  if (!selectedNode.value.data.params) {
    selectedNode.value.data.params = [];
  }
  
  selectedNode.value.data.params.push({
    name: '',
    source: '',
    defaultValue: ''
  });
  
  // 更新图数据
  const data = graph.value.save();
  const node = findNode(data, selectedNode.value.id);
  if (node) {
    node.data.params = selectedNode.value.data.params;
    graph.value.changeData(data);
  }
};

const removeParam = (index) => {
  selectedNode.value.data.params.splice(index, 1);
  
  // 更新图数据
  const data = graph.value.save();
  const node = findNode(data, selectedNode.value.id);
  if (node) {
    node.data.params = selectedNode.value.data.params;
    graph.value.changeData(data);
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
  grid-template-columns: 300px 1fr 350px;
  gap: 16px;
  height: calc(100vh - 200px);
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  overflow: hidden;
}

.content-container::before,
.content-container::after {
  display: none;
}

.content-container:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
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
  background-color: #fff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: #fafafa;
  text-align: center;
  flex-shrink: 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.panel-content {
  flex: 1;
  overflow: auto;
  position: relative;
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

.extractions-list {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.extraction-item {
  width: 100%;
  box-sizing: border-box;
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 12px;
}

.el-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 !important;
  width: 100%;
  box-sizing: border-box;
}

:deep(.el-button--small) {
  padding: 8px 16px;
  height: 32px;
  font-size: 13px;
}

:deep(.el-button--small.is-circle) {
  padding: 8px;
  width: 32px;
}

:deep(.el-button--primary.is-plain) {
  width: fit-content;
  align-self: center;
  margin-top: 8px;
}

.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color-lighter);
  border-radius: 3px;
}

:deep(.el-form-item:not(:last-child)) {
  position: relative;
}

:deep(.el-form-item:not(:last-child))::after {
  display: none;
}

/* 添加根节点特殊样式 */
:deep(.root-node) {
  font-weight: bold;
  font-size: 16px;
}

/* 修改用例列表样式 */
.case-item {
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: move;
  transition: all 0.3s ease;
  background-color: #fff;
}

.case-item:hover {
  background-color: var(--el-color-primary-light-9);
  transform: translateX(4px);
}

.case-item.dragging {
  opacity: 0.5;
  background-color: var(--el-color-primary-light-8);
}

.case-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.case-title {
  font-weight: 500;
  color: var(--el-text-color-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.case-path {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 优化滚动条样式 */
.list-content {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--el-border-color-lighter) transparent;
}

.list-content::-webkit-scrollbar {
  width: 6px;
}

.list-content::-webkit-scrollbar-track {
  background: transparent;
}

.list-content::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color-lighter);
  border-radius: 3px;
}

.params-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.param-item {
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background-color: var(--el-fill-color-lighter);
}

.param-item .el-row {
  display: flex;
  align-items: center;
}

.param-item .el-button {
  margin-left: 8px;
}

/* 调整滚动区域的样式 */
:deep(.el-scrollbar) {
  height: 100%;
}

:deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

:deep(.el-form) {
  height: auto;
  padding: 20px;
  box-sizing: border-box;
}

:deep(.el-form-item) {
  margin-bottom: 24px;
}

/* 调整行间距和对齐 */
.el-row {
  margin: 0 !important;
  width: 100%;
  box-sizing: border-box;
}

.el-col {
  padding: 0 4px;
  box-sizing: border-box;
}

/* 参数和提取规则卡片样式 */
.params-list,
.extractions-list {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.param-item,
.extraction-item {
  width: 100%;
  box-sizing: border-box;
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 0;
}

/* 行样式优化 */
.param-item .el-row,
.extraction-item .el-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
  width: 100%;
}

/* 列样式优化 */
.param-item .el-col,
.extraction-item .el-col {
  padding: 0 4px;
  min-width: 0;
}

/* 调整最后一列（删除按钮列）的样式 */
.param-item .el-col:last-child,
.extraction-item .el-col:last-child {
  flex: 0 0 32px;  /* 减小列宽 */
  width: 32px;
  padding-right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 删除按钮样式优化 */
:deep(.el-button--danger.is-circle) {
  width: 24px;  /* 减小按钮尺寸 */
  height: 24px;
  padding: 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}

/* 缩小删除按钮的图标 */
:deep(.el-button--danger.is-circle .el-icon) {
  margin: 0;
  font-size: 12px;  /* 减小图标大小 */
  width: 12px;      /* 设置图标宽度 */
  height: 12px;     /* 设置图标高度 */
}

/* 优化按钮悬停效果 */
:deep(.el-button--danger.is-circle:hover) {
  transform: scale(1.1);
  transition: transform 0.2s ease;
}

/* 输入框和选择框容器样式 */
:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
  width: 100%;
  box-shadow: none !important;
}

/* 调整输入框列的宽度比例 */
.param-item .el-col:nth-child(1),
.extraction-item .el-col:nth-child(1) {
  flex: 0 0 30%;  /* 参数名/变量名列 */
}

.param-item .el-col:nth-child(2),
.extraction-item .el-col:nth-child(2) {
  flex: 0 0 40%;  /* 来源变量/提取方式列 */
}

.param-item .el-col:nth-child(3),
.extraction-item .el-col:nth-child(3) {
  flex: 0 0 25%;  /* 默认值/提取表达式列 */
}

/* 确保图标在按钮中居中 */
:deep(.el-button--danger.is-circle .el-icon) {
  margin: 0;
  font-size: 16px;
}

/* 调整表单项标签的样式 */
:deep(.el-form-item__label) {
  padding-bottom: 8px;
  font-weight: 500;
}

/* 优化文本域的样式 */
:deep(.el-textarea__inner) {
  min-height: 80px;
}

/* 调整选择器的样式 */
:deep(.el-select) {
  width: 100%;
}

/* 确保表单项内容正确对齐和显示 */
:deep(.el-form-item__content) {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 调整后置提取区域的样式 */
:deep(.el-form-item.is-required .el-form-item__label) {
  color: var(--el-text-color-primary);
}

/* 确保添加按钮正确显示 */
.extractions-list .el-button {
  align-self: flex-start;
  margin-top: 8px;
}
</style> 