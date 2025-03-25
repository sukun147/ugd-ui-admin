import request from '@/config/axios'

// 类型定义
export interface KnowledgeNode {
  id: number
  name: string
  createdTime: string
  updatedTime: string
}

export interface NodeCreateReqVO {
  name: string
}

export interface NodeUpdateReqVO {
  id: number
  newName: string
}

export interface RelationshipInfo {
  sourceName: string
  targetName: string
  type: string
}

// 知识API
export const knowledgeApi = {
  // 获取所有节点
  getAllNodes: async () => {
    return await request.get({ url: '/tcmc/knowledge/node/list' })
  },

  // 根据ID获取节点
  getNodeById: async (id: number) => {
    return await request.get({ url: '/tcmc/knowledge/node/getById', params: { id } })
  },

  // 根据名称获取节点
  getNodeByName: async (name: string) => {
    return await request.get({ url: '/tcmc/knowledge/node/getByName', params: { name } })
  },

  // 搜索节点
  searchNodes: async (name: string) => {
    return await request.get({ url: '/tcmc/knowledge/node/search', params: { name } })
  },

  // 添加节点
  addNode: async (data: NodeCreateReqVO) => {
    return await request.post({ url: '/tcmc/knowledge/node/add', data })
  },

  // 更新节点
  updateNode: async (data: NodeUpdateReqVO) => {
    return await request.put({ url: '/tcmc/knowledge/node/update', data })
  },

  // 删除节点
  deleteNode: async (id: number) => {
    return await request.get({ url: '/tcmc/knowledge/node/delete', params: { id } })
  },

  // 删除所有节点
  deleteAllNodes: async () => {
    return await request.get({ url: '/tcmc/knowledge/node/deleteAll' })
  },

  // 获取所有关系
  getAllRelationships: async () => {
    return await request.get({ url: '/tcmc/knowledge/relationship/list' })
  },

  // 获取节点的出向关系
  getOutgoingRelationships: async (name: string) => {
    return await request.get({ url: '/tcmc/knowledge/relationship/outgoing', params: { name } })
  },

  // 获取节点的入向关系
  getIncomingRelationships: async (name: string) => {
    return await request.get({ url: '/tcmc/knowledge/relationship/incoming', params: { name } })
  },

  // 获取关系类型
  getRelationshipType: async (sourceName: string, targetName: string) => {
    return await request.get({
      url: '/tcmc/knowledge/relationship/getType',
      params: { sourceName, targetName }
    })
  },

  // 添加关系
  addRelationship: async (data: RelationshipInfo) => {
    return await request.post({ url: '/tcmc/knowledge/relationship/add', data })
  },

  // 删除关系
  deleteRelationship: async (sourceName: string, targetName: string, type: string) => {
    return await request.get({
      url: '/tcmc/knowledge/relationship/delete',
      params: { sourceName, targetName, type }
    })
  },

  // 删除两个节点间的所有关系
  deleteAllRelationshipsBetweenNodes: async (sourceName: string, targetName: string) => {
    return await request.get({
      url: '/tcmc/knowledge/relationship/deleteBetween',
      params: { sourceName, targetName }
    })
  },

  // 删除节点的所有关系
  deleteAllRelationshipsOfNode: async (name: string) => {
    return await request.get({
      url: '/tcmc/knowledge/relationship/deleteForNode',
      params: { name }
    })
  }
}
