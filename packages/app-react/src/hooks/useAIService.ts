import { useAppClientRegistry } from '../providers/app-client-registry-provider';

export function useAIService() {
  return useAppClientRegistry().aiService;
}
