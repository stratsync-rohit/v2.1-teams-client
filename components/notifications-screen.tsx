"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, ChevronRight, MessageSquare, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge, formatDate } from "@/components/common";
import { ReactionDetailsDrawer } from "@/components/notifications/reaction-details-drawer";
import { ReactionSummaryBadges } from "@/components/reaction-summary-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getNotificationViewLabel } from "@/lib/api/normalization";
import { getDisplayableReactionAggregates } from "@/lib/api/reaction-utils";
import { useNotifications } from "@/lib/hooks";
import type { NotificationListParams } from "@/lib/types";

export function NotificationsScreen() {
  const [search, setSearch] = useState("");
  const [viewType, setViewType] = useState("all");
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState("");
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const filters = useMemo<NotificationListParams>(() => ({ ...(viewType !== "all" ? { view_type: viewType } : {}), ...(status !== "all" ? { status } : {}) }), [status, viewType]);
  const query = useNotifications(filters);
  const filtered = useMemo(() => (query.data ?? []).filter((item) => {
    const term = search.trim().toLowerCase();
    const searchableValues = [item.notification_id, item.risk_id ?? "", item.notification_type ?? "", item.view_type ?? "", item.status];
    return (!term || searchableValues.some((value) => value.toLowerCase().includes(term))) && (!date || item.created_at?.slice(0, 10) === date);
  }), [date, query.data, search]);

  if (query.isLoading) return <LoadingState rows={7} />;
  if (query.isError) return <ErrorState message={query.error instanceof Error ? query.error.message : "Unable to load notifications."} retry={() => query.refetch()} />;
  return <>
    <div className="mx-auto max-w-[1500px]"><PageHeader eyebrow="Delivery audit" title="Notification history" description="Trace every Teams alert, inspect delivery status and measure reaction engagement." /><div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-[1.3fr_repeat(3,minmax(150px,.7fr))]"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input className="h-10 pl-9" placeholder="Search risk or notification" value={search} onChange={(event) => setSearch(event.target.value)} /></div><Filter value={viewType} onChange={setViewType} placeholder="All views" options={[{ value: "summary", label: "Summary" }, { value: "details", label: "Details" }, { value: "mitigation", label: "Mitigation" }]} /><Filter value={status} onChange={setStatus} placeholder="All statuses" options={[{ value: "sent", label: "Sent" }, { value: "failed", label: "Failed" }, { value: "pending", label: "Pending" }]} /><div className="relative"><CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input className="h-10 pl-9" type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Filter by date" /></div></div>{filtered.length === 0 ? <EmptyState title="No notifications yet" description="Teams delivery activity will appear here when notifications are sent." /> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b px-5 py-3 text-sm text-slate-500">{filtered.length} notification{filtered.length === 1 ? "" : "s"}</div><Table><TableHeader><TableRow><TableHead className="pl-5">Risk</TableHead><TableHead>View</TableHead><TableHead>Status</TableHead><TableHead>Reactions</TableHead><TableHead>Created at</TableHead><TableHead /></TableRow></TableHeader><TableBody>{filtered.map((item) => { const reactionSummary = getDisplayableReactionAggregates(item.reaction_summary?.reactions); const hasReactions = reactionSummary.length > 0; const openReactions = () => setSelectedNotificationId(item.notification_id); return <TableRow key={item.notification_id}><TableCell className="max-w-[340px] whitespace-normal pl-5"><p className="font-mono text-xs font-semibold text-cyan-700">{item.risk_id ?? "Risk unavailable"}</p><p className="mt-1 text-xs text-slate-500">{item.notification_type ?? "Risk notification"}</p></TableCell><TableCell><div className="flex items-center gap-2"><span className="font-medium text-slate-900">{getNotificationViewLabel(item.view_type ?? undefined)}</span>{item.teams_message_id && <MessageSquare className="size-3.5 text-slate-400" aria-label="Teams message delivered" />}</div></TableCell><TableCell><StatusBadge status={item.status} /></TableCell><TableCell><div className="flex items-center gap-1"><ReactionSummaryBadges reactions={reactionSummary} onClick={hasReactions ? openReactions : undefined} /><Button type="button" variant="ghost" size="icon-xs" onClick={openReactions} disabled={!hasReactions} aria-label="View reactions"><ChevronRight /></Button></div></TableCell><TableCell className="text-slate-500">{formatDate(item.created_at)}</TableCell><TableCell><Link href={`/notifications/${item.notification_id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-700 hover:underline">Details <ArrowUpRight className="size-4" /></Link></TableCell></TableRow>; })}</TableBody></Table></div>}</div>
    <ReactionDetailsDrawer notificationId={selectedNotificationId} open={Boolean(selectedNotificationId)} onOpenChange={(open) => { if (!open) setSelectedNotificationId(null); }} />
  </>;
}

function Filter({ value, onChange, placeholder, options }: { value: string; onChange: (value: string) => void; placeholder: string; options: { value: string; label: string }[] }) { return <Select value={value} onValueChange={onChange}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{placeholder}</SelectItem>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>; }
