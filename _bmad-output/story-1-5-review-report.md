# Senior Developer Review (Adversarial) - Story 1.5

**Review Date:** 2025-01-22
**Status:** 🔴 **BLOCKED (Updates Required)**
**Reviewer:** Senior Developer AI Agent

## Executive Summary
The implementation is **REJECTED**. The submission contains critical runtime errors, violates explicit Acceptance Criteria regarding file naming and directory structure, and lacks required tests. The code effectively breaks the build and introduces significant technical debt by bypassing the dependency injection system.

## 🚨 Critical Findings (Showstoppers)

### 1. 💥 Runtime/Build Failure: Missing Method
**Severity:** **CRITICAL**
- **File:** `apps/api/src/modules/goal/interface/http/WeightSnapshotController.ts`
- **Issue:** The controller calls `WeightSnapshotApplicationService.getInstance(...)`.
- **Evidence:** `WeightSnapshotController.snapshotService = WeightSnapshotApplicationService.getInstance(...)`
- **Reality:** The `WeightSnapshotApplicationService` class (in `packages/application-server`) **DOES NOT** have a `getInstance` method. It only has a public constructor.
- **Impact:** The application will crash on startup or first request. This proves the claim "Verified all imports" is false.

### 2. 🧪 Zero Test Coverage
**Severity:** **CRITICAL**
- **Issue:** New files were created in packages, but NO corresponding test files (`.spec.ts`) exist.
- **Requirement Violation:** AC #6 "所有相关测试通过" (All related tests pass).
- **Files Affected:**
  - `packages/infrastructure-server/src/modules/goal/mappers/PrismaWeightSnapshotMapper.ts`
  - `packages/application-server/src/modules/goal/errors/WeightSnapshotErrors.ts`
- **Impact:** We are shipping untested code. Logic in `toDomain`/`toPrisma` is unverified.

### 3. 🏗️ DI System Bypass & Coupling
**Severity:** **HIGH**
- **File:** `WeightSnapshotController.ts`
- **Issue:** The controller manually instantiates repositories (`new PrismaGoalRepository`, `new PrismaWeightSnapshotRepository`) and services inside its own logic.
- **Requirement Violation:** The Task explicitly required: "确保 DI 容器完整组装" (Ensure DI container is fully assembled).
- **Correct Approach:** Use `GoalContainer.getInstance().getWeightSnapshotService()`. The container ALREADY implements the logic for wiring these dependencies.
- **Impact:** Unit testing the controller becomes impossible without mocking the entire file. Configuration changes must be applied in multiple places.

## 🚓 Acceptance Criteria Violations (Mandatory Fixes)

### 4. 📂 File Naming Convention Ignored
**Severity:** **HIGH**
- **Requirement:** "所有文件名统一为 kebab-case" (All filenames unified to kebab-case).
- **Violations:**
  - `WeightSnapshotErrors.ts` -> SHOULD BE `weight-snapshot-errors.ts`
  - `PrismaWeightSnapshotMapper.ts` -> SHOULD BE `prisma-weight-snapshot-mapper.ts`
  - `WeightSnapshotApplicationService.ts` -> SHOULD BE `weight-snapshot-application.service.ts` (implied by convention).

### 5. 📁 Directory Structure Violation
**Severity:** **MEDIUM**
- **Requirement:** "Separate migration to `packages/application-server/src/goal/`..."
- **Reality:** Implementation used `packages/application-server/src/modules/goal/`.
- **Impact:** Inconsistent path depth compared to other migrated modules (Task/Schedule).

## 🛠️ Remediation Plan

You must fix these issues before merging:

1.  **Fix Naming:** Rename all new files to kebab-case (`weight-snapshot-errors.ts`, `prisma-weight-snapshot-mapper.ts`).
2.  **Fix Directory:** Move files from `src/modules/goal` to `src/goal` to match AC (or update AC if `modules` is the new standard, but be consistent).
3.  **Implement Singleton/DI:** Either add `getInstance` to the service (Anti-pattern) OR **BETTER**: Update `WeightSnapshotController` to use `GoalContainer`.
4.  **Add Tests:** Add unit tests for the Mapper and the Errors.
5.  **Verify Build:** Run the build to ensure the controller can actually find the service method.

**Note:** Do not mark stories as "Done" without running the code.
