import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Ensure profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!profile) {
    // Create profile if it doesn't exist
    await supabase.from('profiles').upsert({
      id: session.user.id,
      email: session.user.email!,
      full_name: session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
    })
  }

  return (
    <AppShell userId={session.user.id} userEmail={session.user.email!}>
      {children}
    </AppShell>
  )
}
