import { ExternalLink, ListChecks } from "lucide-react";
import type { Risk } from "@/lib/types";
import { SeverityBadge } from "@/components/common";
import { RiskBlocksRenderer } from "@/components/risk-blocks-renderer";

export function TeamsPreview({ risk }: { risk: Risk }) {
  const notification = risk.views?.notification;
  const senderName = risk.sender?.name ?? risk.sender?.source ?? "Risk Monitor";
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b bg-[#f7f7f8] px-4 py-3 text-sm font-semibold text-slate-800"><span className="grid size-7 place-items-center rounded bg-[#5b5fc7] text-xs font-bold text-white">T</span>Microsoft Teams preview</div>
      <div className="border-l-4 border-l-orange-500 p-4">
        <p className="text-sm font-semibold text-slate-900">{senderName}</p>
        <p className="mt-0.5 text-xs text-slate-500">{risk.subtitle ?? risk.sender?.source ?? "Enterprise risk alert"}</p>
        <h3 className="mt-4 text-base font-semibold text-slate-950">{risk.title}</h3>
        {risk.subtitle && <p className="mt-1 text-sm text-slate-600">{risk.subtitle}</p>}
        {risk.severity && <div className="mt-3"><SeverityBadge severity={risk.severity} /></div>}
        {risk.summary && <p className="mt-4 text-sm leading-6 text-slate-600">{risk.summary}</p>}
        <div className="mt-4"><RiskBlocksRenderer blocks={notification?.blocks ?? []} /></div>
        <div className="mt-4 flex flex-wrap gap-2">
          {risk.views?.details && <span className="inline-flex items-center gap-1.5 rounded-md border border-[#5b5fc7] px-3 py-1.5 text-xs font-semibold text-[#4f52b2]"><ExternalLink className="size-3.5" />{risk.views.details.action_label ?? "View Details"}</span>}
          {risk.views?.mitigation && <span className="inline-flex items-center gap-1.5 rounded-md border border-[#5b5fc7] px-3 py-1.5 text-xs font-semibold text-[#4f52b2]"><ListChecks className="size-3.5" />{risk.views.mitigation.action_label ?? "Mitigation Plan"}</span>}
        </div>
        <p className="mt-3 text-[11px] text-slate-400">Preview only. Card actions are handled by the Teams bot.</p>
      </div>
    </div>
  );
}
