"use client"

import { Button } from "@/components/ui/button"
import { useOrg } from "@/lib/hooks/use-organization"
import { CreateOrganizationForm } from "@/components/organization/create-organization-form"
import { JoinOrganizationForm } from "@/components/organization/join-organization-form"

export function SelectOrgClient() {
  const { memberships, setActiveOrg } = useOrg()
  const safeMemberships = memberships ?? []

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Select or create an organization
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Choose an existing organization, create a new one, or join with a code.
        </p>
      </div>

      {safeMemberships.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Your organizations</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {safeMemberships.map(({ org, member }) => (
              <div key={org.id} className="rounded-lg border border-slate-200 p-4">
                <div className="font-medium text-slate-900">{org.name}</div>
                <div className="mt-1 text-sm text-slate-500">
                  Role: {member.role} · Join code: {org.join_code}
                </div>
                <div className="mt-3">
                  <Button
                    onClick={() => {
                      setActiveOrg(org.id)
                      window.location.href = "/dashboard"
                    }}
                  >
                    Open organization
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <CreateOrganizationForm />
        <JoinOrganizationForm />
      </div>
    </div>
  )
}
