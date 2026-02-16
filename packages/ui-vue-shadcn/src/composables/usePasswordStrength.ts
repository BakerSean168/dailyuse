import { ref, computed, watch, type Ref, type ComputedRef } from 'vue';
import {
  createPasswordStrength,
  generatePassword,
  type PasswordStrengthLevel,
  type PasswordStrengthResult,
} from '@dailyuse/ui-core';

export interface UsePasswordStrengthReturn {
  /** The password being analyzed */
  password: Ref<string>;
  /** Current strength level */
  level: ComputedRef<PasswordStrengthLevel>;
  /** Strength score (0-100) */
  score: ComputedRef<number>;
  /** Display label for current strength */
  label: ComputedRef<string>;
  /** Color for current strength */
  color: ComputedRef<string>;
  /** Full strength result */
  strength: ComputedRef<PasswordStrengthResult>;
  /** Generate a random password */
  generate: (length?: number) => string;
}

/**
 * Vue composable for password strength analysis
 * Wraps @dailyuse/ui-core password strength logic with Vue reactivity
 */
export function usePasswordStrength(initialPassword = ''): UsePasswordStrengthReturn {
  const password = ref(initialPassword);
  const core = createPasswordStrength();

  const strength = computed(() => core.analyze(password.value));
  const level = computed(() => strength.value.level);
  const score = computed(() => strength.value.score);
  const label = computed(() => strength.value.label);
  const color = computed(() => strength.value.color);

  return {
    password,
    level,
    score,
    label,
    color,
    strength,
    generate: generatePassword,
  };
}
