export interface KnowledgeRepositoryLeaseRequest {
  leaseKey: string;
  ownerToken: string;
  now: number;
  expiresAt: number;
}

export interface IKnowledgeRepositoryLeaseRepository {
  tryAcquire(request: KnowledgeRepositoryLeaseRequest): Promise<boolean>;
  renew(request: KnowledgeRepositoryLeaseRequest): Promise<boolean>;
  release(leaseKey: string, ownerToken: string): Promise<void>;
}
