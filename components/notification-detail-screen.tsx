"use client";

import Link from "next/link";
import { ArrowLeft, Clock3, MessageSquareMore, ShieldAlert } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ErrorState, LoadingState, StatusBadge, formatDate } from "@/components/common";
import { ReactionDetailsDrawer } from "@/components/notifications/reaction-details-drawer";
import { ReactionSummaryBadges } from "@/components/reaction-summary-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getNotificationViewLabel, getReactionPresentation } from "@/lib/api/normalization";
import { getDisplayableReactionAggregates, getReactionAggregateTotal, getReactionType, getReactionUserLabel } from "@/lib/api/reaction-utils";
import { useNotification, useNotificationReactions } from "@/lib/hooks";
import type { NotificationReaction } from "@/lib/types";

export function NotificationDetailScreen() {
  const params = useParams<{ notificationId: string }>();
  const id = decodeURIComponent(params.notificationId ?? "");
  const [reactionDrawerOpen, setReactionDrawerOpen] = useState(false);
  const notification = useNotification(id);
  const reactions = useNotificationReactions(id);

  if (notification.isLoading) return <LoadingState rows={6} />;
  if (notification.isError || !notification.data) return <ErrorState message={notification.error instanceof Error ? notification.error.message : "Notification not found."} retry={() => notification.refetch()} />;

  const item = notification.data;
  const reactionRecords = reactions.data?.reaction_states ?? [];
  const reactionData = reactionRecords.filter((reaction) => reaction.is_active);
  const reactionSummary = reactions.data?.reactions ?? item.reaction_summary?.reactions;
  const visibleReactionSummary = getDisplayableReactionAggregates(reactionSummary);

  return (
    <>
      <div className="mx-auto max-w-[1200px]">
        <Button asChild variant="ghost" className="mb-4 -ml-3 text-slate-600"><Link href="/notifications"><ArrowLeft />Back to notifications</Link></Button>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2"><StatusBadge status={item.status} /><Badge variant="secondary">{getNotificationViewLabel(item.view_type ?? undefined)}</Badge></div>
              <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">{item.risk_id ?? "Risk notification"}</h1>
              <p className="mt-2 text-slate-600">Teams delivery details and active reaction activity.</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm"><p className="text-slate-500">Sent at</p><p className="mt-1 flex items-center gap-2 font-semibold text-slate-900"><Clock3 className="size-4 text-cyan-700" />{formatDate(item.sent_at ?? item.created_at)}</p></div>
          </div>
          {item.status === "failed" && <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><strong>Delivery failed:</strong> The backend could not deliver this notification.</div>}
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Info icon={ShieldAlert} label="Risk" value={item.risk_id ?? "Not available"} /><Info icon={MessageSquareMore} label="View" value={getNotificationViewLabel(item.view_type ?? undefined)} /><Info icon={ShieldAlert} label="Status" value={item.status} /><Info icon={Clock3} label="Sent at" value={formatDate(item.sent_at ?? item.created_at)} /></div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.55fr]">
          <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-lg">Notification metadata</CardTitle></CardHeader><CardContent><dl className="grid gap-5 sm:grid-cols-2"><Meta label="Notification type" value={item.notification_type ?? "Risk notification"} /><Meta label="View" value={getNotificationViewLabel(item.view_type ?? undefined)} /><Meta label="Delivery status" value={item.status} /><Meta label="Created" value={formatDate(item.created_at)} /></dl><p className="mt-6 rounded-xl bg-cyan-50 p-4 text-sm leading-6 text-cyan-900">Teams routing metadata and message identifiers remain hidden from this view.</p></CardContent></Card>
          <Card role="button" tabIndex={0} aria-label="View reaction activity" onClick={() => setReactionDrawerOpen(true)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setReactionDrawerOpen(true); }} className="cursor-pointer border-slate-200 bg-[#0b2131] text-white shadow-none transition hover:border-cyan-300"><CardContent className="p-6"><MessageSquareMore className="size-5 text-cyan-300" /><p className="mt-6 text-4xl font-semibold">{getReactionAggregateTotal(visibleReactionSummary)}</p><p className="mt-1 text-sm text-slate-400">Active Teams reactions</p><ReactionSummaryBadges reactions={visibleReactionSummary} className="mt-6 [&>span]:border [&>span]:border-white/10 [&>span]:bg-white/10 [&>span]:text-white" /></CardContent></Card>
        </div>

        <Card className="mt-6 border-slate-200 shadow-none"><CardHeader><CardTitle className="text-lg">Reaction activity</CardTitle></CardHeader><CardContent className="p-0">{reactions.isLoading ? <p className="px-6 pb-6 text-sm text-slate-500">Loading active reactions…</p> : reactions.isError ? <div className="px-6 pb-6 text-sm text-rose-700"><p>Unable to load reactions.</p><Button variant="outline" size="sm" className="mt-3" onClick={() => reactions.refetch()}>Retry</Button></div> : reactionData.length === 0 ? <p className="px-6 pb-6 text-sm text-slate-500">No active reactions.</p> : <Table><TableHeader><TableRow><TableHead className="pl-6">Reaction</TableHead><TableHead>User</TableHead><TableHead>Created</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{reactionData.map((reaction, index) => <ReactionRow key={reaction.reaction_id ?? `${getReactionType(reaction)}:${getReactionUserLabel(reaction)}:${index}`} reaction={reaction} />)}</TableBody></Table>}</CardContent></Card>
      </div>
      <ReactionDetailsDrawer notificationId={id} open={reactionDrawerOpen} onOpenChange={setReactionDrawerOpen} />
    </>
  );
}

function ReactionRow({ reaction }: { reaction: NotificationReaction }) { const presentation = getReactionPresentation(getReactionType(reaction)); const user = getReactionUserLabel(reaction); return <TableRow><TableCell className="pl-6"><span className="inline-flex items-center gap-2"><span className="text-lg">{presentation.icon}</span>{presentation.label}</span></TableCell><TableCell className="font-mono text-xs text-slate-500" title={user}>{shortenUserIdentifier(user)}</TableCell><TableCell className="text-slate-500">{formatDate(reaction.created_at)}</TableCell><TableCell><Badge variant="outline" className={reaction.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-slate-100 text-slate-600"}>{reaction.is_active ? "Active" : "Removed"}</Badge></TableCell></TableRow>; }
function shortenUserIdentifier(value: string) { return value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value; }
function Info({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) { return <div className="rounded-xl border border-slate-200 p-4"><Icon className="size-4 text-cyan-700" /><p className="mt-4 text-xs text-slate-500">{label}</p><p className="mt-1 break-all font-semibold text-slate-900">{value}</p></div>; }
function Meta({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 capitalize text-sm font-medium text-slate-900">{value}</dd></div>; }
