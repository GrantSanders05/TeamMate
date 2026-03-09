'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Archive, ArrowRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrg } from '@/lib/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import { SchedulingPeriod } from '@/lib/types'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirmation-dialog'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

export default function HistoryPage() {
  const { organization, isManager } = useOrg()
  const [periods, setPeriods] = useState<SchedulingPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<SchedulingPeriod | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (organization) load()
  }, [organization])

  async function load() {
    const { data } = await supabase
      .from('scheduling_periods')
      .select('*')
      .eq('organization_id', organization!.id)
      .eq('status', 'archived')
      .order('updated_at', { ascending: false })

    setPeriods(data || [])
    setLoading(false)
  }

  async function archivePublished(period: SchedulingPeriod) {
    // This is called from the schedule builder, but we expose "archive" on published periods here
  }

  async function deletePeriod(period: SchedulingPeriod) {
    const { error } = await supabase.from('scheduling_periods').delete().eq('id', period.id)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }
    setPeriods(p => p.filter(x => x.id !== period.id))
    setConfirmDelete(null)
    toast({ title: 'Archive deleted' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">History</h1>
        <p className="text-slate-500 mt-0.5">Archived scheduling periods</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : periods.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="No archived schedules"
          description="Archived schedules will appear here once you mark a period as archived."
        />
      ) : (
        <div className="space-y-3">
          {periods.map(period => (
            <div key={period.id} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">{period.name}</div>
                <div className="text-sm text-slate-500 mt-0.5">
                  {formatDate(period.start_date)} — {formatDate(period.end_date)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/schedule/${period.id}`}>
                  <Button variant="outline" size="sm">
                    View <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
                {isManager && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:bg-red-50 w-8 h-8"
                    onClick={() => setConfirmDelete(period)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
        title="Delete archived schedule"
        description={`Permanently delete the archive for "${confirmDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => confirmDelete && deletePeriod(confirmDelete)}
      />
    </div>
  )
}
