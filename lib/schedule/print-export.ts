import { formatDateReadable, formatTimeRange } from "./time-format"

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

function escapeHtml(v: string) {
  return v
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
}

function getDates(start: string,end: string){
  const out=[]
  const cur=new Date(start+"T00:00:00")
  const last=new Date(end+"T00:00:00")
  while(cur<=last){
    out.push(cur.toISOString().slice(0,10))
    cur.setDate(cur.getDate()+1)
  }
  return out
}

export function openSchedulePrintWindow({
  title,
  subtitle,
  shifts,
  assignments,
  members,
  startDate,
  endDate
}:{
  title:string
  subtitle:string
  shifts:ExportShift[]
  assignments:ExportAssignment[]
  members:ExportMember[]
  startDate:string
  endDate:string
}){

  const dates=getDates(startDate,endDate)

  const shiftsByDate={}
  shifts.forEach(s=>{
    if(!shiftsByDate[s.date])shiftsByDate[s.date]=[]
    shiftsByDate[s.date].push(s)
  })

  const assignedNames=(shiftId:string)=>{
    return assignments
      .filter(a=>a.shift_id===shiftId && a.status!=="dropped")
      .map(a=>{
        const m=members.find(x=>x.user_id===a.employee_id)
        return m?.display_name || a.manual_name || "Assigned"
      })
  }

  const html=`
  <!doctype html>
  <html>
  <head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(title)}</title>

  <style>

  body{
    font-family:Arial, sans-serif;
    margin:20px;
    color:#0f172a;
  }

  h1{margin:0;font-size:26px}
  .subtitle{margin-top:6px;color:#64748b;font-size:14px}

  .calendar{
    display:grid;
    grid-template-columns:repeat(7,1fr);
    gap:12px;
    margin-top:24px;
  }

  .day{
    border:1px solid #cbd5e1;
    border-radius:10px;
    padding:10px;
    background:#f8fafc;
    min-height:140px;
  }

  .date{
    font-weight:700;
    font-size:13px;
    margin-bottom:8px;
  }

  .shift{
    border:1px solid #e2e8f0;
    border-left:4px solid #3b82f6;
    border-radius:8px;
    padding:6px 8px;
    margin-bottom:6px;
    background:#fff;
  }

  .shift-title{
    font-size:12px;
    font-weight:700;
  }

  .shift-time{
    font-size:11px;
    color:#475569;
  }

  .shift-workers{
    font-size:11px;
    margin-top:3px;
    color:#334155;
  }

  @media print{
    body{margin:10px}
  }

  </style>
  </head>

  <body>

  <h1>${escapeHtml(title)}</h1>
  <div class="subtitle">${escapeHtml(subtitle)}</div>

  <div class="calendar">

  ${dates.map(d=>{

    const dayShifts=shiftsByDate[d]||[]

    return `
    <div class="day">
      <div class="date">${formatDateReadable(d)}</div>

      ${dayShifts.length===0
        ? '<div style="font-size:11px;color:#94a3b8">No shifts</div>'
        : dayShifts.map(s=>{

            const names=assignedNames(s.id)

            return `
            <div class="shift">
              <div class="shift-title">${escapeHtml(s.label)}</div>
              <div class="shift-time">${formatTimeRange(s.start_time,s.end_time)}</div>
              <div class="shift-workers">${names.join(", ")}</div>
            </div>
            `

        }).join("")
      }

    </div>
    `

  }).join("")}

  </div>

  </body>
  </html>
  `

  const w=window.open("","_blank","width=1200,height=900")
  if(!w)return

  w.document.open()
  w.document.write(html)
  w.document.close()

  setTimeout(()=>{
    w.print()
  },300)

}
