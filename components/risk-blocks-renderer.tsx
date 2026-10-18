import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RiskBlock } from "@/lib/types";

function displayValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
  return null;
}

function BlockTitle({ title }: { title?: string }) {
  return title ? <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3> : null;
}

export function RiskBlocksRenderer({ blocks = [] }: { blocks?: RiskBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "key_value":
            { const value = block as import("@/lib/types").KeyValueBlock; return <section key={index} className="rounded-xl border border-slate-200 bg-white p-4"><BlockTitle title={value.title} /><dl className="grid gap-3 sm:grid-cols-2">{(value.items ?? []).map((item, itemIndex) => { const display = displayValue(item.value); return display === null ? null : <div key={itemIndex} className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">{item.label ?? "Value"}</dt><dd className="mt-1 font-medium text-slate-900">{display}</dd></div>; })}</dl></section>; }
          case "metrics":
            { const value = block as import("@/lib/types").MetricsBlock; return <section key={index} className="rounded-xl border border-slate-200 bg-white p-4"><BlockTitle title={value.title} /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(value.items ?? []).map((item, itemIndex) => { const display = displayValue(item.value); return display === null ? null : <div key={itemIndex} className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{item.label ?? "Metric"}</p><div className="mt-1 flex items-center justify-between gap-2"><p className="font-semibold text-slate-900">{display}</p>{item.status && <Badge variant="outline" className="text-[10px] capitalize">{item.status}</Badge>}</div></div>; })}</div></section>; }
          case "text":
            { const value = block as import("@/lib/types").TextBlock; return <section key={index} className="rounded-xl border border-slate-200 bg-white p-4"><BlockTitle title={value.title} /><p className={`${value.bold ? "font-semibold" : ""} text-sm leading-6 text-slate-700`}>{displayValue(value.text) ?? "—"}</p>{value.status && <Badge variant="outline" className="mt-3 text-[10px] capitalize">{value.status}</Badge>}</section>; }
          case "table":
            { const value = block as import("@/lib/types").TableBlock; return <section key={index} className="rounded-xl border border-slate-200 bg-white p-4"><BlockTitle title={value.title} /><div className="overflow-x-auto"><Table><TableHeader><TableRow>{(value.columns ?? []).map((column) => <TableHead key={column.key}>{column.label}</TableHead>)}</TableRow></TableHeader><TableBody>{(value.rows ?? []).map((row, rowIndex) => <TableRow key={rowIndex}>{(value.columns ?? []).map((column) => <TableCell key={column.key}>{displayValue(row[column.key]) ?? "—"}</TableCell>)}</TableRow>)}</TableBody></Table></div></section>; }
          case "action_list":
            { const value = block as import("@/lib/types").ActionListBlock; return <section key={index} className="rounded-xl border border-slate-200 bg-white p-4"><BlockTitle title={value.title} /><ol className="space-y-2">{(value.items ?? []).map((item, itemIndex) => <li key={itemIndex} className="flex gap-3 text-sm leading-6 text-slate-700"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#0b2131] text-xs font-semibold text-white">{item.order ?? itemIndex + 1}</span><span>{item.title ?? "—"}</span></li>)}</ol></section>; }
          default:
            return null;
        }
      })}
    </div>
  );
}
