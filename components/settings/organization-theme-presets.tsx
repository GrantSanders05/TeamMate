"use client"

import { Button } from "@/components/ui/button"

const presets = [
  { name: "Classic Blue", primary: "#2563EB", secondary: "#1E40AF" },
  { name: "Emerald", primary: "#059669", secondary: "#065F46" },
  { name: "Sunset", primary: "#EA580C", secondary: "#BE123C" },
  { name: "Royal", primary: "#7C3AED", secondary: "#4338CA" },
]

export function OrganizationThemePresets({ onApply }: { onApply: (primary: string, secondary: string) => void }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Theme Presets</h3>
      <p className="mt-1 text-sm text-slate-600">Apply a preset look instead of typing color codes manually.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {presets.map((preset) => (
          <div key={preset.name} className="rounded-2xl border border-slate-200 p-4">
            <div className="h-14 rounded-xl" style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }} />
            <div className="mt-3 font-medium text-slate-900">{preset.name}</div>
            <div className="mt-3">
              <Button size="sm" variant="outline" onClick={() => onApply(preset.primary, preset.secondary)}>
                Apply Preset
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
