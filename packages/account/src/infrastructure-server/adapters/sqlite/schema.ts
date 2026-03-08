/**
 * SQLite Database Schema - Account Module
 */

export const ACCOUNT_MODULE_SCHEMA = `
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  email_address TEXT,
  email_is_verified INTEGER NOT NULL DEFAULT 0,
  email_verified_at INTEGER,
  email_is_primary INTEGER NOT NULL DEFAULT 1,
  phone_country_code TEXT,
  phone_number TEXT,
  phone_full_number TEXT,
  phone_is_verified INTEGER NOT NULL DEFAULT 0,
  phone_verified_at INTEGER,
  display_name TEXT,
  avatar_url TEXT,
  profile TEXT,
  settings TEXT,
  locale TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  status TEXT DEFAULT 'ACTIVE',
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username);
CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
CREATE INDEX IF NOT EXISTS idx_accounts_email_address ON accounts(email_address);
CREATE INDEX IF NOT EXISTS idx_accounts_phone_full_number ON accounts(phone_full_number);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
`;