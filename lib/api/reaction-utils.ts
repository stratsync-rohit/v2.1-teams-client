import type { NotificationReaction, ReactionAggregate } from "../types.js";

/**
 * Keeps the rendering layer defensive without manufacturing or retaining reaction
 * state. A new backend response therefore removes absent or zero-count chips.
 */
export function getDisplayableReactionAggregates(
  reactions: readonly ReactionAggregate[] | null | undefined,
): ReactionAggregate[] {
  return (reactions ?? []).filter(
    (reaction) =>
      typeof reaction.reaction === "string" &&
      typeof reaction.emoji === "string" &&
      Number.isFinite(reaction.count) &&
      reaction.count > 0,
  );
}

export function getReactionAggregateTotal(
  reactions: readonly ReactionAggregate[] | null | undefined,
): number {
  return getDisplayableReactionAggregates(reactions).reduce(
    (total, reaction) => total + reaction.count,
    0,
  );
}

export function getReactionType(reaction: NotificationReaction): string {
  return reaction.reaction ?? reaction.reaction_type ?? "unknown";
}

export function getActiveReactionCounts(
  reactions: readonly NotificationReaction[],
): Record<string, number> {
  return reactions.reduce<Record<string, number>>((counts, reaction) => {
    if (!reaction.is_active) return counts;
    const type = getReactionType(reaction);
    counts[type] = (counts[type] ?? 0) + 1;
    return counts;
  }, {});
}

export function getReactionUserLabel(reaction: NotificationReaction): string {
  return (
    reaction.user_display_name ??
    reaction.display_name ??
    reaction.user_name ??
    reaction.user_identifier ??
    reaction.user_aad_id ??
    "Unknown user"
  );
}
