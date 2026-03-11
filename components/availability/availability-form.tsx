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
        .in(
          "shift_id",
          normalizedShifts.map((shift) => shift.id),
        )

      const mapped = ((responseData as AvailabilityRow[]) || []).reduce<Record<string, AvailabilityState>>(
        (acc, row) => {
          acc[row.shift_id] = {
            status: row.status === "all_day" ? "available" : row.status,
            notes: row.notes || "",
          }
          return acc
        },
        {},
      )

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

  function setDayStatus(dayShifts: Shift[], status: "available" | "unavailable") {
    setResponses((prev) => {
      const next = { ...prev }
      for (const shift of dayShifts) {
        next[shift.id] = {
          status,
          notes: prev[shift.id]?.notes || "",
        }
      }
      return next
    })
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
    return <div>Loading availability...</div>
  }

  if (!organization || !member) {
    return <div>No active organization selected.</div>
  }

  if (!period) {
    return <div>Schedule period not found.</div>
  }

  const locked = period.status !== "collecting"

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{period.name}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {formatDisplayDate(period.start_date)} – {formatDisplayDate(period.end_date)} · Status: {period.status}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Mark each shift as available or unavailable. You can now set a full day at once when a date has multiple shifts.
        </p>
      </div>

      {locked ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Availability is locked because this period is no longer in collecting status.
        </div>
      ) : null}

      {Object.keys(shiftsByDate).length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          No shifts have been added to this period yet.
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(shiftsByDate).map(([date, dayShifts]) => {
            const allAvailable = dayShifts.every(
              (shift) => (responses[shift.id] || { status: "", notes: "" }).status === "available",
            )
            const allUnavailable = dayShifts.every(
              (shift) => (responses[shift.id] || { status: "", notes: "" }).status === "unavailable",
            )

            return (
              <section key={date} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{formatDisplayDate(date)}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {dayShifts.length} shift{dayShifts.length === 1 ? "" : "s"} scheduled for this day.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setDayStatus(dayShifts, "available")}
                      disabled={locked}
                      className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                        allAvailable
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      Available all day
                    </button>
                    <button
                      type="button"
                      onClick={() => setDayStatus(dayShifts, "unavailable")}
                      disabled={locked}
                      className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                        allUnavailable
                          ? "border-rose-600 bg-rose-600 text-white"
                          : "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      Unavailable all day
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {dayShifts.map((shift) => {
                    const current = responses[shift.id] || { status: "", notes: "" }
                    const availableActive = current.status === "available"
                    const unavailableActive = current.status === "unavailable"

                    return (
                      <div key={shift.id} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900">{shift.label}</h3>
                            <p className="mt-1 text-sm text-slate-600">
                              {formatDisplayTimeRange(shift.start_time, shift.end_time)} · {shift.required_workers} worker{shift.required_workers === 1 ? "" : "s"} needed
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:min-w-[270px]">
                            <button
                              type="button"
                              onClick={() => setShiftStatus(shift.id, "available")}
                              disabled={locked}
                              className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                                availableActive
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                              } disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                              Available
                            </button>
                            <button
                              type="button"
                              onClick={() => setShiftStatus(shift.id, "unavailable")}
                              disabled={locked}
                              className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                                unavailableActive
                                  ? "border-rose-600 bg-rose-600 text-white"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                              } disabled:cursor-not-allowed disabled:opacity-60`}
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
            )
          })}
        </div>
      )}

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={() => void saveAvailability()} disabled={saving || locked} className="rounded-2xl px-5 shadow-lg">
          {saving ? "Saving..." : "Save Availability"}
        </Button>
      </div>
    </div>
  )
}
