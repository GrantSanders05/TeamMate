"use client"

import { useMemo, useState } from "react"
import { Loader2, Wand2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

type AutoScheduleSummary = {
  period_id: string
  shifts_seen: number
  created_assignments: number
  unfilled_slots: number
  unfilled_shifts: number
}

export function AutoScheduleButton({
  periodId,
  onApplied,
  className = "",
}: {
  periodId: string
  onApplied?: () => Promise<void> | void
  className?: string
}) {
  const supabase = useMemo(() => createClient(), [])
  const [isRunning, setIsRunning] = useState(false)
  const [summary, setSummary] = useState<AutoScheduleSummary | null>(null)

  async function runAutoSchedule() {
    const confirmed = window.confirm(
      "Run auto schedule? This will fill open shift slots using employee availability and balanced load."
    )

    if (!confirmed) return

    try {
      setIsRunning(true)

      const { data, error } = await supabase.rpc("auto_assign_schedule_period", {
        target_period_id: periodId,
      })

      if (error) throw error

      const nextSummary = (data ?? null) as AutoScheduleSummary | null
      setSummary(nextSummary)

      if (onApplied) {
        await onApplied()
      }

      if (nextSummary) {
        alert(
          `Auto schedule complete.\n\nCreated assignments: ${nextSummary.created_assignments}\nUnfilled slots: ${nextSummary.unfilled_slots}\nShifts still short: ${nextSummary.unfilled_shifts}`
        )
      } else {
        alert("Auto schedule completed.")
      }
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Could not run auto schedule.")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={() => void runAutoSchedule()} disabled={isRunning}>
          {isRunning ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          {isRunning ? "Building Schedule..." : "Auto Fill Schedule"}
        </Button>

        {summary ? (
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
            {summary.created_assignments} assigned · {summary.unfilled_slots} open slot
            {summary.unfilled_slots === 1 ? "" : "s"} left
          </div>
        ) : null}
      </div>
    </div>
  )
}
