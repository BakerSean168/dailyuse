/**
 * Governance Module - RPC Map
 * 规则治理模块 - RPC 映射
 * 
 * 【规范说明：RPC Map】
 * 定义模块处理的 RPC（远程过程调用）请求和响应类型
 * 用于模块间同步通信
 * 
 * 类型定义：'rpc-name': [RequestType, ResponseType]
 */

import type {
  CreateRuleReq,
  CreateRuleRes,
  UpdateRuleReq,
  UpdateRuleRes,
  GetRuleReq,
  GetRuleRes,
  DeleteRuleReq,
  DeleteRuleRes,
  ListRulesQuery,
  ListRulesRes,
  SearchRulesQuery,
  SearchRulesRes,
  GetRuleRevisionsQuery,
  GetRuleRevisionsRes,
  GetRuleRevisionReq,
  GetRuleRevisionRes,
} from '../api';

export type GovernanceRpcMap = {
  // ===== Rule CRUD Operations =====
  
  /** 创建规则 */
  'governance:rule:create': [CreateRuleReq, CreateRuleRes];
  
  /** 更新规则 */
  'governance:rule:update': [UpdateRuleReq, UpdateRuleRes];
  
  /** 获取单个规则 */
  'governance:rule:get': [GetRuleReq, GetRuleRes];
  
  /** 删除规则 */
  'governance:rule:delete': [DeleteRuleReq, DeleteRuleRes];
  
  /** 列出规则 */
  'governance:rule:list': [ListRulesQuery, ListRulesRes];
  
  /** 搜索规则 */
  'governance:rule:search': [SearchRulesQuery, SearchRulesRes];
  
  // ===== Rule Revision Query Operations =====
  
  /** 获取规则修订历史 */
  'governance:rule-revision:list': [GetRuleRevisionsQuery, GetRuleRevisionsRes];
  
  /** 获取单个修订记录详情 */
  'governance:rule-revision:get': [GetRuleRevisionReq, GetRuleRevisionRes];
};
