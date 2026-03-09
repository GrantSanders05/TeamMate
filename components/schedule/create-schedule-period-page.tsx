"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

function createToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function addDays(dateString: string, days: number) {
  const date = new Date(dateString + "T00:00:00")
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function CreateSchedulePeriodPage() {
  const supabase = createClient()
  const router = useRouter()
  const { organization, isManager } = useOrgSafe()

  const [name, setName] = useState("")
  const [periodType, setPeriodType] = useState("weekly")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!organization || !isManager) return

    const resolvedEndDate =
      endDate || (periodType === "weekly" ? addDays(startDate, 6) : addDays(startDate, 29))

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from("scheduling_periods")
      .insert({
        organization_id: organization.id,
        name,
        start_date: startDate,
        end_date: resolvedEndDate,
        period_type: periodType,
        status: "draft",
        availability_link_token: createToken(),
        created_by: user?.id || null,
      })
      .select("id")
      .single()

    setLoading(false)

    if (error || !data) {
      alert(error?.message || "Could not create schedule period.")
      return
    }

    router.push(`/schedule/${data.id}`)
    router.refresh()
  }

  if (!organization) {
    return <div className="rounded-lg border bg-white p-6">No organization selected.</div>
  }

  if (!isManager) {
    return <div className="rounded-lg border bg-white p-6">Only managers can create schedules.</div>
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <h1 className="text-2xl font-semibold">Create New Schedule</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create a scheduling period, then add shifts and assignments.
        </p>
      </div>

      <form className="rounded-lg border bg-white p-6 space-y-4" onSubmit={handleCreate}>
        <div>
          <Label htmlFor="name">Period name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Week of September 9"
            required
          />
        </div>

        <div>
          <Label htmlFor="periodType">Period type</Label>
          <select
            id="periodType"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value)}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="startDate">Start date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="endDate">End date (optional)</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <Button type="submit" disabled={loading || !startDate || !name}>
          {loading ? "Creating..." : "Create Schedule Period"}
        </Button>
      </form>
    </div>
  )
}
