export function getOrgBranding(input?: {
  primary_color?: string | null
  secondary_color?: string | null
  font_family?: string | null
} | null) {
  return {
    primary: input?.primary_color || "#2563EB",
    secondary: input?.secondary_color || "#0F172A",
    fontFamily: input?.font_family || "Inter",
  }
}

export function buildBrandStyleVars(input?: {
  primary_color?: string | null
  secondary_color?: string | null
  font_family?: string | null
} | null): Record<string, string> {
  const brand = getOrgBranding(input)
  return {
    "--brand-primary": brand.primary,
    "--brand-secondary": brand.secondary,
    "--brand-font-family": brand.fontFamily,
    "--brand-hero-gradient": `linear-gradient(135deg, ${brand.secondary} 0%, ${brand.secondary} 35%, ${brand.primary} 100%)`,
    fontFamily: `var(--brand-font-family), Inter, ui-sans-serif, system-ui, sans-serif`,
  }
}
