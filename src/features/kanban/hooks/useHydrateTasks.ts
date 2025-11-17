import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { fetchInitialTasks } from '@/services/task-service'
import { useKanbanStore } from '@/store/kanban-store'

const tasksKey = ['tasks', 'initial']

export function useHydrateTasks() {
  const reconcileWithServer = useKanbanStore((state) => state.reconcileWithServer)
  const { data } = useQuery({
    queryKey: tasksKey,
    queryFn: fetchInitialTasks,
  })

  useEffect(() => {
    if (!data) return
    reconcileWithServer(data)
  }, [data, reconcileWithServer])
}

