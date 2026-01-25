import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-950 to-black">
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
              className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition bg-sky-500 text-slate-950 hover:bg-sky-400 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:bg-sky-400 dark:hover:bg-sky-300 dark:text-slate-950 dark:focus-visible:ring-offset-slate-950"
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
      <section className="border-t border-slate-800/60 bg-slate-950/60">
        <div className="mx-auto max-w-5xl px-4 py-12 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-slate-100">
              Why use Unsaid?
            </h2>
            <p className="text-sm text-slate-400">
              Give people a safe way to be honest while you stay in control.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3 text-left">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
              <p className="text-sm font-semibold text-slate-100">Smart inbox</p>
              <p className="text-xs text-slate-400">
                All questions and polls arrive in one private inbox, sorted into new,
                answered, and reported.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
              <p className="text-sm font-semibold text-slate-100">Safety first</p>
              <p className="text-xs text-slate-400">
                Report anything that crosses the line and keep your profile link under
                your control at all times.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
              <p className="text-sm font-semibold text-slate-100">Real reactions</p>
              <p className="text-xs text-slate-400">
                Let people react to your answers with quick emoji reactions to see what
                resonates.
              </p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 items-start">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-100">
                How it works
              </h3>
              <ol className="space-y-2 text-xs text-slate-400">
                <li>
                  <span className="font-semibold text-slate-100">1. Create your profile.</span>{" "}
                  Sign up in seconds and get your own Unsaid link.
                </li>
                <li>
                  <span className="font-semibold text-slate-100">2. Share the link.</span>{" "}
                  Post it on socials, stories, or send it directly to friends.
                </li>
                <li>
                  <span className="font-semibold text-slate-100">3. Answer from your inbox.</span>{" "}
                  Read questions privately, answer what you like, and publish when you are
                  ready.
                </li>
              </ol>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-100">
                Perfect for
              </h3>
              <ul className="space-y-1 text-xs text-slate-400">
                <li>Creators who want honest feedback without DMs getting messy.</li>
                <li>Friends who want to ask things they are shy to say out loud.</li>
                <li>Communities that need quick anonymous polls and questions.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
