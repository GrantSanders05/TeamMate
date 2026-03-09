'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Calendar, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrg } from '@/lib/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import { SchedulingPeriod } from '@/lib/types'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { formatDate } from '@/lib/utils'

export default function SchedulePage() {
  const { organization, isManager } = useOrg()
  const [periods, setPeriods] = useState<SchedulingPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (organization) loadPeriods()
  }, [organization])

  async function loadPeriods() {
    const { data } = await supabase
      .from('scheduling_periods')
      .select('*')
      .eq('organization_id', organization!.id)
      .not('status', 'eq', 'archived')
      .order('start_date', { ascending: false })

    setPeriods(data || [])
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schedules</h1>
          <p className="text-slate-500 mt-0.5">Manage scheduling periods</p>
        </div>
        {isManager && (
          <Link href="/schedule/new">
            <Button className="bg-blue-600 hover:bg-blue-700" style={{ backgroundColor: organization?.primary_color }}>
              <Plus className="w-4 h-4 mr-2" />
              New Schedule
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : periods.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No schedules yet"
          description="Create your first scheduling period to get started."
          action={isManager ? { label: 'Create schedule', onClick: () => window.location.href = '/schedule/new' } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {periods.map(period => (
            <Link key={period.id} href={`/schedule/${period.id}`}>
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer group">
                <div>
                  <div className="font-semibold text-slate-900 mb-1">{period.name}</div>
                  <div className="text-sm text-slate-500">
                    {formatDate(period.start_date)} — {formatDate(period.end_date)} · {period.period_type}
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
