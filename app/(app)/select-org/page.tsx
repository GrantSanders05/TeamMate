'use client'

import { useRouter } from 'next/navigation'
import { Building2, ArrowRight } from 'lucide-react'
import { useOrg } from '@/lib/hooks/use-organization'

export default function SelectOrgPage() {
  const { allOrgs, setActiveOrg } = useOrg()
  const router = useRouter()

  function selectOrg(orgId: string) {
    setActiveOrg(orgId)
    router.push('/dashboard')
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="text-center mb-8">
        <Building2 className="w-10 h-10 text-blue-600 mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-slate-900">Select Organization</h1>
        <p className="text-slate-500 mt-1">You belong to multiple organizations</p>
      </div>

      <div className="space-y-3">
        {allOrgs.map(({ org, member }) => (
          <button
            key={org.id}
            onClick={() => selectOrg(org.id)}
            className="w-full border border-slate-200 rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-md transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: org.primary_color }}
              >
                {org.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-slate-900">{org.name}</div>
                <div className="text-xs text-slate-500 capitalize">{member.role}</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  )
}
