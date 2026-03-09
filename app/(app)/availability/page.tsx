'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckSquare, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrg } from '@/lib/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import { SchedulingPeriod } from '@/lib/types'
import { EmptyState } from '@/components/shared/empty-state'
import { formatDate } from '@/lib/utils'

export default function AvailabilityIndexPage() {
  const { organization } = useOrg()
  const [periods, setPeriods] = useState<SchedulingPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (organization) load()
  }, [organization])

  async function load() {
    const { data } = await supabase
      .from('scheduling_periods')
      .select('*')
      .eq('organization_id', organization!.id)
      .eq('status', 'collecting')
      .order('start_date', { ascending: true })

    setPeriods(data || [])
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Submit Availability</h1>
        <p className="text-slate-500 mt-0.5">Periods currently open for availability</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : periods.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No open periods"
          description="Your manager hasn't opened any shifts for availability yet. Check back soon."
        />
      ) : (
        <div className="space-y-3">
          {periods.map(period => (
            <div key={period.id} className="bg-white border border-blue-200 rounded-xl p-5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">{period.name}</div>
                <div className="text-sm text-slate-500 mt-0.5">
                  {formatDate(period.start_date)} — {formatDate(period.end_date)}
                </div>
              </div>
              <Link href={`/availability/${period.id}`}>
                <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                  Submit <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
