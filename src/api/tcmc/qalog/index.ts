import request from '@/config/axios'

// 问答日志 API
export const QALogApi = {
  // 查询问答日志列表
  getQALogList: async (sessionId: number) => {
    return await request.get({ url: `/tcmc/QA-log/list?sessionId=` + sessionId })
  }
}
