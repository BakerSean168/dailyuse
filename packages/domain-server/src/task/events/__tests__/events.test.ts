/**
 * Task 模块事件导出验证测试
 * 验证事件类型的正确性和完整性
 */

import {
  TaskInstanceCompletedEvent,
  TaskTemplateCreatedEvent,
  TaskTemplateDeletedEvent,
  TaskTemplatePausedEvent,
  TaskTemplateResumedEvent,
  TaskTemplateScheduleChangedEvent,
  TaskModuleEvent,
  TaskEventTypes,
} from '../index';

describe('Task Events Module', () => {
  describe('Event Types Export', () => {
    it('should export TaskInstanceCompletedEvent type', () => {
      const event: TaskInstanceCompletedEvent = {
        eventType: 'task.instance.completed',
        payload: {
          taskInstanceUuid: 'test-instance-id',
          taskTemplateUuid: 'test-template-id',
          title: 'Test Task',
          completedAt: Date.now(),
          accountUuid: 'test-account-id',
        },
      };
      expect(event.eventType).toBe('task.instance.completed');
    });

    it('should export TaskTemplateCreatedEvent type', () => {
      const event: TaskTemplateCreatedEvent = {
        eventType: 'task.template.created',
        payload: {
          taskTemplateUuid: 'test-template-id',
          title: 'Test Template',
          accountUuid: 'test-account-id',
          createdAt: Date.now(),
        },
      };
      expect(event.eventType).toBe('task.template.created');
    });

    it('should export TaskTemplateDeletedEvent type', () => {
      const event: TaskTemplateDeletedEvent = {
        eventType: 'task.template.deleted',
        payload: {
          taskTemplateUuid: 'test-template-id',
          accountUuid: 'test-account-id',
          deletedAt: Date.now(),
        },
      };
      expect(event.eventType).toBe('task.template.deleted');
    });

    it('should export TaskTemplatePausedEvent type', () => {
      const event: TaskTemplatePausedEvent = {
        eventType: 'task.template.paused',
        payload: {
          taskTemplateUuid: 'test-template-id',
          accountUuid: 'test-account-id',
          pausedAt: Date.now(),
          reason: 'Maintenance',
        },
      };
      expect(event.eventType).toBe('task.template.paused');
    });

    it('should export TaskTemplateResumedEvent type', () => {
      const event: TaskTemplateResumedEvent = {
        eventType: 'task.template.resumed',
        payload: {
          taskTemplateUuid: 'test-template-id',
          taskTemplateTitle: 'Test Template',
          accountUuid: 'test-account-id',
          resumedAt: Date.now(),
        },
      };
      expect(event.eventType).toBe('task.template.resumed');
    });

    it('should export TaskTemplateScheduleChangedEvent type', () => {
      const event: TaskTemplateScheduleChangedEvent = {
        eventType: 'task.template.schedule_changed',
        payload: {
          taskTemplateUuid: 'test-template-id',
          taskTemplateTitle: 'Test Template',
          accountUuid: 'test-account-id',
          changedAt: Date.now(),
        },
      };
      expect(event.eventType).toBe('task.template.schedule_changed');
    });
  });

  describe('Event Types Constants', () => {
    it('should have INSTANCE_COMPLETED constant', () => {
      expect(TaskEventTypes.INSTANCE_COMPLETED).toBe(
        'task.instance.completed'
      );
    });

    it('should have TEMPLATE_CREATED constant', () => {
      expect(TaskEventTypes.TEMPLATE_CREATED).toBe('task.template.created');
    });

    it('should have TEMPLATE_DELETED constant', () => {
      expect(TaskEventTypes.TEMPLATE_DELETED).toBe('task.template.deleted');
    });

    it('should have TEMPLATE_PAUSED constant', () => {
      expect(TaskEventTypes.TEMPLATE_PAUSED).toBe('task.template.paused');
    });

    it('should have TEMPLATE_RESUMED constant', () => {
      expect(TaskEventTypes.TEMPLATE_RESUMED).toBe('task.template.resumed');
    });

    it('should have TEMPLATE_SCHEDULE_CHANGED constant', () => {
      expect(TaskEventTypes.TEMPLATE_SCHEDULE_CHANGED).toBe(
        'task.template.schedule_changed'
      );
    });

    it('should have readonly type properties for type safety', () => {
      // TaskEventTypes is defined as 'as const' which makes it readonly at type level
      // This ensures the constants cannot be accidentally modified
      expect(typeof TaskEventTypes.INSTANCE_COMPLETED).toBe('string');
      expect(typeof TaskEventTypes.TEMPLATE_CREATED).toBe('string');
    });
  });

  describe('TaskModuleEvent Union Type', () => {
    it('should accept any valid task event type', () => {
      const completedEvent: TaskModuleEvent = {
        eventType: 'task.instance.completed',
        payload: {
          taskInstanceUuid: 'id',
          taskTemplateUuid: 'id',
          title: 'Test',
          completedAt: Date.now(),
          accountUuid: 'id',
        },
      };

      const pausedEvent: TaskModuleEvent = {
        eventType: 'task.template.paused',
        payload: {
          taskTemplateUuid: 'id',
          accountUuid: 'id',
          pausedAt: Date.now(),
        },
      };

      expect(completedEvent.eventType).toBeDefined();
      expect(pausedEvent.eventType).toBeDefined();
    });
  });

  describe('Event Consistency', () => {
    it('all event types should have matching constants', () => {
      const expectedConstants = [
        'INSTANCE_COMPLETED',
        'TEMPLATE_CREATED',
        'TEMPLATE_DELETED',
        'TEMPLATE_PAUSED',
        'TEMPLATE_RESUMED',
        'TEMPLATE_SCHEDULE_CHANGED',
      ];

      const actualConstants = Object.keys(TaskEventTypes);

      expectedConstants.forEach((constant) => {
        expect(actualConstants).toContain(constant);
      });
    });

    it('constant values should match eventType literal values', () => {
      expect(TaskEventTypes.INSTANCE_COMPLETED).toBe('task.instance.completed');
      expect(TaskEventTypes.TEMPLATE_CREATED).toBe('task.template.created');
      expect(TaskEventTypes.TEMPLATE_DELETED).toBe('task.template.deleted');
      expect(TaskEventTypes.TEMPLATE_PAUSED).toBe('task.template.paused');
      expect(TaskEventTypes.TEMPLATE_RESUMED).toBe('task.template.resumed');
      expect(TaskEventTypes.TEMPLATE_SCHEDULE_CHANGED).toBe(
        'task.template.schedule_changed'
      );
    });
  });
});
