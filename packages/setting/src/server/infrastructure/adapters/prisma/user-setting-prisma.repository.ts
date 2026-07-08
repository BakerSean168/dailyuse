/**
 * UserSetting Prisma Repository
 *
 * Prisma implementation of IUserSettingRepository.
 */

import type { PrismaClient, UserSetting as PrismaUserSetting } from '@dailyuse/database';
import type { IDomainEvent } from '@dailyuse/contracts/shared';
import type { SettingEventMap } from '@dailyuse/contracts/setting';
import type { IUserSettingRepository } from '../../../domain/repositories/i-user-setting-repository';
import { UserSetting } from '../../../domain/aggregates/user-setting';
import { eventBus } from '@dailyuse/utils/domain';
import { PrismaUserSettingMapper } from './mappers';

export class UserSettingPrismaRepository implements IUserSettingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(data: PrismaUserSetting): UserSetting {
    return PrismaUserSettingMapper.toDomain(data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toPrisma(setting: UserSetting): any {
    return PrismaUserSettingMapper.toPersistence(setting);
  }

  async save(setting: UserSetting): Promise<void> {
    const data = this.toPrisma(setting);
    await this.prisma.userSetting.upsert({
      where: { identityId: data.identityId },
      create: data,
      update: data,
    });

    this.publishDomainEvents(setting.pullDomainEvents());
  }

  async findByIdentityId(identityId: string): Promise<UserSetting | null> {
    const data = await this.prisma.userSetting.findUnique({
      where: { identityId },
    });
    return data ? this.toDomain(data) : null;
  }

  async delete(identityId: string): Promise<void> {
    await this.prisma.userSetting.delete({
      where: { identityId },
    });
  }

  private publishDomainEvents(events: ReadonlyArray<IDomainEvent>): void {
    for (const event of events) {
      eventBus.send(
        event.eventType as keyof SettingEventMap,
        event.payload as SettingEventMap[keyof SettingEventMap],
      );
    }
  }
}
