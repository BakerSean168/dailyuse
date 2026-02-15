import { BusinessRuleViolationError } from '@dailyuse/utils';

export interface StoragePolicyLimits {
  maxFileBytes?: number | null;
  maxTotalBytes?: number | null;
  forbiddenExtensions?: string[] | null;
}

export class StoragePolicy {
  private static defaultForbiddenExtensions = ['.exe', '.sh'];

  public assertFileSizeWithinLimit(sizeBytes: number, limits: StoragePolicyLimits): void {
    const maxFileBytes = limits.maxFileBytes ?? null;
    if (maxFileBytes !== null && sizeBytes > maxFileBytes) {
      throw new BusinessRuleViolationError('File size exceeds the maximum allowed size.');
    }
  }

  public assertQuotaWithinLimit(
    currentBytes: number,
    deltaBytes: number,
    limits: StoragePolicyLimits,
  ): void {
    const maxTotalBytes = limits.maxTotalBytes ?? null;
    if (maxTotalBytes !== null && currentBytes + deltaBytes > maxTotalBytes) {
      throw new BusinessRuleViolationError('Storage quota exceeded.');
    }
  }

  public assertExtensionAllowed(name: string, limits: StoragePolicyLimits): void {
    const forbidden =
      limits.forbiddenExtensions && limits.forbiddenExtensions.length > 0
        ? limits.forbiddenExtensions
        : StoragePolicy.defaultForbiddenExtensions;

    const extension = StoragePolicy.extractExtension(name);
    if (extension && forbidden.map((ext) => ext.toLowerCase()).includes(extension)) {
      throw new BusinessRuleViolationError(`File extension ${extension} is not allowed.`);
    }
  }

  private static extractExtension(name: string): string {
    const dotIndex = name.lastIndexOf('.');
    if (dotIndex <= 0) return '';
    return name.slice(dotIndex).toLowerCase();
  }
}
