'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, RefreshCw, Plus, Pencil, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOrg } from '@/lib/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import { ShiftType } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'
import { generateJoinCode } from '@/lib/utils'
import { FONT_OPTIONS, SHIFT_COLORS, TIMEZONES } from '@/lib/constants'
import { ConfirmDialog } from '@/components/shared/confirmation-dialog'

export default function SettingsPage() {
  const { organization, isManager } = useOrg()
  const [name, setName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#2563EB')
  const [secondaryColor, setSecondaryColor] = useState('#1E40AF')
  const [fontFamily, setFontFamily] = useState('Inter')
  const [timezone, setTimezone] = useState('America/New_York')
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [editingType, setEditingType] = useState<ShiftType | null>(null)
  const [newType, setNewType] = useState({ name: '', start_time: '09:00', end_time: '17:00', color: '#3B82F6' })
  const [showAddType, setShowAddType] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteOrg, setConfirmDeleteOrg] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (organization) {
      setName(organization.name)
      setPrimaryColor(organization.primary_color)
      setSecondaryColor(organization.secondary_color)
      setFontFamily(organization.font_family)
      setTimezone((organization as any).timezone || 'America/New_York')
      loadShiftTypes()
    }
  }, [organization])

  async function loadShiftTypes() {
    const { data } = await supabase
      .from('shift_types')
      .select('*')
      .eq('organization_id', organization!.id)
      .order('created_at')

    setShiftTypes(data || [])
  }

  async function handleSaveOrg(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('organizations')
      .update({ name, primary_color: primaryColor, secondary_color: secondaryColor, font_family: fontFamily, timezone })
      .eq('id', organization!.id)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Settings saved' })
    }
    setSaving(false)
  }

  async function regenerateCode() {
    let code = generateJoinCode()
    let { data: existing } = await supabase.from('organizations').select('id').eq('join_code', code).single()
    while (existing) {
      code = generateJoinCode()
      const r = await supabase.from('organizations').select('id').eq('join_code', code).single()
      existing = r.data
    }
    await supabase.from('organizations').update({ join_code: code }).eq('id', organization!.id)
    toast({ title: 'Join code regenerated', description: `New code: ${code}` })
    window.location.reload()
  }

  async function addShiftType() {
    if (!newType.name || !newType.start_time || !newType.end_time) return

    const { data, error } = await supabase
      .from('shift_types')
      .insert({ ...newType, organization_id: organization!.id })
      .select()
      .single()

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }

    setShiftTypes(t => [...t, data])
    setNewType({ name: '', start_time: '09:00', end_time: '17:00', color: '#3B82F6' })
    setShowAddType(false)
    toast({ title: 'Shift type added' })
  }

  async function deactivateShiftType(id: string) {
    await supabase.from('shift_types').update({ is_active: false }).eq('id', id)
    setShiftTypes(t => t.filter(st => st.id !== id))
    toast({ title: 'Shift type removed' })
  }

  async function deleteOrg() {
    await supabase.from('organizations').delete().eq('id', organization!.id)
    router.push('/onboarding')
  }

  if (!isManager) {
    return <div className="text-center py-20 text-slate-500">Only managers can access settings.</div>
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-0.5">Manage your organization</p>
      </div>

      {/* Organization profile */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Organization Profile</h2>
        <form onSubmit={handleSaveOrg} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Organization name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Primary color</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-9 rounded border border-slate-200 cursor-pointer" />
                <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="font-mono text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Secondary color</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-10 h-9 rounded border border-slate-200 cursor-pointer" />
                <Input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="font-mono text-sm" />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Font</Label>
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </section>

      {/* Join settings */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Join Settings</h2>
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
            <span className="text-xl font-mono font-bold tracking-widest text-slate-900">{organization?.join_code}</span>
          </div>
          <Button variant="outline" onClick={regenerateCode}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate
          </Button>
        </div>
        <p className="text-xs text-slate-500">Regenerating the code will invalidate the old one immediately.</p>
      </section>

      {/* Shift types */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Shift Types</h2>
          <Button size="sm" variant="outline" onClick={() => setShowAddType(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add type
          </Button>
        </div>

        {shiftTypes.filter(t => t.is_active).length === 0 && !showAddType ? (
          <p className="text-sm text-slate-500">No shift types yet. Add some to use as templates when building schedules.</p>
        ) : (
          <div className="space-y-2">
            {shiftTypes.filter(t => t.is_active).map(type => (
              <div key={type.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-lg">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: type.color }} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 text-sm">{type.name}</div>
                  <div className="text-xs text-slate-500">{type.start_time.slice(0,5)} – {type.end_time.slice(0,5)}</div>
                </div>
                <Button variant="ghost" size="icon" className="w-7 h-7 text-red-500 hover:bg-red-50" onClick={() => deactivateShiftType(type.id)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {showAddType && (
          <div className="mt-4 border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input placeholder="e.g. Morning Shift" value={newType.name} onChange={e => setNewType(t => ({ ...t, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start time</Label>
                <Input type="time" value={newType.start_time} onChange={e => setNewType(t => ({ ...t, start_time: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End time</Label>
                <Input type="time" value={newType.end_time} onChange={e => setNewType(t => ({ ...t, end_time: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {SHIFT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewType(t => ({ ...t, color: c }))}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${newType.color === c ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddType(false)}>Cancel</Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={addShiftType}>Add shift type</Button>
            </div>
          </div>
        )}
      </section>

      {/* Danger zone */}
      <section className="bg-white border border-red-200 rounded-xl p-6">
        <h2 className="font-semibold text-red-700 mb-3">Danger Zone</h2>
        <p className="text-sm text-slate-500 mb-4">Permanently delete this organization and all of its data. This cannot be undone.</p>
        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setConfirmDeleteOrg(true)}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete organization
        </Button>
      </section>

      <ConfirmDialog
        open={confirmDeleteOrg}
        onOpenChange={setConfirmDeleteOrg}
        title="Delete organization"
        description={`Permanently delete "${organization?.name}"? All data including schedules, employees, and history will be lost forever.`}
        confirmLabel="Delete forever"
        variant="destructive"
        onConfirm={deleteOrg}
      />
    </div>
  )
}
