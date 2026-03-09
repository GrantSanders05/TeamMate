"use client"

import Link from "next/link"
import { Building2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
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
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-full bg-blue-50 p-3 text-blue-700">
            <Building2 className="h-6 w-6" />
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Welcome to Teammate
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            You&apos;re logged in, but you&apos;re not active in an organization yet.
            Create a new organization for your team or join one using a code.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/select-org">
                <Building2 className="mr-2 h-4 w-4" />
                Create Organization
              </Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/select-org">
                <UserPlus className="mr-2 h-4 w-4" />
                Join Organization
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Create your workspace</h2>
            <p className="mt-2 text-sm text-slate-600">
              Set your organization name, colors, font, and timezone to get started.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Join an existing team</h2>
            <p className="mt-2 text-sm text-slate-600">
              Enter the 6-character join code shared by your manager and start using the app.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return isManager ? <ManagerDashboard /> : <EmployeeDashboard />
}
