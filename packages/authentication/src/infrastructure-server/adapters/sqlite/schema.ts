/**
 * Authentication Module - SQLite Schema
 *
 * Tables: auth_identities, auth_identifiers, auth_credentials,
 *         auth_oauth_bindings, auth_sessions.
 */

export const AUTHENTICATION_MODULE_SCHEMA = `
-- ─── auth_identities (aggregate root) ───
CREATE TABLE IF NOT EXISTS auth_identities (
  id                    TEXT PRIMARY KEY,
  status                TEXT NOT NULL DEFAULT 'Unverified',
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  last_failed_attempt   INTEGER,
  locked_until          INTEGER,
  version               INTEGER NOT NULL DEFAULT 1,
  created_at            INTEGER NOT NULL,
  updated_at            INTEGER NOT NULL,
  deleted_at            INTEGER
);

-- ─── auth_identifiers (sub-entity: email / phone) ───
CREATE TABLE IF NOT EXISTS auth_identifiers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  identity_id TEXT NOT NULL,
  type        TEXT NOT NULL,
  value       TEXT NOT NULL,
  is_verified INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (identity_id) REFERENCES auth_identities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_auth_identifiers_identity
  ON auth_identifiers(identity_id);
CREATE INDEX IF NOT EXISTS idx_auth_identifiers_type_value
  ON auth_identifiers(type, value);

-- ─── auth_credentials (sub-entity: password) ───
CREATE TABLE IF NOT EXISTS auth_credentials (
  id                      TEXT PRIMARY KEY,
  identity_id             TEXT NOT NULL,
  type                    TEXT NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'Active',
  password_hash           TEXT,
  password_last_changed_at INTEGER,
  created_at              INTEGER NOT NULL,
  last_used_at            INTEGER,
  FOREIGN KEY (identity_id) REFERENCES auth_identities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_auth_credentials_identity
  ON auth_credentials(identity_id);

-- ─── auth_oauth_bindings (sub-entity) ───
CREATE TABLE IF NOT EXISTS auth_oauth_bindings (
  id                  TEXT PRIMARY KEY,
  identity_id         TEXT NOT NULL,
  provider            TEXT NOT NULL,
  provider_subject_id TEXT NOT NULL,
  access_token        TEXT,
  refresh_token       TEXT,
  expires_at          INTEGER,
  created_at          INTEGER NOT NULL,
  last_used_at        INTEGER,
  FOREIGN KEY (identity_id) REFERENCES auth_identities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_auth_oauth_bindings_identity
  ON auth_oauth_bindings(identity_id);
CREATE INDEX IF NOT EXISTS idx_auth_oauth_bindings_provider
  ON auth_oauth_bindings(provider, provider_subject_id);

-- ─── auth_sessions (separate aggregate) ───
CREATE TABLE IF NOT EXISTS auth_sessions (
  id                 TEXT PRIMARY KEY,
  identity_id        TEXT NOT NULL,
  refresh_token_hash TEXT,
  device_id          TEXT NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_type        TEXT NOT NULL,
  device_name        TEXT,
  os                 TEXT,
  browser            TEXT,
  ip_address         TEXT,
  location           TEXT,
  version            INTEGER NOT NULL DEFAULT 1,
  created_at         INTEGER NOT NULL,
  expires_at         INTEGER NOT NULL,
  last_active_at     INTEGER NOT NULL,
  deleted_at         INTEGER,
  FOREIGN KEY (identity_id) REFERENCES auth_identities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_identity
  ON auth_sessions(identity_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires
  ON auth_sessions(expires_at);
`;
