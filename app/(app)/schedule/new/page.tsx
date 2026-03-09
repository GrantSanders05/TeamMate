'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays, endOfMonth, startOfMonth } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOrg } from '@/lib/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

export default function NewSchedulePage() {
  const { organization, member } = useOrg()
  const [name, setName] = useState('')
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly'>('weekly')
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 6), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  function handleTypeChange(type: 'weekly' | 'monthly') {
    setPeriodType(type)
    const start = new Date(startDate + 'T00:00:00')
    if (type === 'weekly') {
      setEndDate(format(addDays(start, 6), 'yyyy-MM-dd'))
    } else {
      setEndDate(format(endOfMonth(startOfMonth(start)), 'yyyy-MM-dd'))
    }
  }

  function handleStartChange(date: string) {
    setStartDate(date)
    const start = new Date(date + 'T00:00:00')
    if (periodType === 'weekly') {
      setEndDate(format(addDays(start, 6), 'yyyy-MM-dd'))
    } else {
      setEndDate(format(endOfMonth(startOfMonth(start)), 'yyyy-MM-dd'))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!organization || !member) return
    setLoading(true)

    const { data, error } = await supabase
      .from('scheduling_periods')
      .insert({
        organization_id: organization.id,
        name,
        start_date: startDate,
        end_date: endDate,
        period_type: periodType,
        status: 'draft',
        created_by: member.user_id,
      })
      .select()
      .single()

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    router.push(`/schedule/${data.id}`)
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">New Schedule</h1>
        <p className="text-slate-500 mt-0.5">Create a new scheduling period for your team</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5">
          <Label>Period name</Label>
          <Input
            placeholder='e.g. "Week of June 9" or "June 2025"'
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Period type</Label>
          <div className="grid grid-cols-2 gap-3">
            {(['weekly', 'monthly'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`border rounded-lg p-4 text-left transition-all ${
                  periodType === type
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-medium capitalize">{type}</div>
                <div className="text-xs mt-0.5 text-slate-500">
                  {type === 'weekly' ? '7-day schedule' : 'Full month schedule'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Start date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={e => handleStartChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>End date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              min={startDate}
              required
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 flex-1" disabled={loading}>
            {loading ? 'Creating...' : 'Create schedule'}
          </Button>
        </div>
      </form>
    </div>
  )
}
