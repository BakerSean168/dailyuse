/**
 * Example Module - RPC Map
 * 
 * 【规范说明：RPC Map】
 * 定义模块处理的 RPC（远程过程调用）请求和响应类型
 * 用于模块间同步通信
 * 
 * 类型定义：'rpc-name': [RequestType, ResponseType]
 */

export type ExampleRpcMap = {
  /**
   * 检查 Example 是否存在
   * 请求：{ id: string }
   * 响应：boolean
   */
  'example:check-existence': [{ id: string }, boolean];

  /**
   * 获取 Example 基本信息
   * 请求：{ id: string }
   * 响应：{ name: string; status: string } | null
   */
  'example:get-basic-info': [
    { id: string },
    { name: string; status: string } | null
  ];

  /**
   * 批量获取 Example 信息
   * 请求：{ ids: string[] }
   * 响应：Array<{ id: string; name: string }>
   */
  'example:get-batch': [
    { ids: string[] },
    Array<{ id: string; name: string }>
  ];
};
