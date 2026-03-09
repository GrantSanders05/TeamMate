import { SignupForm } from "@/components/auth/signup-form"

export default function SignupPage({
  searchParams,
}: {
  searchParams?: { redirect?: string }
}) {
  const redirectTo = searchParams?.redirect || "/dashboard"
  return <SignupForm redirectTo={redirectTo} />
}
