import { createHttpResponseBuilder } from '@dailyuse/contracts/result';

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function readNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' ? value : undefined;
}

export function createApiResponseBuilder(req?: unknown) {
  const request = req && typeof req === 'object' ? (req as Record<string, unknown>) : {};

  return createHttpResponseBuilder({
    traceId: readString(request, 'traceId') ?? readString(request, 'id'),
    startTime: readNumber(request, 'startTime') ?? Date.now(),
  });
}
