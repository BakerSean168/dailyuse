/**
 * Frequency Adjustment Value Object
 * 频率调整值对象
 *
 * Residual 857: FrequencyAdjustmentDTO dual retired — sole FrequencyAdjustment interface + type alias.
 */

// Residual 857: sole FrequencyAdjustment body.
export interface FrequencyAdjustment {
  readonly originalInterval: number;
  readonly adjustedInterval: number;
  readonly adjustmentReason: string;
  readonly adjustmentTime: number; // epoch ms
  readonly isAutoAdjusted: boolean;
  readonly userConfirmed: boolean;
  readonly rejectionReason?: string | null;
}

// Residual 857: FrequencyAdjustmentDTO dual retired — DTO is the FrequencyAdjustment shape.
export type FrequencyAdjustmentDTO = FrequencyAdjustment;
