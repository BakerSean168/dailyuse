/**
 * Setting Module — Export Projections
 */

import type { PortableSettings } from '@memoflow/contracts/data-portability';
import { parseJsonField } from './projection-helpers';

export function projectSettings(setting: unknown): PortableSettings {
  const entity = setting as Record<string, unknown>;
  return {
    preferences: (parseJsonField(entity.preferences, {}) as Record<string, unknown>) ?? {},
  };
}
