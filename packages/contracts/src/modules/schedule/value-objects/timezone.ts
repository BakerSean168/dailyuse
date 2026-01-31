/**
 * 常用时区
 */
export const Timezone = {
  Utc: 'UTC',
  Shanghai: 'Asia/Shanghai',
  Tokyo: 'Asia/Tokyo',
  NewYork: 'America/New_York',
  London: 'Europe/London',
} as const;

export type Timezone = (typeof Timezone)[keyof typeof Timezone];
