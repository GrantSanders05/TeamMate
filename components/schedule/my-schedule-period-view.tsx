"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { PageShell } from "@/components/shared/page-shell"
import { SectionCard } from "@/components/shared/section-card"

type ShiftCard = {
  id: string
  date: string
  label: string
  start_time: string
  end_time: string
}

function formatTimeRange(start: string, end: string) {
  const normalize = (value: string) => {
    const [hourRaw, minute = "00"] = value.split(":")
    const hourNum = Number(hourRaw)
    const suffix = hourNum >= 12 ? "PM" : "AM"
    const twelveHour = hourNum % 12 || 12
    return `${twelveHour}:${minute.slice(0, 2)} ${suffix}`
  }

  return `${normalize(start)} – ${normalize(end)}`
}

export default function MySchedulePeriodView({
  periodId,
}: {
  periodId: string
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [periodName, setPeriodName] = useState("Schedule")
  const [shifts, setShifts] = useState<ShiftCard[]>([])

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)

      const { data: periodData, error: periodError } = await supabase
        .from("scheduling_periods")
        .select("id, name")
        .eq("id", periodId)
        .maybeSingle()

      if (periodError) {
        if (mounted) {
          setError(periodError.message)
          setLoading(false)
        }
        return
      }

      const { data: shiftData, error: shiftError } = await supabase
        .from("shifts")
        .select("id, date, label, start_time, end_time")
        .eq("scheduling_period_id", periodId)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })

      if (!mounted) return

      if (shiftError) {
        setError(shiftError.message)
      } else {
        setPeriodName(periodData?.name || "Schedule")
        setShifts((shiftData || []) as ShiftCard[])
      }

      setLoading(false)
    }

    void load()
    return () => {
      mounted = false
    }
  }, [periodId, supabase])

  const grouped = useMemo(() => {
    const map = new Map<string, ShiftCard[]>()

    for (const shift of shifts) {
      const existing = map.get(shift.date) || []
      existing.push(shift)
      map.set(shift.date, existing)
    }

    return Array.from(map.entries()).map(([date, dayShifts]) => ({
      date,
      shifts: dayShifts,
    }))
  }, [shifts])

  return (
    <PageShell
      title={periodName}
      subtitle="Published schedule"
    >
      <SectionCard>
        {loading ? (
          <p className="text-sm text-slate-500">Loading schedule…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : grouped.length === 0 ? (
          <p className="text-sm text-slate-500">No shifts found for this schedule yet.</p>
        ) : (
          <div className="space-y-4">
            {grouped.map((day) => (
              <div key={day.date} className="rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900">{day.date}</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {day.shifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="font-medium text-slate-900">{shift.label}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatTimeRange(shift.start_time, shift.end_time)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </PageShell>
  )
}
