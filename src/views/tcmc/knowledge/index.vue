<template>
  <ContentWrap>
    <!-- 调试信息 -->
    <div class="mb-10px">
      <el-tag type="info" class="mr-10px">节点数量: {{ nodes.length }}</el-tag>
      <el-tag type="info">关系数量: {{ relationships.length }}</el-tag>
    </div>

    <!-- 操作按钮 -->
    <div class="mb-10px">
      <el-button type="primary" @click="openAddNodeDialog">
        <Icon icon="ep:plus" class="mr-5px" /> 添加节点
      </el-button>
      <el-button type="primary" @click="openAddRelationDialog">
        <Icon icon="ep:connection" class="mr-5px" /> 添加关系
      </el-button>
      <el-button @click="handleRefresh">
        <Icon icon="ep:refresh" class="mr-5px" /> 刷新图谱
      </el-button>
      <el-button type="success" @click="addTestData">
        <Icon icon="ep:data-line" class="mr-5px" /> 添加测试数据
      </el-button>
    </div>

    <!-- 知识图谱可视化区域 -->
    <div ref="graphContainer" class="knowledge-graph">
      <div v-if="loading" class="loading-overlay">
        <el-icon class="is-loading"><Loading /></el-icon>
        加载中...
      </div>
    </div>

    <!-- 添加节点对话框 -->
    <el-dialog v-model="addNodeDialog.visible" title="添加节点" width="500px">
      <el-form :model="addNodeDialog.form" label-width="80px">
        <el-form-item
          label="节点名称"
          prop="name"
          :rules="[{ required: true, message: '请输入节点名称' }]"
        >
          <el-input v-model="addNodeDialog.form.name" placeholder="请输入节点名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addNodeDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleAddNode">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加关系对话框 -->
    <el-dialog v-model="addRelationDialog.visible" title="添加关系" width="500px">
      <el-form :model="addRelationDialog.form" label-width="100px">
        <el-form-item
          label="源节点"
          prop="sourceName"
          :rules="[{ required: true, message: '请选择源节点' }]"
        >
          <el-select v-model="addRelationDialog.form.sourceName" placeholder="请选择源节点">
            <el-option v-for="node in nodes" :key="node.id" :label="node.name" :value="node.name" />
          </el-select>
        </el-form-item>
        <el-form-item
          label="目标节点"
          prop="targetName"
          :rules="[{ required: true, message: '请选择目标节点' }]"
        >
          <el-select v-model="addRelationDialog.form.targetName" placeholder="请选择目标节点">
            <el-option v-for="node in nodes" :key="node.id" :label="node.name" :value="node.name" />
          </el-select>
        </el-form-item>
        <el-form-item
          label="关系类型"
          prop="type"
          :rules="[{ required: true, message: '请输入关系类型' }]"
        >
          <el-input v-model="addRelationDialog.form.type" placeholder="请输入关系类型" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addRelationDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleAddRelation">确定</el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { knowledgeApi, type KnowledgeNode, type RelationshipInfo } from '@/api/tcmc/knowledge'
import * as d3 from 'd3'

// 状态定义
const nodes = ref<KnowledgeNode[]>([])
const relationships = ref<RelationshipInfo[]>([])
const graphContainer = ref<HTMLDivElement | null>(null)
const loading = ref(false)
let simulation: d3.Simulation<KnowledgeNode, undefined> | null = null

// 添加节点对话框
const addNodeDialog = ref({
  visible: false,
  form: {
    name: ''
  }
})

// 添加关系对话框
const addRelationDialog = ref({
  visible: false,
  form: {
    sourceName: '',
    targetName: '',
    type: ''
  }
})

// 防抖函数
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(null, args), delay)
  }
}

// 初始化数据
const initData = async () => {
  loading.value = true
  try {
    console.log('Fetching graph data...')
    const [nodesRes, relationshipsRes] = await Promise.all([
      knowledgeApi.getAllNodes(),
      knowledgeApi.getAllRelationships()
    ])

    console.log('Raw API response - nodes:', nodesRes)
    console.log('Raw API response - relationships:', relationshipsRes)

    // 将响应数据转换为普通对象
    nodes.value = Array.isArray(nodesRes)
      ? nodesRes.map((node) => ({
          ...node,
          name: String(node.name) // 确保名称是字符串类型
        }))
      : []

    relationships.value = Array.isArray(relationshipsRes)
      ? relationshipsRes.map((rel) => ({
          sourceName: String(rel.sourceName),
          targetName: String(rel.targetName),
          relationType: String(rel.relationType)
        }))
      : []

    console.log('Processed nodes:', nodes.value)
    console.log('Processed relationships:', relationships.value)

    // 数据验证
    if (relationships.value.length > 0) {
      const nodeNames = new Set(nodes.value.map((n) => n.name))
      const invalidRelationships = relationships.value.filter(
        (rel) => !nodeNames.has(rel.sourceName) || !nodeNames.has(rel.targetName)
      )

      if (invalidRelationships.length > 0) {
        console.warn('Found invalid relationships:', invalidRelationships)
      }
    }

    await nextTick()
    renderGraph()
  } catch (error) {
    console.error('Error fetching graph data:', error)
    ElMessage.error('获取知识图谱数据失败')
  } finally {
    loading.value = false
  }
}

// 渲染知识图谱
const renderGraph = () => {
  if (!graphContainer.value) {
    console.error('Graph container not found')
    return
  }

  // 清理之前的simulation
  if (simulation) {
    simulation.stop()
    simulation = null
  }

  // 清空已有内容
  d3.select(graphContainer.value).selectAll('*').remove()

  if (nodes.value.length === 0) {
    console.log('No nodes to render')
    return
  }

  console.log('Rendering graph with:', { nodes: nodes.value, relationships: relationships.value })

  const width = graphContainer.value.clientWidth
  const height = 600
  const radius = 30

  // 创建SVG容器
  const svg = d3
    .select(graphContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'max-width: 100%; height: auto;')

  console.log('SVG container created with dimensions:', { width, height })

  // 创建缩放行为
  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      container.attr('transform', event.transform)
    })

  svg.call(zoom)

  // 创建一个容器组来包含所有元素
  const container = svg.append('g')

  // 创建箭头标记
  svg
    .append('defs')
    .selectAll('marker')
    .data(['end'])
    .join('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', radius + 8)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#999')

  // 准备关系数据
  interface LinkData {
    source: KnowledgeNode
    target: KnowledgeNode
    relationType: string
  }

  const links: LinkData[] = []
  relationships.value.forEach((rel) => {
    // 将代理对象转换为普通对象
    const relationship = {
      sourceName: rel.sourceName,
      targetName: rel.targetName,
      relationType: rel.relationType
    }

    console.log('Processing relationship:', relationship)

    const sourceNode = nodes.value.find((n) => n.name === relationship.sourceName)
    const targetNode = nodes.value.find((n) => n.name === relationship.targetName)

    console.log('Found source node:', sourceNode)
    console.log('Found target node:', targetNode)

    if (sourceNode && targetNode) {
      links.push({
        source: sourceNode,
        target: targetNode,
        relationType: relationship.relationType
      })
      console.log('Added link:', {
        source: sourceNode.name,
        target: targetNode.name,
        relationType: relationship.relationType
      })
    } else {
      console.warn('Cannot create link:', {
        sourceName: relationship.sourceName,
        targetName: relationship.targetName,
        sourceFound: !!sourceNode,
        targetFound: !!targetNode
      })
    }
  })

  console.log('Final links array:', links)

  // 创建力导向布局
  simulation = d3
    .forceSimulation<KnowledgeNode>(nodes.value)
    .force(
      'link',
      d3
        .forceLink<KnowledgeNode, LinkData>(links)
        .id((d) => d.name)
        .distance(150)
    )
    .force('charge', d3.forceManyBody().strength(-1000))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(radius * 1.5))
    .alphaDecay(0.05)
    .velocityDecay(0.3)

  // 绘制关系线
  const linkGroup = container
    .append('g')
    .attr('class', 'links')
    .selectAll('g')
    .data(links)
    .join('g')

  // 添加关系线
  linkGroup
    .append('line')
    .attr('stroke', '#999')
    .attr('stroke-width', 1.5)
    .attr('marker-end', 'url(#arrow)')

  // 添加关系类型标签
  linkGroup
    .append('text')
    .attr('dy', -5)
    .attr('text-anchor', 'middle')
    .attr('fill', '#666')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .text((d) => d.relationType)

  // 创建节点组
  const nodeGroup = container
    .append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(nodes.value)
    .join('g')
    .call(
      d3
        .drag<any, KnowledgeNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
    )

  // 添加节点圆圈
  nodeGroup
    .append('circle')
    .attr('r', radius)
    .attr('fill', '#69b1ff')
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)

  // 添加节点文本
  nodeGroup
    .append('text')
    .attr('dy', '.35em')
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .text((d) => d.name)

  // 使用requestAnimationFrame优化tick更新
  let rafId: number
  let isSimulationRunning = true

  const updatePositions = () => {
    if (!isSimulationRunning) return

    // 更新连接线位置
    linkGroup
      .selectAll('line')
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y)

    // 更新关系标签位置
    linkGroup
      .selectAll('text')
      .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
      .attr('y', (d: any) => (d.source.y + d.target.y) / 2)

    // 更新节点位置
    nodeGroup.attr('transform', (d: any) => `translate(${d.x},${d.y})`)

    rafId = requestAnimationFrame(updatePositions)
  }

  if (simulation) {
    simulation.on('end', () => {
      isSimulationRunning = false
      cancelAnimationFrame(rafId)
    })
  }

  updatePositions()

  // 拖拽相关函数
  function dragstarted(event: any, d: KnowledgeNode) {
    if (!event.active && simulation) simulation.alphaTarget(0.3).restart()
    d.fx = event.x
    d.fy = event.y
  }

  function dragged(event: any, d: KnowledgeNode) {
    d.fx = event.x
    d.fy = event.y
  }

  function dragended(event: any, d: KnowledgeNode) {
    if (!event.active && simulation) simulation.alphaTarget(0)
    d.fx = null
    d.fy = null
  }
}

// 添加测试数据
const addTestData = async () => {
  try {
    // 添加测试节点
    const testNodes = [{ name: '石楠' }, { name: '药味' }, { name: '功效' }]

    console.log('Adding test nodes...')
    // 依次添加节点
    for (const node of testNodes) {
      console.log('Adding node:', node)
      await knowledgeApi.addNode(node)
    }

    // 添加测试关系
    const testRelationships = [
      { sourceName: '石楠', targetName: '药味', relationType: '苦' },
      { sourceName: '石楠', targetName: '功效', relationType: '清热' }
    ]

    console.log('Adding test relationships...')
    // 依次添加关系
    for (const rel of testRelationships) {
      console.log('Adding relationship:', rel)
      await knowledgeApi.addRelationship(rel)
    }

    // 等待一下以确保数据已经写入
    await new Promise((resolve) => setTimeout(resolve, 500))

    // 刷新图谱数据
    await initData()
    ElMessage.success('测试数据添加成功')
  } catch (error) {
    console.error('Error adding test data:', error)
    ElMessage.error('添加测试数据失败')
  }
}

// 添加节点
const openAddNodeDialog = () => {
  addNodeDialog.value.visible = true
  addNodeDialog.value.form.name = ''
}

const handleAddNode = async () => {
  const { name } = addNodeDialog.value.form
  if (!name) {
    ElMessage.warning('请输入节点名称')
    return
  }

  try {
    await knowledgeApi.addNode({ name })
    ElMessage.success('添加节点成功')
    addNodeDialog.value.visible = false
    initData()
  } catch (error) {
    console.error('Error adding node:', error)
    ElMessage.error('添加节点失败')
  }
}

// 添加关系
const openAddRelationDialog = () => {
  addRelationDialog.value.visible = true
  addRelationDialog.value.form = {
    sourceName: '',
    targetName: '',
    type: ''
  }
}

const handleAddRelation = async () => {
  const { sourceName, targetName, type } = addRelationDialog.value.form
  if (!sourceName || !targetName || !type) {
    ElMessage.warning('请填写完整的关系信息')
    return
  }

  if (sourceName === targetName) {
    ElMessage.warning('源节点和目标节点不能相同')
    return
  }

  try {
    const relationship = {
      sourceName: String(sourceName),
      targetName: String(targetName),
      relationType: String(type)
    }

    console.log('Adding new relationship:', relationship)
    await knowledgeApi.addRelationship(relationship)
    ElMessage.success('添加关系成功')
    addRelationDialog.value.visible = false
    await initData()
  } catch (error) {
    console.error('Error adding relationship:', error)
    ElMessage.error('添加关系失败')
  }
}

// 刷新图谱
const handleRefresh = debounce(() => {
  initData()
}, 300)

// 监听窗口大小变化的防抖函数
const debouncedResize = debounce(() => {
  if (nodes.value.length > 0) {
    renderGraph()
  }
}, 300)

// 生命周期钩子
onMounted(async () => {
  console.log('Component mounted')
  await nextTick()
  await initData()
  window.addEventListener('resize', debouncedResize)
})

onBeforeUnmount(() => {
  // 清理事件监听器
  window.removeEventListener('resize', debouncedResize)
  // 停止simulation
  if (simulation) {
    simulation.stop()
    simulation = null
  }
})
</script>

<style lang="scss" scoped>
.knowledge-graph {
  position: relative;
  width: 100%;
  height: 600px;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  z-index: 1;
  .el-icon {
    margin-right: 8px;
  }
}

:deep(svg) {
  width: 100%;
  height: 100%;
}

/* 优化节点和关系的交互效果 */
:deep(g) {
  cursor: pointer;

  circle {
    transition: fill 0.3s;
    &:hover {
      fill: #40a9ff;
    }
  }

  line {
    transition: stroke-width 0.3s;
    &:hover {
      stroke-width: 3;
    }
  }
}
</style>
