import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import type { NotificationStatus, Severity } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div className="max-w-3xl">
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-cyan-700">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-[15px] leading-6 text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

const severityStyles: Record<string, string> = {
  critical: "border-rose-200 bg-rose-50 text-rose-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-sky-200 bg-sky-50 text-sky-700",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const label = severity || "unknown";
  return <Badge variant="outline" className={severityStyles[label] ?? "border-slate-200 bg-slate-50 text-slate-700"}><span className="mr-1.5 size-1.5 rounded-full bg-current" />{label[0].toUpperCase() + label.slice(1)}</Badge>;
}

const statusStyles: Record<string, string> = {
  sent: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
};

export function StatusBadge({ status }: { status: NotificationStatus }) {
  const label = status || "unknown";
  return <Badge variant="outline" className={statusStyles[label] ?? "border-slate-200 bg-slate-50 text-slate-700"}>{label[0].toUpperCase() + label.slice(1)}</Badge>;
}

export function LoadingState({ rows = 4 }: { rows?: number }) {
  return <div className="space-y-3 rounded-2xl border bg-white p-5">{Array.from({ length: rows }).map((_, index) => <Skeleton key={index} className="h-14 w-full rounded-xl" />)}</div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><Inbox className="mx-auto size-8 text-slate-400" /><h3 className="mt-4 font-semibold text-slate-900">{title}</h3><p className="mt-1 text-sm text-slate-500">{description}</p></div></div>;
}

export function ErrorState({ message, retry }: { message?: string; retry?: () => void }) {
  return <div className="grid min-h-72 place-items-center rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center"><div><AlertCircle className="mx-auto size-8 text-rose-600" /><h3 className="mt-4 font-semibold text-slate-900">Unable to load this view</h3><p className="mt-1 max-w-md text-sm text-slate-600">{message ?? "The service could not complete the request."}</p>{retry && <Button variant="outline" className="mt-4" onClick={retry}><LoaderCircle className="size-4" />Try again</Button>}</div></div>;
}

export function formatDate(value?: string | null) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));
}
