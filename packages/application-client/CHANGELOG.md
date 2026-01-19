# Changelog

## [0.2.0](https://github.com/BakerSean168/dailyuse/compare/application-client-v0.1.10...application-client-v0.2.0) (2026-01-19)


### Features

* add focus session management features ([07ec678](https://github.com/BakerSean168/dailyuse/commit/07ec6788e320ffed474c3f98a509a23d44de1038))
* Add habit module exports and update sprint status ([8122950](https://github.com/BakerSean168/dailyuse/commit/81229500f42f2ad26c8af688465b5b8452c66e24))
* add task template services for CRUD operations and dashboard retrieval ([7775497](https://github.com/BakerSean168/dailyuse/commit/777549719e24d98e828044528b022a43a0a570e2))
* **authentication:** add auth status types and related interfaces ([a6baa48](https://github.com/BakerSean168/dailyuse/commit/a6baa48eaecc377e27b23719ca65438bcf78d7b3))
* **authentication:** implement application services for API key, login, registration, password management, and session management ([893dc28](https://github.com/BakerSean168/dailyuse/commit/893dc283e84e56fcfcd30db7db54a152553fa824))
* Enhance infrastructure client with new API clients and methods ([166d6cd](https://github.com/BakerSean168/dailyuse/commit/166d6cd76ebc28cc6d24facecbe5247aafc5ace8))
* **EPIC-006:** Implement task decomposition, time estimation, and priority analysis services with tests ([3b183e6](https://github.com/BakerSean168/dailyuse/commit/3b183e6aca464fa15a4b7c7ac9b2f24a2eacc0ef))
* **EPIC-008:** Implement all 6 habit services with comprehensive tests ([19e09e0](https://github.com/BakerSean168/dailyuse/commit/19e09e088cc375c19899e33cd22e46262872ab7d))
* **goal:** add sort order update method in GoalFolder aggregate ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))
* **goal:** refactor update goal service to use new request/response types ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))
* Implement Dashboard and Repository modules with HTTP and IPC adapters ([dd85285](https://github.com/BakerSean168/dailyuse/commit/dd85285e4ad1071f525ed3a43849058caa954f71))
* Implement HTTP and IPC adapters for Reminder, Schedule Event, and Schedule Task APIs ([d98454d](https://github.com/BakerSean168/dailyuse/commit/d98454ded58c223bb0172a5a4ed7068b4604ac78))
* Implement Task Module API Clients and Adapters ([f8ae023](https://github.com/BakerSean168/dailyuse/commit/f8ae0238dc3643c85670a76c4be8cb7dccf3fa24))
* **PriorityAnalysisService:** Expand priority analysis tests with Eisenhower matrix classification and context fit analysis ([af027ea](https://github.com/BakerSean168/dailyuse/commit/af027ea40db513847fcffcad5eb9b7d8ba236317))
* **schedule:** refactor schedule services to return entity objects ([b0efdbf](https://github.com/BakerSean168/dailyuse/commit/b0efdbfe2c5a21252ba2105d17fdc87223a9d24a))
* **STORY-027:** Phase 1-2 AI Task Decomposition Implementation Complete ([1e33eda](https://github.com/BakerSean168/dailyuse/commit/1e33edaaad991e64d6e8dded81964ad9616cd139))
* **STORY-029:** Smart Priority Analysis implementation ([d62a50b](https://github.com/BakerSean168/dailyuse/commit/d62a50b783d505cd1ddb0d4b66cb726176a927b1))
* **STORY-030:** Daily Planning Service implementation ([27d1d54](https://github.com/BakerSean168/dailyuse/commit/27d1d5421918278806aa5ac7de47573bc0f3e6f3))
* **STORY-031:** Review & Reports Analytics implementation ([4d65df5](https://github.com/BakerSean168/dailyuse/commit/4d65df557d4c73c2ba48f38a548fd214f939e73e))
* **STORY-032-036:** Implement EPIC-007 core focus services ([a315323](https://github.com/BakerSean168/dailyuse/commit/a315323a1473c1f06de24a3060c49c642bf42232))
* **STORY-043:** implement SyncAdapter interface architecture ([e02e013](https://github.com/BakerSean168/dailyuse/commit/e02e0135c05dc9b022fd5e84ef447d3108c1a53b))
* **STORY-044:** implement EncryptionService with AES-256-GCM ([7d6f423](https://github.com/BakerSean168/dailyuse/commit/7d6f423c5067ff9649bd99a906b284066b69d95c))
* **STORY-051-052:** implement data export/import services for JSON, CSV, and backup formats ([b568dc8](https://github.com/BakerSean168/dailyuse/commit/b568dc8b4a892cad5a6a7e6854e94bef5f5a3fdd))
* **sync:** implement in-memory and Prisma repositories for sync profiles, sessions, conflicts, and pending changes ([58c37bf](https://github.com/BakerSean168/dailyuse/commit/58c37bf1bf239f8634f34747f4e0fe38ef337142))
* **sync:** implement sync module with GitHub Gist support ([a6baa48](https://github.com/BakerSean168/dailyuse/commit/a6baa48eaecc377e27b23719ca65438bcf78d7b3))
* **TaskDecompositionService:** Add comprehensive tests for task decomposition, including complexity assessment and risk identification ([af027ea](https://github.com/BakerSean168/dailyuse/commit/af027ea40db513847fcffcad5eb9b7d8ba236317))
* **task:** implement new dashboard API requests and responses ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))
* **TaskTimeEstimationService:** Enhance time estimation with confidence intervals, time-of-day factors, and historical data analysis ([af027ea](https://github.com/BakerSean168/dailyuse/commit/af027ea40db513847fcffcad5eb9b7d8ba236317))
* **task:** update task services to use new request/response types and remove legacy code ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))


### Bug Fixes

* **authentication:** update API client interfaces for consistency ([a6baa48](https://github.com/BakerSean168/dailyuse/commit/a6baa48eaecc377e27b23719ca65438bcf78d7b3))
* Clean up incomplete EPIC-009 code and fix EPIC-006/007/008 compilation errors ([f710437](https://github.com/BakerSean168/dailyuse/commit/f710437b8cb8118837e939220d2cb7ce5216371d))
* **ipc:** rename IPC channels for consistency ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))
* **reminder:** update reminder IPC channels for clarity ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))
* **schedule:** modify schedule task adapters to return total count in responses ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))
* update event retrieval method in GoalApplicationService to use getUncommittedDomainEvents ([ab2315a](https://github.com/BakerSean168/dailyuse/commit/ab2315a7fd5dc51e397c37906e91d93abcb3fe3a))
