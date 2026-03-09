"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]

export function ScheduleBuilder() {

  const supabase = createClient()
  const { organization } = useOrgSafe()

  const [employees,setEmployees] = useState([])
  const [shiftTypes,setShiftTypes] = useState([])
  const [schedule,setSchedule] = useState({})

  async function load(){

    if(!organization) return

    const { data: emp } = await supabase
      .from("employees")
      .select("*")
      .eq("organization_id", organization.id)

    const { data: types } = await supabase
      .from("shift_types")
      .select("*")
      .eq("organization_id", organization.id)

    setEmployees(emp || [])
    setShiftTypes(types || [])
  }

  useEffect(()=>{
    load()
  },[organization])

  function assign(day, employee, shift){
    const key = `${day}-${employee}`

    setSchedule(prev=>({
      ...prev,
      [key]: shift
    }))
  }

  async function publish(){

    if(!organization) return

    const rows = Object.entries(schedule).map(([key,value])=>{
      const [day,employee] = key.split("-")

      return {
        organization_id: organization.id,
        employee_id: employee,
        shift_type_id: value,
        day
      }
    })

    if(rows.length === 0){
      alert("No shifts assigned")
      return
    }

    await supabase.from("schedule_shifts").insert(rows)

    alert("Schedule Published")
  }

  if(employees.length === 0){
    return (
      <div className="border p-4 rounded bg-white">
        No employees found. Add employees first before creating a schedule.
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-6 bg-white space-y-6">

      {employees.map(emp => (
        <div key={emp.id} className="border p-3 rounded space-y-2">

          <div className="font-medium">{emp.name}</div>

          <div className="grid grid-cols-7 gap-2">
            {days.map(day => (
              <select
                key={day}
                className="border rounded p-1 text-sm"
                onChange={(e)=>assign(day,emp.id,e.target.value)}
              >
                <option value="">Off</option>

                {shiftTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}

              </select>
            ))}
          </div>

        </div>
      ))}

      <Button onClick={publish}>
        Publish Schedule
      </Button>

    </div>
  )
}
