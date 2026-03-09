'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrg } from '@/lib/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import { SchedulingPeriod, Shift, AvailabilityResponse } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'
import { formatDate, formatDateFull, formatTime, getDaysInRange, cn } from '@/lib/utils'

type AvailStatus = 'available' | 'unavailable' | null

export default function AvailabilityPage() {
  const params = useParams()
  const periodId = params.periodId as string
  const { organization, member } = useOrg()
  const [period, setPeriod] = useState<SchedulingPeriod | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [responses, setResponses] = useState<Record<string, AvailStatus>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (member) loadData()
  }, [member, periodId])

  async function loadData() {
    const { data: periodData } = await supabase
      .from('scheduling_periods').select('*').eq('id', periodId).single()

    const { data: shiftsData } = await supabase
      .from('shifts').select('*').eq('scheduling_period_id', periodId)
      .order('date').order('start_time')

    const shiftIds = (shiftsData || []).map((s: any) => s.id)
    let existingResponses: any[] = []
    if (shiftIds.length > 0) {
      const { data } = await supabase
        .from('availability_responses').select('*')
        .eq('employee_id', member!.user_id).in('shift_id', shiftIds)
      existingResponses = data || []
    }

    setPeriod(periodData)
    setShifts(shiftsData || [])
    const existing: Record<string, AvailStatus> = {}
    for (const r of existingResponses) existing[r.shift_id] = r.status as AvailStatus
    setResponses(existing)
    setLoading(false)
  }

  function toggleShift(shiftId: string, status: AvailStatus) {
    setResponses(r => ({ ...r, [shiftId]: r[shiftId] === status ? null : status }))
  }

  function markAllDay(day: string, status: AvailStatus) {
    const dayShifts = shifts.filter(s => s.date === day)
    setResponses(r => {
      const updated = { ...r }
      dayShifts.forEach(s => { updated[s.id] = status })
      return updated
    })
  }

  async function handleSubmit() {
    if (!member) return
    setSaving(true)
    const upserts = Object.entries(responses)
      .filter(([, status]) => status !== null)
      .map(([shiftId, status]) => ({
        shift_id: shiftId, employee_id: member.user_id,
        status: status!, submitted_at: new Date().toISOString(),
      }))
    const nulledIds = Object.entries(responses).filter(([, s]) => s === null).map(([id]) => id)
    if (nulledIds.length > 0) {
      await supabase.from('availability_responses').delete()
        .in('shift_id', nulledIds).eq('employee_id', member.user_id)
    }
    if (upserts.length > 0) {
      const { error } = await supabase.from('availability_responses')
        .upsert(upserts, { onConflict: 'shift_id,employee_id' })
      if (error) {
        toast({ title: 'Error saving', description: error.message, variant: 'destructive' })
        setSaving(false)
        return
      }
    }
    toast({ title: 'Availability saved!' })
    setSaving(false)
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-10 w-64 bg-slate-100 rounded" /><div className="h-64 bg-slate-100 rounded-xl" /></div>
  if (!period) return <div className="text-center py-20 text-slate-500">Schedule not found</div>

  if (period.status !== 'collecting') {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <XCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Availability is closed</h2>
        <p className="text-slate-500">{period.status === 'published' ? 'This schedule has been published.' : 'The manager has closed availability for this period.'}</p>
      </div>
    )
  }

  const days = getDaysInRange(period.start_date, period.end_date)
  const respondedCount = Object.values(responses).filter(s => s !== null).length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl p-5 text-white" style={{ backgroundColor: organization?.primary_color || '#2563EB' }}>
        {organization?.logo_url && <img src={organization.logo_url} alt={organization.name} className="h-8 mb-3 rounded" />}
        <div className="font-semibold text-lg">{period.name}</div>
        <div className="text-sm opacity-80 mt-0.5">{formatDate(period.start_date)} — {formatDate(period.end_date)} · {organization?.name}</div>
        <div className="mt-3 text-sm opacity-90">{respondedCount} of {shifts.length} shifts responded</div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        Mark each shift as <strong>Available</strong> or <strong>Unavailable</strong>. Use the day buttons to mark all shifts at once.
      </div>

      <div className="space-y-5">
        {days.map(day => {
          const dayShifts = shifts.filter(s => s.date === day)
          if (dayShifts.length === 0) return null
          return (
            <div key={day} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                <div className="font-semibold text-slate-900 text-sm">{formatDateFull(day)}</div>
                <div className="flex gap-1.5">
                  <button onClick={() => markAllDay(day, 'available')} className="text-xs px-2 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 font-medium">All available</button>
                  <button onClick={() => markAllDay(day, 'unavailable')} className="text-xs px-2 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 font-medium">All unavailable</button>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {dayShifts.map(shift => {
                  const status = responses[shift.id]
                  return (
                    <div key={shift.id} className="flex items-center justify-between px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: shift.color }} />
                        <div>
                          <div className="font-medium text-slate-900 text-sm">{shift.label}</div>
                          <div className="text-xs text-slate-500">{formatTime(shift.start_time)} – {formatTime(shift.end_time)}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toggleShift(shift.id, 'available')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all', status === 'available' ? 'bg-green-600 text-white shadow-sm' : 'bg-green-50 text-green-700 hover:bg-green-100')}>
                          <CheckCircle className="w-3.5 h-3.5" /><span className="hidden sm:inline">Available</span>
                        </button>
                        <button onClick={() => toggleShift(shift.id, 'unavailable')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all', status === 'unavailable' ? 'bg-red-600 text-white shadow-sm' : 'bg-red-50 text-red-700 hover:bg-red-100')}>
                          <XCircle className="w-3.5 h-3.5" /><span className="hidden sm:inline">Unavailable</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="sticky bottom-20 md:bottom-4">
        <Button onClick={handleSubmit} disabled={saving} className="w-full shadow-lg h-12 text-base font-semibold" style={{ backgroundColor: organization?.primary_color || '#2563EB' }}>
          {saving ? 'Saving...' : 'Save Availability'}
        </Button>
      </div>
    </div>
  )
}
