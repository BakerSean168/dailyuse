/**
 * Example RPC Map
 */
import type {
  CreateItemReq, CreateItemRes,
  GetItemReq, GetItemRes
} from '../api';

export type ExampleRpcMap = {
  'example:create-item': [CreateItemReq, CreateItemRes];
  'example:get-item': [GetItemReq, GetItemRes];
};
