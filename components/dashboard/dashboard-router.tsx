"use client"

import Link from "next/link"
import { Building2, UserPlus } from "lucide-react"

import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard"
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard"
import { Button } from "@/components/ui/button"
import { useOrg } from "@/lib/hooks/use-organization"

export function DashboardRouter() {
  const { organization, isManager, isLoading } = useOrg()

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-36 rounded-[28px] border border-slate-200 bg-white animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="page-shell">
        <section className="brand-panel p-6 sm:p-8">
          <div className="max-w-3xl">
            <div className="pill-badge mb-4">Welcome to TeamMate</div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Build your workspace or join one that already exists.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-[15px]">
              You're logged in, but you're not active in an organization yet. Create a new organization for your team or join one using a code.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/organization/new">
                  <Building2 className="h-4 w-4" />
                  Create Organization
                </Link>
              </Button>

              <Button asChild variant="outline">
                <Link href="/organization/join">
                  <UserPlus className="h-4 w-4" />
                  Join Organization
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/70 bg-white/75 p-5">
              <h2 className="text-lg font-semibold text-slate-950">Create your workspace</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Set your organization name, colors, font, and timezone to get started with a more professional experience.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/70 bg-white/75 p-5">
              <h2 className="text-lg font-semibold text-slate-950">Join an existing team</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Enter the 6-character join code shared by your manager and start using the app right away.
              </p>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return isManager ? <ManagerDashboard /> : <EmployeeDashboard />
}
