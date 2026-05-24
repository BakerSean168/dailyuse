export interface NamedColorOption {
  value: string;
  labelKey: string;
}

export const namedColorOptions: NamedColorOption[] = [
  { value: '#f97316', labelKey: 'common.colors.orange' },
  { value: '#ef4444', labelKey: 'common.colors.red' },
  { value: '#f59e0b', labelKey: 'common.colors.amber' },
  { value: '#84cc16', labelKey: 'common.colors.lime' },
  { value: '#22c55e', labelKey: 'common.colors.green' },
  { value: '#14b8a6', labelKey: 'common.colors.teal' },
  { value: '#06b6d4', labelKey: 'common.colors.cyan' },
  { value: '#3b82f6', labelKey: 'common.colors.blue' },
  { value: '#6366f1', labelKey: 'common.colors.indigo' },
  { value: '#8b5cf6', labelKey: 'common.colors.violet' },
  { value: '#a855f7', labelKey: 'common.colors.purple' },
  { value: '#ec4899', labelKey: 'common.colors.pink' },
];

export const defaultNamedColor = namedColorOptions[0].value;

export function findNamedColor(value?: string | null): NamedColorOption | null {
  if (!value) return null;
  return (
    namedColorOptions.find((option) => option.value.toLowerCase() === value.toLowerCase()) ?? null
  );
}
