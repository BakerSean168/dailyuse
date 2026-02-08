// Governance Module RPC Map
// Defines all RPC operations for the Governance module following Protocol → API layering

import type {
  CreateRuleReq,
  CreateRuleRes,
  UpdateRuleReq,
  UpdateRuleRes,
  GetRuleReq,
  GetRuleRes,
  DeleteRuleReq,
  DeleteRuleRes,
  ListRulesReq,
  ListRulesRes,
  SearchRulesReq,
  SearchRulesRes,
  FilterRulesByTagReq,
  FilterRulesByTagRes,
  FilterRulesByStatusReq,
  FilterRulesByStatusRes,
  GetRuleRevisionsReq,
  GetRuleRevisionsRes,
  DeprecateRuleReq,
  DeprecateRuleRes,
  ReactivateRuleReq,
  ReactivateRuleRes,
} from '../api';

/**
 * RPC Map for Governance module operations
 * 
 * Format: 'module:operation': [RequestType, ResponseType]
 * All types MUST be imported from ../api layer
 */
export interface GovernanceRpcMap {
  // Rule CRUD operations
  'rule:create': [CreateRuleReq, CreateRuleRes];
  'rule:update': [UpdateRuleReq, UpdateRuleRes];
  'rule:get': [GetRuleReq, GetRuleRes];
  'rule:delete': [DeleteRuleReq, DeleteRuleRes];
  'rule:list': [ListRulesReq, ListRulesRes];
  
  // Search and filter operations
  'rule:search': [SearchRulesReq, SearchRulesRes];
  'rule:filter-by-tag': [FilterRulesByTagReq, FilterRulesByTagRes];
  'rule:filter-by-status': [FilterRulesByStatusReq, FilterRulesByStatusRes];
  
  // Lifecycle operations
  'rule:deprecate': [DeprecateRuleReq, DeprecateRuleRes];
  'rule:reactivate': [ReactivateRuleReq, ReactivateRuleRes];
  
  // Audit operations
  'rule:get-revisions': [GetRuleRevisionsReq, GetRuleRevisionsRes];
}

export type GovernanceRpcOperation = keyof GovernanceRpcMap;
