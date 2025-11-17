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

// Throttle function to prevent excessive localStorage writes
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle: boolean
  return ((...args: any[]) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }) as T
}

const throttledPersistState = throttle((state: PersistedKanbanState) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore quota errors
  }
}, 100) // Throttle to max 10 writes per second

export function persistState(state: PersistedKanbanState) {
  throttledPersistState(state)
}

