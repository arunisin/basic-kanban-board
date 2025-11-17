import { Button } from '@/components/ui/button'

type ErrorFallbackProps = {
  error: Error
  onRetry: () => void
}

export function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
      <div>
        <p className="text-base font-semibold text-destructive">Something went wrong</p>
        <p className="text-sm text-destructive/70">{error.message}</p>
      </div>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

