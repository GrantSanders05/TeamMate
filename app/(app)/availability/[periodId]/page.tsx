"use client"

import { AvailabilityForm } from "@/components/availability/availability-form"

export default function AvailabilityPeriodPage({
  params,
}: {
  params: { periodId: string }
}) {
  return <AvailabilityForm periodId={params.periodId} />
}
