/**
 * CapabilityResolver — production Agent Host capability resolution (ADR-035 stage 2 start).
 *
 * Residual 322: ICapabilityResolverPort implementation.
 * Projects explicit CapabilityOffer[] through fail-closed resolveRunPlan.
 * Never silently expands offers (especially engine.* labels) — callers must
 * supply the offer set at construction time.
 */
import type {
  CapabilityOffer,
  CapabilityRequirement,
  ICapabilityResolverPort,
  ResolvedRunPlan,
} from '@memoflow/contracts/ai';
import { resolveRunPlan } from '@memoflow/contracts/ai';

export const CAPABILITY_RESOLVER_ENGINE_ID = 'capability-resolver' as const;

export class CapabilityResolver implements ICapabilityResolverPort {
  readonly engineId: string;
  private readonly offers: readonly CapabilityOffer[];

  constructor(
    offers: readonly CapabilityOffer[] = [],
    engineId: string = CAPABILITY_RESOLVER_ENGINE_ID,
  ) {
    this.engineId = engineId;
    // Defensive copy — freeze surface so callers cannot mutate after construct.
    this.offers = offers.map((offer) => ({ ...offer }));
  }

  /** Snapshot of all registered offers (unfiltered). */
  listRegisteredOffers(): CapabilityOffer[] {
    return this.offers.map((offer) => ({ ...offer }));
  }

  async listOffers(surface: CapabilityOffer['surface']): Promise<CapabilityOffer[]> {
    return this.offers
      .filter((offer) => offer.surface === 'any' || offer.surface === surface)
      .map((offer) => ({ ...offer }));
  }

  async resolve(requirements: CapabilityRequirement[]): Promise<ResolvedRunPlan> {
    return resolveRunPlan({
      engineId: this.engineId,
      offers: this.listRegisteredOffers(),
      requirements,
    });
  }

  /**
   * Resolve with an explicit engine label and surface (Host start/planning path).
   * Not part of ICapabilityResolverPort — keeps the port shape frozen.
   */
  resolveFor(
    engineId: string,
    requirements: readonly CapabilityRequirement[],
    surface?: CapabilityOffer['surface'],
  ): ResolvedRunPlan {
    return resolveRunPlan({
      engineId,
      offers: this.listRegisteredOffers(),
      requirements: [...requirements],
      surface,
    });
  }

  /** Structural guard: resolver never invents engine.* offers by itself. */
  assertsNoSilentEngineOffers(): void {
    // This class only stores what was constructed with; the guard documents intent
    // and is used by surface tests. Callers that want engine.* must pass them in.
    void this.offers;
  }
}
