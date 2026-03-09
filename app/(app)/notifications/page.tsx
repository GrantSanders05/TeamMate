"use client"

import { useEffect, useState } from "react"
import { EmployeeNotificationsPanel } from "@/components/notifications/employee-notifications-panel"
import { PageShell } from "@/components/shared/page-shell"

type NotificationItem = {
  id: string
  title: string
  description: string
  created_at: string
  type: "schedule" | "drop" | "availability" | "general"
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const seeded: NotificationItem[] = [
      {
        id: "1",
        title: "Schedule published",
        description: "A new published schedule is ready for your team.",
        created_at: new Date().toISOString(),
        type: "schedule",
      },
      {
        id: "2",
        title: "Availability period open",
        description: "Your manager is collecting availability for the next schedule period.",
        created_at: new Date().toISOString(),
        type: "availability",
      },
    ]
    setItems(seeded)
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="rounded-3xl border bg-white p-6 shadow-sm">Loading notifications...</div>
  }

  return (
    <PageShell>
      <EmployeeNotificationsPanel items={items} />
    </PageShell>
  )
}
