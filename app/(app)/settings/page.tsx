"use client"

import { OrganizationSettings } from "@/components/organization/organization-settings"
import { ShiftTemplatesManager } from "@/components/schedule/shift-templates-manager"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <OrganizationSettings />
      <ShiftTemplatesManager />
    </div>
  )
}
