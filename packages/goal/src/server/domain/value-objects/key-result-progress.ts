import { ValueObject } from '@memoflow/utils/domain';
import type {
  KeyResultProgress as IKeyResultProgress,
  KeyResultProgressDTO,
  KeyResultCalculationMethod,
} from '@memoflow/contracts/goal';
import { calculateKeyResultProgress } from '../services/key-result-progress-calculator';

/** Immutable KR Measurement V2 value object. Arithmetic delegates to the canonical calculator. */
export class KeyResultProgress
  extends ValueObject<KeyResultProgressDTO>
  implements IKeyResultProgress
{
  private constructor(props: KeyResultProgressDTO) {
    super(props);
  }

  public static create(props: KeyResultProgressDTO): KeyResultProgress {
    this.validate(props);
    return new KeyResultProgress(props);
  }

  public static createDefault(targetValue: number): KeyResultProgress {
    return this.create({
      startingValue: 0,
      currentValue: 0,
      targetValue,
      progressBaselineValue: null,
      aggregationMethod: 'Sum',
      unit: null,
    });
  }

  public static fromDTO(dto: KeyResultProgressDTO): KeyResultProgress {
    this.validate(dto);
    return new KeyResultProgress(dto);
  }

  private static validate(props: KeyResultProgressDTO): void {
    if (props.unit && props.unit.length > 20) throw new Error('Unit too long (max 20 characters)');
    calculateKeyResultProgress(props);
  }

  public get aggregationMethod(): KeyResultCalculationMethod {
    return this.props.aggregationMethod;
  }

  public get startingValue(): number {
    return this.props.startingValue;
  }

  public get targetValue(): number {
    return this.props.targetValue;
  }

  public get currentValue(): number {
    return this.props.currentValue;
  }

  public get progressBaselineValue(): number | null {
    return this.props.progressBaselineValue;
  }

  public get unit(): string | null {
    return this.props.unit;
  }

  public updateCurrentValue(currentValue: number): KeyResultProgress {
    return KeyResultProgress.create({ ...this.props, currentValue });
  }

  public updateStartingValue(startingValue: number): KeyResultProgress {
    return KeyResultProgress.create({ ...this.props, startingValue });
  }

  public updateTargetValue(targetValue: number): KeyResultProgress {
    return KeyResultProgress.create({ ...this.props, targetValue });
  }

  public updateProgressBaselineValue(progressBaselineValue: number | null): KeyResultProgress {
    return KeyResultProgress.create({ ...this.props, progressBaselineValue });
  }

  public updateAggregationMethod(aggregationMethod: KeyResultCalculationMethod): KeyResultProgress {
    return KeyResultProgress.create({ ...this.props, aggregationMethod });
  }

  public increment(delta: number): KeyResultProgress {
    return this.updateCurrentValue(this.props.currentValue + delta);
  }

  public decrement(delta: number): KeyResultProgress {
    return this.updateCurrentValue(this.props.currentValue - delta);
  }

  public reset(): KeyResultProgress {
    return this.updateCurrentValue(this.props.startingValue);
  }

  public setToTarget(): KeyResultProgress {
    return this.updateCurrentValue(this.props.targetValue);
  }

  public calculateAggregatedValue(values: readonly number[]): number {
    return calculateKeyResultProgress(this.props, values).currentValue;
  }

  public recalculateFromHistory(historyValues: readonly number[]): KeyResultProgress {
    const calculation = calculateKeyResultProgress(this.props, historyValues);
    return new KeyResultProgress({ ...this.props, currentValue: calculation.currentValue });
  }

  public getAggregationMethodDescription(): string {
    const descriptions: Record<KeyResultCalculationMethod, string> = {
      Sum: '累计记录增量',
      Average: '记录样本平均值',
      Max: '记录样本最大值',
      Min: '记录样本最小值',
      Last: '最后一次记录值',
    };
    return descriptions[this.props.aggregationMethod];
  }

  public getProgressPercentage(): number {
    return calculateKeyResultProgress(this.props).percentage;
  }

  public get isCompleted(): boolean {
    return calculateKeyResultProgress(this.props).isCompleted;
  }

  public getRemainingValue(): number {
    return Math.abs(this.props.targetValue - this.props.currentValue);
  }

  public getCompletedValue(): number {
    const baseline = this.props.progressBaselineValue ?? 0;
    return Math.abs(this.props.currentValue - baseline);
  }

  public getDirection(): 'up' | 'down' {
    return calculateKeyResultProgress(this.props).direction === 'increasing' ? 'up' : 'down';
  }

  public toDTO(): KeyResultProgressDTO {
    return { ...this.props };
  }
}
