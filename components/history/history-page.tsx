"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { formatDateReadable } from "@/lib/schedule/time-format"

type ArchiveRow = {
  id: string
  scheduling_period_id: string
  organization_id: string
  archived_at: string
  snapshot_data: {
    period?: {
      id: string
      name: string
      start_date: string
      end_date: string
      status: string
    }
  } | null
}

export function HistoryPage() {
  const supabase = createClient()
  const { organization, isManager } = useOrgSafe()

  const [archives, setArchives] = useState<ArchiveRow[]>([])
  const [loading, setLoading] = useState(true)

  async function loadArchives() {
    if (!organization) {
      setArchives([])
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from("schedule_archives")
      .select("id, scheduling_period_id, organization_id, archived_at, snapshot_data")
      .eq("organization_id", organization.id)
      .order("archived_at", { ascending: false })

    if (error) {
      console.error("Failed to load archives", error)
      setArchives([])
      setLoading(false)
      return
    }

    setArchives((data as ArchiveRow[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    void loadArchives()
  }, [organization?.id])

  async function deleteArchive(archiveId: string) {
    const confirmed = window.confirm("Delete this archive permanently?")
    if (!confirmed) return

    const { error } = await supabase
      .from("schedule_archives")
      .delete()
      .eq("id", archiveId)

    if (error) {
      alert(error.message)
      return
    }

    await loadArchives()
  }

  if (!organization) {
    return <div className="rounded-lg border bg-white p-6">No organization selected.</div>
  }

  if (!isManager) {
    return <div className="rounded-lg border bg-white p-6">Only managers can view schedule history.</div>
  }

  if (loading) {
    return <div className="rounded-lg border bg-white p-6">Loading history...</div>
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <h1 className="text-2xl font-semibold">Schedule History</h1>
        <p className="mt-2 text-sm text-slate-600">
          Archived schedule periods live here so you can review older schedules any time.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        {archives.length === 0 ? (
          <div className="text-sm text-slate-600">
            No archived schedule periods yet. Publish a schedule and archive it from the schedule builder.
          </div>
        ) : (
          <div className="space-y-3">
            {archives.map((archive) => {
              const period = archive.snapshot_data?.period
              return (
                <div
                  key={archive.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="font-medium text-slate-900">
                      {period?.name || "Archived Schedule"}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {period?.start_date ? formatDateReadable(period.start_date) : "Unknown"}{" "}
                      {period?.end_date ? `– ${formatDateReadable(period.end_date)}` : ""}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Archived: {new Date(archive.archived_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                      <Link href={`/history/${archive.id}`}>View</Link>
                    </Button>
                    <Button variant="destructive" onClick={() => void deleteArchive(archive.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
