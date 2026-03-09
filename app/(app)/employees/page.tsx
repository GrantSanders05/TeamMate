'use client'

import { useEffect, useState } from 'react'
import { Users, Search, Copy, Check, UserMinus, ShieldCheck, User, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useOrg } from '@/lib/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import { MemberWithProfile } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'
import { ConfirmDialog } from '@/components/shared/confirmation-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { formatDate, copyToClipboard } from '@/lib/utils'

export default function EmployeesPage() {
  const { organization, isManager } = useOrg()
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [codeCopied, setCodeCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<MemberWithProfile | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (organization) loadMembers()
  }, [organization])

  async function loadMembers() {
    const { data } = await supabase
      .from('organization_members')
      .select('*, profiles(*)')
      .eq('organization_id', organization!.id)
      .order('joined_at', { ascending: false })

    setMembers((data as any) || [])
    setLoading(false)
  }

  async function removeMember(member: MemberWithProfile) {
    const { error } = await supabase
      .from('organization_members')
      .update({ is_active: false })
      .eq('id', member.id)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }

    toast({ title: `${member.display_name} removed` })
    loadMembers()
    setConfirmRemove(null)
  }

  async function changeRole(member: MemberWithProfile, newRole: 'manager' | 'employee') {
    const { error } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', member.id)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }

    toast({ title: `${member.display_name} is now a ${newRole}` })
    loadMembers()
  }

  const joinLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${organization?.join_code}`

  const filtered = members.filter(m =>
    m.display_name.toLowerCase().includes(search.toLowerCase()) ||
    m.profiles?.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (!isManager) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Only managers can access this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
        <p className="text-slate-500 mt-0.5">Manage your team members</p>
      </div>

      {/* Join code section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Hash className="w-4 h-4 text-slate-400" />
          Join Code
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 flex-1">
            <span className="text-2xl font-mono font-bold tracking-widest text-slate-900">
              {organization?.join_code}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                await copyToClipboard(organization?.join_code || '')
                setCodeCopied(true)
                setTimeout(() => setCodeCopied(false), 2000)
              }}
              className="flex-1 sm:flex-none"
            >
              {codeCopied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
              Copy code
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await copyToClipboard(joinLink)
                setLinkCopied(true)
                setTimeout(() => setLinkCopied(false), 2000)
              }}
              className="flex-1 sm:flex-none"
            >
              {linkCopied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
              Copy link
            </Button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">Share this code or link with your team. Anyone with it can join instantly.</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-slate-500">{members.filter(m => m.is_active).length} active</span>
      </div>

      {/* Members list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees yet"
          description="Share the join code above to invite your team."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Name</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3 hidden sm:table-cell">Email</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Role</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3 hidden md:table-cell">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3 hidden md:table-cell">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(member => (
                <tr key={member.id} className={`hover:bg-slate-50 ${!member.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-900">{member.display_name}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500 hidden sm:table-cell">
                    {member.profiles?.email}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                      member.role === 'manager'
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {member.role === 'manager' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {member.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      member.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {member.is_active ? 'Active' : 'Removed'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500 hidden md:table-cell">
                    {formatDate(member.joined_at)}
                  </td>
                  <td className="px-5 py-4">
                    {member.is_active && (
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-600 text-xs"
                          onClick={() => changeRole(member, member.role === 'manager' ? 'employee' : 'manager')}
                        >
                          {member.role === 'manager' ? 'Make employee' : 'Make manager'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 text-xs"
                          onClick={() => setConfirmRemove(member)}
                        >
                          <UserMinus className="w-3.5 h-3.5 mr-1" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmRemove}
        onOpenChange={() => setConfirmRemove(null)}
        title="Remove employee"
        description={`Remove ${confirmRemove?.display_name} from ${organization?.name}? They will lose access immediately. Their historical data will be preserved.`}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={() => confirmRemove && removeMember(confirmRemove)}
      />
    </div>
  )
}
