import { prisma } from '@memoflow/database';
import { createTaskPrismaModule } from '@memoflow/task';

const [, , taskInstanceId, identityId] = process.argv;

if (!taskInstanceId || !identityId) {
  throw new Error('taskInstanceId and identityId are required');
}

const taskModule = createTaskPrismaModule(prisma);
const result = await taskModule.api.completeTaskInstance(taskInstanceId, identityId);

if (!result.ok) {
  throw new Error(`${result.error.code}: ${result.error.message}`);
}

process.stdout.write('TASK_COMMITTED\n');
// Deliberately skip normal host disposal and database disconnect. This leaves
// only committed database state available to the replacement host.
process.exit(0);
