import { describe, expect, it } from 'vitest';
import { ReminderResponse } from '../reminder-response';
import { ReminderResponseId } from '../../../domain-shared/value-objects/reminder-response-id';

describe('ReminderResponse entity', () => {
  it('creates responses with optional timestamps and serializes them', () => {
    const response = ReminderResponse.create({
      reminderTemplateId: 'template-1',
      identityId: 'identity-1',
      action: 'CLICKED',
      responseTime: 45_000,
      timestamp: 1_000,
    });

    expect(response.reminderTemplateId).toBe('template-1');
    expect(response.identityId).toBe('identity-1');
    expect(response.timestamp.getTime()).toBe(1_000);
    expect(response.responseTime?.getTime()).toBe(45_000);
    expect(response.toServerDTO()).toEqual({
      id: response.id,
      reminderTemplateId: 'template-1',
      identityId: 'identity-1',
      action: 'CLICKED',
      responseTime: 45_000,
      timestamp: 1_000,
    });
  });

  it('covers response predicates and weight mapping for all actions', () => {
    const actions = [
      { action: 'CLICKED' as const, weight: 1.0, positive: true, method: 'isClicked' as const },
      { action: 'IGNORED' as const, weight: -0.5, negative: true, method: 'isIgnored' as const },
      { action: 'SNOOZED' as const, weight: -0.2, method: 'isSnoozed' as const },
      { action: 'DISMISSED' as const, weight: -0.3, negative: true, method: 'isDismissed' as const },
      { action: 'COMPLETED' as const, weight: 1.5, positive: true, method: 'isCompleted' as const },
    ];

    for (const entry of actions) {
      const response = ReminderResponse.create({
        reminderTemplateId: 'template-1',
        identityId: 'identity-1',
        action: entry.action,
      });

      expect(response[entry.method]()).toBe(true);
      expect(response.getResponseWeight()).toBe(entry.weight);
      expect(response.isPositiveResponse()).toBe(entry.positive ?? false);
      expect(response.isNegativeResponse()).toBe(entry.negative ?? false);
    }
  });

  it('returns client DTOs with semantic fields only', () => {
    const dto = ReminderResponse.create({
      reminderTemplateId: 'template-1',
      identityId: 'identity-1',
      action: 'CLICKED',
      responseTime: 30_000,
    }).toClientDTO();

    expect(dto).toEqual({
      id: dto.id,
      reminderTemplateId: 'template-1',
      action: 'CLICKED',
      responseTime: 30_000,
      timestamp: dto.timestamp,
    });
  });

  it('loads persisted state and preserves null response times', () => {
    const loaded = ReminderResponse.load({
      id: ReminderResponseId.generate(),
      reminderTemplateId: 'template-2',
      identityId: 'identity-2',
      action: 'DISMISSED',
      responseTime: null,
      timestamp: new Date(2_000),
    });

    expect(loaded.responseTime).toBeNull();
    expect(loaded.toClientDTO()).toEqual({
      id: loaded.id,
      reminderTemplateId: 'template-2',
      action: 'DISMISSED',
      responseTime: null,
      timestamp: 2_000,
    });
  });
});
