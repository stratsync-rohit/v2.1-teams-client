import { getDisplayableReactionAggregates } from "@/lib/api/reaction-utils";
import type { ReactionAggregate } from "@/lib/types";

export function ReactionSummaryBadges({ reactions: rawReactions, emptyLabel = "No reactions", className = "", onClick, ariaLabel = "View reactions" }: { reactions?: readonly ReactionAggregate[] | null; emptyLabel?: string | null; className?: string; onClick?: () => void; ariaLabel?: string }) {
  const reactions = getDisplayableReactionAggregates(rawReactions);
  if (reactions.length === 0) return emptyLabel ? <span className={`text-xs text-slate-500 ${className}`}>{emptyLabel}</span> : null;
  const content = reactions.map((reaction) => <span key={reaction.reaction} title={`${reaction.reaction}: ${reaction.count}`} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"><span aria-hidden="true">{reaction.emoji}</span><span>{reaction.count}</span></span>);
  if (onClick) return <button type="button" aria-label={ariaLabel} onClick={onClick} className={`flex flex-wrap gap-1.5 rounded-md text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 ${className}`}>{content}</button>;
  return <div className={`flex flex-wrap gap-1.5 ${className}`}>{content}</div>;
}
