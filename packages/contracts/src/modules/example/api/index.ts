/**
 * Example Module - API Export
 * 
 * 【规范说明：API 层导出】
 * 导出顺序：Requests → Responses → Endpoints
 */

// ============ Request DTOs ============
export type {
  CreateExampleRequest,
  UpdateExampleRequest,
  ListExampleQuery,
} from './requests';

// ============ Response DTOs ============
export type {
  ExampleResponse,
  ListExampleResponse,
  CreateExampleResponse,
  UpdateExampleResponse,
  DeleteExampleResponse,
  ErrorResponse,
} from './responses';

// ============ API Endpoints & Routes ============
export {
  EXAMPLE_API_PREFIX,
  GET_EXAMPLE_ENDPOINT,
  LIST_EXAMPLES_ENDPOINT,
  CREATE_EXAMPLE_ENDPOINT,
  UPDATE_EXAMPLE_ENDPOINT,
  DELETE_EXAMPLE_ENDPOINT,
  EXAMPLE_API_ENDPOINTS,
} from './endpoints';
