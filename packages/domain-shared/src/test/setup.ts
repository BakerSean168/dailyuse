/**
 * Domain Shared Test Setup
 * @description Basic test environment setup for domain-shared package
 */

import { beforeEach, afterEach } from 'vitest';

beforeEach(async () => {
  // Set timezone to UTC for consistent date handling
  process.env.TZ = 'UTC';
});

afterEach(async () => {
  // Cleanup if needed
});