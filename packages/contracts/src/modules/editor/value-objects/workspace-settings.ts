/**
 * Workspace Settings Value Object
 */

// ============ Interface Definition ============

/** Workspace Settings interface. */
export interface IWorkspaceSettings {
  theme: string | null;
  fontSize: number | null;
  fontFamily: string | null;
  lineHeight: number | null;
  tabSize: number | null;
  wordWrap: boolean | null;
  lineNumbers: boolean | null;
  minimap: boolean | null;
  autoSave: {
    enabled: boolean;
    interval: number; // In seconds
  } | null;

  // Value object methods
  with(
    updates: Partial<
      Omit<
        IWorkspaceSettings,
        'equals' | 'with' | 'toDTO'
      >
    >,
  ): IWorkspaceSettings;
}

// ============ DTO Definition ============

/**
 * Workspace Settings DTO
 */
export interface WorkspaceSettingsDTO {
  theme: string | null;
  fontSize: number | null;
  fontFamily: string | null;
  lineHeight: number | null;
  tabSize: number | null;
  wordWrap: boolean | null;
  lineNumbers: boolean | null;
  minimap: boolean | null;
  autoSave: {
    enabled: boolean;
    interval: number;
  } | null;
}

// ============ Defaults ============

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettingsDTO = {
  theme: 'default',
  fontSize: 14,
  fontFamily: 'Consolas, "Courier New", monospace',
  lineHeight: 1.5,
  tabSize: 2,
  wordWrap: true,
  lineNumbers: true,
  minimap: true,
  autoSave: {
    enabled: true,
    interval: 30,
  },
};
