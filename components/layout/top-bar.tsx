"use client";

import Link from "next/link";

export function TopBar({
  orgName,
  userEmail,
}: {
  orgName?: string;
  userEmail?: string;
}) {
  return (
    <header className="app-surface sticky top-0 z-30 mb-4 flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
          Active organization
        </p>
        <h1 className="truncate text-lg font-semibold tracking-tight text-slate-950">
          {orgName || "TeamMate"}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {userEmail ? (
          <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600 sm:block">
            {userEmail}
          </div>
        ) : null}
        <Link
          href="/profile"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Profile
        </Link>
      </div>
    </header>
  );
}
