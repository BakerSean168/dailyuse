/**
 * Repository Application Service
 * @module application-client/repository
 */
import {
  CreateRepository,
  ListRepositories,
  GetRepository,
  UpdateRepository,
  DeleteRepository,
  SearchRepositories,
} from './services';

export class RepositoryApplicationService {
  async createRepository(request: any): Promise<any> {
    return CreateRepository.getInstance().execute(request);
  }
  async listRepositories(): Promise<any[]> {
    return ListRepositories.getInstance().execute();
  }
  async getRepository(uuid: string): Promise<any> {
    return GetRepository.getInstance().execute(uuid);
  }
  async updateRepository(uuid: string, request: any): Promise<any> {
    return UpdateRepository.getInstance().execute(uuid, request);
  }
  async deleteRepository(uuid: string): Promise<void> {
    return DeleteRepository.getInstance().execute(uuid);
  }
  async searchRepositories(query: string): Promise<any[]> {
    return SearchRepositories.getInstance().execute(query);
  }
}

export const repositoryApplicationService = new RepositoryApplicationService();
