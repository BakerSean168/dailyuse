/**
 * Example Module - RPC Map
 * 
 * 【规范说明：RPC Map】
 * 定义模块处理的 RPC（远程过程调用）请求和响应类型
 * 用于模块间同步通信
 * 
 * 类型定义：'rpc-name': [RequestType, ResponseType]
 */

import type {
  CreateExampleReq,
  CreateExampleRes,
  UpdateExampleReq,
  UpdateExampleRes,
  GetExampleReq,
  GetExampleRes,
  DeleteExampleReq,
  DeleteExampleRes,
  ListExampleQuery,
  ListExampleRes,
} from '../api';

export type ExampleRpcMap = {
  // === CRUD Operations ===
  'example:create': [CreateExampleReq, CreateExampleRes];
  'example:update': [UpdateExampleReq, UpdateExampleRes];
  'example:get': [GetExampleReq, GetExampleRes];
  'example:delete': [DeleteExampleReq, DeleteExampleRes];
  'example:list': [ListExampleQuery, ListExampleRes];
};
