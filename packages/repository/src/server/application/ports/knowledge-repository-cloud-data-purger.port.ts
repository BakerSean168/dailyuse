/**
 * Host-owned lifecycle edge for deleting all cloud-derived data for a
 * knowledge repository connection.
 *
 * Repository does not depend on AI persistence details. The composition root
 * supplies this port so the host can delete the independent AI index in the
 * same transaction as the repository connection cascade.
 */
export interface IKnowledgeRepositoryCloudDataPurger {
  purge(identityId: string, connectionId: string): Promise<boolean>;
}
