import type { Result } from '@memoflow/contracts/result';
import { error, ok } from '@memoflow/contracts/result';
import { Habit, type HabitFrequency, type HabitState } from '../../../domain/habit/habit';

/** Habit 仓储端口（Prisma/PowerSync 实现）。 */
export interface IHabitRepository {
  save(habit: Habit): Promise<void>;
  findByIdForIdentity(identityId: string, id: string): Promise<Habit | null>;
  findByIdentityId(identityId: string): Promise<Habit[]>;
  deleteByIdentityId(identityId: string, id: string): Promise<void>;
}

export interface CreateHabitReq {
  name: string;
  description?: string | null;
  frequency?: HabitFrequency;
  goalId?: string | null;
}

export interface HabitDTO {
  id: string;
  name: string;
  description: string | null;
  frequency: HabitFrequency;
  goalId: string | null;
  status: string;
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: number | null;
}

function toDTO(habit: Habit, now: number): HabitDTO {
  const streak = habit.streak(now);
  return {
    id: habit.id,
    name: habit.name,
    description: habit.description,
    frequency: habit.frequency,
    goalId: habit.goalId,
    status: habit.status,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastCheckInDate: streak.lastCheckInDate,
  };
}

export class CreateHabitUseCase {
  constructor(private readonly repository: IHabitRepository) {}

  async execute(identityId: string, req: CreateHabitReq): Promise<Result<HabitDTO>> {
    if (!req.name.trim()) {
      return error('VALIDATION_ERROR', 'Habit name is required');
    }
    const habit = Habit.create({ identityId, ...req });
    await this.repository.save(habit);
    return ok(toDTO(habit, Date.now()));
  }
}

export class RecordHabitCheckInUseCase {
  constructor(private readonly repository: IHabitRepository) {}

  async execute(
    identityId: string,
    id: string,
    occurrenceDate: number,
    note?: string | null,
  ): Promise<Result<HabitDTO>> {
    const habit = await this.repository.findByIdForIdentity(identityId, id);
    if (!habit) {
      return error('NOT_FOUND', `Habit ${id} not found`);
    }
    habit.checkIn(occurrenceDate, Date.now(), note);
    await this.repository.save(habit);
    return ok(toDTO(habit, Date.now()));
  }
}

export class ListHabitUseCase {
  constructor(private readonly repository: IHabitRepository) {}

  async execute(identityId: string): Promise<Result<HabitDTO[]>> {
    const habits = await this.repository.findByIdentityId(identityId);
    const now = Date.now();
    return ok(habits.map((h) => toDTO(h, now)));
  }
}

export function stateToHabit(state: HabitState): Habit {
  return Habit.load(state);
}
