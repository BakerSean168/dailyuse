/**
 * An interface for equatable objects.
 * 现在主要用于 DDD 基类
 */
export interface Equatable {
  equals(other: unknown): boolean;
}