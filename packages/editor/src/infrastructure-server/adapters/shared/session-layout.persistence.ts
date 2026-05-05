import type { SessionLayoutDTO } from '@dailyuse/contracts/editor';
import { SessionLayout } from '../../../domain-shared/value-objects/session-layout';

function isSessionLayoutDTO(value: unknown): value is SessionLayoutDTO {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<SessionLayoutDTO>;
  const splitType = candidate.splitType;

  return (
    (splitType === 'Horizontal' || splitType === 'Vertical' || splitType === 'Grid') &&
    typeof candidate.groupCount === 'number' &&
    typeof candidate.activeGroupIndex === 'number'
  );
}

function parseLayoutValue(layout: unknown): unknown {
  if (typeof layout !== 'string') {
    return layout;
  }

  try {
    return JSON.parse(layout);
  } catch {
    return null;
  }
}

export function parseSessionLayoutFromPersistence(layout: unknown): SessionLayout {
  const layoutValue = parseLayoutValue(layout);

  if (!isSessionLayoutDTO(layoutValue)) {
    return SessionLayout.createDefault();
  }

  return SessionLayout.fromDTO(layoutValue);
}
