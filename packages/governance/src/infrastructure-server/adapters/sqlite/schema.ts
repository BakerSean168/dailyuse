/**
 * SQLite Schema — Governance Module
 *
 * 列名：snake_case（与 SQLite 约定一致）
 * 日期：INTEGER（毫秒级 Unix epoch），与 goal 模块保持一致
 * JSON：TEXT（tags / good_examples / bad_examples / changed_fields 等）
 * 布尔：无（本模块暂无布尔字段）
 */

export const GOVERNANCE_MODULE_SCHEMA = `
-- ============================================================
-- Rules Table（规则聚合根）
-- ============================================================
CREATE TABLE IF NOT EXISTS rules (
  id                      TEXT PRIMARY KEY,
  code                    TEXT NOT NULL UNIQUE,
  title                   TEXT NOT NULL,
  description             TEXT NOT NULL,
  severity                TEXT NOT NULL DEFAULT 'Recommended',
  status                  TEXT NOT NULL DEFAULT 'Draft',
  deprecation_reason      TEXT,
  replacement_rule_id     TEXT,
  live_reference_location TEXT,
  tags                    TEXT NOT NULL DEFAULT '[]',
  good_examples           TEXT NOT NULL DEFAULT '[]',
  bad_examples            TEXT NOT NULL DEFAULT '[]',
  author_id               TEXT NOT NULL,
  created_at              INTEGER NOT NULL,
  updated_at              INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rules_code     ON rules(code);
CREATE INDEX IF NOT EXISTS idx_rules_status   ON rules(status);
CREATE INDEX IF NOT EXISTS idx_rules_severity ON rules(severity);
CREATE INDEX IF NOT EXISTS idx_rules_author   ON rules(author_id);

-- ============================================================
-- Rule Revisions Table（修订记录分表，不可变审计日志）
-- ============================================================
CREATE TABLE IF NOT EXISTS rule_revisions (
  id               TEXT    PRIMARY KEY,
  rule_id          TEXT    NOT NULL,
  revision_number  INTEGER NOT NULL,
  author_id        TEXT    NOT NULL,
  changed_fields   TEXT    NOT NULL DEFAULT '[]',
  previous_values  TEXT,
  new_values       TEXT,
  change_type      TEXT    NOT NULL,
  created_at       INTEGER NOT NULL,
  FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE,
  UNIQUE (rule_id, revision_number)
);

CREATE INDEX IF NOT EXISTS idx_rule_revisions_rule_id ON rule_revisions(rule_id);
`;
