"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

type ShiftTemplate = {
  id: string
  name: string
  start_time: string
  end_time: string
  color: string
  required_workers: number
  is_active: boolean
}

const DEFAULT_COLOR = "#3B82F6"

export function ShiftTemplatesManager() {
  const supabase = createClient()
  const { organization, isManager } = useOrgSafe()

  const [templates, setTemplates] = useState<ShiftTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [requiredWorkers, setRequiredWorkers] = useState("1")
  const [color, setColor] = useState(DEFAULT_COLOR)

  async function loadTemplates() {
    if (!organization) {
      setTemplates([])
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from("shift_types")
      .select("id, name, start_time, end_time, color, required_workers, is_active")
      .eq("organization_id", organization.id)
      .order("name", { ascending: true })

    if (error) {
      console.error("Failed to load shift templates", error)
      setTemplates([])
      setLoading(false)
      return
    }

    setTemplates((data as ShiftTemplate[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    void loadTemplates()
  }, [organization?.id])

  async function createTemplate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!organization || !isManager) return

    setSaving(true)

    const { error } = await supabase.from("shift_types").insert({
      organization_id: organization.id,
      name,
      start_time: startTime,
      end_time: endTime,
      required_workers: Number(requiredWorkers || "1"),
      color,
      is_active: true,
    })

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    setName("")
    setStartTime("")
    setEndTime("")
    setRequiredWorkers("1")
    setColor(DEFAULT_COLOR)
    await loadTemplates()
  }

  async function toggleTemplate(template: ShiftTemplate) {
    const { error } = await supabase
      .from("shift_types")
      .update({ is_active: !template.is_active })
      .eq("id", template.id)

    if (error) {
      alert(error.message)
      return
    }

    await loadTemplates()
  }

  async function deleteTemplate(templateId: string) {
    const confirmed = window.confirm("Delete this shift template?")
    if (!confirmed) return

    const { error } = await supabase
      .from("shift_types")
      .delete()
      .eq("id", templateId)

    if (error) {
      alert(error.message)
      return
    }

    await loadTemplates()
  }

  if (!organization) {
    return (
      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold">Shift Templates</h2>
        <p className="mt-2 text-sm text-slate-600">No organization selected.</p>
      </div>
    )
  }

  if (!isManager) {
    return (
      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold">Shift Templates</h2>
        <p className="mt-2 text-sm text-slate-600">Only managers can manage templates.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold">Shift Templates</h2>
        <p className="mt-2 text-sm text-slate-600">
          Create reusable templates so managers do not have to re-enter the same shift details every time.
        </p>
      </div>

      <form className="rounded-lg border bg-white p-6 space-y-4" onSubmit={createTemplate}>
        <h3 className="text-base font-semibold">Create Template</h3>

        <div>
          <Label htmlFor="templateName">Template name</Label>
          <Input
            id="templateName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Morning Shift"
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="templateStart">Start time</Label>
            <Input
              id="templateStart"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="templateEnd">End time</Label>
            <Input
              id="templateEnd"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="templateWorkers">Default required workers</Label>
            <Input
              id="templateWorkers"
              type="number"
              min="1"
              value={requiredWorkers}
              onChange={(e) => setRequiredWorkers(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="templateColor">Template color</Label>
            <Input
              id="templateColor"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create Template"}
        </Button>
      </form>

      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-base font-semibold">Existing Templates</h3>

        {loading ? (
          <div className="mt-4 text-sm text-slate-600">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="mt-4 text-sm text-slate-600">No templates created yet.</div>
        ) : (
          <div className="mt-4 space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full border"
                    style={{ backgroundColor: template.color || DEFAULT_COLOR }}
                  />
                  <div>
                    <div className="font-medium text-slate-900">{template.name}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {template.start_time} - {template.end_time} · {template.required_workers} worker(s) · {template.is_active ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void toggleTemplate(template)}
                  >
                    {template.is_active ? "Deactivate" : "Activate"}
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => void deleteTemplate(template.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
