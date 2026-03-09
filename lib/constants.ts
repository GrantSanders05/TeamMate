import type { PeriodStatus } from "@/lib/types"

export const APP_NAME = "Teammate"

export const DEFAULT_PRIMARY_COLOR = "#2563EB"
export const DEFAULT_SECONDARY_COLOR = "#1E40AF"
export const DEFAULT_FONT_FAMILY = "Inter"
export const DEFAULT_TIMEZONE = "America/New_York"

export const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans" },
  { value: "DM Sans", label: "DM Sans" },
  { value: "Outfit", label: "Outfit" },
] as const

export const TIMEZONE_OPTIONS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
] as const

export const SHIFT_COLOR_OPTIONS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#84CC16",
] as const

export const PERIOD_STATUSES: PeriodStatus[] = [
  "draft",
  "collecting",
  "scheduling",
  "published",
  "archived",
]

export const STATUS_CONFIG: Record<
  PeriodStatus,
  { label: string; color: string; dot: string }
> = {
  draft: {
    label: "Draft",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
  collecting: {
    label: "Collecting",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  scheduling: {
    label: "Scheduling",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  published: {
    label: "Published",
    color: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  archived: {
    label: "Archived",
    color: "bg-slate-100 text-slate-500 border-slate-200",
    dot: "bg-slate-300",
  },
}

export const PUBLIC_ROUTES = ["/", "/login", "/signup"] as const
export const AUTH_ROUTES = ["/login", "/signup"] as const

export const ACTIVE_ORG_STORAGE_KEY = "teammate_active_org"
