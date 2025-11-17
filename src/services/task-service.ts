import { sortTasks } from '@/services/task-logic'
import type { Task } from '@/types/kanban'

const seedTasks: Task[] = sortTasks([
  {
    id: 'task-1',
    title: 'Design Kanban data model',
    description: 'Define Task, Column and drag metadata',
    status: 'TODO',
    order: 0,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'task-2',
    title: 'Set up global providers',
    description: 'React Query, Zustand, Suspense wrappers',
    status: 'IN_PROGRESS',
    order: 0,
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'task-3',
    title: 'Implement drag & drop shell',
    description: 'Integrate DnD Kit and column layout',
    status: 'DONE',
    order: 0,
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
])

export async function fetchInitialTasks(): Promise<Task[]> {
  await wait(650)
  return JSON.parse(JSON.stringify(seedTasks))
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

