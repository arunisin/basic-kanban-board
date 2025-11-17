export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  order: number
  updatedAt: string
}

export type TaskInput = Pick<Task, 'title' | 'description'> & {
  status?: TaskStatus
}

