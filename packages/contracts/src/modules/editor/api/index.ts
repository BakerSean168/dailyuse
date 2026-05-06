/**
 * Editor Module - API Request/Response DTOs
 * 编辑器模块 - API 请求/响应 DTO
 */

// ============ Zod Validation Schemas ============
export {
  CreateEditorWorkspaceSchema,
  type CreateEditorWorkspaceReq,
  UpdateEditorWorkspaceSchema,
  type UpdateEditorWorkspaceReq,
} from './editor-workspace.dto';

export { SearchEditorResourcesSchema, type SearchEditorResourcesReq } from './editor-search.dto';
export {
  CreateEditorSessionSchema,
  type CreateEditorSessionReq,
  UpdateEditorSessionSchema,
  type UpdateEditorSessionReq,
  CreateEditorGroupSchema,
  type CreateEditorGroupReq,
  UpdateEditorGroupSchema,
  type UpdateEditorGroupReq,
  CreateEditorTabSchema,
  type CreateEditorTabReq,
  UpdateEditorTabSchema,
  type UpdateEditorTabReq,
  SaveEditorContentSchema,
  type SaveEditorContentReq,
  ActivateEditorSessionParamsSchema,
  DeleteEditorGroupParamsSchema,
  ActivateEditorTabParamsSchema,
  DeleteEditorTabParamsSchema,
} from './editor-runtime.dto';

export * from './response-schemas';

// ============ API Request/Response DTOs (canonical source: api-requests.ts) ============
// Request type aliases (re-exported Zod-inferred types with Request naming):
//   CreateEditorWorkspaceRequest  = CreateEditorWorkspaceReq
//   UpdateEditorWorkspaceRequest  = UpdateEditorWorkspaceReq
//   CreateEditorSessionRequest    = CreateEditorSessionReq
//   UpdateEditorSessionRequest    = UpdateEditorSessionReq
//   CreateEditorGroupRequest      = CreateEditorGroupReq
//   UpdateEditorGroupRequest      = UpdateEditorGroupReq
//   CreateEditorTabRequest        = CreateEditorTabReq
//   UpdateEditorTabRequest        = UpdateEditorTabReq
export type {
  // Request type aliases (Zod-inferred)
  CreateEditorWorkspaceRequest,
  UpdateEditorWorkspaceRequest,
  CreateEditorSessionRequest,
  UpdateEditorSessionRequest,
  CreateEditorGroupRequest,
  UpdateEditorGroupRequest,
  CreateEditorTabRequest,
  UpdateEditorTabRequest,
  // Unique request types (no Zod schema)
  CreateSearchEngineRequest,
  UpdateSearchEngineProgressRequest,
  SearchRequest,
  CreateLinkedResourceRequest,
  UpdateLinkedResourceRequest,
  ValidateLinksRequest,
  // Response types
  ListEditorWorkspacesResponse,
  ListEditorSessionsResponse,
  ListResourceVersionsResponse,
  ListEditorGroupsResponse,
  ListEditorTabsResponse,
  SearchResponse,
  ListLinkedResourcesResponse,
  ValidateLinksResponse,
} from './api-requests';
