import type { AIModelInfo } from '@dailyuse/contracts/ai';

export interface ProviderModelCatalogInput {
  baseUrl: string;
  apiKey: string;
}

export interface IAIProviderModelCatalogPort {
  listModels(input: ProviderModelCatalogInput): Promise<AIModelInfo[]>;
}
