
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]

export function AvailabilityManager(){

  const supabase = createClient()
  const { organization } = useOrgSafe()

  const [availability,setAvailability] = useState({})

  function toggle(day){
    setAvailability(prev=>({
      ...prev,
      [day]: !prev[day]
    }))
  }

  async function save(){
    if(!organization) return

    const rows = Object.entries(availability).map(([day,val])=>({
      organization_id: organization.id,
      day,
      available: val
    }))

    await supabase.from("employee_availability").upsert(rows)
    alert("Availability saved")
  }

  return (
    <div className="border rounded-lg p-6 space-y-4 bg-white">
      <h2 className="text-lg font-semibold">Weekly Availability</h2>

      <div className="grid grid-cols-7 gap-2">
        {days.map(day => (
          <Button
            key={day}
            variant={availability[day] ? "default" : "outline"}
            onClick={()=>toggle(day)}
          >
            {day}
          </Button>
        ))}
      </div>

      <Button onClick={save}>
        Save Availability
      </Button>
    </div>
  )
}
