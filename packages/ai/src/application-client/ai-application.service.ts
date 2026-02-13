/**
 * AI Application Service
 * @module application-client/ai
 *
 * Provides client-side AI operations through simple service methods.
 */

/**
 * AIApplicationService
 *
 * Client-side service for AI operations.
 * Use-case classes (CreateConversation, SendMessage, etc.) should be
 * imported directly from ./services for more granular control.
 */
export class AIApplicationService {
  async generateTaskName(_context: any): Promise<string> {
    throw new Error('AIApplicationService.generateTaskName not implemented. Use application-server services.');
  }
  async generateContent(_prompt: string): Promise<string> {
    throw new Error('AIApplicationService.generateContent not implemented. Use application-server services.');
  }
  async analyzeTasks(_tasks: any[]): Promise<any> {
    throw new Error('AIApplicationService.analyzeTasks not implemented. Use application-server services.');
  }
}

export const aiApplicationService = new AIApplicationService();