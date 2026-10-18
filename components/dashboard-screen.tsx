"use client";

import Link from "next/link";
import { Activity, ArrowUpRight, BellRing, CircleAlert, MessageSquareMore, RadioTower, Send, ShieldAlert } from "lucide-react";
import { EmptyState, ErrorState, LoadingState, PageHeader, SeverityBadge, StatusBadge, formatDate } from "@/components/common";
import { ReactionSummaryBadges } from "@/components/reaction-summary-badges";
import { SendNotificationDialog } from "@/components/send-notification-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getNotificationViewLabel } from "@/lib/api/normalization";
import { getReactionAggregateTotal } from "@/lib/api/reaction-utils";
import { useInstallations, useNotifications, useRisks } from "@/lib/hooks";
import { getInstallationMetrics } from "@/lib/teams";
import type { DashboardMetrics } from "@/lib/types";

const metricMeta = [
  { key: "totalActiveRisks", label: "Active risks", icon: ShieldAlert, tone: "text-slate-900", bg: "bg-slate-100" },
  { key: "highSeverityRisks", label: "Critical & high", icon: CircleAlert, tone: "text-rose-700", bg: "bg-rose-50" },
  { key: "activeChannels", label: "Active channels", icon: RadioTower, tone: "text-cyan-700", bg: "bg-cyan-50" },
  { key: "notificationsSent", label: "Alerts sent", icon: Send, tone: "text-emerald-700", bg: "bg-emerald-50" },
  { key: "failedNotifications", label: "Failed delivery", icon: BellRing, tone: "text-orange-700", bg: "bg-orange-50" },
  { key: "totalReactions", label: "Active reactions", icon: MessageSquareMore, tone: "text-violet-700", bg: "bg-violet-50" },
] as const;

export function DashboardScreen() {
  const risks = useRisks();
  const installationsQuery = useInstallations();
  const notifications = useNotifications();
  if (risks.isLoading || installationsQuery.isLoading || notifications.isLoading) return <LoadingState rows={6} />;
  const queryError = risks.error ?? installationsQuery.error ?? notifications.error;
  if (risks.isError || installationsQuery.isError || notifications.isError) return <ErrorState message={queryError instanceof Error ? queryError.message : undefined} retry={() => { risks.refetch(); installationsQuery.refetch(); notifications.refetch(); }} />;

  const riskData = risks.data ?? [];
  const installationMetrics = getInstallationMetrics(installationsQuery.data ?? []);
  const notificationData = notifications.data ?? [];
  const metrics: DashboardMetrics = {
    totalActiveRisks: riskData.filter((risk) => risk.is_active).length,
    highSeverityRisks: riskData.filter((risk) => risk.severity === "high" || risk.severity === "critical").length,
    activeChannels: installationMetrics.activeChannels,
    notificationsSent: notificationData.filter((notification) => notification.status === "sent").length,
    failedNotifications: notificationData.filter((notification) => notification.status === "failed").length,
    totalReactions: notificationData.reduce((total, notification) => total + getReactionAggregateTotal(notification.reaction_summary?.reactions), 0),
  };
  const maxSeverityCount = Math.max(1, ...["critical", "high", "medium", "low"].map((severity) => riskData.filter((risk) => risk.severity === severity).length));

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader eyebrow="Live operations" title="Risk command overview" description="Monitor commercial exposure, manage Teams destinations and verify alert delivery from one operational surface." action={<SendNotificationDialog />} />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {metricMeta.map((item) => <Card key={item.key} className="border-slate-200 shadow-none"><CardContent className="p-4"><div className={`grid size-8 place-items-center rounded-lg ${item.bg} ${item.tone}`}><item.icon className="size-4" /></div><p className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">{metrics[item.key]}</p><p className="mt-1 text-sm text-slate-500">{item.label}</p></CardContent></Card>)}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_.7fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="font-semibold text-slate-950">Priority risks</h2><p className="mt-0.5 text-sm text-slate-500">Highest exposure requiring attention</p></div><Button asChild variant="ghost" size="sm"><Link href="/risks">View all <ArrowUpRight /></Link></Button></div>
          {riskData.length === 0 ? <EmptyState title="No active risks" description="New risks will appear here when detected." /> : <Table><TableHeader><TableRow><TableHead className="pl-5">Risk</TableHead><TableHead>Severity</TableHead><TableHead>Entity</TableHead><TableHead>Industry</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{riskData.slice(0, 5).map((risk) => <TableRow key={risk.risk_id}><TableCell className="max-w-[360px] whitespace-normal pl-5"><p className="font-semibold text-slate-900">{risk.title}</p><p className="mt-1 text-xs text-slate-500">{risk.risk_id}{risk.subtitle ? ` · ${risk.subtitle}` : ""}</p></TableCell><TableCell>{risk.severity ? <SeverityBadge severity={risk.severity} /> : "—"}</TableCell><TableCell>{risk.entity?.name ?? risk.entity?.id ?? "—"}</TableCell><TableCell>{risk.industry_name ?? risk.industry_slug ?? "—"}</TableCell><TableCell><Button asChild size="sm" variant="ghost"><Link href={`/risks/${risk.risk_id}`}>Open <ArrowUpRight /></Link></Button></TableCell></TableRow>)}</TableBody></Table>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-[#0b2131] p-5 text-white">
          <div className="flex items-center gap-2"><Activity className="size-4 text-cyan-300" /><h2 className="font-semibold">Risk concentration</h2></div>
          <p className="mt-1 text-sm text-slate-400">Active risks grouped by severity</p>
          <div className="mt-7 space-y-5">{["critical", "high", "medium", "low"].map((severity) => { const count = riskData.filter((risk) => risk.severity === severity).length; const color = severity === "critical" ? "bg-rose-400" : severity === "high" ? "bg-orange-400" : severity === "medium" ? "bg-amber-300" : "bg-sky-300"; return <div key={severity}><div className="mb-2 flex justify-between text-sm"><span className="capitalize text-slate-300">{severity}</span><span className="font-semibold">{count}</span></div><div className="h-2 rounded-full bg-white/10"><div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.max(count ? 12 : 0, (count / maxSeverityCount) * 100)}%` }} /></div></div>; })}</div>
          <div className="mt-7 rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-sm font-semibold text-white">Delivery health</p><p className="mt-1 text-sm leading-6 text-slate-400">{metrics.failedNotifications === 0 ? "All recent notifications were delivered successfully." : `${metrics.failedNotifications} notification requires delivery review.`}</p></div>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="font-semibold text-slate-950">Recent notification activity</h2><p className="mt-0.5 text-sm text-slate-500">Latest Teams delivery attempts and engagement</p></div><Button asChild variant="ghost" size="sm"><Link href="/notifications">History <ArrowUpRight /></Link></Button></div>
        <Table><TableHeader><TableRow><TableHead className="pl-5">Risk</TableHead><TableHead>View</TableHead><TableHead>Status</TableHead><TableHead>Reactions</TableHead><TableHead>Created</TableHead></TableRow></TableHeader><TableBody>{notificationData.slice(0, 5).map((notification) => <TableRow key={notification.notification_id}><TableCell className="max-w-[320px] whitespace-normal pl-5 font-mono text-xs font-semibold"><Link className="text-cyan-700 hover:underline" href={`/notifications/${notification.notification_id}`}>{notification.risk_id ?? "Risk notification"}</Link></TableCell><TableCell>{getNotificationViewLabel(notification.view_type ?? undefined)}</TableCell><TableCell><StatusBadge status={notification.status} /></TableCell><TableCell><ReactionSummaryBadges reactions={notification.reaction_summary?.reactions} emptyLabel="—" /></TableCell><TableCell className="text-slate-500">{formatDate(notification.created_at)}</TableCell></TableRow>)}</TableBody></Table>
      </section>
    </div>
  );
}
