import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { IRepositoryContentPort } from '../../ports/i-repository-content-port';

/**
 * SaveEditorContentUseCase
 * Saves content for a given resource.
 */
export class SaveEditorContentUseCase {
  constructor(private readonly repositoryContentPort: IRepositoryContentPort) {}

  async execute(resourceId: string, content: string): Promise<Result<void>> {
    await this.repositoryContentPort.saveContent({ resourceId, content });
    return ok(undefined);
  }
}
