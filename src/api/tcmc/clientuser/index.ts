import request from '@/config/axios'

// 问诊用户 VO
export interface ClientUserVO {}

// 问诊用户 API
export const ClientUserApi = {
  // 查询问诊用户分页
  getClientUserPage: async (params: any) => {
    return await request.get({ url: `/tcmc/client-user/page`, params })
  },

  // ==================== 子表（用户会话） ====================

  // 获得用户会话分页
  getSessionPage: async (params) => {
    return await request.get({ url: `/tcmc/client-user/session/page`, params })
  }
}
