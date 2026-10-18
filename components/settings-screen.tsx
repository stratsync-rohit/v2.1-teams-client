"use client";

import { CheckCircle2, Database, KeyRound, Server, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDemoFallbackEnabled } from "@/lib/api/client";

export function SettingsScreen() {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3978";
  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader eyebrow="Configuration" title="Platform settings" description="Review the public frontend connection and the security boundary enforced by this application." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Server className="size-5 text-cyan-700" />Backend connection</CardTitle></CardHeader><CardContent><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">API base URL</p><p className="mt-2 break-all font-mono text-sm text-slate-900">{apiUrl}</p></div><div className="mt-5 flex items-center justify-between"><div><p className="font-medium text-slate-900">Demo fallback</p><p className="mt-1 text-sm text-slate-500">Explicit sample data mode for isolated demonstrations.</p></div><Badge variant="outline" className={isDemoFallbackEnabled ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}>{isDemoFallbackEnabled ? "Enabled" : "Disabled"}</Badge></div></CardContent></Card>
        <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="size-5 text-cyan-700" />Frontend security boundary</CardTitle></CardHeader><CardContent><div className="space-y-4"><Boundary icon={CheckCircle2} text="Frontend sends only risk_id and destination_id when triggering alerts." /><Boundary icon={KeyRound} text="Microsoft credentials and access tokens never reach the browser." /><Boundary icon={Database} text="MongoDB is accessed only by the FastAPI backend." /><Boundary icon={ShieldCheck} text="Conversation references and private service URLs are not displayed." /></div></CardContent></Card>
      </div>
      <Card className="mt-6 border-cyan-200 bg-cyan-50/50 shadow-none"><CardContent className="p-6"><h2 className="font-semibold text-cyan-950">Production checklist</h2><div className="mt-4 grid gap-3 text-sm text-cyan-900 sm:grid-cols-2"><p>1. Set the deployed FastAPI HTTPS URL.</p><p>2. Set demo fallback to false.</p><p>3. Allow the frontend origin in FastAPI CORS.</p><p>4. Verify /health and notification trigger responses.</p></div></CardContent></Card>
    </div>
  );
}

function Boundary({ icon: Icon, text }: { icon: typeof CheckCircle2; text: string }) { return <div className="flex gap-3"><span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Icon className="size-4" /></span><p className="text-sm leading-6 text-slate-600">{text}</p></div>; }
