/**
 * Editor Module - Entities
 * 编辑器模块 - 实体统一导出
 */

// Document Entity
export type {
  DocumentServerDTO,
  DocumentPersistenceDTO,
  DocumentServer,
} from './document-server';

export type {
  DocumentClientDTO,
  DocumentClient,
} from './document-client';

// Document Version Entity
export type {
  DocumentVersionServerDTO,
  DocumentVersionPersistenceDTO,
  DocumentVersionServer,
} from './document-version-server';

export type {
  DocumentVersionClientDTO,
  DocumentVersionClient,
} from './document-version-client';

// Editor Session Entity (⚠️ 实体，不是聚合根)
export type {
  EditorSessionServerDTO,
  EditorSessionPersistenceDTO,
} from './editor-session-server';

export type {
  EditorSessionClientDTO,
  EditorSessionClient,
} from './editor-session-client';

// Editor Group Entity
export type {
  EditorGroupServerDTO,
  EditorGroupPersistenceDTO,
  EditorGroupServer,
} from './editor-group-server';

export type {
  EditorGroupClientDTO,
  EditorGroupClient,
} from './editor-group-client';

// Editor Tab Entity
export type {
  EditorTabServerDTO,
  EditorTabPersistenceDTO,
  EditorTabServer,
} from './editor-tab-server';

export type {
  EditorTabClientDTO,
  EditorTabClient,
} from './editor-tab-client';

// Search Engine Entity
export type {
  SearchEngineServerDTO,
  SearchEnginePersistenceDTO,
  SearchEngineServer,
} from './search-engine-server';

export type {
  SearchEngineClientDTO,
  SearchEngineClient,
} from './search-engine-client';

// Linked Resource Entity
export type {
  LinkedResourceServerDTO,
  LinkedResourcePersistenceDTO,
  LinkedResourceServer,
} from './linked-resource-server';

export type {
  LinkedResourceClientDTO,
  LinkedResourceClient,
} from './linked-resource-client';
