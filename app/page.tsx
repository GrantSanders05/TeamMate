import Link from "next/link"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex rounded-full border bg-white px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm">
              TeamMate
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Scheduling made simple.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Create shifts, collect availability, publish schedules, and keep your team on the same page — all in one clean, mobile-friendly workspace.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm"
              >
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm"
              >
                Sign In
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-slate-900">Collect Availability</div>
                <p className="mt-2 text-sm text-slate-600">
                  Let employees submit availability from their phone in a clean workflow.
                </p>
              </div>
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-slate-900">Build Faster</div>
                <p className="mt-2 text-sm text-slate-600">
                  Use shift templates, weekly views, and quick assignment tools to build schedules.
                </p>
              </div>
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-slate-900">Publish Clearly</div>
                <p className="mt-2 text-sm text-slate-600">
                  Share polished schedules with your whole team and export them when needed.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
            <div className="rounded-2xl bg-slate-900 p-5 text-white">
              <div className="text-sm font-medium text-slate-300">This Week</div>
              <div className="mt-2 text-2xl font-semibold">Bluebird Coffee</div>
              <div className="mt-1 text-sm text-slate-300">Team schedule overview</div>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">Morning Shift</div>
                    <div className="mt-1 text-sm text-slate-600">Mon, Jul 15 · 8:00 AM – 12:00 PM</div>
                  </div>
                  <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    Fully Staffed
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="text-sm font-medium text-slate-900">Live Highlights</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Available</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">12</div>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Assigned</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">18</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="text-sm font-medium text-slate-900">Built for teams on the go</div>
                <p className="mt-2 text-sm text-slate-600">
                  Managers and employees can use the same app comfortably on desktop or phone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
