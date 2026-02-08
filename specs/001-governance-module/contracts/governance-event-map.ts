// Governance Module Event Map
// Defines all domain events for the Governance module

import type { RuleId } from '../value-objects';

/**
 * Base structure for all domain events
 */
export interface DomainEvent {
  aggregateId: string;
  occurredAt: Date;
}

/**
 * Event: Rule created
 * Emitted when a new rule is created (Draft status)
 */
export interface RuleCreatedEvent extends DomainEvent {
  ruleId: RuleId;
  code: string;
  title: string;
  authorId: string;
}

/**
 * Event: Rule updated
 * Emitted when rule content is modified
 */
export interface RuleUpdatedEvent extends DomainEvent {
  ruleId: RuleId;
  changedFields: string[];
}

/**
 * Event: Rule deprecated
 * Emitted when rule transitions to Deprecated status
 */
export interface RuleDeprecatedEvent extends DomainEvent {
  ruleId: RuleId;
  reason: string;
  replacementRuleId?: RuleId;
}

/**
 * Event: Rule reactivated
 * Emitted when deprecated rule returns to Active status
 */
export interface RuleReactivatedEvent extends DomainEvent {
  ruleId: RuleId;
}

/**
 * Event: Rule status changed
 * Emitted on any status transition (Draft → Active, etc.)
 */
export interface RuleStatusChangedEvent extends DomainEvent {
  ruleId: RuleId;
  oldStatus: string;
  newStatus: string;
}

/**
 * Event Map for Governance module domain events
 * 
 * Format: 'module:EventName': EventPayloadType
 */
export interface GovernanceEventMap {
  'rule:created': RuleCreatedEvent;
  'rule:updated': RuleUpdatedEvent;
  'rule:deprecated': RuleDeprecatedEvent;
  'rule:reactivated': RuleReactivatedEvent;
  'rule:status-changed': RuleStatusChangedEvent;
}

export type GovernanceEventType = keyof GovernanceEventMap;
