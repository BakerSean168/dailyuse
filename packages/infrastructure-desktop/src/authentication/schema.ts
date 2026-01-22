/**
 * SQLite Database Schema - Authentication Module
 * 认证模块数据库架构
 */

export const AUTHENTICATION_MODULE_SCHEMA = `
-- Auth Sessions Table
CREATE TABLE IF NOT EXISTS auth_sessions (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  access_token TEXT NOT NULL UNIQUE,
  refresh_token TEXT UNIQUE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_account_uuid ON auth_sessions(account_uuid);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_access_token ON auth_sessions(access_token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_refresh_token ON auth_sessions(refresh_token);

-- Auth Credentials Table
CREATE TABLE IF NOT EXISTS auth_credentials (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  credential_type TEXT NOT NULL,
  credential_value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  verified_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_credentials_account_uuid ON auth_credentials(account_uuid);
CREATE INDEX IF NOT EXISTS idx_auth_credentials_status ON auth_credentials(status);
`;
