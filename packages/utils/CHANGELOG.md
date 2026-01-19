# Changelog

## [0.2.0](https://github.com/BakerSean168/dailyuse/compare/utils-v0.1.10...utils-v0.2.0) (2026-01-19)


### Features

* Add frontend best practices documentation for template management ([9133729](https://github.com/BakerSean168/dailyuse/commit/9133729a995d71f981f90c6869b382f49617e277))
* Add reminder-specific error classes for better semantic error handling ([9133729](https://github.com/BakerSean168/dailyuse/commit/9133729a995d71f981f90c6869b382f49617e277))
* add SettingsView and ScheduleView components with full settings management ([346813a](https://github.com/BakerSean168/dailyuse/commit/346813ab04dcc7b1794d32231c049898c9505ec6))
* add WelcomeView component for optimized landing page ([dc585ef](https://github.com/BakerSean168/dailyuse/commit/dc585efafe762008f80b9c2a23169337c17d5b28))
* **api:** add CrossModuleAPIClient for task binding with goals and key results ([f52d152](https://github.com/BakerSean168/dailyuse/commit/f52d152b75f236db65d19324f04b3da1d9e00fae))
* Enhance ReminderTriggerService with null checks and error logging ([9133729](https://github.com/BakerSean168/dailyuse/commit/9133729a995d71f981f90c6869b382f49617e277))
* Implement detailed error classes for reminder module operations ([9133729](https://github.com/BakerSean168/dailyuse/commit/9133729a995d71f981f90c6869b382f49617e277))
* implement IPC Result Adapter for unified communication between Main and Renderer processes ([ab73f31](https://github.com/BakerSean168/dailyuse/commit/ab73f318ce7760d354bde79d1b5c2846b7647c31))
* Implement Smart Reminder Frequency feature across Application and Infrastructure layers ([ceb23b8](https://github.com/BakerSean168/dailyuse/commit/ceb23b8bdc4d7c747d72756dc7bffe73ec490f90))
* Implement Smart Reminder Frequency feature across Application and Infrastructure layers ([ab5446e](https://github.com/BakerSean168/dailyuse/commit/ab5446e5f6afc6c172f14e4e59012e7509b1e4a7))
* Introduce ScheduleErrors for better error handling in scheduling module ([9133729](https://github.com/BakerSean168/dailyuse/commit/9133729a995d71f981f90c6869b382f49617e277))
* **logger:** refactor logging system to support Winston and HTTP transport ([2008036](https://github.com/BakerSean168/dailyuse/commit/20080365475bc4ec8ea2652bb70e23ee91ea51e0))
* **patterns:** add initial patterns library with scheduler and repository implementations ([47c01b9](https://github.com/BakerSean168/dailyuse/commit/47c01b99df41ef504f94f169dd23f508dee9c937))
* Refactor Goal and KeyResult views, remove KeyResultInfo component, and implement CrossPlatformEventBus ([5108eb9](https://github.com/BakerSean168/dailyuse/commit/5108eb9e13307ea907509f029f9face4ea5df714))
* Refactor Task CRUD architecture and implement UI components for ONE_TIME tasks ([8d7d1a5](https://github.com/BakerSean168/dailyuse/commit/8d7d1a5e4c710b2f94805e76d8cb2b0e824f665d))
* Refactor Task CRUD architecture and implement UI components for ONE_TIME tasks ([eeb1551](https://github.com/BakerSean168/dailyuse/commit/eeb1551a23af0367b9ebd4c6e6a218919adf612b))
* **task:** add updateTimeType method to TaskTemplate for dynamic time configuration ([f52d152](https://github.com/BakerSean168/dailyuse/commit/f52d152b75f236db65d19324f04b3da1d9e00fae))
* Update event types in ReminderTemplate aggregate for consistency ([9133729](https://github.com/BakerSean168/dailyuse/commit/9133729a995d71f981f90c6869b382f49617e277))


### Bug Fixes

* **build:** adjust tsup configuration for improved type declaration handling ([f52d152](https://github.com/BakerSean168/dailyuse/commit/f52d152b75f236db65d19324f04b3da1d9e00fae))
* **contracts:** update authentication response DTOs to reflect cookie storage ([f52d152](https://github.com/BakerSean168/dailyuse/commit/f52d152b75f236db65d19324f04b3da1d9e00fae))
* Improve DomainError to include operation tracking and error chaining ([9133729](https://github.com/BakerSean168/dailyuse/commit/9133729a995d71f981f90c6869b382f49617e277))
* **reminder:** resolve naming conflicts with enums in ReminderGroup and ReminderTemplate ([f52d152](https://github.com/BakerSean168/dailyuse/commit/f52d152b75f236db65d19324f04b3da1d9e00fae))
* **task:** standardize enum naming conventions and add task events ([f52d152](https://github.com/BakerSean168/dailyuse/commit/f52d152b75f236db65d19324f04b3da1d9e00fae))
* 移除 tsbuildinfo 缓存文件并修复构建配置 ([7151680](https://github.com/BakerSean168/dailyuse/commit/7151680c2df72bd9a1fb1cb6ef287d380aa28c78))
* 移除 tsbuildinfo 缓存文件并修复构建配置 ([21ab56e](https://github.com/BakerSean168/dailyuse/commit/21ab56ec7a7e5f47df1c9e1ce8c28fc47e13f491))
