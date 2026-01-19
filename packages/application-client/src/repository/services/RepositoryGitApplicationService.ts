// @ts-nocheck
import { repositoryApiClient } from '../../infrastructure/api/repositoryApiClient';
import type { RepositoryServerDTO, ResourceServerDTO } from '@dailyuse/contracts/repository';

/**
 * 仓库 Git 操作应用服务
 * 用例：Git 状态查询、提交操作
 */
export class RepositoryGitApplicationService {
  /**
   * 用例：获取 Git 状态
   */
  async getGitStatus(repositoryUuid: string): Promise<GitStatusResponseDTO> {
    try {
      const statusDTO = await repositoryApiClient.getGitStatus(repositoryUuid);
      return statusDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取Git状态失败';
      console.error(errorMessage, error);
      throw error;
    }
  }

  /**
   * 用例：执行 Git 提交
   */
  async gitCommit(
    repositoryUuid: string,
    request: GitCommitRequestDTO,
  ): Promise<GitCommitResponseDTO> {
    try {
      const response = await repositoryApiClient.gitCommit(repositoryUuid, request);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Git提交失败';
      console.error(errorMessage, error);
      throw error;
    }
  }
}

// 导出单例
export const repositoryGitService = new RepositoryGitApplicationService();


