export const ImportanceLevel = {
  Vital: "Vital",
  Important: "Important",
  Moderate: "Moderate",
  Minor: "Minor",
  Trivial: "Trivial",
} as const;
export type ImportanceLevel = keyof typeof ImportanceLevel;
