# Feature Specification: Goal Module API Backend

**Feature Branch**: `001-goal-api-backend`  
**Created**: 2026-02-11  
**Status**: Draft  
**Input**: User description: "继续完成 goal 模块的 api 端开发，即完成 goal 模块的各层级代码，并创建 api（express） 模块注册代码，contracts、domain层相关代码已经初步重构好，主要的改动在 application、infrastructure 层。代码规范严格参考governance 模块代码，模块大致功能见md文档"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Manage goals and key results (Priority: P1)

As a goal owner, I can create, update, and organize goals with key results so I can define measurable outcomes and track progress toward them.

**Why this priority**: This is the core value of the module; without it the product cannot support OKR-style goal management.

**Independent Test**: Can be fully tested by creating a goal with key results, updating progress, and verifying computed goal progress.

**Acceptance Scenarios**:

1. **Given** an authenticated user with no goals, **When** they create a goal with a name, optional deadline, and two key results, **Then** the goal is saved and returned with its key results and initial progress of 0%.
2. **Given** a goal with key results and weights totaling 100%, **When** the user updates one key result progress to 60%, **Then** the goal progress reflects the selected calculation method (weighted average, max, min, latest, or sum which may exceed 100%).

---

### User Story 2 - Progress history and retrospectives (Priority: P2)

As a goal owner, I can review progress history and add retrospective notes so I can understand what worked and capture outcomes.

**Why this priority**: Progress history and retrospectives support reflection and continuous improvement, which are critical to OKR usage.

**Independent Test**: Can be tested by updating key result progress and verifying that history entries and retrospective notes are retrievable.

**Acceptance Scenarios**:

1. **Given** a goal with key results, **When** the user updates progress multiple times, **Then** each change is recorded with timestamp and value for review.
2. **Given** a completed goal, **When** the user adds a retrospective note, **Then** the note is saved and listed with the goal summary.

---

### User Story 3 - Reminders and focus mode (Priority: P3)

As a goal owner, I can configure reminders and select a focus goal so I stay engaged with the most important objective.

**Why this priority**: Reminders and focus mode reinforce ongoing engagement and reduce goal abandonment.

**Independent Test**: Can be tested by enabling reminders, selecting a focus goal, and verifying the returned reminder settings and focus state.

**Acceptance Scenarios**:

1. **Given** a goal with a deadline, **When** the user enables deadline and inactivity reminders, **Then** the reminder configuration is saved and returned in goal settings.
2. **Given** multiple active goals, **When** the user selects one as the focus goal, **Then** the system returns that goal as focused and flags others as not focused.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Key results exceed the maximum of five per goal.
- Key result weights contain negative values or all weights sum to zero.
- Progress updates attempt to set values below 0% or above 100%.
- Goals without deadlines use reminder types that depend on a deadline.
- Deleting a goal cascades to remove all associated key results, progress history, retrospective notes, and reminder settings.
- Concurrent updates to key result progress within a short time window.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST allow authenticated users to create, view, update, and delete their own goals.
- **FR-002**: System MUST store goal attributes including name, description, status, importance, optional deadline, single folder assignment, and multiple tags.
- **FR-003**: System MUST allow up to five key results per goal.
- **FR-004**: System MUST validate key result progress values are within 0-100%.
- **FR-005**: System MUST store a progress calculation method per goal (weighted average, maximum, minimum, latest value, or sum) to compute overall goal progress from key results; sum method may produce values exceeding 100%.
- **FR-006**: System MUST accept key result weights as relative proportions and normalize them when calculating weighted progress.
- **FR-007**: System MUST record a progress history entry each time a key result progress value changes.
- **FR-008**: System MUST allow users to view progress history for a goal and its key results.
- **FR-009**: System MUST allow users to create and view retrospective notes for goals.
- **FR-010**: System MUST allow users to configure reminder types: deadline approaching, progress update reminders, and inactivity reminders.
- **FR-011**: System MUST allow users to select a single focus goal and retrieve the current focus state.
- **FR-012**: System MUST ensure users can access only their own goals, key results, reminders, and retrospectives through authentication middleware that extracts identityId from verified tokens.
- **FR-013**: System MUST cascade delete all associated key results, progress records, retrospective notes, and reminder settings when a goal is deleted.
- **FR-014**: System MUST support goal filtering and full-text search by title and description with pagination and status/folder/tag filters.
- **FR-015**: System MUST support batch progress updates for multiple key results in a single transaction with automatic goal progress recalculation.
- **FR-016**: System MUST support reordering key results within a goal by updating display order values.

### Non-Functional Requirements

- **NFR-001**: Authentication middleware MUST extract `identityId: IdentityId` from verified JWT tokens and pass execution context `{ identityId: IdentityId }` to all use cases.
- **NFR-002**: All application use cases MUST accept request DTO and execution context as separate parameters following signature: `execute(request: TRequest, context: ExecutionContext): Promise<Result<TResponse>>`.
- **NFR-003**: All API contracts MUST use types from `@dailyuse/contracts/modules/goal` package (GoalServerDTO, KeyResultServerDTO, etc.) - do NOT create duplicate DTO definitions.

### Key Entities *(include if feature involves data)*

- **Goal**: A user-defined objective with metadata (name, description, status, importance, deadline, single folder, multiple tags), progress calculation method, and computed progress.
- **Key Result**: A measurable outcome linked to a goal with target progress, weight, and current progress.
- **Progress Record**: A timestamped entry capturing a key result progress change.
- **Reminder Setting**: User-configured reminder preferences for a goal.
- **Retrospective Note**: A user-authored reflection linked to a goal.
- **Focus Selection**: The currently selected goal marked as focused by a user.

### Assumptions

- Each goal belongs to a single user and is not shared by default.
- Goal statuses include in-progress, completed, archived, and abandoned.
- Reminder delivery timing is handled by existing platform scheduling capabilities.

## Clarifications

### Session 2026-02-11

- Q: Is the progress calculation method stored per goal, globally for all goals, or per goal with per-key-result override? → A: Progress calculation method is stored per goal.
- Q: When a goal is deleted, should progress history and retrospective notes be cascade deleted or soft-deleted? → A: Cascade delete
- Q: When key result weights don't total 100%, should the system reject, auto-adjust, or use a fallback? → A: Allow relative weights
- Q: Can a goal belong to multiple folders, single folder + multiple tags, hierarchical folders, or other organization pattern? → A: Goal has single folder and multiple tags.
- Q: When using sum calculation method for goal progress, should results cap at 100% or allow values >100%? → A: Sum calculation method allows results >100%.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 95% of users can create a goal with at least one key result in under 2 minutes on first time viewing the create goal form.
- **SC-002**: 95% of progress updates are reflected in the displayed goal progress within 2 seconds.
- **SC-003**: Users can manage at least 100 goals and 500 key results with <500ms response time for typical list/get operations (no noticeable slowdowns).
- **SC-004**: 90% of users can locate and review a goal's progress history and retrospective notes without assistance.
