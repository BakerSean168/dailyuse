---
tags:
  - plan
  - active
  - release
  - ci-cd
description: MemoFlow 0.10.0 发布闭环与 Release Lifecycle V2 实施计划
created: 2026-08-23T11:48:00+08:00
updated: 2026-08-23T19:30:55+08:00
---

# Release Lifecycle V2 — 0.10.0 发布闭环

## Outcome

把 release-please 从“每次 main push 都扫描并同时负责发布”的路径中拆出，只负责按需维护 Release PR；真正发布由 exact-SHA CI 驱动的单一 orchestrator 完成：Draft Release → Desktop assets + Docker images → postflight → Publish。

0.10.0 是新链路的首个正式样板版本；本计划先完成发布基础设施重构，再更新/合并现有 #196，最后执行 0.10.0 发布。

## Current evidence

- `main@5b4fea75d` clean；最新正式版本 `v0.9.0`。
- `v0.9.0..main` 已累计 1737 commits；release-please 在 backfill file list / merge-commit pagination 阶段反复 GitHub API timeout。
- Release PR #196 已生成 0.10.0 version/changelog，required CI 全绿，仅落后 main 一个 docs-only commit。
- 现有 `docker-deploy.yml` 由 tag push 触发并要求 tag SHA 已存在成功 CI；tag 与 CI 并发存在竞态。
- 现有 `release.yml` 在 GitHub Release `published` 后才构建 Desktop assets，导致公开 Release 可能先于资产完成。

## Protected contracts

- 版本身份保持单产品：root `package.json`、`apps/desktop/package.json`、`.release-please-manifest.json` 必须一致。
- 正式 tag 继续使用 `v<semver>`，且必须指向经过成功 `CI` 的 exact SHA。
- Docker production promotion 继续只消费该 SHA 的 verified CI artifact closure，不从未验证源码重新构建。
- API / migrator 仍是同版本发布单元；production rollout 本身不在本计划中自动执行。
- 发布失败不得公开半成品 Release；必须保留 Draft 且允许幂等重跑。

## RL2-01 — Prepare Release 与 Publish 解耦

**Goal:** release-please 只按需创建/更新 Release PR，不再在每次 main push 上做昂贵历史扫描，也不创建 GitHub Release/tag。

**Implementation:**

1. `release-please.yml` 改为 `workflow_dispatch`。
2. manifest config 启用 `skip-github-release`。
3. 保留版本/changelog/desktop extra-file 行为。
4. 增加 workflow contract test。

**Acceptance:** 普通 main push 不运行 release-please；手工 Prepare Release 仍可维护 release PR。

## RL2-02 — Exact-SHA Release Orchestrator

**Goal:** Release PR merge 后只在该 merge SHA 的 `CI` 成功时开始发布。

**Implementation:**

1. 新增 `release-publish.yml`，监听 `CI` workflow_run completed + 手工 retry 入口。
2. 验证 release commit subject、三份 version identity、CHANGELOG heading、main ancestry、exact-SHA CI。
3. 幂等创建 Draft GitHub Release 与 `v<version>` tag；冲突时 fail closed。
4. 直接调用 reusable Desktop/Docker workflows，避免依赖 token-created tag 的递归事件。

**Acceptance:** 非 release main commit 只得到 no-op success；release commit 在 CI 绿后进入 Draft；错误 tag/version/SHA fail closed。

## RL2-03 — Desktop assets before Publish

**Goal:** Desktop Windows/Linux 资产在 Draft 阶段构建并上传。

**Implementation:**

1. 将 `release.yml` 改为 reusable + manual retry。
2. 显式接收 release tag/SHA 并 checkout exact SHA。
3. 保留版本一致性检查与 Windows/Linux packaging。
4. 生成 SHA256 清单与 `desktop-release-manifest.json`，上传 Draft Release。

**Acceptance:** Desktop 任一平台失败时 Release 仍为 Draft；retry 不生成新版本/tag。

## RL2-04 — Docker publish 与 deployment 语义分离

**Goal:** workflow 明确表达“发布镜像”而非“部署生产机”。

**Implementation:**

1. `docker-deploy.yml` 迁移为 `publish-images.yml` reusable + manual retry。
2. exact release SHA 解析 verified CI artifacts。
3. 仅发布 `<vX.Y.Z>` 与 `<vX.Y.Z>-<sha12>` 两类 immutable release tags；`prod-latest` 留给独立 production rollout/promotion。
4. 记录 API/Web/Migrator image digests 到 `docker-release-manifest.json` 并上传 Draft Release。
5. 保留 production promotion provenance artifact。

**Acceptance:** 镜像 digest 可从 Release 追溯；workflow 不宣称已经部署生产服务器。

## RL2-05 — Postflight / atomic publish

**Goal:** GitHub Release 仅在 Desktop + Docker 两条 lane 均成功后公开。

**Implementation:**

1. Finalize job 下载两份 lane manifest。
2. 校验 version/tag/gitSha 与 exact CI run identity。
3. 生成 `release-manifest.json` 并上传。
4. 最后一步将 Draft 改为 Published/Latest。

**Acceptance:** 任一前置失败均无 Published Release；成功时 release manifest 能唯一追溯 Git SHA、CI、桌面资产与镜像 digest。

## RL2-06 — Release health 与文档收口

**Goal:** 防止再次长期堆积未发布历史。

**Implementation:**

1. 增加非阻塞 release health audit：release age、commits since tag、pending release PR age。
2. 更新 `AGENT.md` 与 release guide，删除旧 tag→docker-deploy 默认链路描述。
3. 完成 workflow tests、governance、diff hygiene。

**Acceptance:** 新标准发布路径有单一文档入口；health audit 只告警不阻塞产品 CI。

## 0.10.0 execution after infrastructure merge

1. rebase/update #196 onto new main；保留既有 release commit，补人工 Highlights。
2. required CI green 后 merge #196。
3. exact-SHA `CI` success 自动进入 Release Publish。
4. Draft + Desktop + Docker + postflight 全绿后 Publish `v0.10.0`。
5. 验证下一次 Prepare Release 以 `v0.10.0` 为新基线，不再回扫 `v0.9.0` 的超长历史。

## Implementation checkpoint — Release infrastructure ready for PR

Release Lifecycle V2 infrastructure implementation is complete on `chore/release-lifecycle-v2` and remains active until the real `v0.10.0` release closes.

Verified before PR:

- release-please is manual Prepare Release only; `skip-github-release: true`;
- exact-SHA Release Publish orchestrator is fail-closed on commit/version/CHANGELOG/tag/SHA/CI identity;
- Desktop and Docker lanes are reusable and retryable against the same Draft release;
- Docker release publication uses immutable `vX.Y.Z` / `vX.Y.Z-<sha12>` tags only; `prod-latest` is explicitly outside the Draft release phase;
- canonical desktop/docker/release manifests and SHA256 evidence are covered by behavioral tests;
- `actionlint` passes on all five release workflows;
- `ci-cd-platform` governance: 44/44 tests pass;
- Test System V2 inventory: 1072 files, governance suite 37;
- repository `governance:check`, `docs:check`, inventory check and `git diff --check` pass;
- standard `validate-local-deploy` verdict: **pass**, `ready for PR: yes`; repository policy classified this workflow-only change as not requiring a Docker runtime rebuild.

Next gate: merge this infrastructure PR, update existing Release PR #196 onto the new main, then exercise the real 0.10.0 Draft → assets/images → postflight → Publish path.

## Implementation checkpoint — #259 merged / 0.10.0 focus-gate repair

- Release Lifecycle V2 infrastructure merged as PR #259 at `main@2c2171905`; the exact-SHA `Release Publish` workflow subsequently ran against that ordinary main commit and correctly completed as a no-op without creating a tag or release.
- Release PR #196 is rebased directly on `2c2171905` as `f3221c4a3 chore(main): release 0.10.0`; version identity is 0.10.0 across root/Desktop/manifest.
- #196 exposed an existing Web Flow Shard 4 focus failure in Task/Reminder resize journeys. The same failure reproduced on main, so it is not caused by release metadata.
- Browser event evidence showed failed drags sometimes read the resizer bounding box while the 200ms panel-width transition was still settling; `pointerdown` then landed on adjacent AI/workspace content, so `startPanelResize()` never owned the gesture and no focus restoration could occur.
- Focused repair: keep the resize hit target fully inside the clipped business panel with explicit stacking, and centralize Web E2E panel dragging through a helper that calls Playwright `hover()` before reading geometry. `hover()` supplies the missing stable/receives-events actionability gate instead of relying on stale coordinates.
- Verification so far: Task resize journey 3/3, Reminder resize journey 3/3, Goal/Notification/Schedule resize journeys 3/3 all pass.
- Package/repository validation: app-vue 183 files / 759 tests, app-vue typecheck, affected lint/typecheck/test, governance, docs, inventory, and diff check all pass.
- Standard local-deploy validator reran on isolated machine-local ports `63180-63184`: all five Docker services healthy, verdict `pass`, `readyForPr: yes`, no blocking issues or warnings. The canonical main validation stack remained untouched.

Next gate: run package/affected/governance validation, merge the focused repair, rebase #196 onto the repaired main, then resume the real 0.10.0 publish path.

## Implementation checkpoint — v0.10.0 packaging retry repair

- The first real `Release Publish` run preserved `v0.10.0` as a Draft and exposed three release-lane blockers: Linux derived an invalid scoped-package executable name, Windows forced a Visual Studio 2022 toolchain on the newer hosted image, and ACR rejected the stored login credential.
- Desktop packaging now has a stable `MemoFlow` / `memoflow` product identity, canonical platform icons, one native dependency rebuild owner (`electron-builder`), and an explicit packaged runtime closure for the workspace database package plus `dotenv` / `dotenv-expand`.
- Manual retries keep the immutable release source at tag SHA `318f5380e04623c5f01f9ada673ee05897159d10` while loading packaging workflow/configuration from the retrying workflow revision. This makes the existing tag repairable without moving or recreating it.
- The Windows lane no longer pins `npm_config_msvs_version=2022`; MSBuild discovery is x64 and may select the toolchain installed on the hosted runner.
- The ACR password secret was refreshed after the failed run. Its value was not exposed; the post-merge retry proved registry authentication succeeds.
- That retry exposed a separate ACR compatibility boundary: image layers and the normal image manifest uploaded, but the registry rejected BuildKit's `application/vnd.oci.empty.v1+json` SBOM/provenance attestation manifest. Release image builds therefore disable registry-side BuildKit attestations while retaining the canonical Docker/release manifests and GitHub-hosted promotion provenance artifact.
- The same retry proved both Windows and Linux Desktop build lanes succeed, then the Desktop upload job downloaded every artifact in the parent run and failed while extracting an unrelated Docker build record. Desktop release upload now filters `actions/download-artifact` to `desktop-*`, preserving lane isolation.
- Verification completed before PR: release workflow contract 5/5, CI/CD platform 45/45, Desktop 40 files / 230 tests, Desktop lint/typecheck, governance/docs/inventory, `actionlint`, and `git diff --check` all pass.
- A real Linux AppImage was built twice: once from the repaired branch and once from the untouched `v0.10.0` release SHA using the new external packaging configuration. Both produced the `memoflow` ELF executable and verified all 76 packaged runtime dependencies.

Next gate: merge the packaging repair, rerun the existing Draft release, confirm Desktop and immutable Docker assets plus postflight evidence, publish `v0.10.0`, verify Prepare Release uses it as the new baseline, then archive this plan.
