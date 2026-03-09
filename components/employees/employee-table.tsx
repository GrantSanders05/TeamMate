"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useOrg } from "@/lib/hooks/use-organization"
import { EmployeeRow } from "@/components/employees/employee-row"
import type { MemberWithProfile } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"

type MembershipRow = {
  id: string
  organization_id: string
  user_id: string
  role: "manager" | "employee"
  display_name: string
  is_active: boolean
  joined_at: string
  profiles:
    | {
        id: string
        email: string
        full_name: string
        avatar_url: string | null
        created_at: string
        updated_at: string
      }
    | null
}

export function EmployeeTable() {
  const supabase = createClient()
  const { organization, member } = useOrg()
  const { toast } = useToast()

  const [rows, setRows] = useState<MemberWithProfile[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)

  async function loadMembers() {
    if (!organization) return

    setLoading(true)

    const { data, error } = await supabase
      .from("organization_members")
      .select("*, profiles(*)")
      .eq("organization_id", organization.id)
      .order("is_active", { ascending: false })
      .order("joined_at", { ascending: true })

    if (error) {
      toast({
        title: "Could not load members",
        description: error.message,
        variant: "destructive",
      })
      setRows([])
      setLoading(false)
      return
    }

    const mapped = ((data ?? []) as MembershipRow[]).map((row) => ({
      id: row.id,
      organization_id: row.organization_id,
      user_id: row.user_id,
      role: row.role,
      display_name: row.display_name,
      is_active: row.is_active,
      joined_at: row.joined_at,
      profile: row.profiles,
    }))

    setRows(mapped)
    setLoading(false)
  }

  useEffect(() => {
    void loadMembers()
  }, [organization])

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return rows

    return rows.filter((row) => {
      const fullName = row.profile?.full_name?.toLowerCase() ?? ""
      const email = row.profile?.email?.toLowerCase() ?? ""
      const displayName = row.display_name?.toLowerCase() ?? ""

      return (
        fullName.includes(normalized) ||
        email.includes(normalized) ||
        displayName.includes(normalized) ||
        row.role.includes(normalized)
      )
    })
  }, [rows, query])

  const activeCount = rows.filter((row) => row.is_active).length

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Organization members</h2>
          <p className="mt-1 text-sm text-slate-500">
            {activeCount} active member{activeCount === 1 ? "" : "s"} · {rows.length} total
          </p>
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, or role"
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="mt-6 text-sm text-slate-500">Loading team members...</div>
      ) : filteredRows.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-600">
          No members matched your search.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name
                </th>
                <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email
                </th>
                <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Role
                </th>
                <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Joined
                </th>
                <th className="border-b border-slate-200 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((row) => (
                <EmployeeRow
                  key={row.id}
                  row={row}
                  isCurrentUser={row.user_id === member?.user_id}
                  onChanged={loadMembers}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
