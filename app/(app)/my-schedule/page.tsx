'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, ArrowRight } from 'lucide-react'
import { useOrg } from '@/lib/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import { SchedulingPeriod } from '@/lib/types'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { formatDate } from '@/lib/utils'

export default function MySchedulePage() {
  const { organization, member } = useOrg()
  const [periods, setPeriods] = useState<SchedulingPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (organization && member) load()
  }, [organization, member])

  async function load() {
    // Get periods where this employee has assignments (published)
    const { data } = await supabase
      .from('scheduling_periods')
      .select('*')
      .eq('organization_id', organization!.id)
      .in('status', ['published', 'archived'])
      .order('start_date', { ascending: false })

    setPeriods(data || [])
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Schedule</h1>
        <p className="text-slate-500 mt-0.5">Your published shifts</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : periods.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No published schedules yet"
          description="Your schedule will appear here once your manager publishes it."
        />
      ) : (
        <div className="space-y-3">
          {periods.map(period => (
            <Link key={period.id} href={`/my-schedule/${period.id}`}>
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer group">
                <div>
                  <div className="font-semibold text-slate-900">{period.name}</div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    {formatDate(period.start_date)} — {formatDate(period.end_date)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={period.status} />
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
