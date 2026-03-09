"use client"

import { useState } from "react"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import type { MemberWithProfile } from "@/lib/types"

export function EmployeeRow({
  row,
  isCurrentUser,
  onChanged,
}: {
  row: MemberWithProfile
  isCurrentUser: boolean
  onChanged: () => Promise<void>
}) {
  const supabase = createClient()
  const { toast } = useToast()
  const [working, setWorking] = useState(false)

  async function updateRole(nextRole: "manager" | "employee") {
    if (row.role === nextRole) return

    setWorking(true)

    const { error } = await supabase
      .from("organization_members")
      .update({ role: nextRole })
      .eq("id", row.id)

    if (error) {
      toast({
        title: "Could not update role",
        description: error.message,
        variant: "destructive",
      })
      setWorking(false)
      return
    }

    await onChanged()

    toast({
      title: "Role updated",
      description: `${row.display_name} is now a ${nextRole}.`,
    })

    setWorking(false)
  }

  async function toggleActive(nextActive: boolean) {
    const confirmed = window.confirm(
      nextActive
        ? `Reactivate ${row.display_name}?`
        : `Remove ${row.display_name} from the organization? Their historical data will be preserved.`
    )

    if (!confirmed) return

    setWorking(true)

    const { error } = await supabase
      .from("organization_members")
      .update({ is_active: nextActive })
      .eq("id", row.id)

    if (error) {
      toast({
        title: nextActive ? "Could not reactivate member" : "Could not remove member",
        description: error.message,
        variant: "destructive",
      })
      setWorking(false)
      return
    }

    await onChanged()

    toast({
      title: nextActive ? "Member reactivated" : "Member removed",
      description: nextActive
        ? `${row.display_name} is active again.`
        : `${row.display_name} has been removed from the active team.`,
    })

    setWorking(false)
  }

  return (
    <tr className="hover:bg-slate-50">
      <td className="border-b border-slate-100 px-4 py-4">
        <div className="font-medium text-slate-900">{row.profile?.full_name || row.display_name}</div>
        {isCurrentUser ? (
          <div className="mt-1 text-xs font-medium text-blue-600">You</div>
        ) : null}
      </td>

      <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-600">
        {row.profile?.email || "No email available"}
      </td>

      <td className="border-b border-slate-100 px-4 py-4">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
          {row.role}
        </span>
      </td>

      <td className="border-b border-slate-100 px-4 py-4">
        <span
          className={
            row.is_active
              ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
              : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
          }
        >
          {row.is_active ? "Active" : "Inactive"}
        </span>
      </td>

      <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-600">
        {new Date(row.joined_at).toLocaleDateString()}
      </td>

      <td className="border-b border-slate-100 px-4 py-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={row.role}
            disabled={working || isCurrentUser}
            onChange={(e) => updateRole(e.target.value as "manager" | "employee")}
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>

          {row.is_active ? (
            <Button
              size="sm"
              variant="outline"
              disabled={working || isCurrentUser}
              onClick={() => toggleActive(false)}
            >
              Remove
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={working}
              onClick={() => toggleActive(true)}
            >
              Reactivate
            </Button>
          )}

          <Button size="icon" variant="ghost" disabled>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
