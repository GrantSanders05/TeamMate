'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Users, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function JoinPage() {
  const params = useParams()
  const code = (params.code as string).toUpperCase()
  const [status, setStatus] = useState<'loading' | 'joining' | 'success' | 'error' | 'already'>('loading')
  const [orgName, setOrgName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    autoJoin()
  }, [])

  async function autoJoin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/login?redirect=/join/${code}`)
      return
    }

    setStatus('joining')
    const { data: org } = await supabase.from('organizations').select('*').eq('join_code', code).single()

    if (!org) {
      setStatus('error')
      setErrorMsg('No organization found with that join code.')
      return
    }

    setOrgName(org.name)

    const { data: existing } = await supabase
      .from('organization_members')
      .select('id, is_active')
      .eq('organization_id', org.id)
      .eq('user_id', user.id)
      .single()

    if (existing?.is_active) {
      setStatus('already')
      return
    }

    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

    const { error } = await supabase.from('organization_members').upsert({
      organization_id: org.id,
      user_id: user.id,
      role: 'employee',
      display_name: profile?.full_name || user.email!.split('@')[0],
      is_active: true,
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }

    setStatus('success')
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-5">
          <Users className="w-6 h-6 text-white" />
        </div>

        {status === 'loading' || status === 'joining' ? (
          <>
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Joining organization...</p>
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">You&apos;re in!</h2>
            <p className="text-slate-500">Welcome to <strong>{orgName}</strong>. Redirecting to your dashboard...</p>
          </>
        ) : status === 'already' ? (
          <>
            <CheckCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Already a member</h2>
            <p className="text-slate-500 mb-5">You&apos;re already in <strong>{orgName}</strong>.</p>
            <Button onClick={() => router.push('/dashboard')} className="w-full bg-blue-600 hover:bg-blue-700">
              Go to dashboard
            </Button>
          </>
        ) : (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Couldn&apos;t join</h2>
            <p className="text-slate-500 mb-5">{errorMsg}</p>
            <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full">
              Go to dashboard
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
