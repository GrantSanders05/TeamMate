'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Copy, Check, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrg } from '@/lib/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import { SchedulingPeriod, Shift, ShiftType, MemberWithProfile, AvailabilityResponse, ShiftAssignment } from '@/lib/types'
import { StatusBadge } from '@/components/shared/status-badge'
import { useToast } from '@/components/ui/use-toast'
import { copyToClipboard, formatDate, getDaysInRange } from '@/lib/utils'
import { WeekView } from '@/components/schedule/week-view'
import { EmployeePanel } from '@/components/schedule/employee-panel'
import { ShiftDetailModal } from '@/components/schedule/shift-detail-modal'
import { AddShiftForm } from '@/components/schedule/add-shift-form'

export default function ScheduleBuilderPage() {
  const params = useParams()
  const periodId = params.periodId as string
  const { organization, member, isManager } = useOrg()
  const [period, setPeriod] = useState<SchedulingPeriod | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [availability, setAvailability] = useState<AvailabilityResponse[]>([])
  const [assignments, setAssignments] = useState<(ShiftAssignment & { profiles?: any })[]>([])
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [addShiftDay, setAddShiftDay] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [linkCopied, setLinkCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [currentWeek, setCurrentWeek] = useState(0)
  const { toast } = useToast()
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (organization) loadAll()
  }, [organization, periodId])

  async function loadAll() {
    const [periodRes, shiftsRes, typesRes, membersRes, availRes, assignRes] = await Promise.all([
      supabase.from('scheduling_periods').select('*').eq('id', periodId).single(),
      supabase.from('shifts').select('*').eq('scheduling_period_id', periodId).order('date').order('start_time'),
      supabase.from('shift_types').select('*').eq('organization_id', organization!.id).eq('is_active', true),
      supabase.from('organization_members').select('*, profiles(*)').eq('organization_id', organization!.id).eq('is_active', true),
      supabase.from('availability_responses').select('*').in(
        'shift_id',
        supabase.from('shifts').select('id').eq('scheduling_period_id', periodId)
      ),
      supabase.from('shift_assignments').select('*, profiles(*)').in(
        'shift_id',
        supabase.from('shifts').select('id').eq('scheduling_period_id', periodId)
      ).neq('status', 'dropped'),
    ])

    setPeriod(periodRes.data)
    setShifts(shiftsRes.data || [])
    setShiftTypes(typesRes.data || [])
    setMembers((membersRes.data as any) || [])
    setAvailability(availRes.data || [])
    setAssignments((assignRes.data as any) || [])
    setLoading(false)
  }

  async function updateStatus(newStatus: string) {
    const { error } = await supabase
      .from('scheduling_periods')
      .update({
        status: newStatus,
        ...(newStatus === 'published' ? { published_at: new Date().toISOString() } : {}),
      })
      .eq('id', periodId)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }
    setPeriod(p => p ? { ...p, status: newStatus as any } : null)
    toast({ title: `Status updated to ${newStatus}` })
  }

  async function addShift(shiftData: any) {
    const { data, error } = await supabase
      .from('shifts')
      .insert({ ...shiftData, scheduling_period_id: periodId })
      .select()
      .single()

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }
    setShifts(s => [...s, data].sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)))
    setAddShiftDay(null)
    toast({ title: 'Shift added' })
  }

  async function deleteShift(shiftId: string) {
    await supabase.from('shifts').delete().eq('id', shiftId)
    setShifts(s => s.filter(sh => sh.id !== shiftId))
    setAssignments(a => a.filter(as => as.shift_id !== shiftId))
    setAvailability(av => av.filter(av => av.shift_id !== shiftId))
    setSelectedShift(null)
    toast({ title: 'Shift deleted' })
  }

  async function assignEmployee(shiftId: string, employeeId: string) {
    if (!member) return
    const { data, error } = await supabase
      .from('shift_assignments')
      .insert({ shift_id: shiftId, employee_id: employeeId, assigned_by: member.user_id, status: 'assigned' })
      .select('*, profiles(*)')
      .single()

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }
    setAssignments(a => [...a, data as any])
    toast({ title: 'Assigned!' })
  }

  async function unassignEmployee(assignmentId: string) {
    await supabase.from('shift_assignments').delete().eq('id', assignmentId)
    setAssignments(a => a.filter(as => as.id !== assignmentId))
    toast({ title: 'Unassigned' })
  }

  async function addManualAssignment(shiftId: string, name: string) {
    if (!member) return
    const { data, error } = await supabase
      .from('shift_assignments')
      .insert({ shift_id: shiftId, manual_name: name, assigned_by: member.user_id, status: 'assigned' })
      .select()
      .single()

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }
    setAssignments(a => [...a, data as any])
    toast({ title: `${name} added` })
  }

  const availLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/availability/${periodId}?token=${period?.availability_link_token}`

  const days = period ? getDaysInRange(period.start_date, period.end_date) : []
  const weeks: string[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }
  const currentDays = weeks[currentWeek] || days.slice(0, 7)

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-10 w-64 bg-slate-100 rounded" /><div className="h-96 bg-slate-100 rounded-xl" /></div>
  if (!period) return <div className="text-center py-20 text-slate-500">Schedule not found</div>

  const canEdit = isManager && ['draft', 'collecting', 'scheduling'].includes(period.status)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">{period.name}</h1>
            <StatusBadge status={period.status} />
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            {formatDate(period.start_date)} — {formatDate(period.end_date)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Status transitions */}
          {isManager && period.status === 'draft' && (
            <Button size="sm" onClick={() => updateStatus('collecting')} className="bg-blue-600 hover:bg-blue-700">
              Open for Availability
            </Button>
          )}
          {isManager && period.status === 'collecting' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await copyToClipboard(availLink)
                  setLinkCopied(true)
                  setTimeout(() => setLinkCopied(false), 2000)
                }}
              >
                {linkCopied ? <Check className="w-4 h-4 mr-1.5 text-green-600" /> : <Copy className="w-4 h-4 mr-1.5" />}
                Copy availability link
              </Button>
              <Button size="sm" onClick={() => updateStatus('scheduling')} className="bg-amber-600 hover:bg-amber-700">
                Close Availability
              </Button>
            </>
          )}
          {isManager && period.status === 'scheduling' && (
            <>
              <Button size="sm" variant="outline" onClick={() => router.push(`/schedule/${periodId}/preview`)}>
                <Eye className="w-4 h-4 mr-1.5" />
                Preview
              </Button>
              <Button size="sm" onClick={() => updateStatus('published')} className="bg-green-600 hover:bg-green-700">
                Publish Schedule
              </Button>
            </>
          )}
          {isManager && period.status === 'published' && (
            <Button size="sm" variant="outline" onClick={() => updateStatus('scheduling')}>
              Unpublish for edits
            </Button>
          )}

          {/* View toggle */}
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'week' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'month' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-5 min-h-[600px]">
        {/* Employee panel - only for managers */}
        {isManager && (
          <EmployeePanel
            members={members}
            assignments={assignments}
            shifts={shifts}
          />
        )}

        {/* Calendar */}
        <div className="flex-1 min-w-0">
          {/* Week navigation */}
          {weeks.length > 1 && (
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentWeek(w => Math.max(0, w - 1))}
                disabled={currentWeek === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev week
              </Button>
              <span className="text-sm text-slate-500">
                Week {currentWeek + 1} of {weeks.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentWeek(w => Math.min(weeks.length - 1, w + 1))}
                disabled={currentWeek === weeks.length - 1}
              >
                Next week <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          <WeekView
            days={currentDays}
            shifts={shifts}
            assignments={assignments}
            availability={availability}
            members={members}
            canEdit={canEdit}
            onShiftClick={setSelectedShift}
            onAddShift={setAddShiftDay}
          />
        </div>
      </div>

      {/* Modals */}
      {selectedShift && (
        <ShiftDetailModal
          shift={selectedShift}
          members={members}
          assignments={assignments.filter(a => a.shift_id === selectedShift.id)}
          availability={availability.filter(a => a.shift_id === selectedShift.id)}
          canEdit={canEdit}
          onClose={() => setSelectedShift(null)}
          onAssign={employeeId => assignEmployee(selectedShift.id, employeeId)}
          onUnassign={unassignEmployee}
          onAddManual={name => addManualAssignment(selectedShift.id, name)}
          onDelete={() => deleteShift(selectedShift.id)}
        />
      )}

      {addShiftDay && (
        <AddShiftForm
          date={addShiftDay}
          shiftTypes={shiftTypes}
          onAdd={addShift}
          onClose={() => setAddShiftDay(null)}
        />
      )}
    </div>
  )
}
