import type { Destination, Installation, Notification, Risk } from "@/lib/types";

export const mockRisks: Risk[] = [
  {
    risk_id: "RSK-EFRY-O0QT",
    schema_version: 2,
    industry_slug: "distribution-trading",
    industry_name: "Distribution & Trading",
    title: "INVENTORY ACTION REQUIRED",
    severity: "high",
    severity_label: "High",
    subtitle: "Clear 500 units of SKU 21132",
    summary: "Inventory action is required before the next fulfilment cycle.",
    sender: { name: "StratSync Risk Monitor", source: "enterprise-risk-bot", risk_id: "RSK-EFRY-O0QT" },
    entity: { type: "sku", id: "21132", name: "Burberry XYZ Perfume for Men" },
    views: {
      notification: {
        title: "Inventory Snapshot",
        subtitle: "Pricing Recommendation",
        blocks: [
          { type: "key_value", title: "Inventory Snapshot", items: [{ label: "Available units", value: 500 }, { label: "Warehouse", value: "Mumbai" }] },
          { type: "metrics", title: "Pricing Recommendation", items: [{ label: "Recommended price", value: "$72", status: "good" }, { label: "Margin", value: "31%", status: "warning" }, { label: "Units to clear", value: 500 }] },
          { type: "text", title: "Incoming Stock", text: "No replenishment is expected before the action window.", status: "warning", bold: true },
        ],
      },
      details: {
        title: "Inventory details",
        subtitle: "Current stock and timing signals",
        blocks: [{ type: "table", title: "Warehouse snapshot", columns: [{ key: "warehouse", label: "Warehouse" }, { key: "stock", label: "Stock" }, { key: "age", label: "Age" }], rows: [{ warehouse: "Mumbai", stock: 320, age: "127 days" }, { warehouse: "Delhi", stock: 180, age: "119 days" }] }],
      },
      mitigation: {
        title: "Mitigation plan",
        blocks: [{ type: "action_list", title: "Recommended actions", items: [{ order: 1, title: "Approve the pricing recommendation" }, { order: 2, title: "Allocate units to priority accounts" }, { order: 3, title: "Review remaining stock next week" }] }],
      },
    },
    is_active: true,
    status: "active",
  },
  {
    risk_id: "RSK-SUP-0318",
    schema_version: 2,
    industry_slug: "consumer-goods",
    industry_name: "Consumer Goods",
    title: "Critical supplier delay",
    severity: "critical",
    severity_label: "Critical",
    subtitle: "Priority orders may miss their fulfilment window",
    summary: "Primary supplier delivery is delayed by 18 days.",
    sender: { name: "StratSync Risk Monitor", source: "enterprise-risk-bot" },
    entity: { type: "supplier", id: "SUP-0318", name: "Aurelia Supply Co." },
    views: { notification: { blocks: [{ type: "text", title: "Supplier signal", text: "Delivery is delayed by 18 days." }] } },
    is_active: true,
    status: "monitoring",
  },
];

export const mockInstallations: Installation[] = [
  {
    tenant_id: "tenant-demo",
    team_id: "team-risk-operations",
    team_name: "Risk Operations",
    is_active: true,
    installed_at: "2026-08-28T07:30:00Z",
    updated_at: "2026-09-17T04:30:00Z",
    channels: [
      { tenant_id: "tenant-demo", team_id: "team-risk-operations", team_name: "Risk Operations", channel_id: "channel-test2", channel_name: "test2", available: true, updated_at: "2026-09-17T04:30:00Z" },
      { tenant_id: "tenant-demo", team_id: "team-risk-operations", team_name: "Risk Operations", channel_id: "channel-archive", channel_name: "Archive", available: false, updated_at: "2026-09-17T04:30:00Z" },
    ],
  },
];

/* Legacy demo read data is kept isolated because the current backend has no
 * public notification, risk, or destination read APIs yet. */
export const mockDestinations: Destination[] = [
  { destination_id: "DEST-DEMO-1", team_id: "team-risk-operations", team_name: "Risk Operations", channel_id: "channel-test2", channel_name: "test2", scope_type: "channel", is_active: true, installed_at: "2026-08-28T07:30:00Z", updated_at: "2026-09-17T04:30:00Z" },
];

export const mockNotifications: Notification[] = [
  { notification_id: "NOT-DEMO-123", risk_id: "RSK-EFRY-O0QT", risk_title: "INVENTORY ACTION REQUIRED", destination_id: "DEST-DEMO-1", destination_label: "Risk Operations / test2", destination_primary: "Risk Operations", destination_secondary: "test2", notification_type: "risk_view", view_type: "summary", status: "sent", teams_message_id: "safe-demo-message", created_at: "2026-09-06T04:18:00Z", updated_at: "2026-09-06T04:18:00Z", sent_at: "2026-09-06T04:18:00Z", reactions: [{ reaction_id: "DEMO-REACTION-1", reaction_type: "like", icon: "👍", label: "Like", count: 1, user_identifier: "demo-user-1", created_at: "2026-09-06T04:20:00Z", updated_at: "2026-09-06T04:20:00Z", is_active: true }] },
];
