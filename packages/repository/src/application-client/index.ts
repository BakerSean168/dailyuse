/**
 * Repository Module - Application Client
 *
 * Use Cases for Repository (file/document) operations including:
 * - Repository management (list, get, file tree)
 * - Folder operations (create, get contents, delete)
 * - Resource operations (get, delete)
 * - Search functionality
 */

// Smart Container
export { RepositoryApplicationService, repositoryApplicationService } from './repository-application.service';
export { RepositoryClientService } from './repository-client-service';

export {
  // Repository
  ListRepositories,
  GetRepository,
  GetFileTree,
  SearchResources,
  
  // Folder
  CreateFolder,
  GetFolderContents,
  DeleteFolder,
  
  // Resource
  GetResource,
  DeleteResource,
} from './services';
