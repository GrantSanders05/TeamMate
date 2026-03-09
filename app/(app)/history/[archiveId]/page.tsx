"use client"

import { HistoryDetailPage } from "@/components/history/history-detail-page"

export default function ArchiveDetailPage({
  params,
}: {
  params: { archiveId: string }
}) {
  return <HistoryDetailPage archiveId={params.archiveId} />
}
