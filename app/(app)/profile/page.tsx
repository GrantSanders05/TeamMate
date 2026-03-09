'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useOrg } from '@/lib/hooks/use-organization'

export default function ProfilePage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const { toast } = useToast()
  const { allOrgs } = useOrg()
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    setEmail(user.email || '')

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profile) setFullName(profile.full_name)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', userId)

    if (newPassword) {
      const { error: pwError } = await supabase.auth.updateUser({ password: newPassword })
      if (pwError) {
        toast({ title: 'Password error', description: pwError.message, variant: 'destructive' })
        setSaving(false)
        return
      }
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Profile updated' })
      setNewPassword('')
    }
    setSaving(false)
  }

  async function leaveOrg(orgId: string, orgName: string) {
    await supabase
      .from('organization_members')
      .update({ is_active: false })
      .eq('organization_id', orgId)
      .eq('user_id', userId)

    toast({ title: `Left ${orgName}` })
    router.push('/onboarding')
    router.refresh()
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-500 mt-0.5">Manage your account settings</p>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Account Details</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={email} disabled className="bg-slate-50 text-slate-500" />
            <p className="text-xs text-slate-400">Email cannot be changed</p>
          </div>
          <div className="space-y-1.5">
            <Label>New password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
            />
          </div>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </section>

      {/* Organizations */}
      {allOrgs.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4">My Organizations</h2>
          <div className="space-y-3">
            {allOrgs.map(({ org, member }) => (
              <div key={org.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">{org.name}</div>
                  <div className="text-xs text-slate-500 capitalize">{member.role}</div>
                </div>
                {member.role === 'employee' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => leaveOrg(org.id, org.name)}
                  >
                    Leave
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
