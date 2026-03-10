"use client"

import MySchedulePeriodView from "@/components/schedule/my-schedule-period-view"

export default function MySchedulePeriodPage({
  params,
}: {
  params: { periodId: string }
}) {
  return <MySchedulePeriodView periodId={params.periodId} />
}
