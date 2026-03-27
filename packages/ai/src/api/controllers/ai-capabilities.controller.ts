import { ok } from '@dailyuse/contracts/result';
import type { AICapabilities } from '@dailyuse/contracts/ai';

interface AICapabilitiesControllerService {
  getCapabilities(): Promise<AICapabilities>;
}

export class AICapabilitiesController {
  constructor(private readonly service: AICapabilitiesControllerService) {}

  async get() {
    return ok(await this.service.getCapabilities());
  }
}
