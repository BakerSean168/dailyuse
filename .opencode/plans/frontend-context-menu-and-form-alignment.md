# Plan: Frontend Context Menu Infrastructure + Form-DTO Alignment

## Overview

Two parallel efforts:

1. **Context Menu Infrastructure** — Build a reusable `ActionableWrapper` component that provides right-click context menu + hover-reveal dropdown on any card/item, then apply it across all modules.
2. **Form-DTO Alignment** — Expand form dialogs to collect all fields their contract DTOs require, starting with Goal (8 missing fields).

## Architecture Decision: Dual-Menu Rendering

Since shadcn's `ContextMenuItem` and `DropdownMenuItem` are separate Radix primitives that cannot be nested inside each other's parent, the `ActionableWrapper` will use a **data-driven menu definition** pattern:

- Each entity defines a `useXxxMenuActions()` composable that returns a reactive `MenuAction[]` array
- `ActionableWrapper` renders these actions as `ContextMenuItem` inside the context menu AND as `DropdownMenuItem` inside the dropdown
- This avoids the slot-sharing problem entirely

```ts
interface MenuAction {
  key: string;
  label: string;
  icon?: Component;
  shortcut?: string;
  destructive?: boolean;
  disabled?: boolean;
  separator?: boolean; // render a separator before this item
  handler: () => void;
}
```

---

## Phase 1: Shared Infrastructure

### 1.1 Create `ActionableWrapper.vue`

**File:** `packages/app-vue/src/components/shared/ActionableWrapper.vue`

```
Props:
  actions: MenuAction[]         — menu items to render
  disabled?: boolean            — disable right-click (e.g. during drag)
  showMoreButton?: boolean      — show hover "..." button (default: true)
  wrapperClass?: string         — extra CSS classes
  moreButtonPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  dropdownAlign?: 'start' | 'center' | 'end'
  menuWidth?: string            — default 'w-48'

Template:
  <ContextMenu>
    <ContextMenuTrigger as-child :disabled="disabled">
      <div class="group/actionable relative" :class="wrapperClass">
        <slot />  <!-- The wrapped card/item -->

        <div v-if="showMoreButton" class="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button class="... opacity-0 group-hover/actionable:opacity-100 ...">
                <MoreHorizontal />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent :align :class="menuWidth">
              <!-- Render actions as DropdownMenuItem -->
              <template v-for="action in actions" :key="action.key">
                <DropdownMenuSeparator v-if="action.separator" />
                <DropdownMenuItem
                  :disabled="action.disabled"
                  :class="{ 'text-destructive focus:text-destructive': action.destructive }"
                  @click="action.handler"
                >
                  <component :is="action.icon" v-if="action.icon" class="h-4 w-4 mr-2" />
                  {{ action.label }}
                  <DropdownMenuShortcut v-if="action.shortcut">{{ action.shortcut }}</DropdownMenuShortcut>
                </DropdownMenuItem>
              </template>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </ContextMenuTrigger>

    <ContextMenuContent :class="menuWidth">
      <!-- Render same actions as ContextMenuItem -->
      <template v-for="action in actions" :key="action.key">
        <ContextMenuSeparator v-if="action.separator" />
        <ContextMenuItem
          :disabled="action.disabled"
          :class="{ 'text-destructive focus:text-destructive': action.destructive }"
          @click="action.handler"
        >
          <component :is="action.icon" v-if="action.icon" class="h-4 w-4 mr-2" />
          {{ action.label }}
          <ContextMenuShortcut v-if="action.shortcut">{{ action.shortcut }}</ContextMenuShortcut>
        </ContextMenuItem>
      </template>
    </ContextMenuContent>
  </ContextMenu>
```

### 1.2 Create `types.ts` for MenuAction

**File:** `packages/app-vue/src/components/shared/types.ts`

Export the `MenuAction` interface.

### 1.3 Create barrel export

**File:** `packages/app-vue/src/components/shared/index.ts`

Export `ActionableWrapper` and `MenuAction` type.

### 1.4 Update `packages/app-vue/src/index.ts`

Add `export * from './components/shared'` to the barrel.

---

## Phase 2: Goal Module — Form-DTO Alignment + Context Menus

### 2.1 Expand `GoalDialog.vue`

**File:** `packages/app-vue/src/modules/goal/components/dialogs/GoalDialog.vue`

Current: 4 fields (title, description, category, importance)
Target: 12 fields matching `CreateGoalReq` + edit mode support

**Changes:**

A) Add `mode` prop (`'create' | 'edit'`, default `'create'`) and optional `goal` prop (GoalClientDTO)

B) Expand reactive form to include all fields:

```ts
const defaultForm = () => ({
  title: '',
  description: '',
  category: '',
  importance: 'Moderate' as ImportanceLevel,
  color: '',
  feasibilityAnalysis: '',
  motivation: '',
  tags: [] as string[],
  startDate: undefined as number | undefined,
  targetDate: undefined as number | undefined,
  folderId: undefined as string | undefined,
  parentGoalId: undefined as string | undefined,
});
```

C) Add `watch` on `props.goal` to populate form in edit mode.

D) New template sections (using Collapsible for optional sections):

1. **Basic Info** — title (Input), description (Textarea) [existing]
2. **Category & Importance** — category (Input with datalist suggestions), importance (Select) [existing, expand category]
3. **Timeline** — startDate + targetDate as date pickers (Popover + Calendar pattern already in codebase)
4. **Motivation & Feasibility** — collapsible section with two Textarea fields (max 2000 chars each)
5. **Organization** — collapsible section with:
   - Color picker (Popover with color grid, reuse Reminder pattern)
   - Tags input (reuse governance `TagInput.vue` component or inline Badge-based input)
   - Folder select (Select from `goalFolders`)
   - Parent goal select (Select from `goals`, excluding self)

E) Update submit handler:

- Create mode: call `createGoal(req)`, emit `created`
- Edit mode: call `updateGoal(goal.id, req)`, emit `updated`

F) Update dialog title/button text based on `mode`.

### 2.2 Update `GoalListView.vue` to support edit mode

**File:** `packages/app-vue/src/modules/goal/views/GoalListView.vue`

- Replace the `handleEditGoal` toast stub (line 205) with logic to open GoalDialog in edit mode
- Add state: `editingGoal: Ref<GoalClientDTO | null>`
- Pass `mode` and `goal` props to GoalDialog
- Add `handleGoalUpdated` handler

### 2.3 Expand `GoalFolderDialog.vue`

**File:** `packages/app-vue/src/modules/goal/components/dialogs/GoalFolderDialog.vue`

Add visible UI fields for:

- `description` — Textarea (max 200)
- `color` — Color picker (Popover + color grid)

These fields already exist in the draft type but have no template elements.

### 2.4 Expand `KeyResultDialog.vue`

**File:** `packages/app-vue/src/modules/goal/components/dialogs/KeyResultDialog.vue`

Add `description` Textarea field (max 500) between title and the numeric fields.

### 2.5 Apply `ActionableWrapper` to `GoalCard.vue`

**File:** `packages/app-vue/src/modules/goal/components/cards/GoalCard.vue`

- Remove the existing inline DropdownMenu (lines 35-53)
- Wrap the `<Card>` with `<ActionableWrapper :actions="menuActions">`
- Define `menuActions` computed from the goal data:
  - Edit (Pencil icon) → emit('edit', goal)
  - Archive (Archive icon) → emit('archive', goal.id) [new emit]
  - Separator
  - Delete (Trash2, destructive) → emit('delete', goal.id)

### 2.6 Apply `ActionableWrapper` to `GoalFolder.vue`

**File:** `packages/app-vue/src/modules/goal/components/GoalFolder.vue`

- Replace `@contextmenu.prevent="emit('edit', folder)"` (line 31)
- Wrap each folder button with `<ActionableWrapper :actions="getFolderActions(folder)" :show-more-button="false">`
- `showMoreButton: false` because the sidebar is narrow — right-click only
- Actions: Create Goal (Plus), Edit (Pencil), Separator, Delete (Trash2, destructive)

### 2.7 Apply `ActionableWrapper` to `KeyResultCard.vue`

**File:** `packages/app-vue/src/modules/goal/components/cards/KeyResultCard.vue`

- Wrap with ActionableWrapper
- Move "Add Record" and "Delete" buttons to context menu
- Keep only the progress bar and value display inline

### 2.8 Update goal components barrel export

**File:** `packages/app-vue/src/modules/goal/components/index.ts`

Add any new component exports.

---

## Phase 3: Reminder Module — Form Fixes + Context Menu Migration

### 3.1 Fix `TemplateDialog.vue` field mismatches

**File:** `packages/app-vue/src/modules/reminder/components/TemplateDialog.vue`

A) Fix field name: submit handler line 319 sends `name: formData.title` → change to `title: formData.title`

B) Fix `activeTime` shape: change `{ activatedAt: Date.now() }` → `{ startDate: Date.now(), endDate: null }`

C) Add `type` selector: Radio group or Select for `'ONE_TIME' | 'RECURRING'` (currently hardcoded to 'RECURRING')

D) Add `recurrence` section (collapsible):

- Recurrence type: `'DAILY' | 'WEEKLY' | 'CUSTOM_DAYS'`
- Daily: interval input (number, min 1)
- Weekly: interval + weekday checkboxes
- Custom: date picker for specific dates

E) Add `activeHours` section (collapsible):

- Start hour (Select/Input 0-23)
- End hour (Select/Input 0-23)

### 3.2 Migrate custom `ContextMenu.vue` to shadcn

**File:** `packages/app-vue/src/modules/reminder/components/ContextMenu.vue`

Replace the 153-line manual implementation (fixed positioning, overlay) with a thin wrapper around shadcn `ContextMenu` components. Or better: delete it entirely and use `ActionableWrapper` on the cards that used it.

### 3.3 Update `GridTemplateItem.vue`

**File:** `packages/app-vue/src/modules/reminder/components/GridTemplateItem.vue`

Replace usage of the custom ContextMenu with ActionableWrapper. Actions: Edit, Move, Separator, Delete.

### 3.4 Apply `ActionableWrapper` to `GroupDesktopCard.vue`

**File:** `packages/app-vue/src/modules/reminder/components/GroupDesktopCard.vue`

Remove the hover-only Edit button. Wrap with ActionableWrapper. Actions: Create Reminder, Edit, Separator, Delete.

---

## Phase 4: Apply Context Menus to Task, Repository Modules

### 4.1 `TaskTemplateCard.vue`

**File:** `packages/app-vue/src/modules/task/components/cards/TaskTemplateCard.vue`

- Remove inline Edit (Pencil) and Delete (Trash2) icon buttons (around lines 53-82)
- Remove inline Pause/Resume/Activate buttons from footer (move to context menu)
- Wrap with ActionableWrapper
- Actions: Edit, Pause/Resume (conditional on status), Duplicate, Separator, Delete (destructive)
- Keep: Status badge, importance indicator, time label (these are informational, not actions)

### 4.2 `RepoCard.vue`

**File:** `packages/app-vue/src/modules/repository/components/RepoCard.vue`

- Remove the existing DropdownMenu (lines 22-43)
- Wrap with ActionableWrapper
- Actions: Settings, Edit, Separator, Delete (destructive)

### 4.3 `ResourceCard.vue`

**File:** `packages/app-vue/src/modules/repository/components/ResourceCard.vue`

- Remove the existing DropdownMenu (lines 22-43)
- Wrap with ActionableWrapper
- Actions: View, Edit, Move, Separator, Delete (destructive)

---

## Phase 5: Minor Form Fixes

### 5.1 Schedule `CreateScheduleDialog.vue`

**File:** `packages/app-vue/src/modules/schedule/components/CreateScheduleDialog.vue`

- Submit handler: emit `name` instead of `title` (or rename to match consumer expectations)
- `priority`: add `Number()` conversion before emit
- Add `autoDetectConflicts` toggle (Switch component, default false)
- Fix `maxlength` attributes: description 2000 (not 1000), location 500 (not 200)

### 5.2 Task `TaskTemplateForm.vue` / `TaskTemplateDialog.vue`

**Files:** `packages/app-vue/src/modules/task/components/TaskTemplateForm/TaskTemplateForm.vue`, `packages/app-vue/src/modules/task/components/dialogs/TaskTemplateDialog.vue`

- Add `taskType` selector (`'ONE_TIME' | 'RECURRING'`, default 'RECURRING')
- Add `color` picker (Popover + color grid)
- Verify `title` → `name` mapping in submit/save handler

---

## Phase 6: Typecheck + Verification

Run `npx nx typecheck web` and fix any compilation errors from the changes.

---

## Files to Create (New)

| File                                                           | Purpose                                  |
| -------------------------------------------------------------- | ---------------------------------------- |
| `packages/app-vue/src/components/shared/ActionableWrapper.vue` | Generic right-click + hover menu wrapper |
| `packages/app-vue/src/components/shared/types.ts`              | `MenuAction` interface                   |
| `packages/app-vue/src/components/shared/index.ts`              | Barrel export                            |

## Files to Modify

| File                                                                                 | Changes                                         |
| ------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `packages/app-vue/src/index.ts`                                                      | Add shared components export                    |
| **Goal module**                                                                      |                                                 |
| `packages/app-vue/src/modules/goal/components/dialogs/GoalDialog.vue`                | Expand to 12 fields + edit mode                 |
| `packages/app-vue/src/modules/goal/components/dialogs/GoalFolderDialog.vue`          | Add description, color UI                       |
| `packages/app-vue/src/modules/goal/components/dialogs/KeyResultDialog.vue`           | Add description field                           |
| `packages/app-vue/src/modules/goal/components/cards/GoalCard.vue`                    | Replace DropdownMenu with ActionableWrapper     |
| `packages/app-vue/src/modules/goal/components/cards/KeyResultCard.vue`               | Add ActionableWrapper                           |
| `packages/app-vue/src/modules/goal/components/GoalFolder.vue`                        | Replace @contextmenu with ActionableWrapper     |
| `packages/app-vue/src/modules/goal/views/GoalListView.vue`                           | Wire edit mode to GoalDialog                    |
| `packages/app-vue/src/modules/goal/components/index.ts`                              | Update exports                                  |
| **Reminder module**                                                                  |                                                 |
| `packages/app-vue/src/modules/reminder/components/TemplateDialog.vue`                | Fix field names, add recurrence/activeHours     |
| `packages/app-vue/src/modules/reminder/components/ContextMenu.vue`                   | Delete or gut (replaced by ActionableWrapper)   |
| `packages/app-vue/src/modules/reminder/components/GridTemplateItem.vue`              | Use ActionableWrapper                           |
| `packages/app-vue/src/modules/reminder/components/GroupDesktopCard.vue`              | Use ActionableWrapper                           |
| **Task module**                                                                      |                                                 |
| `packages/app-vue/src/modules/task/components/cards/TaskTemplateCard.vue`            | Replace inline buttons with ActionableWrapper   |
| `packages/app-vue/src/modules/task/components/TaskTemplateForm/TaskTemplateForm.vue` | Add taskType, color                             |
| **Repository module**                                                                |                                                 |
| `packages/app-vue/src/modules/repository/components/RepoCard.vue`                    | Replace DropdownMenu with ActionableWrapper     |
| `packages/app-vue/src/modules/repository/components/ResourceCard.vue`                | Replace DropdownMenu with ActionableWrapper     |
| **Schedule module**                                                                  |                                                 |
| `packages/app-vue/src/modules/schedule/components/CreateScheduleDialog.vue`          | Fix field names, types, add autoDetectConflicts |

## Estimated Scope

- **3 new files** (ActionableWrapper + types + index)
- **~18 modified files**
- Heaviest change: `GoalDialog.vue` (from ~154 lines to ~350+)
- Second heaviest: `TemplateDialog.vue` (reminder, adding 3 new sections)

## Execution Order

1. Create shared infrastructure (ActionableWrapper, types, barrel) — ~3 files
2. Expand GoalDialog.vue — heaviest single change
3. Apply ActionableWrapper to Goal cards/folder + wire edit in GoalListView
4. Fix GoalFolderDialog + KeyResultDialog
5. Fix Reminder TemplateDialog
6. Apply ActionableWrapper to Reminder cards + delete custom ContextMenu
7. Apply ActionableWrapper to Task cards + minor Task form fixes
8. Apply ActionableWrapper to Repository cards
9. Fix Schedule form
10. Run typecheck, fix errors
