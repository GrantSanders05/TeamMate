'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Users, Calendar, AlertCircle, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrg } from '@/lib/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import { SchedulingPeriod } from '@/lib/types'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'

export function ManagerDashboard() {
  const { organization, member } = useOrg()
  const [stats, setStats] = useState({ employees: 0, periods: 0, dropRequests: 0 })
  const [periods, setPeriods] = useState<SchedulingPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (organization) loadData()
  }, [organization])

  async function loadData() {
    const [empRes, periodsRes, dropsRes] = await Promise.all([
      supabase.from('organization_members').select('id', { count: 'exact' }).eq('organization_id', organization!.id).eq('is_active', true),
      supabase.from('scheduling_periods').select('*').eq('organization_id', organization!.id).not('status', 'eq', 'archived').order('created_at', { ascending: false }).limit(5),
      supabase.from('drop_requests').select('id', { count: 'exact' }).eq('status', 'pending').in(
        'assignment_id',
        supabase.from('shift_assignments').select('id').in(
          'shift_id',
          supabase.from('shifts').select('id').in(
            'scheduling_period_id',
            supabase.from('scheduling_periods').select('id').eq('organization_id', organization!.id)
          )
        )
      ),
    ])

    setStats({
      employees: empRes.count || 0,
      periods: periodsRes.data?.length || 0,
      dropRequests: dropsRes.count || 0,
    })
    setPeriods(periodsRes.data || [])
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-0.5">{organization?.name}</p>
        </div>
        <Link href="/schedule/new">
          <Button className="bg-blue-600 hover:bg-blue-700" style={{ backgroundColor: organization?.primary_color }}>
            <Plus className="w-4 h-4 mr-2" />
            New Schedule
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Employees', value: stats.employees, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active Periods', value: stats.periods, icon: Calendar, color: 'text-green-600 bg-green-50' },
          { label: 'Pending Drop Requests', value: stats.dropRequests, icon: AlertCircle, color: stats.dropRequests > 0 ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-50' },
          { label: 'Total Shifts', value: '-', icon: Clock, color: 'text-purple-600 bg-purple-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{loading ? '—' : s.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Drop request alert */}
      {stats.dropRequests > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-amber-800 font-medium">
              {stats.dropRequests} pending drop request{stats.dropRequests !== 1 ? 's' : ''} need{stats.dropRequests === 1 ? 's' : ''} your review
            </p>
          </div>
          <Link href="/employees#drop-requests">
            <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100">
              Review
            </Button>
          </Link>
        </div>
      )}

      {/* Scheduling Periods */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Scheduling Periods</h2>
          <Link href="/schedule" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : periods.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No scheduling periods yet</p>
            <Link href="/schedule/new">
              <Button variant="outline" size="sm">Create your first schedule</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {periods.map(period => (
              <Link key={period.id} href={`/schedule/${period.id}`}>
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-900">{period.name}</div>
                    <div className="text-sm text-slate-500 mt-0.5">
                      {formatDate(period.start_date)} — {formatDate(period.end_date)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={period.status} />
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: '/schedule/new', label: 'New Schedule', desc: 'Start a new scheduling period', icon: Plus },
          { href: '/employees', label: 'Manage Team', desc: 'Add, remove, or change roles', icon: Users },
          { href: '/settings', label: 'Settings', desc: 'Branding, shift types, join code', icon: Calendar },
        ].map(link => (
          <Link key={link.href} href={link.href}>
            <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
              <link.icon className="w-5 h-5 text-blue-600 mb-2" />
              <div className="font-semibold text-slate-900">{link.label}</div>
              <div className="text-sm text-slate-500 mt-0.5">{link.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
