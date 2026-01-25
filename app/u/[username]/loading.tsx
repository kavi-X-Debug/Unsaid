export default function UserProfileLoading() {
  return (
    <main className="min-h-screen px-4 py-10 flex justify-center">
      <div className="w-full max-w-2xl space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-48 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
        <div className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-900/60" />
        <div className="space-y-3">
          <div className="h-4 w-40 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2">
            <div className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-900/60" />
            <div className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-900/60" />
          </div>
        </div>
      </div>
    </main>
  );
}

