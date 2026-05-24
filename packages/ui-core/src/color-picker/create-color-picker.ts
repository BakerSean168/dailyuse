/**
 * Color picker utilities - Framework agnostic
 */

export interface ColorPickerState {
  color: string;
}

export interface ColorPickerStore {
  setColor: (color: string) => void;
}

export interface ColorPickerStoreAdapter {
  getState: () => ColorPickerState;
  setState: (state: ColorPickerState) => void;
}

export interface UseColorPickerOptions {
  initialColor?: string;
}

/**
 * Create a color picker store with custom state adapter
 */
export function createColorPickerCore(adapter: ColorPickerStoreAdapter): ColorPickerStore {
  return {
    setColor: (color: string) => {
      adapter.setState({ color });
    },
  };
}

/**
 * Check if a color is light (for contrast purposes)
 */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;

  // Calculate luminance using relative luminance formula
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}
