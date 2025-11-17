
import { useMemo, useState } from 'react'
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
  DragOverEvent,
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
  const { tasks, moveTask } = useKanbanStore((state) => ({
    tasks: state.tasks,
    moveTask: state.moveTask,
  }))
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const grouped = useMemo(() => {
    return TASK_STATUSES.map((status) => ({
      status,
      tasks: tasks.filter((task) => task.status === status),
    }))
  }, [tasks])

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const task = tasks.find((task) => task.id === active.id)
    setActiveTask(task || null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeTask = tasks.find((task) => task.id === active.id)
    if (!activeTask) return

    const overId = over.id as string
    const overColumn = TASK_STATUSES.find((status) => status === overId)

    // If dropped over a column, move to that status
    if (overColumn && activeTask.status !== overColumn) {
      const targetColumnTasks = tasks.filter((task) => task.status === overColumn)
      moveTask({
        taskId: activeTask.id,
        status: overColumn,
        position: targetColumnTasks.length,
      })
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeTask = tasks.find((task) => task.id === active.id)
    if (!activeTask) return

    const overId = over.id as string
    const overTask = tasks.find((task) => task.id === overId)
    const overColumn = TASK_STATUSES.find((status) => status === overId)

    // If dropped over another task, reorder within the same status
    if (overTask && activeTask.status === overTask.status && active.id !== over.id) {
      const columnTasks = tasks.filter((task) => task.status === activeTask.status)
      const activeIndex = columnTasks.findIndex((task) => task.id === active.id)
      const overIndex = columnTasks.findIndex((task) => task.id === over.id)
      
      if (activeIndex !== overIndex) {
        moveTask({
          taskId: activeTask.id,
          status: activeTask.status,
          position: overIndex,
        })
      }
    }
    // If dropped over a column header, move to end of that column
    else if (overColumn && activeTask.status !== overColumn) {
      const targetColumnTasks = tasks.filter((task) => task.status === overColumn)
      moveTask({
        taskId: activeTask.id,
        status: overColumn,
        position: targetColumnTasks.length,
      })
    }
  }

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

