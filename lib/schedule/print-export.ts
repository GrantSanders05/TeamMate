export type ExportShift = {
  id: string
  date: string
  label: string
  start_time: string
  end_time: string
  required_workers: number
  color?: string | null
}

export type ExportAssignment = {
  id: string
  shift_id: string
  employee_id: string | null
  manual_name: string | null
  status: string
}

export type ExportMember = {
  id: string
  user_id: string
  display_name: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function openSchedulePrintWindow({
  title,
  subtitle,
  shifts,
  assignments,
  members,
}: {
  title: string
  subtitle: string
  shifts: ExportShift[]
  assignments: ExportAssignment[]
  members: ExportMember[]
}) {
  if (typeof window === "undefined") return

  const grouped = shifts.reduce<Record<string, ExportShift[]>>((acc, shift) => {
    if (!acc[shift.date]) acc[shift.date] = []
    acc[shift.date].push(shift)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort()

  const getAssignedNames = (shiftId: string) => {
    const currentAssignments = assignments.filter(
      (assignment) => assignment.shift_id === shiftId && assignment.status !== "dropped"
    )

    return currentAssignments.map((assignment) => {
      const member = members.find((person) => person.user_id === assignment.employee_id)
      return member?.display_name || assignment.manual_name || "Assigned"
    })
  }

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 24px;
            color: #0f172a;
          }
          h1 {
            margin: 0;
            font-size: 28px;
          }
          .subtitle {
            margin-top: 8px;
            color: #475569;
            font-size: 14px;
          }
          .date-block {
            margin-top: 24px;
            page-break-inside: avoid;
          }
          .date-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 12px;
          }
          .shift {
            border: 1px solid #cbd5e1;
            border-left: 6px solid #3b82f6;
            border-radius: 10px;
            padding: 12px;
            margin-bottom: 12px;
          }
          .shift-title {
            font-weight: 700;
            font-size: 15px;
          }
          .shift-meta {
            margin-top: 4px;
            color: #475569;
            font-size: 13px;
          }
          .assigned {
            margin-top: 10px;
            font-size: 13px;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 999px;
            background: #e2e8f0;
            margin-right: 6px;
            margin-top: 6px;
          }
          @media print {
            body {
              margin: 14px;
            }
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="subtitle">${escapeHtml(subtitle)}</div>

        ${sortedDates.map((date) => `
          <div class="date-block">
            <div class="date-title">${escapeHtml(date)}</div>

            ${(grouped[date] || []).map((shift) => {
              const names = getAssignedNames(shift.id)
              return `
                <div class="shift" style="border-left-color:${escapeHtml(shift.color || "#3B82F6")}">
                  <div class="shift-title">${escapeHtml(shift.label)}</div>
                  <div class="shift-meta">
                    ${escapeHtml(shift.start_time)} - ${escapeHtml(shift.end_time)} · ${shift.required_workers} worker(s)
                  </div>
                  <div class="assigned">
                    ${names.length === 0 ? "No one assigned." : names.map((name) => `<span class="badge">${escapeHtml(name)}</span>`).join("")}
                  </div>
                </div>
              `
            }).join("")}
          </div>
        `).join("")}
      </body>
    </html>
  `

  const printWindow = window.open("", "_blank", "width=1100,height=850")
  if (!printWindow) return

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
  }, 300)
}
