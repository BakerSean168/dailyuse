/**
 * Editor Module - Entities
 * 编辑器模块 - 实体统一导出
 */

// Resource Version Entity
export type {
  ResourceVersionServerDTO,
} from './resource-version-server';

export type { ResourceVersionClientDTO } from './resource-version-client';

// Editor Session Entity (⚠️ 实体，不是聚合根)
export type { EditorSessionServerDTO } from './editor-session-server';

export type { EditorSessionClientDTO } from './editor-session-client';

// Editor Group Entity
export type { EditorGroupServerDTO } from './editor-group-server';

export type { EditorGroupClientDTO } from './editor-group-client';

// Editor Tab Entity
export type { EditorTabServerDTO } from './editor-tab-server';

export type { EditorTabClientDTO } from './editor-tab-client';

// Search Engine Entity
export type { SearchEngineServerDTO } from './search-engine-server';

export type { SearchEngineClientDTO } from './search-engine-client';

// Linked Resource Entity
export type {
  LinkedResourceServerDTO,
} from './linked-resource-server';

export type { LinkedResourceClientDTO } from './linked-resource-client';
