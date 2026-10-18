"use client";

import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, ErrorState, LoadingState, PageHeader, SeverityBadge } from "@/components/common";
import { SendNotificationDialog } from "@/components/send-notification-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRisks } from "@/lib/hooks";

export function RisksScreen() {
  const query = useRisks();
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [status, setStatus] = useState("all");
  const industries = useMemo(() => Array.from(new Set(query.data?.map((risk) => risk.industry_name).filter((value): value is string => Boolean(value)) ?? [])), [query.data]);
  const filtered = useMemo(() => (query.data ?? []).filter((risk) => {
    const term = search.toLowerCase();
    const searchable = [risk.risk_id, risk.title, risk.subtitle, risk.summary, risk.industry_name, risk.entity?.name, risk.entity?.id].filter((value): value is string => typeof value === "string");
    return (!term || searchable.some((value) => value.toLowerCase().includes(term))) && (severity === "all" || risk.severity === severity) && (industry === "all" || risk.industry_name === industry) && (status === "all" || risk.status === status);
  }), [query.data, search, severity, industry, status]);

  if (query.isLoading) return <LoadingState rows={7} />;
  if (query.isError) return <ErrorState message={query.error instanceof Error ? query.error.message : undefined} retry={() => query.refetch()} />;
  const count = filtered.length;
  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader eyebrow="Risk register" title="Active enterprise risks" description="Review exposure, filter operational signals and route approved alerts to Microsoft Teams." action={<SendNotificationDialog />} />
      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[minmax(260px,1fr)_180px_220px_180px]">
        <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input className="h-10 pl-9" placeholder="Search risks" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search risks" /></div>
        <Select value={severity} onValueChange={setSeverity}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All severities</SelectItem><SelectItem value="critical">Critical</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select>
        <Select value={industry} onValueChange={setIndustry}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All industries</SelectItem>{industries.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="monitoring">Monitoring</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent></Select>
      </div>
      <div className="mb-3 text-sm text-slate-500">{count} risk{count === 1 ? "" : "s"}</div>
      {filtered.length === 0 ? <EmptyState title={query.data?.length ? "No matching risks" : "No risks found"} description={query.data?.length ? "Adjust filters or search for another risk." : "No risks are currently available."} /> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><Table><TableHeader><TableRow><TableHead className="pl-5">Risk</TableHead><TableHead>Severity</TableHead><TableHead>Industry</TableHead><TableHead>Entity</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{filtered.map((risk) => <TableRow key={risk.risk_id}><TableCell className="max-w-[340px] whitespace-normal pl-5"><p className="font-semibold text-slate-900">{risk.title}</p><p className="mt-1 font-mono text-xs text-slate-500">{risk.risk_id}</p>{risk.subtitle && <p className="mt-1 text-xs text-slate-500">{risk.subtitle}</p>}</TableCell><TableCell>{risk.severity ? <SeverityBadge severity={risk.severity} /> : "—"}</TableCell><TableCell>{risk.industry_name ?? risk.industry_slug ?? "—"}</TableCell><TableCell>{risk.entity?.name ?? risk.entity?.id ?? "—"}</TableCell><TableCell><span className="capitalize text-slate-700">{risk.status ?? "—"}</span></TableCell><TableCell><div className="flex items-center gap-1"><Button asChild variant="ghost" size="sm"><Link href={`/risks/${risk.risk_id}`}>View <ArrowUpRight /></Link></Button><SendNotificationDialog initialRiskId={risk.risk_id} triggerLabel="Send" compact /></div></TableCell></TableRow>)}</TableBody></Table></div>}
    </div>
  );
}
