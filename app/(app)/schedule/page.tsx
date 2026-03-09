
"use client"

import { useEffect } from "react"
import { ScheduleBuilder } from "@/components/schedule/schedule-builder"

export default function SchedulePage() {

  useEffect(()=>{
    console.log("Schedule route loaded")
  },[])

  return (
    <div className="space-y-6">

      <div className="border rounded-lg p-4 bg-white">
        <h1 className="text-xl font-semibold">Schedule Builder</h1>
        <p className="text-sm text-gray-500">
          Assign shifts for employees and publish the weekly schedule.
        </p>
      </div>

      <ScheduleBuilder />

    </div>
  )
}
