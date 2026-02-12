/**
 * AI Application Service
 * @module application-client/ai
 */
import { GenerateTaskName, GenerateContent, AnalyzeTasks } from './services';

export class AIApplicationService {
  async generateTaskName(context: any): Promise<string> {
    return GenerateTaskName.getInstance().execute(context);
  }
  async generateContent(prompt: string): Promise<string> {
    return GenerateContent.getInstance().execute(prompt);
  }
  async analyzeTasks(tasks: any[]): Promise<any> {
    return AnalyzeTasks.getInstance().execute(tasks);
  }
}

export const aiApplicationService = new AIApplicationService();
