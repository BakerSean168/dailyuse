# Implementation Checklist: Notifications & OKR Architecture

**Document**: Quick Reference Guide  
**Target**: Development Teams  
**Scope**: MVP + Phase 2 Roadmap

---

## Quick Decision Reference

### OKR Progress Synchronization

| Decision | Details |
|----------|---------|
| **MVP Approach** | Manual-only (user sets KR progress explicitly) |
| **Phase 2 Addition** | Auto-calculation optional toggle per user |
| **Default Behavior** | Preserve user's manual input, show task completion % as reference |
| **Database** | Add `auto_progress_enabled`, `calculation_method` columns to KRs |
| **User Impact** | Low friction for simple cases, full control for complex scenarios |

### Notification Channels (MVP)

| Channel | Enabled | Recommended | Implementation |
|---------|---------|-------------|-----------------|
| **In-App Toast** | ✓ | Yes | Pinia state dispatch |
| **Browser Push** | ✓ | Yes | Service Worker + Push Manager API |
| **Email** | ✓ (Phase 2) | Yes | SendGrid / Mailgun |
| **Sound** | ✓ (Phase 2) | Optional | Web Audio API |
| **SMS** | ✗ | Post-MVP | Twilio integration |
| **Slack** | ✗ | Post-MVP | Webhook integration |

### Notification Service Architecture

| Component | Decision | Rationale |
|-----------|----------|-----------|
| **Queue System** | Bull + Redis | Reliability, retry handling, job scheduling |
| **Dispatch Strategy** | Hybrid (immediate + queue) | Fast reminders, reliable batch notifications |
| **Retry Policy** | Exponential backoff, 3-5 attempts | Handles transient failures gracefully |
| **Persistence** | DB logging + queue storage | Audit trail + recovery capability |
| **Failure Handling** | Log to ops, escalate critical | Manual review for failed deliveries |

---

## MVP Implementation Checklist

### Phase 1: Foundation (Weeks 1-2)

#### Database Schema
- [ ] Create `notifications` table
- [ ] Create `notification_deliveries` table
- [ ] Create `user_notification_preferences` table
- [ ] Add KR columns: `auto_progress_enabled`, `calculation_method`
- [ ] Write migrations and run tests

#### Backend Service (Node/Express)
- [ ] Create `NotificationService` class
  - [ ] `notifyImmediately()` method
  - [ ] Subscribe to domain events
  - [ ] Handle task completion events
  - [ ] Handle reminder time reached events
- [ ] Create `NotificationRepository`
  - [ ] Save notification
  - [ ] Query notifications by user
  - [ ] Log delivery results
- [ ] Create `UserPreferencesRepository`
  - [ ] Get user notification preferences
  - [ ] Update preferences
- [ ] Write unit tests for service

#### Frontend Components (Vue 3)
- [ ] Create `ToastNotification.vue` component
- [ ] Create `NotificationCenter.vue` (list view)
- [ ] Create `NotificationSettings.vue` (user preferences)
  - [ ] Toggle channels (browser push, in-app toast)
  - [ ] Manage quiet hours
- [ ] Service for API integration
- [ ] Vuex/Pinia store for notifications state

#### API Routes
- [ ] `GET /api/notifications` - List user notifications
- [ ] `PUT /api/notifications/:id/read` - Mark as read
- [ ] `GET /api/notifications/preferences` - Get user preferences
- [ ] `PUT /api/notifications/preferences` - Update preferences
- [ ] `DELETE /api/notifications/:id` - Delete notification

### Phase 2: Queue & Advanced Channels (Weeks 3-4)

#### Queue Infrastructure
- [ ] Install Bull and Redis
- [ ] Create `QueueService` class
  - [ ] Initialize notification queue
  - [ ] Add job handler
  - [ ] Implement retry logic
  - [ ] Handle job failures
- [ ] Create Bull workers
  - [ ] Notification delivery worker
  - [ ] Digest notification worker (cron)
- [ ] Setup Redis connection pooling
- [ ] Write integration tests

#### Notification Channels
- [ ] Implement `NotificationChannel` interface
- [ ] Create `BrowserPushChannel` class
  - [ ] Service Worker registration
  - [ ] Push Manager API integration
  - [ ] Error handling
- [ ] Create `InAppToastChannel` class
  - [ ] Pinia dispatch integration
  - [ ] Success response
- [ ] Create `EmailChannel` class
  - [ ] SendGrid API integration
  - [ ] Email template rendering
  - [ ] Error handling & retry
- [ ] Create `SoundChannel` class
  - [ ] Web Audio API integration
  - [ ] Quiet hours checking
- [ ] Create `NotificationChannelRegistry`
  - [ ] Register channels
  - [ ] Route to channels
  - [ ] Parallel delivery

#### Event Handling
- [ ] Task completion → check milestone
- [ ] Reminder time reached → immediate notification
- [ ] Task deadline approaching (24h) → queue notification
- [ ] Goal progress milestone → celebration notification
- [ ] Cron: Daily digest aggregation (8 AM)

#### Advanced Features
- [ ] Quiet hours enforcement
- [ ] Duplicate suppression (5s window)
- [ ] Notification deferred during quiet hours
- [ ] Email digest templates
- [ ] Per-event-type channel routing (optional)

### Phase 3: Optimization (Post-MVP)

#### OKR Auto-Calculation
- [ ] Add `auto_progress` calculation view/method
- [ ] Dashboard display of both manual & auto progress
- [ ] User toggle: "Use auto-calculated progress"
- [ ] Analytics: track manual vs. auto usage

#### Enhanced User Preferences
- [ ] Per-event-type channel selection UI
- [ ] Notification frequency control
- [ ] Max notifications per hour setting
- [ ] Custom digest template builder

#### Monitoring & Analytics
- [ ] Notification delivery success rate dashboard
- [ ] Average delivery time per channel
- [ ] Failure rate by event type
- [ ] User adoption metrics (% enabling channels)
- [ ] Delivery logs and audit trail

---

## Code Patterns: Quick Reference

### Pattern 1: Send Immediate Notification

```typescript
// In your domain event handler (e.g., onReminderTriggered)

const notification = new Notification({
  id: generateId(),
  userId: reminderId.userId,
  eventType: 'reminder_triggered',
  title: reminder.name,
  body: `Time for: ${reminder.name}`,
  resourceType: 'reminder',
  resourceId: reminder.id,
  resourceUrl: `/reminders/${reminder.id}`,
  bypassQuietHours: true  // Reminders override quiet hours
});

await notificationService.notifyImmediately(notification);
```

### Pattern 2: Queue Notification with Delay

```typescript
// For task due soon (24h from now)

const delayMs = (hoursUntil - 24) * 60 * 60 * 1000;

await notificationService.queueNotification(notification, {
  delay: delayMs,
  retries: 3
});
```

### Pattern 3: Create Digest Notification

```typescript
// In cron handler: scheduleDigestNotifications()

const grouped = notifications.reduce((acc, n) => {
  acc[n.eventType] = (acc[n.eventType] || []).concat(n);
  return acc;
}, {});

const digestNotification = new Notification({
  eventType: 'daily_digest',
  title: `Daily Summary - ${date.toLocaleDateString()}`,
  body: renderDigestTemplate(grouped),
  metadata: { notificationIds: notifications.map(n => n.id) }
});

await notificationService.queueNotification(digestNotification, {
  priority: 'low',
  retries: 5
});
```

### Pattern 4: Get User Preferences

```typescript
// In notification service before sending

const preferences = await userPreferencesRepository.findByUserId(userId);

if (!preferences.browser_push_enabled) {
  // Skip browser push delivery
}

if (this.isInQuietHours(preferences) && !notification.bypassQuietHours) {
  // Defer to queue instead of immediate
  await this.queueNotification(notification);
  return;
}
```

### Pattern 5: Update KR Progress (Hybrid)

```typescript
// Backend API endpoint: PUT /api/goals/:goalId/key-results/:krId/progress

async updateProgress(krId: string, progress: number, userId: string) {
  const kr = await keyResultRepository.findById(krId, userId);
  
  if (kr.auto_progress_enabled) {
    const autoProgress = await this.calculateAutoProgress(krId);
    if (progress !== autoProgress) {
      // Log override for analytics
      await logProgressOverride(krId, autoProgress, progress);
    }
  }
  
  return await keyResultRepository.update(krId, {
    progress,
    updatedAt: new Date()
  });
}
```

---

## Testing Checklist

### Unit Tests

**NotificationService**
- [ ] `notifyImmediately()` persists to DB
- [ ] `queueNotification()` adds to queue
- [ ] Deduplication within 5s window works
- [ ] Quiet hours check correctly
- [ ] Event subscriptions trigger correctly

**Channels**
- [ ] `BrowserPushChannel.send()` uses correct API
- [ ] `EmailChannel.send()` formats template correctly
- [ ] Each channel handles errors gracefully
- [ ] Retry logic works per channel policy

**UserPreferencesRepository**
- [ ] Get preferences returns correct data
- [ ] Update preferences persists changes
- [ ] New users get default preferences

**QueueService**
- [ ] Add job creates queue entry
- [ ] Worker processes job successfully
- [ ] Failed job retries with backoff
- [ ] Job marked complete after success

### Integration Tests

- [ ] Task completion triggers appropriate notifications
- [ ] Reminder at scheduled time sends notification
- [ ] Email delivery via SendGrid API works
- [ ] Browser push via Service Worker works
- [ ] Queue worker processes jobs end-to-end
- [ ] Quiet hours defer notifications correctly
- [ ] Digest notifications aggregate properly
- [ ] KR auto-progress calculation matches task count

### E2E Tests (Playwright/Cypress)

- [ ] User receives in-app toast notification
- [ ] User can navigate to resource from notification
- [ ] User can update notification preferences
- [ ] Quiet hours disable push notifications
- [ ] Email digest arrives at scheduled time
- [ ] KR progress updates when task completed

### Manual Testing

- [ ] Create reminder → receive notification at scheduled time
- [ ] Create task → receive notification 24h before due
- [ ] Complete task → check if KR progress updated
- [ ] Enable quiet hours → verify no notifications during period
- [ ] Update preferences → verify changes applied immediately
- [ ] Send test notification → verify all channels work

---

## Performance Targets

| Metric | Target | Monitor |
|--------|--------|---------|
| In-app toast latency | <100ms | App analytics |
| Browser push latency | <1s | Service Worker logs |
| Email delivery time | <5min | SendGrid dashboard |
| Notification DB query | <100ms | Database monitoring |
| Queue processing | <1s per job | Bull dashboard |
| Page load (with notifications) | <2s | Lighthouse |
| Notification list render (100 items) | <500ms | React DevTools |

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (unit, integration, e2e)
- [ ] Code review completed
- [ ] Database migrations tested on staging
- [ ] Redis setup verified
- [ ] SendGrid/email provider credentials set
- [ ] VAPID keys generated for push notifications
- [ ] Service Worker built and deployed
- [ ] Performance tests passed

### Deployment Steps

1. [ ] Deploy database migrations
2. [ ] Deploy backend service
3. [ ] Deploy frontend with new components
4. [ ] Verify Service Worker loaded
5. [ ] Test notification delivery end-to-end
6. [ ] Monitor error logs for 24h
7. [ ] Gather user feedback
8. [ ] Enable feature flag for users (gradual rollout)

### Post-Deployment Monitoring

- [ ] Check error rate in logs
- [ ] Monitor queue job processing
- [ ] Verify email delivery success rate
- [ ] Check browser push delivery rate
- [ ] Monitor database performance
- [ ] Collect user feedback via surveys

---

## File Structure Reference

```
packages/
├── api/
│   ├── src/
│   │   ├── infrastructure/
│   │   │   └── notification/
│   │   │       ├── channels/
│   │   │       │   ├── browser-push.channel.ts
│   │   │       │   ├── email.channel.ts
│   │   │       │   ├── in-app-toast.channel.ts
│   │   │       │   ├── sound.channel.ts
│   │   │       │   └── registry.ts
│   │   │       ├── queue/
│   │   │       │   ├── queue.service.ts
│   │   │       │   ├── workers/
│   │   │       │   │   ├── notification.worker.ts
│   │   │       │   │   └── digest.worker.ts
│   │   │       │   └── config.ts
│   │   │       ├── repositories/
│   │   │       │   ├── notification.repository.ts
│   │   │       │   └── user-preferences.repository.ts
│   │   │       ├── routes/
│   │   │       │   └── notification.routes.ts
│   │   │       ├── controllers/
│   │   │       │   └── notification.controller.ts
│   │   │       └── notification.service.ts
│   │   └── domain/
│   │       └── notification/
│   │           ├── notification.entity.ts
│   │           ├── notification-preference.entity.ts
│   │           └── notification.events.ts
│   │
│   └── __tests__/
│       └── infrastructure/notification/
│           ├── notification.service.spec.ts
│           ├── channels/
│           └── queue/

apps/
├── web/
│   ├── src/
│   │   ├── modules/
│   │   │   └── notification/
│   │   │       ├── components/
│   │   │       │   ├── ToastNotification.vue
│   │   │       │   ├── NotificationCenter.vue
│   │   │       │   └── NotificationSettings.vue
│   │   │       ├── services/
│   │   │       │   ├── notification.service.ts
│   │   │       │   └── preferences.service.ts
│   │   │       ├── stores/
│   │   │       │   └── notification.store.ts
│   │   │       └── index.ts
│   │   └── lib/
│   │       └── sw.ts  (Service Worker)
│   │
│   └── __tests__/
│       └── modules/notification/

specs/
└── 001-daily-productivity/
    ├── spec.md  (User stories & requirements)
    ├── ARCHITECTURE-DECISIONS.md  (This document)
    ├── ARCHITECTURE-DIAGRAMS.md  (Visual diagrams)
    └── IMPLEMENTATION-CHECKLIST.md
```

---

## Dependency List (NPM Packages)

### Required (MVP)

```json
{
  "dependencies": {
    "bull": "^4.11.5",
    "ioredis": "^5.3.2",
    "web-push": "^3.6.6",
    "nodemailer": "^6.9.7"
  },
  "devDependencies": {
    "@types/bull": "^4.11.5",
    "@types/ioredis": "^5.0.2"
  }
}
```

### Optional (Phase 2+)

```json
{
  "dependencies": {
    "@sendgrid/mail": "^7.7.0",
    "mailgun.js": "^9.3.0",
    "twilio": "^3.85.0"
  }
}
```

---

## Configuration Template

### .env.example

```bash
# Notification Service
NOTIFICATION_SERVICE_ENABLED=true
NOTIFICATION_QUEUE_PROVIDER=bull
NOTIFICATION_QUEUE_REDIS_URL=redis://localhost:6379

# Browser Push
NOTIFICATION_BROWSER_PUSH_ENABLED=true
VAPID_PUBLIC_KEY=<your-vapid-public-key>
VAPID_PRIVATE_KEY=<your-vapid-private-key>

# Email
NOTIFICATION_EMAIL_ENABLED=true
NOTIFICATION_EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=<your-sendgrid-key>
SENDGRID_FROM_EMAIL=noreply@dailyuse.app

# Retry Settings
NOTIFICATION_MAX_RETRIES=3
NOTIFICATION_RETRY_BACKOFF_INITIAL_MS=1000

# Digest
NOTIFICATION_DAILY_DIGEST_ENABLED=true
NOTIFICATION_DAILY_DIGEST_HOUR=8

# Monitoring
NOTIFICATION_ERROR_LOGGING_ENABLED=true
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Notifications not appearing | Service Worker not registered | Check SW scope, HTTPS requirement in prod |
| Email not sent | SendGrid credentials invalid | Verify API key, check email domain verified |
| Queue job stalled | Worker crashed | Check logs, restart Bull worker, check concurrency |
| Duplicate notifications | Dedup window too short | Increase window to 10-15s |
| High email latency | Queue overloaded | Increase worker concurrency, split into multiple queues |
| User preferences not applied | Cache not invalidated | Clear user preference cache on update |

---

## Key Metrics to Track

1. **Delivery Success Rate** (%)
   - Target: >95% for browser push, >98% for in-app
   
2. **Average Delivery Latency** (ms)
   - Target: <100ms in-app, <1s browser push, <5min email
   
3. **Queue Processing Time** (ms)
   - Target: <1000ms per job
   
4. **Failure Rate** (%)
   - Target: <5% across all channels
   
5. **User Adoption** (%)
   - Target: >70% enable at least one channel

6. **Quiet Hours Compliance** (%)
   - Target: 100% of notifications respect quiet hours

7. **Task→KR Sync Accuracy** (%)
   - Target: 100% correctness for auto-calculation (if enabled)

---

## References

- [Bull Documentation](https://docs.bullmq.io/)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [SendGrid Email API](https://docs.sendgrid.com/for-developers/sending-email/api-overview)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Express Request/Response](https://expressjs.com/en/api/request.html)

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-03  
**Status**: Ready for Team Review
