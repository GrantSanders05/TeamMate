"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useOrg } from "@/lib/hooks/use-organization";

export function AppShell({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) {
  const { organization, isManager } = useOrg();

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex w-full max-w-[1700px] gap-4 px-3 py-3 sm:px-4 lg:px-6">
        <Sidebar orgName={organization?.name} isManager={isManager} />

        <div className="min-w-0 flex-1">
          <TopBar orgName={organization?.name} />
          <div className="pb-24 lg:pb-6">{children}</div>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
