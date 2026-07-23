/**
 * Residual 1037: sole vitest integration globalSetup for domain packages.
 * Ensures test DB readiness once per integration run; package duals re-export.
 */
import { ensureTestDatabase } from './database';

export async function setup() {
  await ensureTestDatabase();
}

export async function teardown() {}
