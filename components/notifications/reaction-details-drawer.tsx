"use client";

import { Check, Copy, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { getNotificationViewLabel, getReactionPresentation } from "@/lib/api/normalization";
import { getDisplayableReactionAggregates, getReactionAggregateTotal, getReactionType, getReactionUserLabel } from "@/lib/api/reaction-utils";
import { useNotification, useNotificationReactions, useRisk } from "@/lib/hooks";
import type { NotificationReaction, NotificationRecord, ReactionAggregate } from "@/lib/types";
import { formatDate, SeverityBadge, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

interface ReactionDetailsDrawerProps {
  notificationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_REACTIONS: NotificationReaction[] = [];

export function ReactionDetailsDrawer({ notificationId, open, onOpenChange }: ReactionDetailsDrawerProps) {
  const [showRemoved, setShowRemoved] = useState(false);
  const [copied, setCopied] = useState(false);
  const id = open ? notificationId ?? "" : "";
  const notification = useNotification(id);
  const riskId = notification.data?.risk_id ?? "";
  const risk = useRisk(riskId);
  const reactions = useNotificationReactions(id, { includeInactive: showRemoved });
  const reactionRecords = reactions.data?.reaction_states ?? EMPTY_REACTIONS;
  const activeReactions = useMemo(() => reactionRecords.filter((reaction) => reaction.is_active), [reactionRecords]);
  const visibleReactions = useMemo(
    () => showRemoved ? reactionRecords : activeReactions,
    [activeReactions, reactionRecords, showRemoved],
  );
  const reactionSummary = getDisplayableReactionAggregates(reactions.data?.reactions ?? notification.data?.reaction_summary?.reactions);
  const removedCount = reactionRecords.filter((reaction) => !reaction.is_active).length;
  const item = notification.data;
  const isLoading = notification.isLoading || reactions.isLoading || Boolean(riskId && risk.isLoading);
  const hasError = notification.isError || reactions.isError;

  async function copyMessageId() {
    if (!item?.teams_message_id || !navigator.clipboard) return;
    await navigator.clipboard.writeText(item.teams_message_id);
    setCopied(true);
  }

  function retry() {
    void notification.refetch();
    void reactions.refetch();
    if (riskId) void risk.refetch();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!w-full gap-0 overflow-hidden p-0 sm:!max-w-[480px]">
        <SheetHeader className="border-b border-slate-200 px-5 py-5 text-left">
          <SheetTitle className="text-lg text-slate-950">Reaction activity</SheetTitle>
          <SheetDescription className="truncate text-slate-500">
            {item?.risk_id ?? riskId ?? "Notification reaction audit"}{item?.risk_title || risk.data?.title ? ` · ${item?.risk_title ?? risk.data?.title}` : ""}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? <DrawerLoading /> : hasError ? <DrawerError retry={retry} /> : item ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <div className="space-y-5">
              <RiskSummary item={item} title={risk.data?.title ?? item.risk_title} risk={risk.data} />
              <NotificationContext item={item} reactions={visibleReactions} onCopyMessageId={copyMessageId} copied={copied} />
              <ReactionSummarySection reactions={reactionSummary} />

              <section>
                <div className="flex items-center justify-between gap-3">
                  <SectionHeading title="People who reacted" />
                  <span className="text-xs text-slate-500">{activeReactions.length} active</span>
                </div>
                <div className="mt-3">
                  {visibleReactions.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                      No active reactions have been recorded for this Teams message.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                      {visibleReactions.map((reaction, index) => <ReactionActivityRow key={reaction.reaction_id ?? `${getReactionType(reaction)}:${getReactionUserLabel(reaction)}:${index}`} reaction={reaction} />)}
                    </div>
                  )}
                </div>
                <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                  <input type="checkbox" checked={showRemoved} onChange={(event) => setShowRemoved(event.target.checked)} className="size-4 rounded border-slate-300 accent-cyan-700" />
                  Show removed reactions{removedCount > 0 && <span className="text-slate-400">({removedCount})</span>}
                </label>
              </section>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function DrawerLoading() {
  return <div className="space-y-4 p-5"><Skeleton className="h-28 w-full rounded-xl" /><Skeleton className="h-40 w-full rounded-xl" /><Skeleton className="h-10 w-2/3 rounded-xl" /><Skeleton className="h-16 w-full rounded-xl" /><Skeleton className="h-16 w-full rounded-xl" /></div>;
}

function DrawerError({ retry }: { retry: () => void }) {
  return <div className="grid min-h-72 place-items-center p-6 text-center"><div><p className="font-semibold text-slate-900">Unable to load reactions</p><p className="mt-1 text-sm text-slate-500">The reaction activity could not be retrieved.</p><Button variant="outline" className="mt-4" onClick={retry}><LoaderCircle className="size-4" />Retry</Button></div></div>;
}

function RiskSummary({ item, title, risk }: { item: NotificationRecord; title?: string | null; risk?: { severity?: string; entity?: { name?: string; id?: string } } }) {
  const entity = risk?.entity?.name ?? risk?.entity?.id;
  return <section className="rounded-xl border border-slate-200 bg-slate-50 p-4"><SectionHeading title="Risk" /><p className="mt-3 font-semibold text-slate-950">{title ?? item.risk_id ?? "Risk unavailable"}</p><p className="mt-1 font-mono text-xs text-slate-500">{item.risk_id ?? "Risk ID unavailable"}</p>{(risk?.severity || entity) && <div className="mt-4 flex flex-wrap gap-2">{risk?.severity && <SeverityBadge severity={risk.severity} />}{entity && <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Entity: {entity}</span>}</div>}</section>;
}

function NotificationContext({ item, reactions, onCopyMessageId, copied }: { item: NotificationRecord; reactions: NotificationReaction[]; onCopyMessageId: () => void; copied: boolean }) {
  const destination = getDestinationLabel(item);
  const destinationLabel = item.destination_primary || item.destination_secondary ? "Delivered to" : "Destination";
  return <section><SectionHeading title="Notification" /><dl className="mt-3 grid gap-3 text-sm"><ContextRow label="View" value={getNotificationViewLabel(item.view_type ?? undefined)} /><ContextRow label="Type" value={item.notification_type ?? "Risk notification"} /><ContextRow label="Status" value={<StatusBadge status={item.status} />} /><ContextRow label="Sent at" value={formatDate(item.sent_at ?? item.created_at)} /><ContextRow label={destinationLabel} value={destination} /></dl><details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><summary className="cursor-pointer text-sm font-medium text-slate-700">Technical details</summary><dl className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-xs"><ContextRow label="Notification ID" value={item.notification_id} />{item.risk_id && <ContextRow label="Risk ID" value={item.risk_id} />}{item.destination_id && <ContextRow label="Destination ID" value={item.destination_id} />}{item.teams_message_id && <ContextRow label="Teams message ID" value={<span className="flex min-w-0 items-center justify-between gap-2"><span className="truncate font-mono" title={item.teams_message_id}>{item.teams_message_id}</span><Button type="button" variant="ghost" size="icon-xs" onClick={onCopyMessageId} aria-label="Copy Teams message ID">{copied ? <Check /> : <Copy />}</Button></span>} />}{reactions.map((reaction, index) => { const userIdentifier = reaction.user_aad_id ?? reaction.user_identifier; return <div key={reaction.reaction_id ?? index} className="space-y-1 border-t border-slate-200 pt-2"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Reaction {index + 1}</p>{reaction.reaction_id && <ContextRow label="Reaction ID" value={reaction.reaction_id} />}{userIdentifier && <ContextRow label={reaction.user_aad_id ? "User AAD ID" : "User identifier"} value={userIdentifier} />}</div>; })}</dl></details></section>;
}

function ReactionSummarySection({ reactions }: { reactions: readonly ReactionAggregate[] }) {
  return <section><div className="flex items-center justify-between"><SectionHeading title="Reactions" /><span className="text-sm font-semibold text-slate-950">{getReactionAggregateTotal(reactions)} active</span></div>{reactions.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No reactions yet</p> : <div className="mt-3 grid gap-2 sm:grid-cols-2">{reactions.map((reaction) => <div key={reaction.reaction} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><span className="flex items-center gap-2 text-slate-700"><span className="text-lg" aria-hidden="true">{reaction.emoji}</span>{reaction.reaction}</span><span className="font-semibold text-slate-900">{reaction.count}</span></div>)}</div>}</section>;
}

function ReactionActivityRow({ reaction }: { reaction: NotificationReaction }) {
  const type = getReactionType(reaction);
  const presentation = getReactionPresentation(type);
  const user = getReactionUserLabel(reaction);
  const initials = user.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
  const removed = !reaction.is_active;
  return <div className={`flex gap-3 p-3 ${removed ? "bg-slate-50 opacity-65" : "bg-white"}`}><div className="grid size-9 shrink-0 place-items-center rounded-full bg-cyan-50 text-xs font-semibold text-cyan-800">{initials}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="truncate text-sm font-medium text-slate-900" title={user}>{user}</p>{removed && <span className="shrink-0 rounded-md border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">Removed</span>}</div><p className="mt-1 text-sm text-slate-600"><span className="mr-1.5" aria-hidden="true">{presentation.icon}</span>{presentation.label}</p><p className="mt-1 text-xs text-slate-500">{removed ? "Removed " : ""}{formatDate(removed ? reaction.updated_at ?? reaction.created_at : reaction.created_at)}</p></div></div>;
}

function ContextRow({ label, value }: { label: string; value: React.ReactNode }) { return <div className="grid grid-cols-[105px_minmax(0,1fr)] gap-3"><dt className="text-slate-500">{label}</dt><dd className="min-w-0 break-words font-medium text-slate-900">{value}</dd></div>; }
function SectionHeading({ title }: { title: string }) { return <h2 className="text-sm font-semibold text-slate-900">{title}</h2>; }
function getDestinationLabel(item: NotificationRecord): string { if (item.destination_label) return item.destination_label; const parts = [item.destination_primary, item.destination_secondary].filter((value): value is string => Boolean(value)); return parts.join(" / ") || item.destination_id || "—"; }
