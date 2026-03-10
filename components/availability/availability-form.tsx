"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { formatDisplayDate, formatDisplayTimeRange } from "@/lib/date-format"

type Period = {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
}

type Shift = {
  id: string
  date: string
  label: string
  start_time: string
  end_time: string
  required_workers: number
}

type AvailabilityRow = {
  id: string
  shift_id: string
  employee_id: string
  status: "available" | "unavailable" | "all_day"
  notes: string | null
}

type AvailabilityState = {
  status: "" | "available" | "unavailable"
  notes: string
}

export function AvailabilityForm({ periodId }: { periodId: string }) {
  const supabase = createClient()
  const { organization, member, isLoading } = useOrgSafe()
  const [period, setPeriod] = useState<Period | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [responses, setResponses] = useState<Record<string, AvailabilityState>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  async function loadData() {
    if (!organization || !member) {
      setLoading(false)
      return
    }

    setLoading(true)

    const [{ data: periodData }, { data: shiftData }] = await Promise.all([
      supabase
        .from("scheduling_periods")
        .select("id, name, start_date, end_date, status")
        .eq("id", periodId)
        .single(),
      supabase
        .from("shifts")
        .select("id, date, label, start_time, end_time, required_workers")
        .eq("scheduling_period_id", periodId)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true }),
    ])

    const normalizedShifts = (shiftData as Shift[]) || []
    setPeriod((periodData as Period) || null)
    setShifts(normalizedShifts)

    if (member.user_id && normalizedShifts.length > 0) {
      const { data: responseData } = await supabase
        .from("availability_responses")
        .select("id, shift_id, employee_id, status, notes")
        .eq("employee_id", member.user_id)
        .in("shift_id", normalizedShifts.map((shift) => shift.id))

      const mapped = ((responseData as AvailabilityRow[]) || []).reduce<Record<string, AvailabilityState>>((acc, row) => {
        acc[row.shift_id] = {
          status: row.status === "all_day" ? "available" : row.status,
          notes: row.notes || "",
        }
        return acc
      }, {})

      setResponses(mapped)
    } else {
      setResponses({})
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [organization?.id, member?.user_id, periodId])

  const shiftsByDate = useMemo(() => {
    return shifts.reduce<Record<string, Shift[]>>((acc, shift) => {
      if (!acc[shift.date]) acc[shift.date] = []
      acc[shift.date].push(shift)
      return acc
    }, {})
  }, [shifts])

  function setShiftStatus(shiftId: string, status: "" | "available" | "unavailable") {
    setResponses((prev) => ({
      ...prev,
      [shiftId]: {
        status,
        notes: prev[shiftId]?.notes || "",
      },
    }))
  }

  function setShiftNotes(shiftId: string, notes: string) {
    setResponses((prev) => ({
      ...prev,
      [shiftId]: {
        status: prev[shiftId]?.status || "",
        notes,
      },
    }))
  }

  async function saveAvailability() {
    if (!member?.user_id || !period) return

    if (period.status !== "collecting") {
      alert("Availability is currently locked for this schedule period.")
      return
    }

    setSaving(true)

    const rows = Object.entries(responses)
      .filter(([, value]) => value.status)
      .map(([shiftId, value]) => ({
        shift_id: shiftId,
        employee_id: member.user_id,
        status: value.status,
        notes: value.notes || null,
      }))

    if (rows.length > 0) {
      const { error } = await supabase
        .from("availability_responses")
        .upsert(rows, { onConflict: "shift_id,employee_id" })

      if (error) {
        setSaving(false)
        alert(error.message)
        return
      }
    }

    setSaving(false)
    alert("Availability saved.")
    await loadData()
  }

  if (isLoading || loading) {
    return <div className="section-card text-sm text-slate-600">Loading availability...</div>
  }

  if (!organization || !member) {
    return <div className="section-card text-sm text-slate-600">No active organization selected.</div>
  }

  if (!period) {
    return <div className="section-card text-sm text-slate-600">Schedule period not found.</div>
  }

  const locked = period.status !== "collecting"

  return (
    <div className="space-y-6">
      <div className="section-card">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">{period.name}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {formatDisplayDate(period.start_date)} – {formatDisplayDate(period.end_date)} · Status: {period.status}
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Mark each shift as available or unavailable. Times now use a 12-hour clock for easier scanning.
        </p>
      </div>

      {locked ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Availability is locked because this period is no longer in collecting status.
        </div>
      ) : null}

      {Object.keys(shiftsByDate).length === 0 ? (
        <div className="section-card text-sm text-slate-600">No shifts have been added to this period yet.</div>
      ) : (
        <div className="space-y-5">
          {Object.entries(shiftsByDate).map(([date, dayShifts]) => (
            <section key={date} className="section-card space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-xl font-semibold text-slate-950">{formatDisplayDate(date)}</h2>
              </div>

              <div className="space-y-4">
                {dayShifts.map((shift) => {
                  const current = responses[shift.id] || { status: "", notes: "" }
                  const availableActive = current.status === "available"
                  const unavailableActive = current.status === "unavailable"

                  return (
                    <div key={shift.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-950">{shift.label}</h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {formatDisplayTimeRange(shift.start_time, shift.end_time)} · {shift.required_workers} worker{shift.required_workers === 1 ? "" : "s"} needed
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setShiftStatus(shift.id, "available")}
                            disabled={locked}
                            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                              availableActive
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            Available
                          </button>
                          <button
                            type="button"
                            onClick={() => setShiftStatus(shift.id, "unavailable")}
                            disabled={locked}
                            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                              unavailableActive
                                ? "border-rose-600 bg-rose-600 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            Unavailable
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Textarea
                          value={current.notes}
                          onChange={(event) => setShiftNotes(shift.id, event.target.value)}
                          placeholder="Optional note"
                          className="min-h-[96px] rounded-2xl bg-white"
                          disabled={locked}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={() => void saveAvailability()} disabled={saving || locked} className="rounded-2xl px-5">
          {saving ? "Saving..." : "Save Availability"}
        </Button>
      </div>
    </div>
  )
}
