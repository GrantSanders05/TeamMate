import { HistoryDetailPage } from "@/components/history/history-detail-page"

export default function ArchiveDetailRoute({
  params,
}: {
  params: { archiveId: string }
}) {
  return <HistoryDetailPage archiveId={params.archiveId} />
}
