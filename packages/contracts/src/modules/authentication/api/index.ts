/**
 * Authentication API - Unified Exports
 * 
 * 统一导出所有认证相关的 API 定义
 * 使用方式: import { LoginByEmailReq, RegisterByEmailReq } from '@contracts/authentication/api';
 */

// 从 feature-based DTO files 导出
export * from './login.dto';
export * from './register.dto';
export * from './password.dto';
export * from './oauth.dto';
export * from './session.dto';
