import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-xl w-full space-y-6 text-center">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Anonymous questions, polls, and reactions for real connections
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Unsaid lets anyone send you anonymous messages and polls while you stay in
            control with a smart inbox, reactions, and safety tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-sm font-medium text-white hover:bg-sky-400 transition"
            >
              Create your profile
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100 transition dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
            >
              Log in
            </Link>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Built with Next.js, Firebase, and Tailwind. Optimized for Vercel.
          </p>
        </div>
      </div>
    </main>
  );
}
