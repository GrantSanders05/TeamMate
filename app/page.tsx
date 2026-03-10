import Link from "next/link";

const featureCards = [
  {
    title: "Collect availability",
    body: "Let employees submit availability from their phone in a clean, low-friction workflow.",
  },
  {
    title: "Build faster",
    body: "Create shifts, assign workers quickly, and keep the week organized without clutter.",
  },
  {
    title: "Publish clearly",
    body: "Share polished schedules with your team and export them when you need to.",
  },
];

const highlights = [
  { label: "Available", value: "12" },
  { label: "Assigned", value: "18" },
  { label: "Open shifts", value: "3" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-4">
          <div className="text-lg font-semibold tracking-tight text-slate-950">
            TeamMate
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 font-medium text-slate-600 hover:bg-white hover:text-slate-950"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              Get started free
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-12">
          <div className="space-y-6">
            <span className="app-chip">Scheduling made simple</span>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-balance text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Build cleaner schedules without the chaos.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Create shifts, collect availability, assign employees, and publish a professional team schedule from one place.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Sign in
              </Link>
            </div>

            <div className="grid gap-4 pt-4 sm:grid-cols-3">
              {featureCards.map((card) => (
                <article key={card.title} className="hero-card">
                  <h2 className="text-base font-semibold text-slate-950">
                    {card.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {card.body}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <aside className="hero-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">This week</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                  Bluebird Coffee
                </h2>
              </div>
              <span className="app-chip">Live preview</span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">Morning shift</p>
                <p className="mt-1 text-sm text-slate-500">
                  Mon, Jul 15 · 8:00 AM – 12:00 PM
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="app-chip border-blue-200 bg-blue-50 text-blue-700">
                    Fully staffed
                  </span>
                  <span className="app-chip">Team schedule overview</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {highlights.map((item) => (
                  <div key={item.label} className="app-stat">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-950">
                  Built for teams on the go
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Managers and employees can use the same app comfortably on desktop or phone.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
