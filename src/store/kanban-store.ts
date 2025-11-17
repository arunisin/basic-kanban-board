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

// Helper function to check if tasks array has actually changed
function tasksEqual(a: Task[], b: Task[]): boolean {
  if (a.length !== b.length) return false
  return a.every((task, index) => {
    const other = b[index]
    return (
      task.id === other.id &&
      task.title === other.title &&
      task.description === other.description &&
      task.status === other.status &&
      task.order === other.order &&
      task.updatedAt === other.updatedAt
    )
  })
}

export const useKanbanStore = create<KanbanState & KanbanActions>((set, get) => ({
  tasks: persisted?.tasks ?? [],
  lastSyncedAt: persisted?.lastSyncedAt,
  hydrated: Boolean(persisted),
  setTasks: (tasks, options) => {
    const sortedTasks = sortTasks(tasks)
    const currentTasks = get().tasks
    
    // Only update if tasks actually changed
    if (!tasksEqual(currentTasks, sortedTasks)) {
      set({
        tasks: sortedTasks,
        lastSyncedAt: options?.lastSyncedAt ?? new Date().toISOString(),
        hydrated: true,
      })
    }
  },
  reconcileWithServer: (tasks) =>
    set((state) => {
      const mergedTasks = mergeServerState(state.tasks, tasks)
      
      // Only update if tasks actually changed
      if (!tasksEqual(state.tasks, mergedTasks)) {
        return {
          tasks: mergedTasks,
          lastSyncedAt: new Date().toISOString(),
          hydrated: true,
        }
      }
      return state
    }),
  addTask: (input) =>
    set((state) => ({
      tasks: applyTaskMutation(state.tasks, { type: 'add', payload: input }),
    })),
  moveTask: ({ taskId, status, position }) =>
    set((state) => {
      const newTasks = applyTaskMutation(state.tasks, {
        type: 'move',
        payload: { taskId, status, position },
      })
      
      // Only update if tasks actually changed
      if (!tasksEqual(state.tasks, newTasks)) {
        return { tasks: newTasks }
      }
      return state
    }),
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
  let previousTasks: Task[] = useKanbanStore.getState().tasks
  
  useKanbanStore.subscribe((state) => {
    const currentTasks = state.tasks
    
    // Only persist if tasks actually changed (not just reference)
    if (!tasksEqual(currentTasks, previousTasks)) {
      persistState({
        tasks: currentTasks,
        lastSyncedAt: state.lastSyncedAt,
      })
      previousTasks = currentTasks
    }
  })
}

