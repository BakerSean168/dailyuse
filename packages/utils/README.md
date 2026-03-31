# @dailyuse/utils

Core utility library for the Memoflow application, providing cross-platform support for logging, domain modeling, event handling, and frontend utilities.

## 📦 Installation

```bash
pnpm add @dailyuse/utils
```

## 🛠️ Modules

### 1. Logging System (`logger`)

A robust, cross-platform logging system based on Winston (Node.js) and Console/HTTP (Browser).

**Features:**
- **Cross-Platform**: Unified `ILogger` interface.
- **Node.js**: Uses `winston` with daily file rotation (`logs/app-YYYY-MM-DD.log`).
- **Browser**: Uses `ConsoleTransport` for dev tools and `HttpTransport` to send logs to the API.
- **Isolation**: Node.js specific code is isolated in `@dailyuse/utils/winston`.

**Usage:**

```typescript
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('MyContext');

logger.info('Hello world', { foo: 'bar' });
logger.error('Something went wrong', new Error('Oops'));
```

**Configuration (API):**

```typescript
import { LoggerFactory } from '@dailyuse/utils';
import { WinstonLogger } from '@dailyuse/utils/winston';

LoggerFactory.registerProvider((context) => new WinstonLogger(context));
```

### 2. Domain Core (`domain`)

Base classes for Domain-Driven Design (DDD).

- **Entity**: Base class for entities with UUID identity.
- **AggregateRoot**: Base class for aggregate roots, supporting domain events.
- **ValueObject**: Base class for immutable value objects.
- **EventBus**: Global event bus for domain events.

**Usage:**

```typescript
import { Entity, ValueObject } from '@dailyuse/utils';

class UserId extends ValueObject { ... }

class User extends Entity<UserId> { ... }
```

### 3. Event System (`event`)

A unified, cross-platform event bus (`CrossPlatformEventBus`) supporting:
- **Pub/Sub**: `publish(event)` / `on(eventType, handler)`
- **Request/Response**: `invoke(requestType, payload)` / `handle(requestType, handler)`
- **Type Safety**: Strongly typed events and requests.

**Usage:**

```typescript
import { eventBus } from '@dailyuse/utils';

// Subscribe
eventBus.on('USER_CREATED', async (event) => {
  console.log('User created:', event.payload);
});

// Publish
await eventBus.publish({
  eventType: 'USER_CREATED',
  payload: { id: '123' }
});
```

### 4. Frontend Utilities (`frontend`)

Helper functions for frontend development.

- **apiUtils**: `getEnvironmentConfig`, `createAuthHeader`, `exponentialBackoff`, etc.
- **debounce / throttle**: Function rate limiting.

**Usage:**

```typescript
import { getEnvironmentConfig, createAuthHeader } from '@dailyuse/utils';

const config = getEnvironmentConfig();
const headers = createAuthHeader(token);
```

### 5. General Utilities

- **Time/Date**: `Time`, `Date` helpers.
- **UUID**: UUID generation.
- **Response**: Standard API response wrappers (`Result`, `Either`).


