export function BoardSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl gap-4">
      {[0, 1, 2].map((column) => (
        <div
          key={column}
          className="flex flex-1 flex-col gap-3 rounded-xl border border-border/50 bg-card/40 p-4"
        >
          <div className="h-6 w-32 rounded-md bg-muted" />
          {[0, 1, 2].map((card) => (
            <div key={card} className="h-20 rounded-lg bg-muted" />
          ))}
        </div>
      ))}
    </div>
  )
}

