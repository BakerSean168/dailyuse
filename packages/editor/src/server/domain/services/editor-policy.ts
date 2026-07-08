import { BusinessRuleViolationError } from '@dailyuse/utils/errors';

export interface EditorPolicyOptions {
  maxOpenTabs?: number | null;
  allowedExtensions?: string[] | null;
}

export class EditorPolicy {
  public assertOpenTabLimit(currentOpenTabs: number, options?: EditorPolicyOptions): void {
    if (!options?.maxOpenTabs) {
      return;
    }

    if (currentOpenTabs >= options.maxOpenTabs) {
      throw new BusinessRuleViolationError('Maximum open tabs reached');
    }
  }

  public assertFileTypeAllowed(fileName: string, options?: EditorPolicyOptions): void {
    if (!options?.allowedExtensions || options.allowedExtensions.length === 0) {
      return;
    }

    const extension = EditorPolicy.extractExtension(fileName);
    if (!extension) {
      throw new BusinessRuleViolationError('File extension is required');
    }

    const normalized = options.allowedExtensions.map((ext) => ext.toLowerCase());
    if (!normalized.includes(extension)) {
      throw new BusinessRuleViolationError(`File extension ${extension} is not allowed`);
    }
  }

  private static extractExtension(fileName: string): string | null {
    const index = fileName.lastIndexOf('.');
    if (index <= 0 || index === fileName.length - 1) {
      return null;
    }
    return fileName.slice(index + 1).toLowerCase();
  }
}
