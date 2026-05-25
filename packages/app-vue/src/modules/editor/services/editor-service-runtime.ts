import type { IEditorService } from '../../../di/types';

let activeEditorService: IEditorService | null = null;

export function setEditorRuntimeService(service: IEditorService): void {
  activeEditorService = service;
}

export function getEditorRuntimeService(): IEditorService {
  if (!activeEditorService) {
    throw new Error('Editor service is not initialized');
  }

  return activeEditorService;
}
