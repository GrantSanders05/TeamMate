'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckSquare, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrg } from '@/lib/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import { SchedulingPeriod } from '@/lib/types'
import { EmptyState } from '@/components/shared/empty-state'
import { formatDisplayDate } from '@/lib/date-format'

export default function AvailabilityIndexPage() {
  const { organization } = useOrg()
  const [periods, setPeriods] = useState<SchedulingPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (organization) void load()
  }, [organization?.id])

  async function load() {
    const { data } = await supabase
      .from('scheduling_periods')
      .select('*')
      .eq('organization_id', organization!.id)
      .eq('status', 'collecting')
      .order('start_date', { ascending: true })

    setPeriods((data as SchedulingPeriod[]) || [])
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="section-card">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Submit Availability</h1>
        <p className="mt-2 text-sm text-slate-600">Periods currently open for availability.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="section-card h-36 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : periods.length === 0 ? (
        <EmptyState title="No open availability periods" description="Your manager has not opened an availability period yet." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {periods.map((period) => (
            <div key={period.id} className="section-card flex flex-col justify-between gap-4">
              <div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-slate-950">{period.name}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {formatDisplayDate(period.start_date)} — {formatDisplayDate(period.end_date)}
                </p>
              </div>

              <Button asChild className="w-full rounded-2xl sm:w-auto">
                <Link href={`/availability/${period.id}`}>
                  Submit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
