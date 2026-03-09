export const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter', import: 'Inter' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', import: 'Plus+Jakarta+Sans' },
  { value: 'DM Sans', label: 'DM Sans', import: 'DM+Sans' },
  { value: 'Outfit', label: 'Outfit', import: 'Outfit' },
]

export const DEFAULT_PRIMARY_COLOR = '#2563EB'
export const DEFAULT_SECONDARY_COLOR = '#1E40AF'
export const DEFAULT_FONT = 'Inter'
export const DEFAULT_TIMEZONE = 'America/New_York'

export const SHIFT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
  '#84CC16', // lime
]

export const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  collecting: { label: 'Collecting', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  scheduling: { label: 'Scheduling', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  published: { label: 'Published', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  archived: { label: 'Archived', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-300' },
} as const

export const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
]
