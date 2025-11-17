import { Suspense } from 'react'

import { BoardSkeleton } from '@/components/system/board-skeleton'
import { ErrorBoundary } from '@/components/system/error-boundary'
import { ErrorFallback } from '@/components/system/error-fallback'
import { KanbanShell } from '@/features/kanban/components/kanban-shell'
import { useHydrateTasks } from '@/features/kanban/hooks/useHydrateTasks'

function KanbanBootstrap() {
  useHydrateTasks()
  return <KanbanShell />
}

function App() {
  return (
    <div className="min-h-screen  px-4 py-10 text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary/80">
            Kanban
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Product Delivery Board</h1>
          <p className="text-muted-foreground">
            Drag and drop tasks across TODO, In Progress, and Done. Local changes stay persisted
            while server data remains the source of truth.
          </p>
        </header>

        <ErrorBoundary
          fallback={(error, reset) => <ErrorFallback error={error} onRetry={reset} />}
        >
          <Suspense fallback={<BoardSkeleton />}>
            <KanbanBootstrap />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
}

export default App
