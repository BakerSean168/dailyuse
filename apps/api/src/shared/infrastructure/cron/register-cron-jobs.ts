/**
 * Cron job registration
 *
 * Creates and returns a configured CronSchedulerManager with all jobs registered.
 * The caller owns the lifecycle (start/stop).
 */

import { CronSchedulerManager } from './cron-scheduler-manager';
import { createLogger } from '@dailyuse/utils/logger';
import { env } from '../config/env';
import { rebuildAllProfileSnapshots } from './jobs/snapshot-rebuild.job.js';

const logger = createLogger('CronJobRegistration');

/**
 * Create a CronSchedulerManager with all cron jobs registered.
 * The returned scheduler is not started — call .start() when ready.
 */
export function createCronScheduler(): CronSchedulerManager {
  const scheduler = new CronSchedulerManager();

  logger.info('Registering all cron jobs...');

  // Snapshot rebuild job
  const snapshotRootDir = env.POWERSYNC_SNAPSHOT_DIR;
  if (snapshotRootDir) {
    scheduler.register({
      name: 'powersync:snapshot-rebuild',
      schedule: env.SNAPSHOT_REBUILD_SCHEDULE,
      task: () => rebuildAllProfileSnapshots(snapshotRootDir),
      enabled: env.SNAPSHOT_REBUILD_ENABLED,
      timezone: env.TZ,
    });
  }

  const status = scheduler.getStatus();
  logger.info('All cron jobs registered', {
    totalJobs: status.length,
    jobs: status.map((j) => `${j.name} (${j.schedule})`),
  });

  return scheduler;
}
