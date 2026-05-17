export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-1.5">
        <div className="h-7 w-36 bg-app-surface-alt rounded animate-pulse" />
        <div className="h-4 w-24 bg-app-surface-alt rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-app-surface-alt border border-app-border/60 rounded-xl p-4 space-y-3 animate-pulse">
            <div className="h-3 w-20 bg-app-surface-alt rounded" />
            <div className="h-7 w-24 bg-app-surface-alt rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-app-surface-alt border border-app-border/60 rounded-xl p-4 animate-pulse">
          <div className="h-4 w-40 bg-app-surface-alt rounded mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 bg-app-surface-alt rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 bg-app-surface-alt rounded" />
                <div className="h-2.5 w-20 bg-app-surface-alt rounded" />
              </div>
              <div className="h-4 w-16 bg-app-surface-alt rounded" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="bg-app-surface-alt border border-app-border/60 rounded-xl p-4 h-40 animate-pulse" />
          <div className="bg-app-surface-alt border border-app-border/60 rounded-xl p-4 h-40 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
