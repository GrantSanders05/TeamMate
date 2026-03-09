"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMessage("")

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    window.location.href = "/dashboard"
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border bg-white shadow-sm lg:grid-cols-2">
        <div className="hidden bg-slate-900 p-10 text-white lg:block">
          <div className="text-sm font-medium text-slate-300">Welcome back</div>
          <h1 className="mt-3 text-4xl font-semibold">Sign in to TeamMate</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
            Access your organization, submit availability, manage schedules, and keep your team aligned.
          </p>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="text-sm font-medium text-slate-500">TeamMate</div>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Sign in</h2>
            <p className="mt-2 text-sm text-slate-600">
              Use your email and password to continue.
            </p>

            {errorMessage ? (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  className="h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-slate-900"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <input
                  className="h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-slate-900"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                />
              </div>

              <button
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white"
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-600">
              Need an account?{" "}
              <Link href="/signup" className="font-medium text-slate-900 underline-offset-4 hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
