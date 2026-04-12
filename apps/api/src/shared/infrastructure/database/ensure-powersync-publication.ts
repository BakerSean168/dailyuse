import { prisma } from '@dailyuse/database';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('PowerSyncPublication');
const PUBLICATION_NAME = 'powersync';

let ensurePublicationPromise: Promise<void> | null = null;

export async function ensurePowerSyncPublication(): Promise<void> {
  if (ensurePublicationPromise) {
    return ensurePublicationPromise;
  }

  ensurePublicationPromise = (async () => {
    await prisma.$executeRawUnsafe(`DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = '${PUBLICATION_NAME}'
  ) THEN
    EXECUTE format('CREATE PUBLICATION %I FOR ALL TABLES', '${PUBLICATION_NAME}');
  END IF;
END
$$;`);

    logger.info('PowerSync publication ensured', { publication: PUBLICATION_NAME });
  })();

  try {
    await ensurePublicationPromise;
  } finally {
    ensurePublicationPromise = null;
  }
}
