# Changelog

## [0.2.0](https://github.com/BakerSean168/dailyuse/compare/infrastructure-client-v0.1.10...infrastructure-client-v0.2.0) (2026-01-19)


### Features

* add focus session management features ([07ec678](https://github.com/BakerSean168/dailyuse/commit/07ec6788e320ffed474c3f98a509a23d44de1038))
* add task template services for CRUD operations and dashboard retrieval ([7775497](https://github.com/BakerSean168/dailyuse/commit/777549719e24d98e828044528b022a43a0a570e2))
* **authentication:** add auth status types and related interfaces ([a6baa48](https://github.com/BakerSean168/dailyuse/commit/a6baa48eaecc377e27b23719ca65438bcf78d7b3))
* **authentication:** implement application services for API key, login, registration, password management, and session management ([893dc28](https://github.com/BakerSean168/dailyuse/commit/893dc283e84e56fcfcd30db7db54a152553fa824))
* Enhance infrastructure client with new API clients and methods ([166d6cd](https://github.com/BakerSean168/dailyuse/commit/166d6cd76ebc28cc6d24facecbe5247aafc5ace8))
* **goal:** add sort order update method in GoalFolder aggregate ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))
* **goal:** refactor update goal service to use new request/response types ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))
* Implement Dashboard and Repository modules with HTTP and IPC adapters ([dd85285](https://github.com/BakerSean168/dailyuse/commit/dd85285e4ad1071f525ed3a43849058caa954f71))
* Implement HTTP and IPC adapters for Reminder, Schedule Event, and Schedule Task APIs ([d98454d](https://github.com/BakerSean168/dailyuse/commit/d98454ded58c223bb0172a5a4ed7068b4604ac78))
* implement IPC Result Adapter for unified communication between Main and Renderer processes ([ab73f31](https://github.com/BakerSean168/dailyuse/commit/ab73f318ce7760d354bde79d1b5c2846b7647c31))
* Implement Task Module API Clients and Adapters ([f8ae023](https://github.com/BakerSean168/dailyuse/commit/f8ae0238dc3643c85670a76c4be8cb7dccf3fa24))
* Refactor IPC and lifecycle management ([c886f5d](https://github.com/BakerSean168/dailyuse/commit/c886f5dbd2bd34cc610cfc16a671c2fbc578d556))
* **STORY-027:** Phase 1-2 AI Task Decomposition Implementation Complete ([1e33eda](https://github.com/BakerSean168/dailyuse/commit/1e33edaaad991e64d6e8dded81964ad9616cd139))
* **STORY-044:** implement EncryptionService with AES-256-GCM ([7d6f423](https://github.com/BakerSean168/dailyuse/commit/7d6f423c5067ff9649bd99a906b284066b69d95c))
* **STORY-045:** implement GitHub Sync Adapter ([6c76585](https://github.com/BakerSean168/dailyuse/commit/6c765854ea74381e3c08bc903bcf1cb6eb9eb43a))
* **STORY-046:** implement Nutstore WebDAV adapter with 7 unit tests passing ([3d56df2](https://github.com/BakerSean168/dailyuse/commit/3d56df2fd4bbf95026223ccb55c9e8d422f2cd7a))
* **STORY-053-054:** implement self-hosted server adapter and key management UI ([05484fc](https://github.com/BakerSean168/dailyuse/commit/05484fc0573d0a6bd4735c536e08472804d10d80))
* **STORY-055:** add comprehensive integration, E2E, and security test suites ([89f3501](https://github.com/BakerSean168/dailyuse/commit/89f35018002502300ddd7fe49343dfcf22f59d83))
* **sync:** implement in-memory and Prisma repositories for sync profiles, sessions, conflicts, and pending changes ([58c37bf](https://github.com/BakerSean168/dailyuse/commit/58c37bf1bf239f8634f34747f4e0fe38ef337142))
* **sync:** implement sync module with GitHub Gist support ([a6baa48](https://github.com/BakerSean168/dailyuse/commit/a6baa48eaecc377e27b23719ca65438bcf78d7b3))
* **task:** implement new dashboard API requests and responses ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))
* **task:** update task services to use new request/response types and remove legacy code ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))


### Bug Fixes

* **authentication:** update API client interfaces for consistency ([a6baa48](https://github.com/BakerSean168/dailyuse/commit/a6baa48eaecc377e27b23719ca65438bcf78d7b3))
* Clean up incomplete EPIC-009 code and fix EPIC-006/007/008 compilation errors ([f710437](https://github.com/BakerSean168/dailyuse/commit/f710437b8cb8118837e939220d2cb7ce5216371d))
* **ipc:** rename IPC channels for consistency ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))
* **reminder:** update reminder IPC channels for clarity ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))
* **renderer:** tsc error ([7d72799](https://github.com/BakerSean168/dailyuse/commit/7d72799b9cd8aea709908c25f12861727ef16cff))
* **schedule:** modify schedule task adapters to return total count in responses ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))
