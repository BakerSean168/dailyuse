import { describe, expect, it, vi } from 'vitest';
import { ok } from '@memoflow/contracts/result';
import type { IResultHttpClient } from '@memoflow/http-client';
import type { ReminderTemplateClientDTO, UpdateReminderTemplateReq } from '@memoflow/contracts/reminder';
import { ReminderHttpAdapter } from './reminder-http.adapter';

function createHttpClientStub(overrides?: Partial<IResultHttpClient>): IResultHttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    stream: vi.fn(),
    ...overrides,
  };
}

describe('ReminderHttpAdapter', () => {
  it('updates reminder templates with the registered PUT route', async () => {
    const response = { id: 'template-1', name: 'Updated reminder' } as ReminderTemplateClientDTO;
    const put = vi.fn().mockResolvedValue(ok(response));
    const patch = vi.fn();
    const httpClient = createHttpClientStub({ put, patch });
    const adapter = new ReminderHttpAdapter(httpClient);
    const request = { title: 'Updated reminder' } satisfies UpdateReminderTemplateReq;

    await expect(adapter.updateReminderTemplate('template-1', request)).resolves.toEqual(ok(response));

    expect(put).toHaveBeenCalledWith('/reminders/templates/template-1', request);
    expect(patch).not.toHaveBeenCalled();
  });
});
