"use client";

import { Building2, CalendarClock, Hash, Loader2, RadioTower, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, ErrorState, LoadingState, PageHeader, formatDate } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDisconnectDestination, useInstallations, useResolveDestination } from "@/lib/hooks";
import { getChannelDisplayName, getDisplayableChannels, getInstallationDisplayName, getInstallationMetrics } from "@/lib/teams";
import type { DiscoveredChannel, Installation } from "@/lib/types";

export function DestinationsScreen() {
  const query = useInstallations();
  if (query.isLoading) return <LoadingState rows={5} />;
  if (query.isError) return <ErrorState message={query.error instanceof Error ? query.error.message : undefined} retry={() => query.refetch()} />;
  const installations = query.data ?? [];
  if (installations.length === 0) return <div className="mx-auto max-w-[1400px]"><PageHeader eyebrow="Microsoft Teams" title="Teams destinations" description="Review discovered Teams installations and channels available for risk alert delivery." /><EmptyState title="No Teams installations discovered" description="Install or configure the Teams bot through the backend onboarding flow." /></div>;
  const metrics = getInstallationMetrics(installations);
  return <div className="mx-auto max-w-[1400px]"><PageHeader eyebrow="Microsoft Teams" title="Teams destinations" description="Review discovered Teams installations and channels available for risk alert delivery." /><div className="mb-6 grid gap-3 sm:grid-cols-3"><Summary icon={UsersRound} value={metrics.connectedTeams} label="Teams installations" /><Summary icon={RadioTower} value={metrics.configuredChannels} label="Configured channels" /><Summary icon={Hash} value={metrics.availableChannels} label="Available channels" /></div><div className="space-y-4">{installations.map((installation) => <InstallationCard key={`${installation.tenant_id}:${installation.team_id}`} installation={installation} onUpdated={() => query.refetch()} />)}</div></div>;
}

function InstallationCard({ installation, onUpdated }: { installation: Installation; onUpdated: () => Promise<unknown> }) {
  const channels = getDisplayableChannels(installation);
  return <section className={`overflow-hidden rounded-2xl border border-slate-200 bg-white ${installation.is_active ? "" : "opacity-75"}`}><div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-5 py-3"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#5b5fc7] text-white"><Building2 className="size-4" /></span><div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Team installation</p><h2 className="font-semibold text-slate-950">{getInstallationDisplayName(installation)}</h2></div></div><Badge variant="outline" className={installation.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-slate-100 text-slate-600"}>{installation.is_active ? "Active" : "Inactive"}</Badge></div><div className="p-3 sm:p-4">{channels.length === 0 ? <p className="px-1 py-4 text-sm text-slate-500">No named channels were discovered for this Team.</p> : <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{channels.map((channel) => <ChannelCard key={channel.channel_id} channel={channel} onUpdated={onUpdated} />)}</div>}<div className="mt-3 flex items-center gap-2 border-t pt-3 text-xs text-slate-500"><CalendarClock className="size-3.5" />Installed {installation.installed_at ? formatDate(installation.installed_at) : "—"}</div></div></section>;
}

function ChannelCard({ channel, onUpdated }: { channel: DiscoveredChannel; onUpdated: () => Promise<unknown> }) {
  const resolveDestination = useResolveDestination();
  const disconnectDestination = useDisconnectDestination();
  const configured = channel.is_configured === true;
  const missingDestinationId = configured && !channel.destination_id;
  const isPending = resolveDestination.isPending || disconnectDestination.isPending;

  async function configure() {
    try {
      await resolveDestination.mutateAsync({ tenant_id: channel.tenant_id, team_id: channel.team_id, channel_id: channel.channel_id });
      await onUpdated();
      toast.success(`${getChannelDisplayName(channel)} configured for risk alerts.`);
    } catch (error) {
      toast.error(`Could not configure ${getChannelDisplayName(channel)}: ${error instanceof Error ? error.message : "Please try again."}`);
    }
  }

  async function disconnect() {
    if (!channel.destination_id) return;
    try {
      await disconnectDestination.mutateAsync(channel.destination_id);
      await onUpdated();
      toast.success(`${getChannelDisplayName(channel)} disconnected.`);
    } catch (error) {
      toast.error(`Could not disconnect ${getChannelDisplayName(channel)}: ${error instanceof Error ? error.message : "Please try again."}`);
    }
  }

  return <Card className={configured ? "border-emerald-200 bg-emerald-50/30 shadow-none" : "border-slate-200 shadow-none"}><CardContent className="px-4 py-3"><div className="flex items-center justify-between gap-3"><p className="flex min-w-0 flex-1 items-center gap-2 font-semibold text-slate-900"><Hash className="size-4 shrink-0 text-slate-400" /><span className="truncate">{getChannelDisplayName(channel)}</span></p><Badge variant="outline" className={`shrink-0 ${configured ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-cyan-200 bg-cyan-50 text-cyan-700"}`}>{configured ? "Configured" : "Available"}</Badge></div><div className="mt-3 flex items-center justify-between gap-3"><Button type="button" size="sm" variant={configured ? "outline" : "default"} className={configured ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "bg-cyan-600 text-white hover:bg-cyan-700"} disabled={isPending || missingDestinationId} onClick={configured ? disconnect : configure}>{isPending ? <><Loader2 className="animate-spin" />{configured ? "Disconnecting…" : "Configuring…"}</> : configured ? "Disconnect" : "Configure"}</Button>{missingDestinationId && <p className="text-right text-xs text-rose-600">Configuration record unavailable.</p>}</div></CardContent></Card>;
}

function Summary({ icon: Icon, value, label }: { icon: typeof RadioTower; value: number; label: string }) { return <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"><span className="grid size-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><Icon className="size-5" /></span><div><p className="text-2xl font-semibold text-slate-950">{value}</p><p className="text-sm text-slate-500">{label}</p></div></div>; }
