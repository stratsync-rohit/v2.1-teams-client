import type {
  BackendNotification,
  BackendReaction,
  Destination,
  NotificationViewModel,
  ReactionViewModel,
  Risk,
} from "../types.js";

export interface DestinationPresentation {
  primary: string;
  secondary: string | null;
}

export function getNotificationViewLabel(viewType?: string): string {
  if (viewType === "summary") return "Summary";
  if (viewType === "details") return "Details";
  if (viewType === "mitigation") return "Mitigation";
  return viewType ? titleCase(viewType) : "Summary";
}

const reactionPresentation: Record<string, { icon: string; label: string }> = {
  like: { icon: "👍", label: "Like" },
  heart: { icon: "❤️", label: "Heart" },
  laugh: { icon: "😆", label: "Laugh" },
  surprised: { icon: "😮", label: "Surprised" },
  sad: { icon: "😢", label: "Sad" },
  angry: { icon: "😠", label: "Angry" },
};

function nonEmpty(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function titleCase(value: string): string {
  const words = value
    .trim()
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  return words.join(" ") || "Reaction";
}

export function getReactionPresentation(reaction: string): { icon: string; label: string } {
  return reactionPresentation[reaction.toLowerCase()] ?? {
    icon: "🙂",
    label: titleCase(reaction),
  };
}

export function getDestinationPresentation(
  destination: Destination,
): DestinationPresentation {
  const teamName = nonEmpty(destination.team_name);
  const channelName = nonEmpty(destination.channel_name);

  if (destination.scope_type === "personal") {
    return { primary: "Personal chat", secondary: null };
  }

  if (destination.scope_type === "group") {
    return {
      primary: channelName ?? teamName ?? "Group chat",
      secondary: null,
    };
  }

  if (destination.scope_type === "channel") {
    if (teamName) {
      return {
        primary: teamName,
        secondary: channelName ?? "Teams channel",
      };
    }
    if (channelName) {
      return { primary: channelName, secondary: "Teams channel" };
    }
    return { primary: "Teams channel", secondary: null };
  }

  if (teamName && channelName) {
    return { primary: teamName, secondary: channelName };
  }
  return {
    primary: teamName ?? channelName ?? "Teams destination",
    secondary: null,
  };
}

export function getDestinationLabel(destination: Destination): string {
  const presentation = getDestinationPresentation(destination);
  return presentation.secondary
    ? `${presentation.primary} / ${presentation.secondary}`
    : presentation.primary;
}

export function getDestinationGroupLabel(destination: Destination): string {
  if (destination.scope_type === "personal") return "Personal chats";
  if (destination.scope_type === "group") return "Group chats";
  if (destination.scope_type === "channel") {
    return nonEmpty(destination.team_name) ?? "Teams channels";
  }
  return "Other destinations";
}

export function normalizeReaction(raw: BackendReaction): ReactionViewModel {
  const presentation = reactionPresentation[raw.reaction.toLowerCase()] ?? {
    icon: "•",
    label: titleCase(raw.reaction),
  };

  return {
    reaction_id: raw.reaction_id,
    reaction_type: raw.reaction,
    icon: presentation.icon,
    label: presentation.label,
    count: 1,
    user_identifier: raw.user_aad_id,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    is_active: raw.is_active,
  };
}

export function countActiveReactions(
  reactions: readonly ReactionViewModel[],
): number {
  return reactions
    .filter((reaction) => reaction.is_active)
    .reduce((total, reaction) => total + reaction.count, 0);
}

export function enrichNotification(
  raw: BackendNotification,
  risks: readonly Pick<Risk, "risk_id" | "title">[],
  destinations: readonly Destination[],
  reactions: readonly BackendReaction[],
): NotificationViewModel {
  const risk = risks.find((item) => item.risk_id === raw.risk_id);
  const destination = destinations.find(
    (item) => item.destination_id === raw.destination_id,
  );
  const presentation = destination
    ? getDestinationPresentation(destination)
    : { primary: raw.destination_id, secondary: null };

  return {
    notification_id: raw.notification_id,
    risk_id: raw.risk_id,
    risk_title: risk?.title ?? raw.risk_id,
    destination_id: raw.destination_id,
    destination_label: destination
      ? getDestinationLabel(destination)
      : raw.destination_id,
    destination_primary: presentation.primary,
    destination_secondary: presentation.secondary,
    notification_type: raw.notification_type,
    view_type: raw.view_type,
    status: raw.status,
    teams_message_id: raw.teams_message_id,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    sent_at: raw.created_at,
    reactions: reactions.map(normalizeReaction),
  };
}
