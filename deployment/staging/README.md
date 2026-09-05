# MemoFlow canonical staging runtime

This directory is the non-secret runtime contract for Delivery Platform V3 Phase 2.
Canonical staging is an artifact projection of a successful `main` candidate; it is not a source checkout deployment.

## Authority model

`Publish Main Candidate` produces:

1. immutable `sha-<full SHA>` Web/API/Migrator images in ACR and GHCR;
2. `memoflow.candidate-set/v1` binding the three image digests to the exact successful main CI run;
3. `memoflow-staging-runtime:sha-<full SHA>`, containing this directory, PowerSync config and the candidate manifest;
4. `staging-latest` pointers only when that candidate is still current `main`;
5. the reviewed `runtime-image-mirrors.json` snapshot used by that exact runtime revision.

The GCP watcher reads `staging-latest`, extracts the runtime contract, validates the embedded candidate manifest, then converts application images and PostgreSQL/Redis/PowerSync mirror dependencies to exact `repository@sha256:...` refs before Compose runs. Runtime dependency pins therefore travel with the candidate runtime instead of remaining stale in host channel configuration.

## Host-owned files

Secrets are never embedded in the runtime OCI artifact.

- channel coordinates: `~/.config/memoflow/staging-channel.env`
- secrets/runtime env: `~/.config/memoflow/staging.env`
- deploy state: `~/.local/state/memoflow/staging-deploy-state`
- active runtime: `~/.local/share/memoflow/staging-runtime`
- previous runtime during a transaction: `~/.local/share/memoflow/staging-runtime.prev`

The Docker client must already be authenticated to the configured registry. GCP staging defaults to the candidate-set `global` distribution (`ghcr.io/<repo-owner>`); Alibaba production uses the `china` distribution separately in Phase 3. Set `STAGING_DISTRIBUTION=china` plus explicit registry/namespace only when a host is intentionally consuming ACR.

## Installation

From a reviewed repository checkout on GCP, authenticate GHCR with a host-owned GitHub credential, then install:

```bash
gh auth token | docker login ghcr.io -u "$(gh api user --jq .login)" --password-stdin
deployment/staging/install-staging-deploy-watch.sh
~/.local/bin/memoflow-staging-deploy-watch --check-only
deployment/staging/install-staging-deploy-watch.sh --enable
```

The timer polls every two minutes. `--check-only` never mutates containers or the state file.

## Transaction semantics

A deploy is:

```text
validate runtime + candidate-set
-> resolve exact image digests
-> validate Compose with external secrets
-> PostgreSQL/Redis healthy
-> hide Web/API/PowerSync application surface
-> run Migrator once
-> API healthy at exact revision
-> PowerSync healthy
-> Web healthy at exact revision
-> loopback + optional tailnet ingress smoke
-> atomic deploy-state commit
```

Failures before the migrator boundary restore the previous runtime automatically. After the migrator succeeds, an uncertain application rollout records `status=BLOCKED`; the watcher does not blindly roll back across an unknown schema compatibility boundary. A blocked host will refuse subsequent automatic deployment attempts until an operator explicitly retries with `--force` after reviewing schema/runtime evidence.

## Emergency source-build path

The historical `docker-compose.local.yml + ~/.config/memoflow/staging.compose.yml` source-build path is emergency/diagnostic only after canonical cutover. It may be used to investigate a broken candidate, but it is not canonical staging and cannot serve as release or deployment evidence.
