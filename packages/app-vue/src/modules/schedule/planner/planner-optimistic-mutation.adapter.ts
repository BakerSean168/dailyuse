import type {
  PlannerMutationOutcome,
  PlannerMutationRequest,
  PlannerOwnerCommandRouter,
} from './planner-owner-command.router';

export interface PlannerOptimisticMutationInput extends PlannerMutationRequest {
  /** FullCalendar eventDrop/eventResize supplies this rollback closure. */
  readonly revert: () => void;
}

/**
 * FullCalendar already applied the visual move/resize when its callback runs.
 * The owner command is therefore the authority check; every non-applied result
 * reverts the visual mutation. Canonical projection objects are never mutated.
 */
export async function applyPlannerOptimisticMutation(
  router: PlannerOwnerCommandRouter,
  input: PlannerOptimisticMutationInput,
): Promise<PlannerMutationOutcome> {
  const outcome = await router.route(input);
  if (outcome.status !== 'applied') input.revert();
  return outcome;
}
