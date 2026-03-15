# Account Composition Root

`@dailyuse/account` follows the governance-style factory composition root pattern.

## Key Code Locations

| Concern                | File                                                                  |
| ---------------------- | --------------------------------------------------------------------- |
| Composition root       | `src/infrastructure-server/account.module.ts`                         |
| API transport assembly | `src/api/module.ts`                                                   |
| Transport mapping      | `src/api/transport-handlers.ts`                                       |
| Event runtime          | `src/application-server/handlers/register-account-event-listeners.ts` |
| Electron wiring        | `src/electron-entry/index.ts`                                         |

## Usage

```ts
import { createAccountModule } from '@dailyuse/account/infrastructure-server';

const module = createAccountModule({ accountRepository });
module.start();

// Transport-neutral API
const profile = await module.api.getProfile(identityId);

// Cleanup
module.dispose();
```

## Migration Notes

- `createAccountModule(deps)` is the single composition root
- Event listeners are module-owned runtime contributions with idempotent `start()`/`stop()`
- Transport handlers consume only `module.api`
- Prisma / PowerSync repositories are chosen by the outer assembly (API or Electron)
- Legacy `AccountContainer` singleton has been deleted
