"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BellRing, CircleUserRound, Gauge, LifeBuoy, RadioTower, Settings, ShieldAlert } from "lucide-react";
import { isDemoFallbackEnabled } from "@/lib/api/client";
import { useHealth } from "@/lib/hooks";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/risks", label: "Risks", icon: ShieldAlert },
  { href: "/destinations", label: "Teams Destinations", icon: RadioTower },
  { href: "/notifications", label: "Notifications", icon: BellRing },
  { href: "/settings", label: "Settings", icon: Settings },
];

function pageName(pathname: string) {
  if (pathname.startsWith("/risks/")) return "Risk details";
  if (pathname === "/risks") return "Risks";
  if (pathname === "/destinations") return "Teams destinations";
  if (pathname.startsWith("/notifications/")) return "Notification details";
  if (pathname === "/notifications") return "Notifications";
  if (pathname === "/settings") return "Settings";
  return "Operations overview";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const health = useHealth();
  const isHealthy = health.data?.status === "ok" || health.data?.status === "healthy";

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas" className="border-r-0 bg-[#081927] text-white">
        <SidebarHeader className="border-b border-white/10 px-5 py-5">
          <Link href="/" className="flex items-center gap-3" aria-label="StratSync Risk Operations home">
            <span className="grid size-10 place-items-center rounded-xl bg-cyan-400 text-[#081927] shadow-[0_0_28px_rgba(34,211,238,.25)]">
              <Activity className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-wide">STRATSYNC</span>
              <span className="block text-xs text-slate-400">Risk Operations</span>
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="px-3 py-4">
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-[.18em] text-slate-500">Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {navigation.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} className="h-10 rounded-lg text-slate-300 hover:bg-white/8 hover:text-white data-[active=true]:bg-cyan-400/12 data-[active=true]:text-cyan-300">
                        <Link href={item.href}><item.icon className="size-[18px]" /><span>{item.label}</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 text-sm font-medium"><LifeBuoy className="size-4 text-cyan-300" /> Operations support</div>
            <p className="mt-1.5 text-xs leading-5 text-slate-400">Escalate delivery failures to the platform team.</p>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0 bg-[#f3f6f8]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="md:hidden" />
            <div>
              <p className="truncate text-sm font-semibold text-slate-900">{pageName(pathname)}</p>
              <p className="hidden text-xs text-slate-500 sm:block">Enterprise risk notification control</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={isDemoFallbackEnabled ? "border-amber-200 bg-amber-50 text-amber-700" : isHealthy ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}>
              <span className="mr-1.5 size-1.5 rounded-full bg-current" />
              {isDemoFallbackEnabled ? "Demo data" : isHealthy ? "Backend connected" : "Backend unavailable"}
            </Badge>
            <div className="hidden h-8 w-px bg-slate-200 sm:block" />
            <button className="grid size-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600" aria-label="User profile"><CircleUserRound className="size-5" /></button>
          </div>
        </header>
        <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
