import { CategoryPreference } from '../CategoryPreference';
import { ChannelError } from '../ChannelError';
import { ChannelResponse } from '../ChannelResponse';
import { DoNotDisturbConfig } from '../DoNotDisturbConfig';
import { NotificationAction } from '../NotificationAction';
import { NotificationMetadata } from '../NotificationMetadata';
import { RateLimit } from '../RateLimit';
import { NotificationActionType } from '../../../domain-shared/value-objects';

describe('notification server value object re-exports', () => {
  it('exposes shared implementations through server paths', () => {
    expect(CategoryPreference.createDefault().enabled).toBe(true);
    expect(ChannelError.of('TIMEOUT', 'retry').isRetryable).toBe(true);
    expect(ChannelResponse.success('message-1').isSuccess).toBe(true);
    expect(DoNotDisturbConfig.createDefault().startTime).toBe('22:00');
    expect(NotificationAction.of('open', 'Open', NotificationActionType.Navigate).label).toBe(
      'Open',
    );
    expect(NotificationMetadata.createDefault().badge).toBeNull();
    expect(RateLimit.createUnlimited().isUnlimited).toBe(true);
  });
});
