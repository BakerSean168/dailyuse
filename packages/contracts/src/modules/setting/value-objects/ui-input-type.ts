/**
 * UI 输入类型
 */
export const UIInputType = {
  Text: 'Text',
  Number: 'Number',
  Switch: 'Switch',
  Select: 'Select',
  Radio: 'Radio',
  Checkbox: 'Checkbox',
  Slider: 'Slider',
  Color: 'Color',
  File: 'File',
} as const;

export type UIInputType = (typeof UIInputType)[keyof typeof UIInputType];
