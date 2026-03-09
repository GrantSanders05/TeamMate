'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOrg } from '@/lib/hooks/use-organization'
import { ManagerDashboard } from '@/components/dashboard/manager-dashboard'
import { EmployeeDashboard } from '@/components/dashboard/employee-dashboard'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'

export default function DashboardPage() {
  const { isManager, isLoading, organization, allOrgs } = useOrg()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && allOrgs.length === 0) {
      router.push('/onboarding')
    }
  }, [isLoading, allOrgs])

  if (isLoading) return <LoadingSkeleton />

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">No organization yet</h2>
        <p className="text-slate-500 mb-6">Create or join an organization to get started.</p>
        <div className="flex gap-3">
          <a href="/onboarding" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Create organization
          </a>
          <a href="/join" className="inline-flex items-center px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
            Join with code
          </a>
        </div>
      </div>
    )
  }

  return isManager ? <ManagerDashboard /> : <EmployeeDashboard />
}
