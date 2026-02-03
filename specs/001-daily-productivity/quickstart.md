# Phase 1: Quick Start Guide

**Feature**: DailyUse Personal Productivity Web Platform  
**Created**: 2026-02-03  
**Status**: Implementation Ready

## Setup (15 minutes)

### Prerequisites
- Node.js 18+ and pnpm
- Express.js backend (existing)
- PostgreSQL database
- Redis (Phase 2+)

### Step 1: Database Setup

```bash
# Initialize Prisma schema
cd prisma
pnpm prisma migrate dev --name init

# Seed test data (optional)
pnpm prisma db seed
```

### Step 2: Environment Configuration

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/dailyuse"
REDIS_URL="redis://localhost:6379"

# Auth
JWT_SECRET="your-secret-key-here-min-32-chars"
SESSION_SECRET="another-secret-key-min-32-chars"

# Notifications
SENDGRID_API_KEY="sg-..."
NOTIFICATION_CHANNELS="in_app,browser,email"

# App
NODE_ENV="development"
API_PORT=3000
API_BASE_URL="http://localhost:3000"
WEB_BASE_URL="http://localhost:3001"
```

### Step 3: Install Dependencies & Start

```bash
# Install packages
pnpm install

# Start backend
pnpm nx serve api

# Start web frontend (in another terminal)
pnpm nx serve web
```

Visit `http://localhost:3001` and sign up.

---

## Core Workflows

### Workflow 1: Create Goal and Track via Key Results (10 min)

**User Journey**: Create Q1 2026 goal → Add 3 key results → Update KR progress

1. **Sign in** and navigate to Goals
2. **Click "New Goal"**:
   - Title: "Ship v1.0 of productivity app"
   - Period: Q1 2026
   - Click "Create"
3. **Add Key Results**:
   - KR 1: "Complete API implementation" (Target: 100%)
   - KR 2: "Achieve 95% test coverage" (Target: 95%)
   - KR 3: "Launch to 100 beta users" (Target: 100)
4. **Update Progress**:
   - Navigate to KR 1, set currentValue (e.g., 50%)
   - Goal progress updates automatically

**Code to Review**: 
- `packages/contracts/src/modules/goal/`
- `apps/api/src/modules/goal/`

---

### Workflow 2: Manage Daily Tasks (8 min)

**User Journey**: Create task → Link to KR → Mark complete → Recurring task auto-created

1. **Navigate to Tasks**
2. **Click "New Task"**:
   - Title: "Design API schema"
   - Priority: High
   - Due: Tomorrow, 5 PM
   - Link to KR (optional)
   - Click "Create"
3. **Mark Complete**:
   - Task list shows new task
   - Click checkmark to mark done
   - If recurring, next instance auto-created
4. **View Dependencies**:
   - Click task to see linked KR
   - See how task completion affects KR progress

**Code to Review**:
- `packages/contracts/src/modules/task/`
- `apps/api/src/modules/task/`

---

### Workflow 3: Set Up Daily Reminders (5 min)

**User Journey**: Create habit reminder → Receive notifications

1. **Navigate to Reminders**
2. **Click "New Reminder"**:
   - Name: "Morning meditation"
   - Time: 6:00 AM
   - Recurrence: Every weekday
   - Channels: In-App, Browser Push
   - Click "Create"
3. **Test Notification** (manual trigger for MVP):
   - Click "Send Test Notification"
   - See in-app toast appear
   - See browser push (if enabled)

**Code to Review**:
- `packages/contracts/src/modules/reminder/`
- `apps/api/src/modules/reminder/`
- `apps/api/src/shared/notification/` (dispatcher)

---

### Workflow 4: Build Knowledge Repository (10 min)

**User Journey**: Create note → Upload media → Tag & organize

1. **Navigate to Repository**
2. **Create a Note**:
   - Click "New Note"
   - Title: "AI Implementation patterns"
   - Write markdown content
   - Save
3. **Create Folder**:
   - "Learning/AI" folder
   - Move note into folder
4. **Upload Media**:
   - Add diagram image
   - Tag: "architecture", "ai"
5. **Search**:
   - Search "pattern" → finds note and mentions
   - Filter by tag "ai" → shows all AI resources

**Code to Review**:
- `packages/contracts/src/modules/repository/`
- `apps/api/src/modules/repository/`

---

### Workflow 5: Customize Settings (3 min)

**User Journey**: Set theme, notification preferences, editor settings

1. **Settings → Appearance**:
   - Theme: Dark
   - Language: English
   - Click "Save"
2. **Settings → Notifications**:
   - Channels: Browser Push, In-App Toast
   - Quiet hours: 10 PM - 7 AM
   - Click "Save"
3. **Settings → Editor**:
   - Autosave interval: 30 seconds
   - Markdown flavor: GitHub Flavored Markdown
   - Click "Save"

**Code to Review**:
- `packages/contracts/src/modules/setting/`
- `apps/api/src/modules/setting/`

---

## Code Architecture Overview

### Folder Structure

```
apps/api/
├── src/
│   ├── modules/
│   │   ├── auth/          # Authentication
│   │   ├── goal/          # Goal & OKR management
│   │   ├── task/          # Task management
│   │   ├── reminder/      # Reminders/habits
│   │   ├── repository/    # Knowledge repository
│   │   ├── note/          # Note editor
│   │   ├── schedule/      # Calendar/schedule
│   │   ├── notification/  # Notifications
│   │   └── setting/       # User settings
│   ├── shared/
│   │   ├── auth/          # Auth helpers
│   │   ├── validation/    # Zod schemas
│   │   ├── database/      # Prisma setup
│   │   └── notification/  # Notification dispatcher
│   ├── app.ts
│   ├── container.ts       # DI container
│   └── index.ts
│
packages/contracts/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── api/       # Request/Response DTOs
│   │   │   ├── aggregates/ # Client/Server DTOs
│   │   │   ├── protocol/  # RPC map definitions
│   │   │   └── dtos/      # Complex DTOs
│   │   ├── goal/          # Same structure
│   │   ├── task/          # Same structure
│   │   └── ... (other modules)
```

### Key Patterns

**DTO Separation** (Critical - per research.md):
```typescript
// Domain entity (internal, database)
interface AuthEntity { id, email, passwordHash, ... }

// Request DTO (API input)
type LoginReq = { email, password }

// Response DTO (API output)
interface AuthClientDTO { id, email, displayName, ... }

// RPC Map (uses DTOs only, NEVER entities)
export type AuthRpcMap = {
  'auth:login': [LoginReq, AuthClientDTO];  // ✓ CORRECT
};
```

**Module Structure**:
```
module/
├── api/
│   ├── requests.ts        # Input schemas
│   ├── responses.ts       # Output DTOs
│   └── index.ts           # Exports
├── aggregates/
│   ├── *-client.ts        # Client-facing DTOs
│   ├── *-server.ts        # Server-internal DTOs
│   └── index.ts
├── protocol/
│   └── {module}-rpc-map.ts # RPC operations definition
├── dtos/
│   └── index.ts           # Complex/special DTOs
└── index.ts               # Module exports
```

---

## Implementation Checklist

### Phase 1: Core MVP (Weeks 1-2)

- [ ] **Database & Schema**
  - [ ] Prisma schema for all entities
  - [ ] Initial migrations
  - [ ] User & Auth tables

- [ ] **Authentication**
  - [ ] Sign up endpoint
  - [ ] Login endpoint with JWT
  - [ ] Session management
  - [ ] Auth middleware

- [ ] **Goal & OKR**
  - [ ] Goal CRUD endpoints
  - [ ] Key Result CRUD endpoints
  - [ ] Progress calculation (avg of KRs)
  - [ ] RPC map definitions

- [ ] **Task Management**
  - [ ] Task CRUD endpoints
  - [ ] Status lifecycle (not_started → completed)
  - [ ] Recurring task logic
  - [ ] RPC map definitions

- [ ] **Notifications (Basic)**
  - [ ] NotificationService class
  - [ ] In-App Toast channel
  - [ ] Browser Push (Service Worker)
  - [ ] Notification preferences (settings)

- [ ] **Settings**
  - [ ] Settings CRUD
  - [ ] User preferences storage
  - [ ] Defaults on signup

- [ ] **Frontend Integration**
  - [ ] React hooks for RPC calls
  - [ ] Sign up form → API call
  - [ ] Login form → API call
  - [ ] Goal/Task CRUD UI
  - [ ] Basic notifications UI

### Phase 2: Enhanced Features (Weeks 3-4)

- [ ] **Reminders & Habits**
  - [ ] Reminder CRUD
  - [ ] Scheduler integration (cron/queue)
  - [ ] Email/Sound channels (Bull + Queue)
  - [ ] RRULE parsing & validation

- [ ] **Repository & Notes**
  - [ ] Repository item CRUD
  - [ ] Note editor with autosave
  - [ ] File upload (images, documents)
  - [ ] Tagging & folder organization
  - [ ] Full-text search

- [ ] **Schedule**
  - [ ] Calendar view
  - [ ] Event CRUD
  - [ ] Goal/Task/Reminder calendar rendering
  - [ ] Date range queries

- [ ] **Performance**
  - [ ] Redis caching for settings
  - [ ] Pagination for large lists
  - [ ] Query optimization
  - [ ] Index validation

- [ ] **Testing**
  - [ ] Unit tests (services, validators)
  - [ ] Integration tests (API endpoints)
  - [ ] E2E tests (user workflows)
  - [ ] Load testing (concurrency, throughput)

---

## Testing Your Implementation

### Manual Testing (Postman/Curl)

```bash
# 1. Sign up
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Test@1234","displayName":"John"}'

# 2. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Test@1234"}'

# 3. Create goal (use token from login response)
curl -X POST http://localhost:3000/goals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Q1 Goal","periodType":"quarter","periodLabel":"Q1 2026"}'

# 4. List goals
curl -X GET http://localhost:3000/goals \
  -H "Authorization: Bearer <token>"
```

### Unit Testing Example

```typescript
// modules/goal/services/goal.service.test.ts
describe('GoalService', () => {
  it('should create a goal with draft status', async () => {
    const req: CreateGoalReq = {
      title: 'Test Goal',
      periodType: 'quarter',
    };
    
    const result = await goalService.create(userId, req);
    
    expect(result).toMatchObject({
      title: 'Test Goal',
      status: 'draft',
      progress: 0,
    });
  });
  
  it('should calculate progress as average of KRs', async () => {
    // Create goal with 2 KRs
    // KR1: 60% progress
    // KR2: 80% progress
    // Goal progress should be 70%
    
    const goal = await goalService.getWithKeyResults(goalId);
    expect(goal.progress).toBe(70);
  });
});
```

### Integration Testing Example

```typescript
// test/integration/goal.integration.test.ts
describe('Goal API', () => {
  it('should create goal and return DTO', async () => {
    const response = await request(app)
      .post('/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Goal', periodType: 'quarter' });
    
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('status', 'draft');
    expect(response.body.data).not.toHaveProperty('passwordHash'); // DTO should not expose internals
  });
});
```

---

## Common Issues & Solutions

### Issue: "Cannot find module" when importing from contracts

**Solution**: Ensure `paths` in `tsconfig.base.json` includes:
```json
"@dailyuse/contracts/*": ["packages/contracts/src/*"]
```

### Issue: Zod validation failing unexpectedly

**Solution**: Check that all fields match schema requirements. Use `schema.parse()` vs `safeParse()`:
- `parse()` throws error (use in handlers)
- `safeParse()` returns success/error (use in tests)

### Issue: RPC response type doesn't match DTO

**Solution**: Verify RPC map definition:
```typescript
// ✗ WRONG - Using Entity
'goal:create': [CreateGoalReq, GoalEntity]

// ✓ CORRECT - Using DTO
'goal:create': [CreateGoalReq, GoalClientDTO]
```

### Issue: Database migration conflicts

**Solution**:
```bash
# Reset dev database
pnpm prisma migrate reset

# Check migration status
pnpm prisma migrate status

# Create new migration
pnpm prisma migrate dev --name description
```

---

## Next Steps

1. **Read the full documentation**:
   - [research.md](./research.md) - Technical decisions
   - [data-model.md](./data-model.md) - Database schema
   - [api-contracts.md](./api-contracts.md) - Endpoint specifications

2. **Start implementing Phase 1**:
   - Follow the Phase 1 checklist above
   - Reference code examples in each module's `example/` folder
   - Use the RPC documentation from Phase 0 research

3. **Set up development workflow**:
   - Create feature branches per user story
   - Implement → Test → Review → Merge
   - Update IMPL_PLAN with progress

4. **Team alignment**:
   - Share this document with team
   - Review RPC protocol standards in research.md
   - Set code review criteria for DTO usage

---

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Sign up → First login | < 500ms | Database + JWT generation |
| Load goal list (20 items) | < 100ms | With pagination |
| Create goal + 3 KRs | < 200ms | Transaction with 4 inserts |
| Save note (autosave) | < 50ms | Queue for batch writes |
| Search repository | < 200ms | Full-text index required |
| List notifications | < 100ms | Index on (userId, createdAt) |

---

## Support & References

- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Express.js Guide**: https://expressjs.com/
- **Prisma Docs**: https://www.prisma.io/docs/
- **Zod Schema Validation**: https://zod.dev/
- **RFC 5545 (RRULE)**: https://datatracker.ietf.org/doc/html/rfc5545

---

**Status**: Ready to implement. Begin with Phase 1 checklist above.

