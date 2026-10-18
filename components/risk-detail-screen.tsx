"use client";

import Link from "next/link";
import { ArrowLeft, Building2, CircleUserRound, Send } from "lucide-react";
import { useParams } from "next/navigation";
import { ErrorState, LoadingState, SeverityBadge } from "@/components/common";
import { RiskBlocksRenderer } from "@/components/risk-blocks-renderer";
import { SendNotificationDialog } from "@/components/send-notification-dialog";
import { TeamsPreview } from "@/components/teams-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRisk } from "@/lib/hooks";
import type { RiskView } from "@/lib/types";

export function RiskDetailScreen() {
  const params = useParams<{ riskId: string }>();
  const riskId = decodeURIComponent(params.riskId ?? "");
  const query = useRisk(riskId);
  if (query.isLoading) return <LoadingState rows={7} />;
  if (query.isError || !query.data) return <ErrorState message={query.error instanceof Error ? query.error.message : "This risk could not be found or the service is unavailable."} retry={() => query.refetch()} />;
  const risk = query.data;
  const entity = risk.entity?.name ?? risk.entity?.id;

  return (
    <div className="mx-auto max-w-[1400px]">
      <Button asChild variant="ghost" className="mb-4 -ml-3 text-slate-600"><Link href="/risks"><ArrowLeft />Back to risks</Link></Button>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-[linear-gradient(120deg,#0b2131,#12384d)] px-5 py-6 text-white sm:px-7"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start"><div className="max-w-4xl"><div className="flex flex-wrap items-center gap-2">{risk.severity && <SeverityBadge severity={risk.severity} />}<Badge variant="outline" className="border-white/20 bg-white/10 text-white">{risk.status ?? "Unknown"}</Badge><span className="font-mono text-xs text-slate-300">{risk.risk_id}</span></div><h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">{risk.title}</h1>{risk.subtitle && <p className="mt-2 text-slate-300">{risk.subtitle}</p>}{risk.summary && <p className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-300">{risk.summary}</p>}<div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">{(risk.industry_name ?? risk.industry_slug) && <span className="flex items-center gap-2"><Building2 className="size-4 text-cyan-300" />{risk.industry_name ?? risk.industry_slug}</span>}{entity && <span className="flex items-center gap-2"><CircleUserRound className="size-4 text-cyan-300" />{entity}</span>}{risk.sender?.name && <span className="flex items-center gap-2"><CircleUserRound className="size-4 text-cyan-300" />{risk.sender.name}</span>}</div></div><SendNotificationDialog initialRiskId={risk.risk_id} triggerLabel="Send to Microsoft Teams" /></div></div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_.75fr]">
        <div className="space-y-6">
          <RiskViewSection title={risk.views?.notification?.title ?? "Notification"} subtitle={risk.views?.notification?.subtitle} view={risk.views?.notification} />
          {risk.views?.details && <RiskViewSection title={risk.views.details.title ?? "Details"} subtitle={risk.views.details.subtitle} view={risk.views.details} />}
          {risk.views?.mitigation && <RiskViewSection title={risk.views.mitigation.title ?? "Mitigation"} subtitle={risk.views.mitigation.subtitle} view={risk.views.mitigation} />}
        </div>
        <aside className="space-y-6"><TeamsPreview risk={risk} /><Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-base">Risk metadata</CardTitle></CardHeader><CardContent><Meta label="Risk ID" value={risk.risk_id} /><Meta label="Industry" value={risk.industry_name ?? risk.industry_slug ?? "—"} /><Meta label="Entity" value={entity ?? "—"} /><Button variant="outline" className="mt-6 w-full" disabled><Send />Actions handled by Teams</Button></CardContent></Card></aside>
      </div>
    </div>
  );
}

function RiskViewSection({ title, subtitle, view }: { title: string; subtitle?: string; view?: RiskView }) {
  return <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-lg">{title}</CardTitle>{subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}</CardHeader><CardContent><RiskBlocksRenderer blocks={view?.blocks ?? []} /></CardContent></Card>;
}

function Meta({ label, value }: { label: string; value: string }) { return <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-medium text-slate-900">{value}</p></div>; }
