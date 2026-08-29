/** Domain-neutral label option consumed by shared Goal/Task presentation controls. */
export interface LabelPickerOption {
  readonly id: string;
  readonly name: string;
  readonly color?: string | null;
}
