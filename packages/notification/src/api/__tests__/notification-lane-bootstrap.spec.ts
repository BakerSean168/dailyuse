import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Router } from 'express';
import { createNotificationApiModule } from '../module';
import { CapabilityMissingStartupException } from '@memoflow/contracts/reliable-messaging';

function createMockContext(overrides: Record<string, unknown> = {}) {
  const router = Router();
  const db = {} as any;
  const middleware = {
    auth: vi.fn(),
    requireRole: vi.fn(() => vi.fn()),
  } as any;

  return {
    app: {} as any,
    router,
    db,
    middleware,
    openApiRegistry: { registerPath: vi.fn(), register: vi.fn() } as any,
    closureChecker: async () => false,
    ...overrides,
  };
}

describe('Notification Module Lane Ownership Bootstrap (P0-1)', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('1. Undeclared lane capability in production fails fast due to missing Desktop/Push transport (default safety)', () => {
    const context = createMockContext();
    const laneModule = createNotificationApiModule({
      closureChecker: async () => false,
    });
    expect(() => laneModule.register(context as any)).toThrow(
      CapabilityMissingStartupException,
    );
  });

  it('2. Production bootstrap succeeds when lane capability (InApp) is explicitly declared', () => {
    const context = createMockContext();
    const laneModule = createNotificationApiModule({
      closureChecker: async () => false,
      channelCapabilities: [
        {
          channelType: 'InApp',
          status: 'available',
          requiredInProduction: true,
        },
      ],
    });

    expect(() => laneModule.register(context as any)).not.toThrow();
  });

  it('3. Production bootstrap succeeds when channelCapabilities are supplied via module context', () => {
    const context = createMockContext({
      closureChecker: async () => false,
      channelCapabilities: [
        {
          channelType: 'InApp',
          status: 'available',
          requiredInProduction: true,
        },
      ],
    });
    const laneModule = createNotificationApiModule({
      closureChecker: async () => false,
    });

    expect(() => laneModule.register(context as any)).not.toThrow();
  });

  it('4. Registration fails fast when closureChecker is missing', () => {
    const context = createMockContext({ closureChecker: undefined });
    const laneModule = createNotificationApiModule();
    expect(() => laneModule.register(context as any)).toThrow(
      '[FAIL-CLOSED] NotificationApiModule requires options.closureChecker or context.closureChecker',
    );
  });
});
