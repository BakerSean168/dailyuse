/**
 * Transaction Manager Interface
 * 
 * Abstraction for executing database transactions.
 * Allows Application Layer to use transactions without depending on specific ORM (Prisma).
 */
export interface ITransactionManager {
  /**
   * Execute a function within a transaction.
   * @param fn Function to execute, receives a transaction client/context
   */
  transaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
}
