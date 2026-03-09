"use client"

import { useOrg } from "@/lib/hooks/use-organization"
import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard"
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"

export function DashboardRouter() {
  const { organization, isManager, isLoading } = useOrg()

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (!organization) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Welcome to Teammate</h1>
        <p className="mt-2 text-sm text-slate-600">
          Create or join an organization to get started.
        </p>
      </div>
    )
  }

  return isManager ? <ManagerDashboard /> : <EmployeeDashboard />
}
