export const ImportanceLevel = {
  Vital: "Vital",
  Important: "Important",
  Moderate: "Moderate",
  Minor: "Minor",
  Trivial: "Trivial",
}
export type ImportanceLevel = keyof typeof ImportanceLevel;