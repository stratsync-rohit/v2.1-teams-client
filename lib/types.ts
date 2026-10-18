export type Severity =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | (string & {});
export type RiskStatus = "active" | "monitoring" | "resolved" | (string & {});
export type NotificationStatus = "sent" | "failed" | "pending" | (string & {});
export type NotificationType = string & {};
export type NotificationViewType = "summary" | "details" | "mitigation" | (string & {});
export type DestinationScope =
  | "channel"
  | "group"
  | "personal"
  | (string & {});

export interface RiskSender {
  name?: string;
  source?: string;
  risk_id?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface RiskEntity {
  type?: string;
  id?: string;
  name?: string;
  [key: string]: unknown;
}

export interface KeyValueItem {
  label?: string;
  value?: unknown;
}

export interface MetricItem {
  label?: string;
  value?: unknown;
  status?: string;
}

export interface TableColumn {
  key: string;
  label: string;
}

export interface KeyValueBlock {
  type: "key_value";
  title?: string;
  items?: KeyValueItem[];
  [key: string]: unknown;
}

export interface MetricsBlock {
  type: "metrics";
  title?: string;
  items?: MetricItem[];
  [key: string]: unknown;
}

export interface TextBlock {
  type: "text";
  title?: string;
  text?: unknown;
  status?: string;
  bold?: boolean;
  [key: string]: unknown;
}

export interface TableBlock {
  type: "table";
  title?: string;
  columns?: TableColumn[];
  rows?: Record<string, unknown>[];
  [key: string]: unknown;
}

export interface ActionListItem {
  order?: number;
  title?: string;
  [key: string]: unknown;
}

export interface ActionListBlock {
  type: "action_list";
  title?: string;
  items?: ActionListItem[];
  [key: string]: unknown;
}

export interface UnknownRiskBlock {
  type?: string;
  [key: string]: unknown;
}

export type RiskBlock =
  | KeyValueBlock
  | MetricsBlock
  | TextBlock
  | TableBlock
  | ActionListBlock
  | UnknownRiskBlock;

export interface RiskView {
  title?: string;
  subtitle?: string;
  action_label?: string;
  blocks?: RiskBlock[];
  [key: string]: unknown;
}

export interface Risk {
  risk_id: string;
  schema_version?: number;
  card_id?: string;
  industry_slug?: string;
  industry_name?: string;
  title: string;
  severity?: Severity;
  severity_label?: string;
  subtitle?: string;
  summary?: string;
  sender?: RiskSender;
  entity?: RiskEntity;
  views?: {
    notification?: RiskView;
    details?: RiskView;
    mitigation?: RiskView;
    [key: string]: RiskView | undefined;
  };
  metadata?: Record<string, unknown>;
  is_active?: boolean;
  status?: RiskStatus;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface DiscoveredChannel {
  tenant_id: string;
  team_id: string;
  team_name?: string | null;
  channel_id: string;
  channel_name?: string | null;
  display_name?: string | null;
  resolution_status?: string | null;
  conversation_id?: string | null;
  service_url?: string | null;
  available?: boolean;
  connected?: boolean;
  is_configured?: boolean;
  status_label?: string | null;
  destination_id?: string | null;
  is_primary?: boolean;
  discovered_at?: string | null;
  updated_at?: string | null;
}

export interface Installation {
  tenant_id: string;
  team_id: string;
  team_name?: string | null;
  conversation_id?: string | null;
  service_url?: string | null;
  is_active: boolean;
  installed_at?: string | null;
  updated_at?: string | null;
  uninstalled_at?: string | null;
  channels: DiscoveredChannel[];
}

export interface ResolveDestinationInput {
  tenant_id: string;
  team_id: string;
  channel_id: string;
}

export interface ResolvedDestination {
  destination_id: string;
  tenant_id: string;
  team_id: string;
  team_name?: string | null;
  channel_id: string;
  channel_name?: string | null;
  is_active: boolean;
}

export interface SendNotificationInput {
  destination_id: string;
  risk_id: string;
}

export interface SendNotificationResult {
  notification_id: string;
  destination_id: string;
  status: NotificationStatus;
}

/** The current aggregate reaction state reported by the Teams backend. */
export interface ReactionAggregate {
  reaction: string;
  emoji: string;
  count: number;
}

export interface ReactionSummary {
  reactions: ReactionAggregate[];
}

export interface NotificationRecord {
  notification_id: string;
  risk_id?: string | null;
  risk_title?: string | null;
  destination_id?: string | null;
  destination_label?: string | null;
  destination_primary?: string | null;
  destination_secondary?: string | null;
  tenant_id?: string | null;
  team_id?: string | null;
  channel_id?: string | null;
  notification_type?: string | null;
  view_type?: string | null;
  status: NotificationStatus;
  teams_message_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  sent_at?: string | null;
  reaction_summary?: ReactionSummary;
  reactions?: NotificationReaction[];
}

export interface NotificationReaction {
  reaction_id?: string;
  reaction?: string;
  reaction_type?: string;
  user_aad_id?: string | null;
  user_identifier?: string | null;
  user_display_name?: string | null;
  display_name?: string | null;
  user_name?: string | null;
  is_active: boolean;
  teams_message_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface NotificationReactionsData {
  notification_id?: string;
  /** Aggregate chips for the notification; this is the source of truth for totals. */
  reactions?: ReactionAggregate[];
  /** Optional per-user audit data, including removed reactions when requested. */
  reaction_states?: NotificationReaction[];
}

export interface NotificationListParams {
  risk_id?: string;
  destination_id?: string;
  status?: string;
  notification_type?: string;
  view_type?: string;
  limit?: number;
}

/* Legacy read-model types remain for demo notification history normalization.
 * They are not used by the live Teams send flow. */
export interface Destination {
  destination_id: string;
  team_id: string | null;
  team_name: string | null;
  channel_id: string | null;
  channel_name: string | null;
  scope_type: DestinationScope;
  is_active: boolean;
  installed_at: string;
  updated_at: string;
}

export interface TeamsHierarchy {
  tenant_id: string;
  tenant_name: string | null;
  teams: TeamHierarchy[];
  personal: PersonalDestination[];
}

export interface TeamHierarchy {
  team_id: string;
  team_name: string | null;
  channels: ChannelHierarchy[];
}

export interface ChannelHierarchy {
  destination_id: string;
  channel_id: string;
  channel_name: string | null;
  is_active: boolean;
  installed_at: string;
  updated_at: string;
}

export interface PersonalDestination {
  destination_id: string;
  is_active: boolean;
  installed_at: string;
  updated_at: string;
}

export interface BackendNotification {
  notification_id: string;
  risk_id: string;
  destination_id: string;
  tenant_id: string;
  notification_type?: NotificationType;
  view_type?: NotificationViewType;
  teams_message_id: string | null;
  created_at: string;
  updated_at: string;
  status: NotificationStatus;
}

export interface BackendReaction {
  reaction_id: string;
  notification_id: string;
  risk_id: string;
  destination_id: string;
  tenant_id: string;
  teams_message_id: string;
  user_aad_id: string;
  reaction: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReactionViewModel {
  reaction_id: string;
  reaction_type: string;
  icon: string;
  label: string;
  count: 1;
  user_identifier: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface NotificationViewModel {
  notification_id: string;
  risk_id: string;
  risk_title: string;
  destination_id: string;
  destination_label: string;
  destination_primary: string;
  destination_secondary: string | null;
  notification_type?: NotificationType;
  view_type?: NotificationViewType;
  status: NotificationStatus;
  teams_message_id: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string;
  reactions: ReactionViewModel[];
}

export type Reaction = ReactionViewModel;
export type Notification = NotificationViewModel;

export interface ApiErrorShape {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorShape | null;
}

export interface DashboardMetrics {
  totalActiveRisks: number;
  highSeverityRisks: number;
  activeChannels: number;
  notificationsSent: number;
  failedNotifications: number;
  totalReactions: number;
}
