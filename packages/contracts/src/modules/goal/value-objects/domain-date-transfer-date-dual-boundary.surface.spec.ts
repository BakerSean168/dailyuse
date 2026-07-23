import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 859: DomainDate ≠ TransferDate dual keep-boundary + shape-mismatch duals stay separate.
 * Exact VO duals (FrequencyAdjustment/ResponseMetrics, residual 857) remain type aliases.
 * Residual 861 (soft): ReminderResponse/NotificationChannel subset duals retired via Omit
 *   (reminder-response-client-dto-dual.surface.spec.ts); this file keeps Residual 859 only.
 * Does not flip §13.2 checkboxes; OAuth / multi-engine Agent / full PR gate remain open.
 */
describe('domain-date transfer-date dual keep-boundary (residual 859)', () => {
  const goalVo = __dirname;
  const accountVo = resolve(goalVo, '../../account/value-objects');
  const taskVo = resolve(goalVo, '../../task/value-objects');
  const reminderVo = resolve(goalVo, '../../reminder/value-objects');
  const authProtocol = resolve(goalVo, '../../authentication/protocol');

  it('keeps DomainDate≠TransferDate goal duals as separate interface bodies', () => {
    const goalTime = readFileSync(resolve(goalVo, 'goal-time-range.ts'), 'utf8');
    const weight = readFileSync(resolve(goalVo, 'key-result-weight-snapshot.ts'), 'utf8');
    expect(goalTime).toMatch(/export interface GoalTimeRange\b/);
    expect(goalTime).toMatch(/export interface GoalTimeRangeDTO\b/);
    expect(goalTime).not.toContain('export type GoalTimeRangeDTO = GoalTimeRange');
    expect(goalTime).toContain('DomainDate');
    expect(goalTime).toContain('TransferDate');
    expect(weight).toMatch(/export interface KeyResultWeightSnapshot\b/);
    expect(weight).toMatch(/export interface KeyResultWeightSnapshotDTO\b/);
    expect(weight).not.toContain(
      'export type KeyResultWeightSnapshotDTO = KeyResultWeightSnapshot',
    );
  });

  it('keeps account/task DomainDate duals and AuthStatus shape-mismatch dual separate', () => {
    const email = readFileSync(resolve(accountVo, 'contact-email.ts'), 'utf8');
    const phone = readFileSync(resolve(accountVo, 'contact-phone.ts'), 'utf8');
    const profile = readFileSync(resolve(accountVo, 'account-profile.ts'), 'utf8');
    const completion = readFileSync(resolve(taskVo, 'completion-record.ts'), 'utf8');
    const desktopAuth = readFileSync(resolve(authProtocol, 'desktop-auth.types.ts'), 'utf8');

    for (const [src, vo, dto] of [
      [email, 'ContactEmail', 'ContactEmailDTO'],
      [phone, 'ContactPhone', 'ContactPhoneDTO'],
      [profile, 'AccountProfile', 'AccountProfileDTO'],
      [completion, 'CompletionRecord', 'CompletionRecordDTO'],
    ] as const) {
      expect(src).toMatch(new RegExp(`export interface ${vo}\\b`));
      expect(src).toMatch(new RegExp(`export interface ${dto}\\b`));
      expect(src).not.toContain(`export type ${dto} = ${vo}`);
    }
    expect(desktopAuth).toMatch(/export interface AuthStatus\b/);
    expect(desktopAuth).toMatch(/export interface AuthStatusDTO\b/);
    expect(desktopAuth).not.toContain('export type AuthStatusDTO = AuthStatus');
  });

  it('keeps residual 857 exact metrics duals as type aliases; residual 859 marker present', () => {
    const frequency = readFileSync(resolve(reminderVo, 'frequency-adjustment.ts'), 'utf8');
    const metrics = readFileSync(resolve(reminderVo, 'response-metrics.ts'), 'utf8');
    expect(frequency).toContain('Residual 857');
    expect(frequency).toContain('export type FrequencyAdjustmentDTO = FrequencyAdjustment');
    expect(frequency).not.toMatch(/export interface FrequencyAdjustmentDTO\b/);
    expect(metrics).toContain('Residual 857');
    expect(metrics).toContain('export type ResponseMetricsDTO = ResponseMetrics');
    expect(metrics).not.toMatch(/export interface ResponseMetricsDTO\b/);
    // Self-doc: this surface owns residual 859 keep-boundary (not a dual collapse).
    expect(readFileSync(__filename, 'utf8')).toContain('Residual 859');
  });
});
