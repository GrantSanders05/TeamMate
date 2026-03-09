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

function getDatesInRange(start: string, end: string) {
  const results: string[] = []
  const current = new Date(start + "T00:00:00")
  const last = new Date(end + "T00:00:00")

  while (current <= last) {
    results.push(current.toISOString().slice(0, 10))
    current.setDate(current.getDate() + 1)
  }

  return results
}

function weekdayLabel(dateString: string) {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const date = new Date(dateString + "T00:00:00")
  return labels[date.getDay()]
}

export function openSchedulePrintWindow({
  title,
  subtitle,
  shifts,
  assignments,
  members,
  startDate,
  endDate,
}: {
  title: string
  subtitle: string
  shifts: ExportShift[]
  assignments: ExportAssignment[]
  members: ExportMember[]
  startDate: string
  endDate: string
}) {
  if (typeof window === "undefined") return

  const dates = getDatesInRange(startDate, endDate)
  const grouped = shifts.reduce<Record<string, ExportShift[]>>((acc, shift) => {
    if (!acc[shift.date]) acc[shift.date] = []
    acc[shift.date].push(shift)
    return acc
  }, {})

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
            background: #ffffff;
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
          .section-title {
            margin-top: 28px;
            margin-bottom: 12px;
            font-size: 18px;
            font-weight: 700;
          }
          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap: 12px;
            align-items: start;
          }
          .day-column {
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            background: #f8fafc;
            padding: 12px;
            min-height: 120px;
          }
          .day-head {
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .day-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: .08em;
            color: #64748b;
            font-weight: 700;
          }
          .day-date {
            margin-top: 4px;
            font-size: 14px;
            font-weight: 700;
          }
          .shift-card {
            border: 1px solid #cbd5e1;
            border-left: 6px solid #3b82f6;
            border-radius: 10px;
            background: #fff;
            padding: 10px;
            margin-bottom: 10px;
            page-break-inside: avoid;
          }
          .shift-title {
            font-weight: 700;
            font-size: 14px;
          }
          .shift-meta {
            margin-top: 4px;
            color: #475569;
            font-size: 12px;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 999px;
            background: #e2e8f0;
            margin-right: 6px;
            margin-top: 6px;
            font-size: 12px;
          }
          .simple-date-block {
            margin-top: 18px;
            page-break-inside: avoid;
          }
          .simple-date-title {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 10px;
          }
          .simple-shift {
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 10px 12px;
            margin-bottom: 10px;
          }
          .muted {
            color: #64748b;
            font-size: 12px;
          }
          @media print {
            body {
              margin: 14px;
            }
            .calendar-grid {
              gap: 8px;
            }
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="subtitle">${escapeHtml(subtitle)}</div>

        <div class="section-title">Calendar View</div>
        <div class="calendar-grid">
          ${dates.map((date) => `
            <div class="day-column">
              <div class="day-head">
                <div class="day-label">${escapeHtml(weekdayLabel(date))}</div>
                <div class="day-date">${escapeHtml(date)}</div>
              </div>

              ${(grouped[date] || []).length === 0 ? `
                <div class="muted">No shifts</div>
              ` : (grouped[date] || []).map((shift) => {
                const names = getAssignedNames(shift.id)
                return `
                  <div class="shift-card" style="border-left-color:${escapeHtml(shift.color || "#3B82F6")}">
                    <div class="shift-title">${escapeHtml(shift.label)}</div>
                    <div class="shift-meta">${escapeHtml(shift.start_time)} - ${escapeHtml(shift.end_time)} · ${shift.required_workers} worker(s)</div>
                    <div class="shift-meta">
                      ${names.length === 0 ? "No one assigned." : names.map((name) => `<span class="badge">${escapeHtml(name)}</span>`).join("")}
                    </div>
                  </div>
                `
              }).join("")}
            </div>
          `).join("")}
        </div>

        <div class="section-title">Simple Shareable View</div>
        ${dates.map((date) => `
          <div class="simple-date-block">
            <div class="simple-date-title">${escapeHtml(weekdayLabel(date))} · ${escapeHtml(date)}</div>
            ${(grouped[date] || []).length === 0 ? `
              <div class="muted">No shifts</div>
            ` : (grouped[date] || []).map((shift) => {
              const names = getAssignedNames(shift.id)
              return `
                <div class="simple-shift">
                  <div class="shift-title">${escapeHtml(shift.label)}</div>
                  <div class="shift-meta">${escapeHtml(shift.start_time)} - ${escapeHtml(shift.end_time)} · ${shift.required_workers} worker(s)</div>
                  <div class="shift-meta">
                    <strong>Assigned:</strong> ${names.length === 0 ? "No one assigned." : names.map((name) => escapeHtml(name)).join(", ")}
                  </div>
                </div>
              `
            }).join("")}
          </div>
        `).join("")}
      </body>
    </html>
  `

  const printWindow = window.open("", "_blank", "width=1300,height=900")
  if (!printWindow) return

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
  }, 300)
}
