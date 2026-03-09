import type { Metadata } from "next"
import { Inter, Plus_Jakarta_Sans, DM_Sans, Outfit } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
})
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" })
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" })

export const metadata: Metadata = {
  title: "Teammate — Employee Scheduling Made Simple",
  description:
    "Create shifts, collect availability, and build your team schedule — all in one place.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} ${dmSans.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
      <body className="font-outfit bg-background text-foreground antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
