/**
 * Result Pattern - unified result types and protocol adapters.
 *
 * @module @dailyuse/contracts/result
 */

export * from './core';

export { toIpcResult, fromIpcResult, isIpcResultEnvelope, createIpcClientWrapper, type IpcResult } from './ipc';

export {
  toHttpResponse,
  fromHttpResponse,
  getHttpStatusCode,
  errorCodeToHttpStatus,
  HttpResponseBuilder,
  createHttpResponseBuilder,
  isClientError,
  isServerError,
  ResultCodeToHttpStatus,
  type HttpResponse,
  type HttpResponseOptions,
} from './http';

export {
  type ActionResult,
  type ActionResultWithData,
  type CountResult,
  type BatchActionResult,
  type BatchFailure,
  type DeleteResult,
  type ValidationResult,
  type SyncResult,
  type ImportExportResult,
  actionOk,
  actionFail,
  countResult,
  batchActionResult,
  isActionOk,
  isActionFail,
} from './action';
