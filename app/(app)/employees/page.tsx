"use client"

import { useOrg } from "@/lib/hooks/use-organization"
import { EmployeeTable } from "@/components/employees/employee-table"
import { JoinCodeDisplay } from "@/components/organization/join-code-display"

export default function EmployeesPage() {
  const { organization, isManager, isLoading } = useOrg()

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm text-slate-500">Loading employees...</div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">No active organization</h1>
        <p className="mt-2 text-sm text-slate-600">
          Select or create an organization before managing employees.
        </p>
      </div>
    )
  }

  if (!isManager) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Manager access only</h1>
        <p className="mt-2 text-sm text-slate-600">
          Only managers can view and manage organization members.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-medium text-slate-500">Employee management</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Team members
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          View active and inactive members, update roles, and remove people from your organization.
        </p>
      </div>

      <JoinCodeDisplay />
      <EmployeeTable />
    </div>
  )
}
