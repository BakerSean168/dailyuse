import type { Ymd } from '@memoflow/time'

export type RecurrenceEditorFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'
export type RecurrenceEditorEndMode = 'never' | 'date' | 'count'

export interface RecurrenceEditorValue {
  frequency: RecurrenceEditorFrequency
  interval: number
  daysOfWeek: number[]
  endMode: RecurrenceEditorEndMode
  endDate: Ymd | null
  occurrences: number | null
}

export interface RecurrenceEditorLabels {
  enabled: string
  frequency: string
  interval: string
  every: string
  daily: string
  weekly: string
  monthly: string
  yearly: string
  weekdays: readonly string[]
  ends: string
  never: string
  onDate: string
  afterCount: string
  endDate: string
  occurrences: string
}
