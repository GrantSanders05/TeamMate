import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""

  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return code
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number)
  const date = new Date()
  date.setHours(hours, minutes)
  return format(date, "h:mm a")
}

export function formatDate(date: string): string {
  return format(parseISO(date), "MMM d, yyyy")
}

export function formatDateShort(date: string): string {
  return format(parseISO(date), "MMM d")
}

export function formatDateFull(date: string): string {
  return format(parseISO(date), "EEEE, MMMM d, yyyy")
}

export function calculateShiftHours(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(":").map(Number)
  const [endH, endM] = endTime.split(":").map(Number)

  const startMinutes = startH * 60 + startM
  let endMinutes = endH * 60 + endM

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60
  }

  return (endMinutes - startMinutes) / 60
}

export function formatHours(hours: number): string {
  if (hours === Math.floor(hours)) return `${hours}h`

  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)

  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function getStaffingStatus(
  assigned: number,
  required: number
): "understaffed" | "filled" | "overstaffed" {
  if (assigned < required) return "understaffed"
  if (assigned > required) return "overstaffed"
  return "filled"
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

export function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return "#000000"

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5 ? "#000000" : "#ffffff"
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function getDaysInRange(startDate: string, endDate: string): string[] {
  const days: string[] = []
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  const current = new Date(start)

  while (current <= end) {
    days.push(format(current, "yyyy-MM-dd"))
    current.setDate(current.getDate() + 1)
  }

  return days
}

export function getWeeksInRange(startDate: string, endDate: string): string[][] {
  const days = getDaysInRange(startDate, endDate)
  const weeks: string[][] = []
  let currentWeek: string[] = []

  days.forEach((day, index) => {
    currentWeek.push(day)

    if (currentWeek.length === 7 || index === days.length - 1) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })

  return weeks
}
