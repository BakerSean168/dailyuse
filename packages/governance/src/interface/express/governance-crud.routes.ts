import type { GovernanceModule } from '../../module';

export type GovernanceCrudRoutesRegistrar = (governanceModule: GovernanceModule) => void;

export const registerGovernanceCrudRoutes: GovernanceCrudRoutesRegistrar = () => {
  // Placeholder for governance CRUD route registration.
};
