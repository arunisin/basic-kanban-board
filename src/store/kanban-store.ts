import { create } from 'zustand'

import { applyTaskMutation, mergeServerState, sortTasks } from '@/services/task-logic'
import type { Task, TaskInput, TaskStatus } from '@/types/kanban'

import { loadPersistedState, persistState } from './persistence'

const persisted = loadPersistedState()

type KanbanState = {
  tasks: Task[]
  lastSyncedAt?: string
  hydrated: boolean
}

type KanbanActions = {
  setTasks: (tasks: Task[], options?: { lastSyncedAt?: string }) => void
  reconcileWithServer: (tasks: Task[]) => void
  addTask: (input: TaskInput) => void
  moveTask: (params: { taskId: string; status: TaskStatus; position: number }) => void
  updateTask: (taskId: string, changes: Partial<Omit<Task, 'id'>>) => void
  removeTask: (taskId: string) => void
}

export const useKanbanStore = create<KanbanState & KanbanActions>((set) => ({
  tasks: persisted?.tasks ?? [],
  lastSyncedAt: persisted?.lastSyncedAt,
  hydrated: Boolean(persisted),
  setTasks: (tasks, options) =>
    set({
      tasks: sortTasks(tasks),
      lastSyncedAt: options?.lastSyncedAt ?? new Date().toISOString(),
      hydrated: true,
    }),
  reconcileWithServer: (tasks) =>
    set((state) => ({
      tasks: mergeServerState(state.tasks, tasks),
      lastSyncedAt: new Date().toISOString(),
      hydrated: true,
    })),
  addTask: (input) =>
    set((state) => ({
      tasks: applyTaskMutation(state.tasks, { type: 'add', payload: input }),
    })),
  moveTask: ({ taskId, status, position }) =>
    set((state) => ({
      tasks: applyTaskMutation(state.tasks, {
        type: 'move',
        payload: { taskId, status, position },
      }),
    })),
  updateTask: (taskId, changes) =>
    set((state) => ({
      tasks: applyTaskMutation(state.tasks, {
        type: 'update',
        payload: { taskId, changes },
      }),
    })),
  removeTask: (taskId) =>
    set((state) => ({
      tasks: applyTaskMutation(state.tasks, {
        type: 'remove',
        payload: { taskId },
      }),
    })),
}))

if (typeof window !== 'undefined') {
  useKanbanStore.subscribe((state) => {
    persistState({
      tasks: state.tasks,
      lastSyncedAt: state.lastSyncedAt,
    })
  })
}

