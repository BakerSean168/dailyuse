/**
 * SQLite Database Schema - Account Module
 * 璐︽埛妯″潡鏁版嵁搴撴灦鏋?
 */

export const ACCOUNT_MODULE_SCHEMA = `
-- Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
  uuid TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  display_name TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username);
CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
`;
