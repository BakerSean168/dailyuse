/**
 * AIAssistantIpcAdapter — residual 347.
 * Desktop AssistantFacade stream channels are not registered yet; fail closed
 * with NOT_SUPPORTED so UI cannot pretend Host dispatch works over IPC.
 */
import type { AssistantClientCommand, AssistantEvent } from '@dailyuse/contracts/ai';
import type { IAIAssistantApiClient, IResultIpcClient } from '../types';
import { createResultClientError } from '../result-client-error';

export class AIAssistantIpcAdapter implements IAIAssistantApiClient {
  constructor(private readonly _ipcClient: IResultIpcClient) {
    void this._ipcClient;
  }

  async dispatchAssistant(
    _command: AssistantClientCommand,
    _handlers: {
      onEvent?: (event: AssistantEvent) => void;
      onDone?: (result: { eventCount: number }) => void;
    },
    _signal?: AbortSignal,
  ): Promise<void> {
    throw createResultClientError(
      'AssistantFacade dispatch is not supported over Desktop IPC yet; use Web HTTP transport',
      'NOT_SUPPORTED',
    );
  }
}
