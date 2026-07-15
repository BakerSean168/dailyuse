import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const notificationSource = readFileSync(
  resolve(process.cwd(), 'src/modules/notification/views/NotificationListPage.vue'),
  'utf8',
);

describe('Notification single-page architecture', () => {
  it('owns one inbox toolbar without panel-tier structure branches', () => {
    expect(notificationSource).toContain('data-testid="notification-page-toolbar"');
    expect(notificationSource.match(/<header/g)).toHaveLength(1);
    expect(notificationSource).not.toContain('FilterBar');
    expect(notificationSource).not.toContain('usePanelWidth');
    expect(notificationSource).not.toContain('isNarrow');
    expect(notificationSource).toContain('data-testid="mark-all-read-button"');
    expect(notificationSource).toContain(':aria-selected="selectedFilter === tab.value"');
  });
});
