export type ShiftLite = {
  id: string
  date: string
  start_time: string
  end_time: string
  required_workers: number
}

export type AssignmentLite = {
  shift_id: string
  employee_id: string | null
  status: string
}

export type EmployeeLite = {
  user_id: string
  display_name: string
}

export type AvailabilityLite = {
  shift_id: string
  employee_id: string
  status: "available" | "unavailable" | "all_day"
}

export type EmployeeLoadSummary = {
  user_id: string
  display_name: string
  shiftCount: number
  hours: number
}

function shiftHours(startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(":").map(Number)
  const [eh, em] = endTime.split(":").map(Number)
  let start = sh * 60 + sm
  let end = eh * 60 + em
  if (end <= start) end += 24 * 60
  return (end - start) / 60
}

export function computeEmployeeLoads(
  employees: EmployeeLite[],
  shifts: ShiftLite[],
  assignments: AssignmentLite[]
): EmployeeLoadSummary[] {
  const shiftMap = new Map(shifts.map((shift) => [shift.id, shift]))
  const loadMap = new Map(
    employees.map((employee) => [
      employee.user_id,
      {
        user_id: employee.user_id,
        display_name: employee.display_name,
        shiftCount: 0,
        hours: 0,
      },
    ])
  )

  for (const assignment of assignments) {
    if (!assignment.employee_id || assignment.status === "dropped") continue
    const load = loadMap.get(assignment.employee_id)
    const shift = shiftMap.get(assignment.shift_id)
    if (!load || !shift) continue
    load.shiftCount += 1
    load.hours += shiftHours(shift.start_time, shift.end_time)
  }

  return Array.from(loadMap.values()).sort((a, b) => {
    if (a.hours !== b.hours) return a.hours - b.hours
    return a.shiftCount - b.shiftCount
  })
}

export function recommendEmployeesForShift({
  shiftId,
  employees,
  shifts,
  assignments,
  availability,
  limit = 5,
}: {
  shiftId: string
  employees: EmployeeLite[]
  shifts: ShiftLite[]
  assignments: AssignmentLite[]
  availability: AvailabilityLite[]
  limit?: number
}) {
  const availableIds = new Set(
    availability
      .filter((item) => item.shift_id === shiftId && (item.status === "available" || item.status === "all_day"))
      .map((item) => item.employee_id)
  )

  const loads = computeEmployeeLoads(employees, shifts, assignments)

  return loads.filter((employee) => availableIds.has(employee.user_id)).slice(0, limit)
}
