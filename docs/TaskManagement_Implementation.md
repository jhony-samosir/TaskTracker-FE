# Task Management Module - UI/UX Implementation Document

## 1. Overview

The **Task Management** module is the admin workspace for planning, assigning, monitoring, and reviewing all tasks in the system. This module is role-restricted to `ADMIN` users and should provide a high-density but readable interface for managing task lifecycle from creation to completion.

The current frontend already has `/tasks` routing and sidebar navigation. The implementation will expand the existing Task Management page into a complete management experience with list/board views, task creation/editing, assignment workflow, review actions, and API-backed state management.

## 2. UI/UX Goals

- **Admin productivity:** Admin users should quickly create, assign, update, and review tasks without excessive navigation.
- **Clear task visibility:** Task status, assignee, reviewer, due date, priority, and overdue indicators should be immediately visible.
- **Low-friction operations:** Common actions such as create, edit, assign, change status, and review should be accessible from row/card actions and detail drawer.
- **Review workflow clarity:** Need Review / Need Revision / Cleared transitions must be explicit and easy to audit.
- **Responsive layout:** Desktop should prioritize table + drawer productivity, while mobile should use card/list layout with accessible actions.
- **Accessible interactions:** Dialogs, forms, menus, keyboard navigation, focus restore, and button labels must follow accessibility best practices.

## 3. Target Users

### Admin
- Create new tasks.
- Assign tasks to employees.
- Assign reviewers.
- Update priority, deadline, description, documents, and status.
- Review submitted tasks and mark as Need Revision or Cleared.
- Monitor overall task delivery status.

### Employee (indirect impact)
- Receives tasks created from this module.
- Task changes should reflect in the My Tasks module.

## 4. Proposed Screen Structure

### 4.1 Header Area
- Page title: `Task Management`.
- Subtitle explaining admin-level task orchestration.
- Primary action button: `Create Task`.
- Secondary actions: refresh/sync, export placeholder if needed later.

### 4.2 Summary KPI Cards
- Total active tasks.
- Overdue tasks.
- Need Review.
- In Progress.
- Cleared this week.

### 4.3 Filter and Search Toolbar
- Search by title, description, assignee, reviewer.
- Filter by status.
- Filter by priority.
- Filter by assignee.
- Filter by reviewer.
- Sort by due date, newest, priority, status.
- Persist filter state in URL query parameters.

### 4.4 Main Task View
Recommended desktop default: **table view** because admins need high-density task data.

Columns:
- Task title + ID.
- Assignee.
- Reviewer.
- Status badge.
- Priority badge.
- Deadline / overdue indicator.
- Last updated.
- Row actions.

Optional alternate view:
- Kanban board grouped by status for visual monitoring.

### 4.5 Task Create/Edit Dialog
Form sections:
- Basic information: title, description, priority.
- Assignment: assignee and reviewer dropdowns.
- Timeline: deadline date.
- Attachments: document upload placeholder or document metadata field.
- Validation and submit states.

### 4.6 Task Detail Drawer
Drawer sections:
- Summary: title, status, priority, deadline.
- People: assignee, reviewer, created by.
- Description and latest comments.
- Attachments section.
- Activity/history timeline.
- Admin action buttons: edit, assign/reassign, mark need revision, mark cleared.

## 5. Component Architecture

### Page Level
- `TaskManagementComponent`
  - Route container for `/tasks`.
  - Owns query param synchronization.
  - Coordinates data loading, selection, dialogs, and action handlers.

### Feature Components
- `TaskManagementToolbarComponent`
  - Search, filter, sort, view toggle.

- `TaskManagementTableComponent`
  - Desktop-first `MatTable` layout.
  - Emits row selection and row action events.

- `TaskManagementCardListComponent`
  - Mobile-first card layout.
  - Reuses task display styles from My Tasks where possible.

- `TaskFormDialogComponent`
  - Create and edit task form.
  - Uses reactive forms with validators.

- `TaskManagementDetailDrawerComponent`
  - Side drawer / dialog for full task context and admin actions.

- `TaskStatusActionMenuComponent`
  - Centralizes valid status transitions and action labels.

### Core Services / Models
- Extend or refactor `TaskService` for admin endpoints:
  - `getTasks(filters)`
  - `getTask(id)`
  - `createTask(payload)`
  - `updateTask(id, payload)`
  - `updateTaskStatus(id, status)`
  - `assignTask(id, assigneeId, reviewerId)`

- Add typed DTOs:
  - `TaskListItem`
  - `TaskDetail`
  - `CreateTaskRequest`
  - `UpdateTaskRequest`
  - `TaskQueryParams`

## 6. Validation Rules

### Create/Edit Task
- Title: required, max 150 characters.
- Description: optional, max 2000 characters.
- Assignee: required.
- Reviewer: required and should not be the same user as assignee.
- Deadline: required and must be today or future date for new tasks.
- Priority: required.
- Status: controlled by workflow actions, not free text.

### Status Workflow
Recommended transitions:
- `ASSIGNED` → `ON_PROGRESS`
- `ON_PROGRESS` → `NEED_REVIEW`
- `NEED_REVIEW` → `NEED_REVISION` or `CLEARED`
- `NEED_REVISION` → `ON_PROGRESS` or `NEED_REVIEW`
- `CLEARED` should be terminal unless admin explicitly reopens.

## 7. API Integration Plan

Frontend should be prepared for the following API contracts:

- `GET /api/tasks`
  - Query params: `search`, `status`, `priority`, `assigneeId`, `reviewerId`, `sortBy`, `page`, `pageSize`.

- `GET /api/tasks/{id}`
  - Returns full task detail with comments, documents, and history.

- `POST /api/tasks`
  - Creates a task.

- `PUT /api/tasks/{id}`
  - Updates task metadata.

- `PUT /api/tasks/{id}/status`
  - Updates workflow status.

- `PUT /api/tasks/{id}/assignment`
  - Updates assignee/reviewer.

Until backend endpoints are available, service methods may use mock fallback data behind typed service methods, but UI components must not depend directly on mock data.

## 8. State Management Approach

Use Angular signals for page-level state:
- `tasks`
- `selectedTask`
- `loading`
- `saving`
- `error`
- `filters`
- `pagination`

Use optimistic updates only for safe operations such as status changes. Roll back state and show an error message if API calls fail.

## 9. Accessibility Requirements

- All icon-only buttons must have tooltips or `aria-label`.
- Dialogs must restore focus after close.
- Form controls must expose validation messages.
- Status and priority must not rely only on color; include text labels.
- Table row actions must be keyboard accessible.
- Loading and saving states must be visible and non-blocking where possible.

## 10. Implementation Phases / GitHub Issue Breakdown

### Issue 1 - `[Task Management] Setup Page Layout & Admin Dashboard Shell`

**Goal:** Convert the current stub page into a complete admin task management shell.

Tasks:
- Build page header with `Create Task` and `Sync` actions.
- Add KPI summary cards for task health.
- Add loading, error, empty, and permission-aware states.
- Keep `/tasks` route lazy-loaded under `MainLayoutComponent`.
- Ensure page follows existing Tailwind + Angular Material visual language.

Acceptance Criteria:
- Admin can navigate to `/tasks` and see a polished Task Management shell.
- Page is responsive on desktop/tablet/mobile.
- Build passes without TypeScript or template errors.

---

### Issue 2 - `[Task Management] Build Task Table & Mobile Card List`

**Goal:** Create high-density task list UI for admins.

Tasks:
- Create `TaskManagementTableComponent` using Angular Material table.
- Create mobile-friendly `TaskManagementCardListComponent`.
- Display task title, assignee, reviewer, status, priority, deadline, updated date.
- Add overdue indicator and row/card action menu.
- Emit events for view detail, edit, assign, and status update.

Acceptance Criteria:
- Desktop shows a readable table.
- Mobile shows stacked cards.
- Row/card actions are accessible and keyboard-friendly.

---

### Issue 3 - `[Task Management] Add Search, Filters, Sorting & URL State`

**Goal:** Enable admins to quickly find and organize tasks.

Tasks:
- Create `TaskManagementToolbarComponent`.
- Add search by title/description/assignee/reviewer.
- Add filters for status, priority, assignee, reviewer.
- Add sorting for due date, newest, priority, status.
- Persist filter state in URL query params.
- Add clear filters action.

Acceptance Criteria:
- Filters update task list without full page reload.
- Query params reflect active filters.
- Refreshing the browser preserves current filter state.

---

### Issue 4 - `[Task Management] Implement Create/Edit Task Dialog`

**Goal:** Allow admins to create and update task metadata.

Tasks:
- Create `TaskFormDialogComponent` with reactive forms.
- Support create and edit modes.
- Validate title, assignee, reviewer, deadline, priority.
- Prevent assignee and reviewer from being the same user.
- Add submit/loading/error handling.
- Prepare payload DTOs for API integration.

Acceptance Criteria:
- Admin can open create dialog from header.
- Admin can edit a task from row/card action.
- Invalid fields show clear validation messages.
- Dialog restores focus after close.

---

### Issue 5 - `[Task Management] Implement Task Detail Drawer & Review Actions`

**Goal:** Provide a full task context view and admin review workflow.

Tasks:
- Create `TaskManagementDetailDrawerComponent`.
- Display task details, assignment, deadline, comments, documents, and history.
- Add admin workflow actions: mark Need Revision, mark Cleared, reopen if required.
- Add confirmation for destructive or terminal actions.
- Keep drawer accessible with focus management.

Acceptance Criteria:
- Admin can open task detail from table/card.
- Drawer shows full task context.
- Review actions update UI state after success.

---

### Issue 6 - `[Task Management] API Integration & Reactive State Management`

**Goal:** Wire UI to backend-ready typed service methods.

Tasks:
- Extend `TaskService` or create admin-specific service methods.
- Add typed DTOs for list/detail/create/update/status/assignment.
- Implement loading, saving, error, and optimistic status update states.
- Add mock fallback only inside service layer until backend endpoints exist.
- Add retry behavior and user-friendly error messages.

Acceptance Criteria:
- Components consume typed service methods only.
- UI can load, create, edit, assign, and update status through service API.
- API failure does not leave UI in inconsistent state.

---

### Issue 7 - `[Task Management] Polish Responsiveness, Accessibility & Tests`

**Goal:** Finalize production-readiness quality checks.

Tasks:
- Review responsive behavior across desktop/tablet/mobile.
- Add aria labels/tooltips to all icon actions.
- Add component tests for filter state, form validation, status transitions.
- Verify build and lint/type safety.
- Remove unused imports and mock-only leaks from UI components.

Acceptance Criteria:
- `npm run build` passes.
- Key UI states are covered by tests.
- UI is accessible and responsive.

## 11. Recommended Implementation Order

1. Page shell and KPI layout.
2. Table and mobile card components.
3. Toolbar filters and URL sync.
4. Create/edit dialog.
5. Detail drawer and review actions.
6. API/service integration.
7. Polish, tests, and accessibility pass.

## 12. Definition of Done

- Feature is fully integrated under `/tasks`.
- Admin-only menu remains enforced by route/menu roles.
- Build passes.
- UI matches the existing dashboard and My Tasks design system.
- All new GitHub issues are closed after implementation.
- No component depends directly on hardcoded mock data outside service layer.
