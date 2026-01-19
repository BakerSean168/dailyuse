# Changelog

## [0.2.0](https://github.com/BakerSean168/dailyuse/compare/application-server-v0.1.10...application-server-v0.2.0) (2026-01-19)


### Features

* add Prisma repositories for TaskStatistics and TaskTemplate ([b4f1215](https://github.com/BakerSean168/dailyuse/commit/b4f1215ae67225886d1d4d7fc9b8ab316584d025))
* add task template services for CRUD operations and dashboard retrieval ([7775497](https://github.com/BakerSean168/dailyuse/commit/777549719e24d98e828044528b022a43a0a570e2))
* **authentication:** add auth status types and related interfaces ([a6baa48](https://github.com/BakerSean168/dailyuse/commit/a6baa48eaecc377e27b23719ca65438bcf78d7b3))
* **goal:** add sort order update method in GoalFolder aggregate ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))
* **goal:** refactor update goal service to use new request/response types ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))
* Implement Prisma and Memory repositories for Notification, Repository, and Setting modules ([7008cf8](https://github.com/BakerSean168/dailyuse/commit/7008cf8f47a10ace6ec11d661da94b4382f5520c))
* **patterns:** add initial patterns library with scheduler and repository implementations ([47c01b9](https://github.com/BakerSean168/dailyuse/commit/47c01b99df41ef504f94f169dd23f508dee9c937))
* **sync:** add Sync Settings View component for managing sync configuration and providers ([e3cc923](https://github.com/BakerSean168/dailyuse/commit/e3cc923748744745f9837440ea4944170d3e9eeb))
* **sync:** implement in-memory and Prisma repositories for sync profiles, sessions, conflicts, and pending changes ([58c37bf](https://github.com/BakerSean168/dailyuse/commit/58c37bf1bf239f8634f34747f4e0fe38ef337142))
* **sync:** implement sync module with GitHub Gist support ([a6baa48](https://github.com/BakerSean168/dailyuse/commit/a6baa48eaecc377e27b23719ca65438bcf78d7b3))
* **task:** implement new dashboard API requests and responses ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))
* **task:** implement task priority calculation service and tests ([3d93a67](https://github.com/BakerSean168/dailyuse/commit/3d93a67d0af1865a41b91566951d6bdbe5cb52fb))
* **task:** update task services to use new request/response types and remove legacy code ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))


### Bug Fixes

* **authentication:** update API client interfaces for consistency ([a6baa48](https://github.com/BakerSean168/dailyuse/commit/a6baa48eaecc377e27b23719ca65438bcf78d7b3))
* **ipc:** rename IPC channels for consistency ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))
* **reminder:** update reminder IPC channels for clarity ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))
* **schedule:** modify schedule task adapters to return total count in responses ([3f7bbe4](https://github.com/BakerSean168/dailyuse/commit/3f7bbe437d50df6f6a68c955fe44b8a36d05f727))
* update event retrieval method in GoalApplicationService to use getUncommittedDomainEvents ([ab2315a](https://github.com/BakerSean168/dailyuse/commit/ab2315a7fd5dc51e397c37906e91d93abcb3fe3a))
