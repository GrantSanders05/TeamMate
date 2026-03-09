"use client"

import { SchedulePeriodBuilder } from "@/components/schedule/schedule-period-builder"

export default function SchedulePeriodPage({
  params,
}: {
  params: { periodId: string }
}) {
  return <SchedulePeriodBuilder periodId={params.periodId} />
}
