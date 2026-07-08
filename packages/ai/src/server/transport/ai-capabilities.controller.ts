import type { Result } from '@dailyuse/contracts/result';
import type { AICapabilities } from '@dailyuse/contracts/ai';

interface AICapabilitiesControllerService {
  getCapabilities(): Promise<Result<AICapabilities>>;
}

export class AICapabilitiesController {
  constructor(private readonly service: AICapabilitiesControllerService) {}

  async get(): Promise<Result<AICapabilities>> {
    return this.service.getCapabilities();
  }
}
