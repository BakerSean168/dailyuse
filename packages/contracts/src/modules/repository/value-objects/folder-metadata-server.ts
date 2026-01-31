/**
 * Folder Metadata Value Object - Server
 * 文件夹元数据值对�?- 服务�?
 */

// ============ Server DTO ============
export interface FolderMetadataServerDTO {
  icon?: string;
  color?: string;
  [key: string]: unknown;
}

// ============ Server 接口 ============
export interface FolderMetadataServer {
  icon?: string;
  color?: string;
  [key: string]: unknown;
}

// ============ Server Static ============
