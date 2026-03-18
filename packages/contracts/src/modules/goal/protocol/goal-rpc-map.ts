/**
 * Goal Module - RPC Map Definition
 * 
 * 【规范说明：RPC 协议】
 * 所有 RPC 请求/响应类型必须从 ../api 导入，确保类型安全
 * RPC map 只定义 [Request, Response] 对，不包含内联类型定义
 */

import type {
  // Goal Operations
  CreateGoalReq,
  CreateGoalRes,
  GetGoalReq,
  GetGoalRes,
  ListGoalFilters,
  QueryGoalsRes,

  // Key Result Operations  
  AddKeyResultReq,
  AddKeyResultRes,
  GetKeyResultsReq,
  GetKeyResultsRes,

  // Goal Folder Operations
  CreateGoalFolderReq,
  CreateGoalFolderRes,
  ListGoalFolderFilters,
  QueryGoalFoldersRes,

  // Focus Session Operations
  GetFocusStatusReq,
  GetFocusStatusRes,
} from '../api';

/**
 * 定义 Goal 模块处理的 RPC 请求 [请求, 响应]
 * 
 * 【使用示例】
 * ```typescript
 * type Response = GoalRpcMap['goal:create'][1]; // CreateGoalRes
 * const req: GoalRpcMap['goal:create'][0] = { ... }; // CreateGoalReq
 * ```
 */
export type GoalRpcMap = {
  // Goal CRUD
  'goal:create': [CreateGoalReq, CreateGoalRes];
  'goal:get': [GetGoalReq, GetGoalRes];
  'goal:list': [ListGoalFilters, QueryGoalsRes];

  // Key Result Operations
  'key-result:add': [AddKeyResultReq, AddKeyResultRes];
  'key-result:list': [GetKeyResultsReq, GetKeyResultsRes];

  // Goal Folder Operations
  'goal-folder:create': [CreateGoalFolderReq, CreateGoalFolderRes];
  'goal-folder:list': [ListGoalFolderFilters, QueryGoalFoldersRes];

  // Focus Session Operations
  'focus:get-status': [GetFocusStatusReq, GetFocusStatusRes];
};

