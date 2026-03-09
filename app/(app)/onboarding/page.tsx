'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Hash, ArrowRight, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { generateJoinCode, generateSlug } from '@/lib/utils'
import { DEFAULT_PRIMARY_COLOR, DEFAULT_SECONDARY_COLOR } from '@/lib/constants'

export default function OnboardingPage() {
  const [view, setView] = useState<'choose' | 'create' | 'join'>('choose')
  const [orgName, setOrgName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const slug = generateSlug(orgName)
    let code = generateJoinCode()

    // Check code uniqueness
    let { data: existing } = await supabase.from('organizations').select('id').eq('join_code', code).single()
    while (existing) {
      code = generateJoinCode()
      const res = await supabase.from('organizations').select('id').eq('join_code', code).single()
      existing = res.data
    }

    const { data: org, error } = await supabase
      .from('organizations')
      .insert({
        name: orgName,
        slug,
        join_code: code,
        primary_color: DEFAULT_PRIMARY_COLOR,
        secondary_color: DEFAULT_SECONDARY_COLOR,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      toast({ title: 'Failed to create organization', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    // Get display name
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

    await supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'manager',
      display_name: profile?.full_name || user.email!.split('@')[0],
    })

    toast({ title: 'Organization created!', description: `Welcome to ${orgName}` })
    router.push('/dashboard')
    router.refresh()
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const code = joinCode.toUpperCase().trim()
    const { data: org, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('join_code', code)
      .single()

    if (error || !org) {
      toast({ title: 'Invalid join code', description: 'No organization found with that code.', variant: 'destructive' })
      setLoading(false)
      return
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('organization_members')
      .select('id, is_active')
      .eq('organization_id', org.id)
      .eq('user_id', user.id)
      .single()

    if (existing?.is_active) {
      toast({ title: 'Already a member', description: `You're already in ${org.name}` })
      router.push('/dashboard')
      return
    }

    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

    await supabase.from('organization_members').upsert({
      organization_id: org.id,
      user_id: user.id,
      role: 'employee',
      display_name: profile?.full_name || user.email!.split('@')[0],
      is_active: true,
    })

    toast({ title: `Joined ${org.name}!` })
    router.push('/dashboard')
    router.refresh()
  }

  if (view === 'choose') {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Users className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Get started with Teammate</h1>
        <p className="text-slate-500 mb-10">Create a new organization or join an existing one.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <button onClick={() => setView('create')} className="border border-slate-200 rounded-xl p-6 text-left hover:border-blue-300 hover:shadow-md transition-all group">
            <Building2 className="w-8 h-8 text-blue-600 mb-3" />
            <div className="font-semibold text-slate-900 mb-1">Create organization</div>
            <div className="text-sm text-slate-500">Set up your team and invite employees</div>
            <ArrowRight className="w-4 h-4 text-slate-400 mt-3 group-hover:translate-x-1 transition-transform" />
          </button>
          <button onClick={() => setView('join')} className="border border-slate-200 rounded-xl p-6 text-left hover:border-green-300 hover:shadow-md transition-all group">
            <Hash className="w-8 h-8 text-green-600 mb-3" />
            <div className="font-semibold text-slate-900 mb-1">Join with code</div>
            <div className="text-sm text-slate-500">Enter a 6-character code from your manager</div>
            <ArrowRight className="w-4 h-4 text-slate-400 mt-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    )
  }

  if (view === 'create') {
    return (
      <div className="max-w-md mx-auto py-8">
        <button onClick={() => setView('choose')} className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-slate-900 mb-6">Create organization</h1>
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="space-y-1.5">
            <Label>Organization name</Label>
            <Input
              placeholder="Acme Coffee Shop"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? 'Creating...' : 'Create organization'}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <button onClick={() => setView('choose')} className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1">
        ← Back
      </button>
      <h1 className="text-xl font-bold text-slate-900 mb-6">Join an organization</h1>
      <form onSubmit={handleJoin} className="space-y-5">
        <div className="space-y-1.5">
          <Label>Join code</Label>
          <Input
            placeholder="ABC123"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="text-center text-xl tracking-widest font-mono uppercase"
            required
          />
          <p className="text-xs text-slate-500">Enter the 6-character code from your manager</p>
        </div>
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
          {loading ? 'Joining...' : 'Join organization'}
        </Button>
      </form>
    </div>
  )
}
