"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/shared/page-shell"
import { SectionCard } from "@/components/shared/section-card"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { formatDateReadable } from "@/lib/schedule/time-format"

type ArchiveSnapshotPeriod = {
  id?: string
  name?: string
  start_date?: string
  end_date?: string
  status?: string
}

type ArchiveRow = {
  id: string
  scheduling_period_id: string
  organization_id: string
  archived_at: string
  snapshot_data: {
    period?: ArchiveSnapshotPeriod
  } | null
}

function archivedWindowLabel(period?: ArchiveSnapshotPeriod) {
  if (!period?.start_date) return "Unknown date range"
  if (!period?.end_date) return formatDateReadable(period.start_date)
  return `${formatDateReadable(period.start_date)} – ${formatDateReadable(period.end_date)}`
}

export function HistoryPage() {
  const supabase = createClient()
  const { organization, isManager } = useOrgSafe()

  const [archives, setArchives] = useState<ArchiveRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

    setArchives((data as ArchiveRow[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void loadArchives()
  }, [organization?.id])

  async function deleteArchive(archive: ArchiveRow) {
    if (!organization || !isManager) return

    const periodName = archive.snapshot_data?.period?.name || "this archived schedule"
    const confirmed = window.confirm(
      `Delete ${periodName}? This permanently removes the archived snapshot.`
    )

    if (!confirmed) return

    try {
      setDeletingId(archive.id)

      const { error } = await supabase
        .from("schedule_archives")
        .delete()
        .eq("id", archive.id)
        .eq("organization_id", organization.id)

      if (error) {
        throw error
      }

      setArchives((current) => current.filter((item) => item.id !== archive.id))
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not delete the archive.")
    } finally {
      setDeletingId(null)
    }
  }

  if (!organization) {
    return (
      <PageShell title="Schedule History" subtitle="Archived schedules appear here once they are moved out of active scheduling.">
        <SectionCard>
          <p className="text-sm text-slate-600">No organization selected.</p>
        </SectionCard>
      </PageShell>
    )
  }

  if (!isManager) {
    return (
      <PageShell title="Schedule History" subtitle="Archived schedules appear here once they are moved out of active scheduling.">
        <SectionCard>
          <p className="text-sm text-slate-600">Only managers can manage archived schedules.</p>
        </SectionCard>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Schedule History"
      subtitle="View and clean up archived schedules without mixing them into active scheduling."
    >
      <SectionCard>
        {loading ? (
          <p className="text-sm text-slate-600">Loading history...</p>
        ) : archives.length === 0 ? (
          <p className="text-sm text-slate-600">
            No archived schedule periods yet. Archive a finished schedule and it will show up here.
          </p>
        ) : (
          <div className="space-y-4">
            {archives.map((archive) => {
              const period = archive.snapshot_data?.period

              return (
                <div
                  key={archive.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                        Archived
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {period?.name || "Archived Schedule"}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {archivedWindowLabel(period)}
                        </p>
                      </div>

                      <p className="text-xs text-slate-500">
                        Archived on {new Date(archive.archived_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline">
                        <Link href={`/history/${archive.id}`}>View archive</Link>
                      </Button>

                      <Button
                        variant="destructive"
                        onClick={() => void deleteArchive(archive)}
                        disabled={deletingId === archive.id}
                      >
                        {deletingId === archive.id ? "Deleting..." : "Delete archive"}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>
    </PageShell>
  )
}
