'use client'

import Link from 'next/link'
import { Calendar, Users, CheckCircle, Download, ArrowRight, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 text-lg">Teammate</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-24 px-4 sm:px-6 text-center bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            Free for teams of any size
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight mb-6">
            Scheduling made<br />
            <span className="text-blue-600">simple.</span>
          </h1>
          <p className="text-xl text-slate-500 mb-10 max-w-xl mx-auto leading-relaxed">
            Create shifts, collect availability, and build your team&apos;s schedule — all in one place. No spreadsheets, no back-and-forth texts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-base">
                Get Started Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                See how it works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Everything you need to schedule your team</h2>
            <p className="text-slate-500 text-lg">From availability collection to published schedules in minutes.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Calendar,
                title: 'Define Your Shifts',
                desc: 'Create reusable shift templates or one-off custom shifts for any schedule period.',
                color: 'text-blue-600 bg-blue-50',
              },
              {
                icon: CheckCircle,
                title: 'Collect Availability',
                desc: 'Workers see open periods on their dashboard and submit when they can work — right from their phone.',
                color: 'text-green-600 bg-green-50',
              },
              {
                icon: Users,
                title: 'Build Your Schedule',
                desc: 'Assign workers with a click. See hours update instantly as you fill each shift.',
                color: 'text-purple-600 bg-purple-50',
              },
              {
                icon: Download,
                title: 'Share & Export',
                desc: 'Publish schedules for your team to view. Download professional PDFs with your branding.',
                color: 'text-amber-600 bg-amber-50',
              },
            ].map((f) => (
              <div key={f.title} className="border border-slate-100 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Up and running in minutes</h2>
            <p className="text-slate-500 text-lg">Three simple steps to a published schedule.</p>
          </div>
          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Create your organization and invite your team',
                desc: 'Set up your org with your branding, create shift types, and share your join code. Team members join instantly — no approval needed.',
              },
              {
                step: '2',
                title: 'Set up shifts and collect availability',
                desc: 'Create a scheduling period, add shifts to each day, and open it for availability collection. Your team submits when they can work directly from their dashboard.',
              },
              {
                step: '3',
                title: 'Build, publish, and share your schedule',
                desc: 'See who\'s available for each shift, assign with a click, and publish. Employees get instant access to their schedule. Download a PDF anytime.',
              },
            ].map((s) => (
              <div key={s.step} className="flex gap-6 items-start">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">
                  {s.step}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-slate-900 text-lg mb-1">{s.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 bg-blue-600 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to simplify your scheduling?</h2>
          <p className="text-blue-100 text-lg mb-8">Free forever. No credit card required.</p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 h-12 px-8 text-base font-semibold">
              Create your free account
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-slate-100 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <Users className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-slate-700">Teammate</span>
        </div>
        <p className="text-slate-400 text-sm">&copy; {new Date().getFullYear()} Teammate. All rights reserved.</p>
      </footer>
    </div>
  )
}
