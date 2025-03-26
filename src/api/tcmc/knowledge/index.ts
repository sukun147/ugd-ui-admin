import request from '@/config/axios'

export interface KnowledgeNode {
  id?: string | number
  name: string
}

export interface RelationshipInfo {
  sourceName: string
  targetName: string
  relationType: string
}

export const knowledgeApi = {
  getAllNodes: () => {
    return request.get({ url: '/tcmc/knowledge/node/list' })
  },

  getAllRelationships: () => {
    return request.get({ url: '/tcmc/knowledge/relationship/list' })
  },

  addNode: (data: KnowledgeNode) => {
    return request.post({ url: '/tcmc/knowledge/node/add', data })
  },

  addRelationship: (data: RelationshipInfo) => {
    return request.post({ url: '/tcmc/knowledge/relationship/add', data })
  }
}
