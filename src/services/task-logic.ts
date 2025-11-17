import { TASK_STATUSES, type Task, type TaskInput, type TaskStatus } from '@/types/kanban'

export type TaskMutation =
  | {
      type: 'add'
      payload: TaskInput
    }
  | {
      type: 'move'
      payload: {
        taskId: string
        status: TaskStatus
        position: number
      }
    }
  | {
      type: 'update'
      payload: {
        taskId: string
        changes: Partial<Omit<Task, 'id'>>
      }
    }
  | {
      type: 'remove'
      payload: { taskId: string }
    }

const STATUS_ORDER = TASK_STATUSES.reduce<Record<TaskStatus, number>>((acc, status, idx) => {
  acc[status] = idx
  return acc
}, {} as Record<TaskStatus, number>)

export const sortTasks = (tasks: Task[]) =>
  [...tasks].sort((a, b) => {
    if (a.status !== b.status) {
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    }
    if (a.order !== b.order) {
      return a.order - b.order
    }
    return a.updatedAt.localeCompare(b.updatedAt)
  })

export function mergeServerState(localTasks: Task[], serverTasks: Task[]): Task[] {
  const merged = new Map<string, Task>()

  serverTasks.forEach((task) => merged.set(task.id, task))

  localTasks.forEach((localTask) => {
    const serverTask = merged.get(localTask.id)
    if (!serverTask) {
      merged.set(localTask.id, localTask)
      return
    }
    const localTime = Date.parse(localTask.updatedAt)
    const serverTime = Date.parse(serverTask.updatedAt)
    if (Number.isNaN(localTime) || Number.isNaN(serverTime)) {
      merged.set(localTask.id, serverTask)
    } else if (localTime > serverTime) {
      merged.set(localTask.id, localTask)
    }
  })

  return sortTasks(Array.from(merged.values()))
}

const createTaskId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `task_${Math.random().toString(36).slice(2, 10)}`

export function applyTaskMutation(tasks: Task[], mutation: TaskMutation): Task[] {
  switch (mutation.type) {
    case 'add': {
      const status = mutation.payload.status ?? 'TODO'
      const nextOrder = tasks.filter((task) => task.status === status).length
      const now = new Date().toISOString()
      const newTask: Task = {
        id: createTaskId(),
        title: mutation.payload.title,
        description: mutation.payload.description,
        status,
        order: nextOrder,
        updatedAt: now,
      }
      return sortTasks([...tasks, newTask])
    }
    case 'move': {
      const { taskId, status, position } = mutation.payload
      const now = new Date().toISOString()
      const updatedTasks = tasks.map((task) => {
        if (task.id !== taskId) return task
        return {
          ...task,
          status,
          updatedAt: now,
        }
      })
      return reorderWithinStatus(updatedTasks, status, taskId, position)
    }
    case 'update': {
      const { taskId, changes } = mutation.payload
      return sortTasks(
        tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                ...changes,
                updatedAt: new Date().toISOString(),
              }
            : task,
        ),
      )
    }
    case 'remove': {
      return tasks.filter((task) => task.id !== mutation.payload.taskId)
    }
    default:
      return tasks
  }
}

function reorderWithinStatus(
  tasks: Task[],
  status: TaskStatus,
  taskId: string,
  newIndex: number,
): Task[] {
  const inStatus = tasks.filter((task) => task.status === status && task.id !== taskId)
  const movedTask = tasks.find((task) => task.id === taskId)
  if (!movedTask) return tasks

  inStatus.splice(newIndex, 0, movedTask)

  const reordered = tasks.map((task) => {
    if (task.status !== status) return task
    const index = inStatus.findIndex((t) => t.id === task.id)
    return {
      ...task,
      order: index === -1 ? task.order : index,
    }
  })

  return sortTasks(reordered)
}

