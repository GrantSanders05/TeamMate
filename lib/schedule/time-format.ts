export function formatDateReadable(dateString: string) {
  const d = new Date(dateString + "T00:00:00")
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  })
}

export function formatTime12(time: string) {
  if (!time) return ""
  const [h, m] = time.split(":").map(Number)
  const d = new Date()
  d.setHours(h)
  d.setMinutes(m)
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  })
}

export function formatTimeRange(start: string, end: string) {
  return `${formatTime12(start)} – ${formatTime12(end)}`
}
