import type {  PrismaClient  } from "@prisma/client";
import {
  ReminderPrismaRepository,
} from './adapters/prisma';

export class ReminderModule {
  public readonly reminderRepository: ReminderPrismaRepository;

  constructor(prisma: PrismaClient) {
    // 1. Initialize Repository
    this.reminderRepository = new ReminderPrismaRepository(prisma);
  }
}
