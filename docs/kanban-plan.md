## Kanban Board Plan

### 1. High-Level Architecture
- **App shell**: React + Suspense + Error Boundary wrapping the Kanban view.
- **State management**: Zustand store holding canonical task list and column ordering; store hydrates from TanStack Query cache/localStorage on init.
- **Data layer**: Simple async `fetchInitialTasks()` returning mocked data. Wrapped by TanStack Query with Suspense + error boundary integration. Later replace body with real API.
- **Persistence**: LocalStorage provides offline snapshot but server/TanStack Query payload is authoritative; hydrations invoke merge logic that mimics eventual backend conflict resolution rules.
- **Drag & drop**: `@dnd-kit` for columns + cards reordering. Mutations update store state, invalidate/query-set data.

### 2. Component Tree
- `App` (sets up React Query Provider, Zustand provider hook, ErrorBoundary, Suspense fallback).
- `KanbanBoard`
  - `Column` (receives column meta + tasks)
    - `TaskCard`
- `AddTaskForm` (inline or modal; pushes new task through store mutation).

### 3. Data Flow
1. App mounts → React Query runs `fetchInitialTasks`.
2. Suspense fallback shows loader until data resolves; ErrorBoundary catches failures.
3. Query success handler normalizes tasks into Zustand store (`setTasks`), tagging each task with a `updatedAt` timestamp.
4. Components read/write via store hooks:
   - `useTasks()` returns tasks per status.
   - `moveTask(taskId, destinationStatus, index)` handles drag events.
   - `addTask(title, description)` appends new TODO task.
5. Store listens to changes → persist to localStorage.

### 4. Drag & Drop Strategy
- Use `DndContext`, `SortableContext`, `arrayMove` from `@dnd-kit/sortable`.
- Columns static (TODO, IN_PROGRESS, DONE); each column has sortable list of task IDs.
- On drag end:
  - Determine source/destination column/index.
  - Update Zustand store ordering.
  - Persist + optionally `queryClient.setQueryData` to keep cache in sync.

### 5. Local Storage Sync & Conflict Resolution
- Hydration order:
  1. Read localStorage snapshot (if any) into a temporary buffer.
  2. Run Suspense-backed query; once server data arrives, merge server payload with local snapshot by comparing `updatedAt`.
  3. Server data always wins on conflicts; local-only tasks (newer `updatedAt`) are appended.
- Persistence: subscribe to store changes; throttle/debounce writes.
- Schema: `{ tasks: Task[], lastSyncedAt: string }`.
- Mimicked server logic: implement pure helpers (e.g., `applyTaskMutation(task, mutation)` and `mergeServerState(local, server)`) so the later API can reuse identical rules.

### 6. Suspense + Error Boundary Integration
- Wrap `KanbanBoard` with `<ErrorBoundary fallback={<ErrorView />}>` and `<Suspense fallback={<BoardSkeleton />}>`.
- React Query `useQuery({ suspense: true, ... })`.
- Ensure fallback UI includes retry option that triggers `queryClient.invalidateQueries`.

### 7. Types & Utilities
- `Task` interface: `{ id: string; title: string; description?: string; status: 'TODO' | 'IN_PROGRESS' | 'DONE'; order: number; updatedAt: string }`.
- Helper for generating IDs (e.g., `crypto.randomUUID()` fallback).
- Utility `groupTasksByStatus(tasks)` to memoize column data.
- Conflict helpers:
  - `mergeServerState(localTasks, serverTasks)` returns reconciled array favoring server timestamps.
  - `applyTaskMutation(task, mutation)` mirrors future server patch logic for adds/moves/deletes.

### 8. Error Handling
- `fetchInitialTasks` may throw; Error boundary shows message + retry button.
- Store mutations optimistic (no server); if later backend added, integrate revert logic.

### 9. Testing/Validation Plan
- Manual verification: drag cards across columns, add task, refresh to confirm persistence.
- Future: consider unit tests for store reducers + drag logic.

### 10. Next Steps
- Scaffold React project (Vite/CRA).
- Install deps: `@tanstack/react-query`, `zustand`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`.
- Implement data layer + providers.
- Build UI components following plan above.
## Kanban Board Plan

### 1. High-Level Architecture
- **App shell**: React + Suspense + Error Boundary wrapping the Kanban view.
- **State management**: Zustand store holding canonical task list and column ordering; store hydrates from TanStack Query cache/localStorage on init.
- **Data layer**: Simple async `fetchInitialTasks()` returning mocked data. Wrapped by TanStack Query with Suspense + error boundary integration. Later replace body with real API.
- **Persistence**: LocalStorage provides offline snapshot but server/TanStack Query payload is authoritative; hydrations invoke merge logic that mimics eventual backend conflict resolution rules.
- **Drag & drop**: `@dnd-kit` for columns + cards reordering. Mutations update store state, invalidate/query-set data.

### 2. Component Tree
- `App` (sets up React Query Provider, Zustand provider hook, ErrorBoundary, Suspense fallback).
- `KanbanBoard`
  - `Column` (receives column meta + tasks)
    - `TaskCard`
- `AddTaskForm` (inline or modal; pushes new task through store mutation).

### 3. Data Flow
1. App mounts → React Query runs `fetchInitialTasks`.
2. Suspense fallback shows loader until data resolves; ErrorBoundary catches failures.
3. Query success handler normalizes tasks into Zustand store (`setTasks`), tagging each task with a `updatedAt` timestamp.
4. Components read/write via store hooks:
   - `useTasks()` returns tasks per status.
   - `moveTask(taskId, destinationStatus, index)` handles drag events.
   - `addTask(title, description)` appends new TODO task.
5. Store listens to changes → persist to localStorage.

### 4. Drag & Drop Strategy
- Use `DndContext`, `SortableContext`, `arrayMove` from `@dnd-kit/sortable`.
- Columns static (TODO, IN_PROGRESS, DONE); each column has sortable list of task IDs.
- On drag end:
  - Determine source/destination column/index.
  - Update Zustand store ordering.
  - Persist + optionally `queryClient.setQueryData` to keep cache in sync.

### 5. Local Storage Sync & Conflict Resolution
- Hydration order:
  1. Read localStorage snapshot (if any) into a temporary buffer.
  2. Run Suspense-backed query; once server data arrives, merge server payload with local snapshot by comparing `updatedAt`.
  3. Server data always wins on conflicts; local-only tasks (newer `updatedAt`) are appended.
- Persistence: subscribe to store changes; throttle/debounce writes.
- Schema: `{ tasks: Task[], lastSyncedAt: string }`.
- Mimicked server logic: implement pure helpers (e.g., `applyTaskMutation(task, mutation)` and `mergeServerState(local, server)`) so the later API can reuse identical rules.

### 6. Suspense + Error Boundary Integration
- Wrap `KanbanBoard` with `<ErrorBoundary fallback={<ErrorView />}>` and `<Suspense fallback={<BoardSkeleton />}>`.
- React Query `useQuery({ suspense: true, ... })`.
- Ensure fallback UI includes retry option that triggers `queryClient.invalidateQueries`.

### 7. Types & Utilities
- `Task` interface: `{ id: string; title: string; description?: string; status: 'TODO' | 'IN_PROGRESS' | 'DONE'; order: number; updatedAt: string }`.
- Helper for generating IDs (e.g., `crypto.randomUUID()` fallback).
- Utility `groupTasksByStatus(tasks)` to memoize column data.
- Conflict helpers:
  - `mergeServerState(localTasks, serverTasks)` returns reconciled array favoring server timestamps.
  - `applyTaskMutation(task, mutation)` mirrors future server patch logic for adds/moves/deletes.

### 8. Error Handling
- `fetchInitialTasks` may throw; Error boundary shows message + retry button.
- Store mutations optimistic (no server); if later backend added, integrate revert logic.

### 9. Testing/Validation Plan
- Manual verification: drag cards across columns, add task, refresh to confirm persistence.
- Future: consider unit tests for store reducers + drag logic.

### 10. Next Steps
- Scaffold React project (Vite/CRA).
- Install deps: `@tanstack/react-query`, `zustand`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`.
- Implement data layer + providers.
- Build UI components following plan above.

