import type {
  ChannelHierarchy,
  DiscoveredChannel,
  Installation,
  TeamHierarchy,
  TeamsHierarchy,
} from "./types.js";

function nonEmpty(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function getInstallationDisplayName(installation: Installation): string {
  return nonEmpty(installation.team_name) ?? installation.team_id;
}

export function getChannelDisplayName(channel: Pick<DiscoveredChannel, "channel_id" | "channel_name" | "display_name"> & { destination_id?: string | null }): string {
  return nonEmpty(channel.display_name) ?? nonEmpty(channel.channel_name) ?? (channel.destination_id ? "Teams channel" : channel.channel_id);
}

export function hasChannelDisplayName(channel: Pick<DiscoveredChannel, "channel_name" | "display_name">): boolean {
  return Boolean(nonEmpty(channel.display_name) ?? nonEmpty(channel.channel_name));
}

export function getDisplayableChannels(installation: Installation): DiscoveredChannel[] {
  return installation.channels.filter(hasChannelDisplayName);
}

export function getActiveInstallations(installations: readonly Installation[]): Installation[] {
  return installations.filter((installation) => installation.is_active);
}

export function getAvailableChannels(installation: Installation): DiscoveredChannel[] {
  return installation.is_active
    ? installation.channels.filter((channel) => channel.available !== false)
    : [];
}

/**
 * Channels that are safe to target from the risk-alert flow. A configured
 * destination ID is supplied by the backend and must be used as-is when
 * sending; discovered-but-unconfigured channels stay available to the
 * installation management UI only.
 */
export function getConfiguredChannels(installation: Installation): DiscoveredChannel[] {
  return installation.channels.filter(
    (channel) => channel.is_configured === true && Boolean(channel.destination_id),
  );
}

export interface InstallationMetrics {
  connectedTeams: number;
  activeTeams: number;
  totalChannels: number;
  activeChannels: number;
  configuredChannels: number;
  availableChannels: number;
}

export function getInstallationMetrics(installations: readonly Installation[]): InstallationMetrics {
  return {
    connectedTeams: installations.length,
    activeTeams: getActiveInstallations(installations).length,
    totalChannels: installations.reduce((total, installation) => total + getDisplayableChannels(installation).length, 0),
    activeChannels: installations.reduce(
      (total, installation) => total + (installation.is_active ? getDisplayableChannels(installation).filter((channel) => channel.available !== false).length : 0),
      0,
    ),
    configuredChannels: installations.reduce(
      (total, installation) => total + getDisplayableChannels(installation).filter((channel) => channel.is_configured === true).length,
      0,
    ),
    availableChannels: installations.reduce(
      (total, installation) => total + getDisplayableChannels(installation).filter((channel) => channel.is_configured !== true && channel.available !== false).length,
      0,
    ),
  };
}

export function shortenIdentifier(value: string): string {
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

/* Deprecated hierarchy helpers are retained only for the existing unit tests
 * and any old non-production consumers. No current screen uses them. */
export type HierarchyBranchKey = `team:${string}` | "personal";
export interface HierarchyDestinationOption {
  destination_id: string;
  label: string;
  secondary: string | null;
  is_active: boolean;
  installed_at: string;
  updated_at: string;
  kind: "channel" | "personal";
}
export interface HierarchyMetrics { connectedTeams: number; activeChannels: number; personalDestinations: number; }
export function getTenantDisplayName(hierarchy: TeamsHierarchy): string { return nonEmpty(hierarchy.tenant_name) ?? "Microsoft Teams Tenant"; }
export function getTeamDisplayName(team: TeamHierarchy): string { return nonEmpty(team.team_name) ?? "Unnamed Team"; }
export function getTeamBranchKey(team: TeamHierarchy): HierarchyBranchKey { return `team:${team.team_id}`; }
export function getHierarchyDestinationOptions(hierarchy: TeamsHierarchy, branch: HierarchyBranchKey): HierarchyDestinationOption[] {
  if (branch === "personal") return hierarchy.personal.map((destination) => ({ destination_id: destination.destination_id, label: "Personal chat", secondary: shortenIdentifier(destination.destination_id), is_active: destination.is_active, installed_at: destination.installed_at, updated_at: destination.updated_at, kind: "personal" }));
  const team = hierarchy.teams.find((item) => item.team_id === branch.slice("team:".length));
  return team?.channels.map((channel: ChannelHierarchy) => ({ destination_id: channel.destination_id, label: getChannelDisplayName(channel), secondary: nonEmpty(channel.channel_name) ? null : shortenIdentifier(channel.channel_id), is_active: channel.is_active, installed_at: channel.installed_at, updated_at: channel.updated_at, kind: "channel" })) ?? [];
}
export function getHierarchyMetrics(hierarchy: TeamsHierarchy): HierarchyMetrics {
  return { connectedTeams: hierarchy.teams.length, activeChannels: hierarchy.teams.reduce((total, team) => total + team.channels.filter((channel) => channel.is_active).length, 0), personalDestinations: hierarchy.personal.length };
}
export function isHierarchyEmpty(hierarchy: TeamsHierarchy): boolean { return hierarchy.teams.length === 0 && hierarchy.personal.length === 0; }
