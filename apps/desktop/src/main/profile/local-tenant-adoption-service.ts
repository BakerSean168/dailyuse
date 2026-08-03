import type { PowerSyncDatabase } from '@powersync/node';
import { PowerSyncAppSchema } from '@memoflow/powersync-schema';

export const IDENTITY_OWNED_TABLES = Object.freeze(
  PowerSyncAppSchema.tables
    .filter((table) => table.columns.some((column) => column.name === 'identity_id'))
    .map((table) => table.name),
);

export interface CompletedTenantAdoption {
  fromOwnerId: string;
  toOwnerId: string;
  displayName: string;
  identifier: string;
  adoptedAt: number;
}

export class LocalTenantAdoptionService {
  constructor(private readonly db: PowerSyncDatabase) {}

  async adopt(input: {
    fromOwnerId: string;
    toOwnerId: string;
    displayName: string;
    identifier: string;
    emailVerified: boolean;
  }): Promise<void> {
    const { fromOwnerId, toOwnerId, displayName, identifier, emailVerified } = input;
    if (fromOwnerId === toOwnerId) return;
    await this.db.writeTransaction(async (tx) => {
      const conflict = await tx.getOptional<{ id: string }>('SELECT id FROM accounts WHERE id = ? LIMIT 1', [toOwnerId]);
      if (conflict) throw new Error('目标云端账号已存在本地数据，拒绝静默合并');
      await tx.execute(
        `INSERT OR REPLACE INTO profile_adoption_journal
          (id, from_owner_id, to_owner_id, display_name, identifier, adopted_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['current', fromOwnerId, toOwnerId, displayName, identifier, Date.now()],
      );
      await tx.execute(
        `INSERT INTO accounts (
           id,
           status,
           profile,
           settings,
           email_address,
           email_is_verified,
           email_verified_at,
           email_is_primary,
           phone_country_code,
           phone_number,
           phone_full_number,
           phone_is_verified,
           phone_verified_at,
           version,
           created_at,
           updated_at,
           deleted_at
         )
         SELECT ?,
                status,
                profile,
                settings,
                ?,
                ?,
                ?,
                1,
                phone_country_code,
                phone_number,
                phone_full_number,
                phone_is_verified,
                phone_verified_at,
                version,
                created_at,
                ?,
                deleted_at
         FROM accounts
         WHERE id = ?`,
        [
          toOwnerId,
          identifier,
          emailVerified ? 1 : 0,
          emailVerified ? new Date().toISOString() : null,
          new Date().toISOString(),
          fromOwnerId,
        ],
      );
      for (const table of IDENTITY_OWNED_TABLES) {
        await tx.execute(`UPDATE ${table} SET identity_id = ? WHERE identity_id = ?`, [toOwnerId, fromOwnerId]);
      }
      await tx.execute('DELETE FROM accounts WHERE id = ?', [fromOwnerId]);
    });
  }

  async getCompleted(): Promise<CompletedTenantAdoption | null> {
    const row = await this.db.getOptional<{
      from_owner_id: string;
      to_owner_id: string;
      display_name: string;
      identifier: string;
      adopted_at: number;
    }>(
      `SELECT from_owner_id, to_owner_id, display_name, identifier, adopted_at
       FROM profile_adoption_journal WHERE id = ? LIMIT 1`,
      ['current'],
    );
    return row
      ? {
          fromOwnerId: row.from_owner_id,
          toOwnerId: row.to_owner_id,
          displayName: row.display_name,
          identifier: row.identifier,
          adoptedAt: row.adopted_at,
        }
      : null;
  }

  async clearCompleted(): Promise<void> {
    await this.db.execute('DELETE FROM profile_adoption_journal WHERE id = ?', ['current']);
  }
}
