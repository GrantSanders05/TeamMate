"use client"

import { ScheduleBuilder } from "@/components/schedule/schedule-builder"

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 bg-white">
        <h1 className="text-xl font-semibold">Schedule Builder</h1>
        <p className="text-sm text-gray-500">
          Assign shifts for the week and publish the schedule.
        </p>
      </div>

      <ScheduleBuilder />
    </div>
  )
}
