/**
 * Editor Module - Entities
 * 编辑器模块 - 实体统一导出
 */

// Document Entity
export type {
  DocumentServerDTO,
  DocumentPersistenceDTO,
} from './document-server';

export type {
  DocumentClientDTO,
} from './document-client';

// Document Version Entity
export type {
  DocumentVersionServerDTO,
  DocumentVersionPersistenceDTO,
} from './document-version-server';

export type {
  DocumentVersionClientDTO,
} from './document-version-client';

// Editor Session Entity (⚠️ 实体，不是聚合根)
export type {
  EditorSessionServerDTO,
  EditorSessionPersistenceDTO,
} from './editor-session-server';

export type {
  EditorSessionClientDTO,
} from './editor-session-client';

// Editor Group Entity
export type {
  EditorGroupServerDTO,
  EditorGroupPersistenceDTO,
} from './editor-group-server';

export type {
  EditorGroupClientDTO,
} from './editor-group-client';

// Editor Tab Entity
export type {
  EditorTabServerDTO,
  EditorTabPersistenceDTO,
} from './editor-tab-server';

export type {
  EditorTabClientDTO,
} from './editor-tab-client';

// Search Engine Entity
export type {
  SearchEngineServerDTO,
  SearchEnginePersistenceDTO,
} from './search-engine-server';

export type {
  SearchEngineClientDTO,
} from './search-engine-client';

// Linked Resource Entity
export type {
  LinkedResourceServerDTO,
  LinkedResourcePersistenceDTO,
} from './linked-resource-server';

export type {
  LinkedResourceClientDTO,
} from './linked-resource-client';
