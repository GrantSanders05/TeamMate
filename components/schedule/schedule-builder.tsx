
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

  async function load() {
    if(!organization) return

    const { data:emps } = await supabase
      .from("employees")
      .select("*")
      .eq("organization_id",organization.id)

    const { data:types } = await supabase
      .from("shift_types")
      .select("*")
      .eq("organization_id",organization.id)

    setEmployees(emps || [])
    setShiftTypes(types || [])
  }

  useEffect(()=>{ load() },[organization])

  function assign(day,employee,shift){
    const key = day+"-"+employee
    setSchedule(prev => ({
      ...prev,
      [key]: shift
    }))
  }

  async function publish(){
    if(!organization) return

    const rows = Object.entries(schedule).map(([k,v])=>{
      const [day,employee] = k.split("-")
      return {
        organization_id: organization.id,
        employee_id: employee,
        shift_type_id: v,
        day
      }
    })

    if(rows.length===0) return

    await supabase.from("schedule_shifts").insert(rows)
    alert("Schedule published")
  }

  return (
    <div className="border rounded-lg p-6 space-y-6 bg-white">
      <h2 className="text-lg font-semibold">Schedule Builder</h2>

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
                {shiftTypes.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
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
