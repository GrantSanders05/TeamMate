'use client'

import Link from 'next/link'
import { Calendar, Users, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  { icon: Calendar, title: 'Create shifts', desc: 'Build scheduling periods and shift templates for your team.' },
  { icon: CheckCircle, title: 'Collect availability', desc: 'Let employees submit availability from any device.' },
  { icon: Users, title: 'Publish schedules', desc: 'Share finalized schedules with clear team visibility.' },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="text-xl font-semibold">Teammate</div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild><Link href="/login">Sign in</Link></Button>
          <Button asChild><Link href="/signup">Get Started</Link></Button>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            Free for teams of any size
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-slate-900">Scheduling made simple.</h1>
          <p className="mt-6 text-lg text-slate-600">
            Create shifts, collect availability, and build your team&apos;s schedule in one place.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild><Link href="/signup">Create account</Link></Button>
            <Button variant="outline" asChild><Link href="/login">Sign in</Link></Button>
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="rounded-xl border p-6 shadow-sm">
                <div className="mb-4 inline-flex rounded-full bg-slate-100 p-3">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{feature.desc}</p>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
