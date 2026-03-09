import type { PeriodStatus } from "@/lib/types"
import { STATUS_CONFIG } from "@/lib/constants"
import { cn } from "@/lib/utils"

export function StatusBadge({ status }: { status: PeriodStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", config.color)}>
      <span className={cn("mr-1.5 inline-block h-2 w-2 rounded-full", config.dot)} />
      {config.label}
    </span>
  )
}
