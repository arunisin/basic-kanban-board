import type { Task } from '@/types/kanban'

const STORAGE_KEY = 'kanban.tasks.v1'

export interface PersistedKanbanState {
  tasks: Task[]
  lastSyncedAt?: string
}

export function loadPersistedState(): PersistedKanbanState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedKanbanState
    if (!Array.isArray(parsed.tasks)) return null
    return parsed
  } catch {
    return null
  }
}

export function persistState(state: PersistedKanbanState) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore quota errors
  }
}

