/**
 * Schedule Module - Domain Client
 * 调度模块 - 领域客户端
 *
 * 【规范说明】
 * - Private constructor with props object
 * - Static load(state: XxxState): Xxx
 * - Instance toDTO(): XxxClientDTO
 * - 封装客户端业务逻辑
 */

export * from './aggregates/index.js';
export * from './entities/index.js';
export * from '../domain-shared/value-objects';
