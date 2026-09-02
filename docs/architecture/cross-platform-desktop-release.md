---
tags:
  - architecture
  - desktop
  - release
  - windows
  - linux
  - macos
description: MemoFlow Desktop Windows、Linux、macOS Intel/Apple Silicon 构建、签名、资产与更新契约
created: 2026-09-02T16:15:00+08:00
updated: 2026-09-02T16:15:00+08:00
---

# Cross-platform Desktop Release Contract

## 1. Scope

This document governs release-time packaging for MemoFlow Desktop. It does not change application runtime behavior or cloud/server deployment.

## 2. Required platform set

| Key           | Native runner       | Electron Builder args            | Primary assets                         |
| ------------- | ------------------- | -------------------------------- | -------------------------------------- |
| `windows-x64` | Windows x64         | `--win nsis --x64`               | Setup `.exe`, blockmap, `latest.yml`   |
| `linux-x64`   | Ubuntu x64          | `--linux AppImage deb rpm --x64` | AppImage, deb, rpm, `latest-linux.yml` |
| `macos-x64`   | macOS Intel         | `--mac dmg zip --x64`            | architecture-named dmg/zip             |
| `macos-arm64` | macOS Apple Silicon | `--mac dmg zip --arm64`          | architecture-named dmg/zip             |

The runner architecture is part of evidence; package architecture is not inferred only from the file extension.

## 3. Naming

Artifact names must be globally unique across the matrix:

```text
MemoFlow-Windows-x64-<version>-Setup.exe
MemoFlow-Linux-x64-<version>.AppImage
MemoFlow-Linux-x64-<version>.deb
MemoFlow-Linux-x64-<version>.rpm
MemoFlow-macOS-x64-<version>.dmg
MemoFlow-macOS-x64-<version>.zip
MemoFlow-macOS-arm64-<version>.dmg
MemoFlow-macOS-arm64-<version>.zip
```

The exact accepted names may remain compatible with existing Windows/Linux updater metadata during migration. macOS must include `${arch}` immediately because two architectures are produced in one release.

## 4. Build contract

Every platform build must:

1. check out the exact release SHA with sufficient Git history for the release contract;
2. verify release version identity before packaging;
3. install the frozen pnpm lockfile;
4. run Desktop typecheck/test/build or consume exact verified build inputs where portable;
5. package on a native runner;
6. record OS, architecture, runner image, Node/pnpm/Electron Builder versions and signing mode;
7. upload assets under a platform-specific artifact name;
8. never publish directly from the matrix child.

A single upload/postflight job downloads all children, validates coverage and names, builds the manifest, then uploads to the existing Draft Release.

## 5. macOS pilot policy

At implementation start the repository has no Apple signing/notarization secret. Therefore:

- macOS x64 and arm64 packages may be generated as **unsigned pilot artifacts**;
- the release manifest must expose this state;
- the release notes must not imply Gatekeeper-ready public distribution;
- automatic macOS update metadata is withheld until signing and updater verification are implemented;
- local manual acceptance covers extraction, app bundle architecture, startup and basic navigation on each architecture when a device/runner test is available.

A later signing phase must fail closed if any requested certificate/notarization input is missing or invalid.

## 6. Validation

Postflight rejects:

- missing required platform;
- duplicate asset basename;
- zero-size or unhashable asset;
- macOS artifact without architecture in name;
- architecture mismatch between platform receipt and package name;
- unknown signing state;
- update metadata referring to a missing file;
- asset version not equal to release tag version.

## 7. Acceptance evidence

The first V3 cross-platform release is accepted only when the Published GitHub Release contains:

- Windows x64 installer;
- Linux x64 AppImage/deb/rpm;
- macOS x64 dmg/zip;
- macOS arm64 dmg/zip;
- Desktop manifest with all four platform receipts;
- SHA256SUMS covering every published Desktop asset;
- no duplicate names;
- exact tag/SHA identity.
