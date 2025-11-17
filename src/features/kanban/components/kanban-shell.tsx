
import { useMemo, useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import type {
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useKanbanStore } from '@/store/kanban-store'
import { TASK_STATUSES, type Task, type TaskStatus } from '@/types/kanban'

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
}

interface TaskCardProps {
  task: Task
  isDragging?: boolean
}

function TaskCard({ task, isDragging = false }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const opacity = isDragging || isSortableDragging ? 0.4 : 1

  return (
    <Card
      ref={setNodeRef}
      style={{ ...style, opacity }}
      className={`bg-card shadow-sm cursor-grab active:cursor-grabbing ${
        isDragging || isSortableDragging ? 'shadow-lg scale-105' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{task.title}</CardTitle>
        {task.description ? (
          <CardDescription className="text-sm">{task.description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="px-4 pb-4 text-xs text-muted-foreground">
        Updated {new Date(task.updatedAt).toLocaleString()}
      </CardContent>
    </Card>
  )
}

interface DroppableColumnProps {
  status: TaskStatus
  tasks: Task[]
  children: React.ReactNode
}

function DroppableColumn({ status, tasks, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-1 flex-col gap-3 rounded-2xl border border-border bg-card/60 p-4 transition-colors ${
        isOver ? 'border-primary/50 bg-primary/5' : ''
      }`}
    >
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {STATUS_LABELS[status]}
          </p>
          <p className="text-xs text-muted-foreground/80">{tasks.length} tasks</p>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-3 min-h-[200px]">
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
        {tasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
            No tasks yet
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function KanbanShell() {
  const tasks = useKanbanStore((state) => state.tasks)
  const moveTask = useKanbanStore((state) => state.moveTask)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Use a stable reference for tasks to prevent infinite loops
  const stableTasks = useMemo(() => tasks, [tasks])
  
  const grouped = useMemo(() => {
    const tasksByStatus = new Map<TaskStatus, Task[]>()
    
    // Initialize all statuses with empty arrays
    TASK_STATUSES.forEach(status => {
      tasksByStatus.set(status, [])
    })
    
    // Group tasks by status
    stableTasks.forEach(task => {
      const statusTasks = tasksByStatus.get(task.status)
      if (statusTasks) {
        statusTasks.push(task)
      }
    })
    
    // Return the grouped result
    return TASK_STATUSES.map((status) => ({
      status,
      tasks: tasksByStatus.get(status) || [],
    }))
  }, [stableTasks])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const task = stableTasks.find((task) => task.id === active.id)
    setActiveTask(task || null)
  }, [stableTasks])

  const handleDragOver = useCallback(() => {
    // Only provide visual feedback, don't update state here
    // State updates will be handled in handleDragEnd
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over || active.id === over.id) return

    const activeTask = stableTasks.find((task) => task.id === active.id)
    if (!activeTask) return

    const overId = over.id as string
    const overTask = stableTasks.find((task) => task.id === overId)
    const overColumn = TASK_STATUSES.find((status) => status === overId)

    // Case 1: Dropped over another task (reorder within same status or move between statuses)
    if (overTask) {
      const targetStatus = overTask.status
      const targetColumnTasks = stableTasks.filter((task) => task.status === targetStatus)
      const overIndex = targetColumnTasks.findIndex((task) => task.id === over.id)
      
      moveTask({
        taskId: activeTask.id,
        status: targetStatus,
        position: overIndex,
      })
    }
    // Case 2: Dropped over a column (move to end of that column)
    else if (overColumn) {
      const targetColumnTasks = stableTasks.filter((task) => task.status === overColumn)
      moveTask({
        taskId: activeTask.id,
        status: overColumn,
        position: targetColumnTasks.length,
      })
    }
  }, [stableTasks, moveTask])

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <section className="mx-auto flex w-full max-w-6xl flex-1 gap-4">
        {grouped.map((column) => (
          <DroppableColumn
            key={column.status}
            status={column.status}
            tasks={column.tasks}
          >
            {column.tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </DroppableColumn>
        ))}
      </section>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}

