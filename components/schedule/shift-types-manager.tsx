
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

export function ShiftTypesManager() {
  const supabase = createClient()
  const { organization } = useOrgSafe()

  const [types, setTypes] = useState([])
  const [newType, setNewType] = useState("")

  async function load() {
    if (!organization) return

    const { data } = await supabase
      .from("shift_types")
      .select("*")
      .eq("organization_id", organization.id)
      .order("name")

    setTypes(data || [])
  }

  useEffect(()=>{ load() }, [organization])

  async function add() {
    if (!organization || !newType) return

    await supabase.from("shift_types").insert({
      organization_id: organization.id,
      name: newType
    })

    setNewType("")
    load()
  }

  async function remove(id) {
    await supabase.from("shift_types").delete().eq("id", id)
    load()
  }

  return (
    <div className="border rounded-lg p-6 bg-white space-y-4">
      <h2 className="text-lg font-semibold">Shift Types</h2>

      <div className="flex gap-2">
        <Input value={newType} onChange={(e)=>setNewType(e.target.value)} />
        <Button onClick={add}>Add</Button>
      </div>

      {types.map(t => (
        <div key={t.id} className="flex justify-between border p-2 rounded">
          <span>{t.name}</span>
          <Button size="sm" variant="destructive" onClick={()=>remove(t.id)}>
            Remove
          </Button>
        </div>
      ))}
    </div>
  )
}
