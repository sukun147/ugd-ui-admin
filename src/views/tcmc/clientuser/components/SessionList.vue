<template>
  <!-- 列表 -->
  <ContentWrap>
    <el-table 
      v-loading="loading" 
      :data="list" 
      :stripe="true" 
      :show-overflow-tooltip="true"
      @row-click="handleViewQA"
    >
      <el-table-column label="主键" align="center" prop="id" />
      <el-table-column label="会话标题" align="center" prop="title" />
      <el-table-column
        label="创建时间" 
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
    </el-table>

    <!-- QA Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="60%">
      <div class="qa-container">
        <el-row v-for="(qa, index) in qaList" :key="index" class="qa-item">
          <el-col :span="12" class="qa-question">
            <el-card>
              <div class="qa-header">问题</div>
              <div class="qa-content">{{ qa.question }}</div>
            </el-card>
          </el-col>
          <el-col :span="12" class="qa-answer">
            <el-card>
              <div class="qa-header">回答</div>
              <div class="qa-content">{{ qa.answer }}</div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-dialog>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
</template>
<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { ClientUserApi } from '@/api/tcmc/clientuser'
import { QALogApi } from '@/api/tcmc/qalog'

interface QAItem {
  id: number
  question: string
  answer: string
  createTime: string
}

const props = defineProps<{
  userId?: number // 用户id（主表的关联字段）
}>()
const loading = ref(false) // 列表的加载中
const dialogVisible = ref(false) // Dialog显示状态
const dialogTitle = ref('') // Dialog标题
const qaList = ref<QAItem[]>([]) // QA列表
const list = ref([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined as unknown
})

/** 监听主表的关联字段的变化，加载对应的子表数据 */
watch(
  () => props.userId,
  (val: number) => {
    if (!val) {
      return
    }
    queryParams.userId = val
    handleQuery()
  },
  { immediate: true, deep: true }
)

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ClientUserApi.getSessionPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 查看QA */
const handleViewQA = async (row) => {
  dialogTitle.value = row.title
  dialogVisible.value = true
  try {
    const data = await QALogApi.getQALogList(row.id)
    qaList.value = data
  } catch (error) {
    console.error('获取QA日志失败', error)
  }
}
</script>

      <style scoped>
      .qa-container {
        max-height: 60vh;
        overflow-y: auto;
        padding: 10px;
      }
      .qa-item {
        margin-bottom: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .qa-answer {
        align-self: flex-start;
        max-width: 80%;
      }
      .qa-question {
        align-self: flex-end;
        max-width: 80%;
      }
      .qa-question .el-card {
        background-color: #409EFF;
        color: white;
        border-radius: 12px 12px 0 12px;
      }
      .qa-answer .el-card {
        background-color: #f5f7fa;
        border-radius: 12px 12px 12px 0;
      }
      .qa-header {
        font-weight: bold;
        margin-bottom: 8px;
        color: inherit;
      }
      .qa-content {
        white-space: pre-wrap;
        word-break: break-word;
      }
      </style>
