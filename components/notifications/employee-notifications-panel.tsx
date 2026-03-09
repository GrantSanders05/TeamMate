"use client"

type NotificationItem = {
  id: string
  title: string
  description: string
  created_at: string
  type: "schedule" | "drop" | "availability" | "general"
}

export function EmployeeNotificationsPanel({
  items,
}: {
  items: NotificationItem[]
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
      <p className="mt-2 text-sm text-slate-600">
        Important updates about schedules, availability, and shift requests.
      </p>

      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-5 text-sm text-slate-500">
            No notifications yet.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-900">{item.title}</div>
                  <div className="mt-1 text-sm text-slate-600">{item.description}</div>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {item.type}
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                {new Date(item.created_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
