import { PeriodStatus } from '@/lib/types'
import { STATUS_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function StatusBadge({ status }: { status: PeriodStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', config.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}
