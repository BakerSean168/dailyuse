/**
 * 从未知错误中提取错误信息
 */
export function extractErrorInfo(error: unknown): {
  code: string;
  message: string;
  httpStatus: number;
  context?: Record<string, unknown>;
} {
  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      httpStatus: 500,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    httpStatus: 500,
  };
}
