import { ref, computed, type ComputedRef } from 'vue';
import {
  createColorPickerCore,
  isLightColor,
  hexToRgb,
  rgbToHex,
  type ColorPickerState,
  type UseColorPickerOptions,
} from '@dailyuse/ui-core';

export interface UseColorPickerReturn {
  /** Current color (hex) */
  color: ComputedRef<string>;
  /** Whether the color is light */
  isLight: ComputedRef<boolean>;
  /** Set color */
  setColor: (color: string) => void;
  /** Current state */
  state: ComputedRef<ColorPickerState>;
  /** Color utilities */
  utils: {
    isLightColor: typeof isLightColor;
    hexToRgb: typeof hexToRgb;
    rgbToHex: typeof rgbToHex;
  };
}

/**
 * Vue composable for color picker state management
 * Wraps @dailyuse/ui-core color picker logic with Vue reactivity
 */
export function useColorPicker(options: UseColorPickerOptions = {}): UseColorPickerReturn {
  const stateRef = ref<ColorPickerState>({
    color: options.initialColor || '#000000',
  });

  const core = createColorPickerCore({
    getState: () => stateRef.value,
    setState: (state) => {
      stateRef.value = state;
    },
  });

  return {
    color: computed(() => stateRef.value.color),
    isLight: computed(() => isLightColor(stateRef.value.color)),
    setColor: core.setColor,
    state: computed(() => stateRef.value),
    utils: {
      isLightColor,
      hexToRgb,
      rgbToHex,
    },
  };
}
