"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { EmployeeNotificationsPanel } from "@/components/notifications/employee-notifications-panel"

type NotificationItem = {
  id: string
  title: string
  description: string
  created_at: string
  type: "schedule" | "drop" | "availability" | "general"
}

export default function NotificationsPage() {
  const supabase = createClient()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadNotifications() {
      // Replace this with a real table later if you create one.
      // For now this page is ready for live data and can show seeded items.
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
    }

    void loadNotifications()
  }, [])

  if (loading) {
    return <div className="rounded-3xl border bg-white p-6 shadow-sm">Loading notifications...</div>
  }

  return <EmployeeNotificationsPanel items={items} />
}
