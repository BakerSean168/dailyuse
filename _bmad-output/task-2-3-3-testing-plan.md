# Task 2.3.3: Web Task Workflow Testing - Execution Plan

**Status:** 🔄 IN PROGRESS  
**Estimated Duration:** 20-30 minutes  
**Date:** January 16, 2025

---

## Overview

This task validates that the Web app's task form functions correctly after removing the urgency field. It includes manual smoke testing of the task creation and editing workflow.

## Pre-Test Checklist

- [x] All code changes deployed locally
- [x] TypeScript typecheck passing
- [x] Builds successful
- [x] Development environment ready

## Test Environment Setup

**Prerequisites:**
1. Web app running locally (dev server)
2. Backend API running and responding
3. Database populated with test data (if needed)
4. Browser dev tools open (Network tab)

**Test Browsers:**
- [ ] Chrome (primary)
- [ ] Firefox (secondary)
- [ ] Safari (if available)

---

## Test Case 1: Create New Task Without Urgency Field

### Scenario
User creates a new task using the simplified form with only importance selector.

### Steps

1. **Navigate to Task Management**
   - URL: `http://localhost:5173/tasks` (or your dev server)
   - Expected: Task management view loads
   - ✓ Pass / ✗ Fail: ___

2. **Open Create Task Dialog**
   - Click "Create New Task" or "+" button
   - Expected: TaskTemplateForm or creation dialog appears
   - ✓ Pass / ✗ Fail: ___

3. **Verify Urgency Field Absent**
   - Inspect form fields
   - Expected Fields Present:
     - Title input ✓
     - Description textarea ✓
     - Importance selector ✓
     - Tags field ✓
   - Expected Fields Absent:
     - Urgency selector ✗ (should NOT be present)
   - ✓ Pass / ✗ Fail: ___

4. **Fill Form with Test Data**
   ```
   Title: "Test Task - Story 2.3"
   Description: "Testing form after urgency field removal"
   Importance: "Important" (select from dropdown)
   Tags: ["testing", "story-2.3"] (optional)
   ```
   - ✓ Pass / ✗ Fail: ___

5. **Verify Form Validation**
   - Leave Title empty, try to submit
   - Expected: Validation error "Title required" or similar
   - ✓ Pass / ✗ Fail: ___
   - 
   - Fill Title, ensure Importance is selected
   - Expected: Form should be valid
   - ✓ Pass / ✗ Fail: ___

6. **Submit Form**
   - Click "Create" or "Save" button
   - Expected: Loading indicator, then success confirmation
   - ✓ Pass / ✗ Fail: ___

7. **Verify API Request (Network Tab)**
   - Open Browser DevTools → Network tab
   - Look for POST request to `/api/tasks/templates` or similar
   - Expected Request Body:
     ```json
     {
       "accountUuid": "...",
       "title": "Test Task - Story 2.3",
       "description": "Testing form after urgency field removal",
       "importance": "important",
       "tags": ["testing", "story-2.3"]
     }
     ```
   - **Should NOT contain:** `"urgency"` field ✓
   - ✓ Pass / ✗ Fail: ___

8. **Verify API Response**
   - Expected HTTP Status: 201 or 200
   - Expected Response contains:
     - uuid or id of created task
     - title, importance fields populated
     - timestamp of creation
   - ✓ Pass / ✗ Fail: ___

9. **Verify Task Appears in List**
   - Task should appear in the task list
   - Title should be: "Test Task - Story 2.3"
   - Importance should be visible
   - ✓ Pass / ✗ Fail: ___

---

## Test Case 2: Edit Existing Task

### Scenario
User edits an existing task that may have old urgency data. Form should not display urgency field.

### Steps

1. **Open Task Detail/Edit Dialog**
   - Click on "Test Task - Story 2.3" from list
   - Expected: Task detail view or edit dialog opens
   - ✓ Pass / ✗ Fail: ___

2. **Verify Urgency Field Not Displayed in Edit Mode**
   - Form fields visible:
     - Title: editable input ✓
     - Description: editable textarea ✓
     - Importance: editable selector ✓
   - Urgency field should NOT be present ✗
   - ✓ Pass / ✗ Fail: ___

3. **Modify Task Data**
   ```
   Title: "Test Task - Story 2.3 (Updated)"
   Importance: "Vital" (change from "Important")
   ```
   - ✓ Pass / ✗ Fail: ___

4. **Submit Edit**
   - Click "Save" or "Update" button
   - Expected: Loading indicator, then success confirmation
   - ✓ Pass / ✗ Fail: ___

5. **Verify API Request (Network Tab)**
   - Look for PUT/PATCH request to `/api/tasks/templates/{uuid}`
   - Expected Request Body:
     ```json
     {
       "title": "Test Task - Story 2.3 (Updated)",
       "importance": "vital"
     }
     ```
   - **Should NOT contain:** `"urgency"` field ✓
   - ✓ Pass / ✗ Fail: ___

6. **Verify Changes Persisted**
   - Title should update in list: "Test Task - Story 2.3 (Updated)"
   - Importance indicator should show "Vital" or equivalent
   - ✓ Pass / ✗ Fail: ___

---

## Test Case 3: Edit Task with Existing Urgency Data (Backward Compatibility)

### Scenario
If database has tasks with old urgency data, editing should not break.

### Steps

1. **Load Task with Existing Urgency (if available)**
   - Find a task created before Story 2.3 (has urgency in database)
   - Open in edit mode
   - Expected: Form loads without errors
   - ✓ Pass / ✗ Fail: ___

2. **Verify Old Urgency Not Displayed**
   - Form should only show: title, description, importance, tags
   - Old urgency data should NOT be shown in form
   - ✓ Pass / ✗ Fail: ___

3. **Edit and Save**
   - Make minor change (e.g., update description)
   - Submit form
   - Expected: Save successful without needing urgency data
   - ✓ Pass / ✗ Fail: ___

4. **Verify Task Still Exists with New Data**
   - Task should update successfully
   - Old data should not be corrupted
   - ✓ Pass / ✗ Fail: ___

---

## Test Case 4: Form Layout Responsiveness

### Scenario
Form should layout properly without urgency field on different screen sizes.

### Steps

1. **Desktop Layout (1920x1080)**
   - All form fields visible and properly aligned
   - Importance selector not squeezed
   - No horizontal scrolling needed
   - ✓ Pass / ✗ Fail: ___

2. **Tablet Layout (768x1024)**
   - Form fields stack vertically
   - Importance selector readable
   - No layout breaks
   - ✓ Pass / ✗ Fail: ___

3. **Mobile Layout (375x667)**
   - Form fields single column
   - Touch targets appropriately sized
   - No overflow or hidden fields
   - ✓ Pass / ✗ Fail: ___

---

## Test Case 5: Validation Edge Cases

### Scenario
Form validation works correctly with only importance requirement.

### Steps

1. **Submit with Empty Title**
   - Expected: Error message shown
   - Form not submitted
   - ✓ Pass / ✗ Fail: ___

2. **Submit with Whitespace-Only Title**
   - Title: "   " (spaces)
   - Expected: Error or trimmed/rejected
   - ✓ Pass / ✗ Fail: ___

3. **Submit with No Importance Selected**
   - Title: filled
   - Importance: default selected
   - Expected: Form submits (has default value)
   - ✓ Pass / ✗ Fail: ___

4. **Submit with Very Long Title**
   - Title: 500+ characters
   - Expected: Either truncated or error message
   - ✓ Pass / ✗ Fail: ___

---

## Test Case 6: Form State Management

### Scenario
Form correctly manages state across open/close cycles.

### Steps

1. **Open Create Dialog**
   - Enter data: Title = "Test 1", Importance = "High"
   - ✓ Pass / ✗ Fail: ___

2. **Close Dialog Without Saving**
   - Click Cancel or X
   - ✓ Pass / ✗ Fail: ___

3. **Open Create Dialog Again**
   - Expected: Form reset to initial state (empty)
   - Title should be empty ✓
   - Importance should be default ✓
   - ✓ Pass / ✗ Fail: ___

4. **Open Edit Dialog**
   - Select existing task
   - Form populated with task data
   - ✓ Pass / ✗ Fail: ___

5. **Click Cancel Without Saving**
   - Make changes then click Cancel
   - Changes should NOT be saved
   - ✓ Pass / ✗ Fail: ___

---

## Browser Console Checks

**During all tests, monitor browser console for:**
- [ ] No JavaScript errors
- [ ] No TypeScript type errors (if dev console shows)
- [ ] No network 4xx or 5xx errors
- [ ] No deprecation warnings from our code
- [ ] Performance: Form opens in < 500ms
- [ ] Performance: Submit responds in < 1000ms

---

## Test Results Summary

### Overall Results
- **Total Test Cases:** 6
- **Passed:** ___ / 6
- **Failed:** ___ / 6
- **Skipped:** ___ / 6

### Test Case Status
- [ ] Test Case 1: Create Task - PASSED / FAILED / SKIPPED
- [ ] Test Case 2: Edit Task - PASSED / FAILED / SKIPPED
- [ ] Test Case 3: Backward Compat - PASSED / FAILED / SKIPPED
- [ ] Test Case 4: Responsive - PASSED / FAILED / SKIPPED
- [ ] Test Case 5: Validation - PASSED / FAILED / SKIPPED
- [ ] Test Case 6: State Mgmt - PASSED / FAILED / SKIPPED

### Issues Found
```
[List any bugs, missing features, or concerns discovered]
1. 
2. 
3. 
```

### Comments
```
[Additional observations, feedback, or notes]
```

---

## Sign-Off

- **Tested By:** ________________
- **Date:** ________________
- **Overall Result:** ✓ PASS / ✗ FAIL / ⚠ PARTIAL
- **Approved to Proceed:** YES / NO

---

## Next Steps

If **All Tests Pass:**
1. Proceed to Task 2.3.6-8 (Unit Tests)
2. Proceed to Task 2.3.7 (Visual Tests)
3. Prepare for merge

If **Some Tests Fail:**
1. Document issues above
2. Fix code/design based on failures
3. Re-run failing tests
4. Update this report

If **Critical Issues Found:**
1. Stop testing
2. Report issues to development team
3. Do not proceed until resolved

