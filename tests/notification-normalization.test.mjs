import assert from "node:assert/strict";
import test from "node:test";
import {
  countActiveReactions,
  enrichNotification,
  getDestinationGroupLabel,
  getDestinationLabel,
  getDestinationPresentation,
  normalizeReaction,
} from "../lib/api/normalization.ts";

const installedAt = "2026-09-17T04:00:00Z";
const updatedAt = "2026-09-17T04:30:00Z";

const channelWithoutName = {
  destination_id: "DEST-EFA9E4ED15F563E9",
  team_id: "team-1",
  team_name: "rc-test",
  channel_id: "channel-1",
  channel_name: null,
  scope_type: "channel",
  is_active: true,
  installed_at: installedAt,
  updated_at: updatedAt,
};

const personalDestination = {
  destination_id: "DEST-PERSONAL",
  team_id: null,
  team_name: null,
  channel_id: null,
  channel_name: null,
  scope_type: "personal",
  is_active: true,
  installed_at: installedAt,
  updated_at: updatedAt,
};

const groupDestination = {
  ...personalDestination,
  destination_id: "DEST-GROUP",
  channel_name: "Procurement leads",
  scope_type: "group",
};

const rawLike = {
  reaction_id: "REACTION-1",
  notification_id: "NOT-1",
  risk_id: "RSK-1",
  destination_id: channelWithoutName.destination_id,
  tenant_id: "tenant-must-not-reach-view-model",
  teams_message_id: "teams-message-1",
  user_aad_id: "aad-user-1",
  reaction: "like",
  is_active: true,
  created_at: "2026-09-17T05:00:00Z",
  updated_at: "2026-09-17T05:00:00Z",
};

const rawNotification = {
  notification_id: "NOT-1",
  risk_id: "RSK-1",
  destination_id: channelWithoutName.destination_id,
  tenant_id: "tenant-must-not-reach-view-model",
  notification_type: "initial_alert",
  teams_message_id: null,
  created_at: "2026-09-17T04:45:00Z",
  updated_at: "2026-09-17T04:46:00Z",
  status: "sent",
};

test("channel destination uses a Teams channel fallback when channel name is null", () => {
  assert.deepEqual(getDestinationPresentation(channelWithoutName), {
    primary: "rc-test",
    secondary: "Teams channel",
  });
  assert.equal(
    getDestinationLabel(channelWithoutName),
    "rc-test / Teams channel",
  );
});

test("personal and group destinations receive scope-aware labels", () => {
  assert.equal(getDestinationLabel(personalDestination), "Personal chat");
  assert.equal(getDestinationGroupLabel(personalDestination), "Personal chats");
  assert.equal(getDestinationLabel(groupDestination), "Procurement leads");
  assert.equal(getDestinationGroupLabel(groupDestination), "Group chats");
});

test("known backend reaction maps to one UI reaction record", () => {
  assert.deepEqual(normalizeReaction(rawLike), {
    reaction_id: "REACTION-1",
    reaction_type: "like",
    icon: "👍",
    label: "Like",
    count: 1,
    user_identifier: "aad-user-1",
    created_at: "2026-09-17T05:00:00Z",
    updated_at: "2026-09-17T05:00:00Z",
    is_active: true,
  });
});

test("unknown backend reaction gets a readable fallback", () => {
  const reaction = normalizeReaction({ ...rawLike, reaction: "surprised_face" });

  assert.equal(reaction.icon, "•");
  assert.equal(reaction.label, "Surprised Face");
});

test("removed reactions remain in history but do not count as engagement", () => {
  const active = normalizeReaction(rawLike);
  const removed = normalizeReaction({
    ...rawLike,
    reaction_id: "REACTION-2",
    is_active: false,
  });

  assert.equal(countActiveReactions([active, removed]), 1);
  assert.equal(removed.is_active, false);
});

test("notification enrichment resolves business metadata and omits tenant data", () => {
  const risk = { risk_id: "RSK-1", title: "Supply risk" };
  const enriched = enrichNotification(
    rawNotification,
    [risk],
    [channelWithoutName],
    [rawLike],
  );

  assert.equal(enriched.risk_title, "Supply risk");
  assert.equal(enriched.destination_label, "rc-test / Teams channel");
  assert.equal(enriched.destination_primary, "rc-test");
  assert.equal(enriched.destination_secondary, "Teams channel");
  assert.equal(enriched.sent_at, rawNotification.created_at);
  assert.equal(enriched.reactions.length, 1);
  assert.equal("tenant_id" in enriched, false);
  assert.equal("tenant_id" in enriched.reactions[0], false);
});

test("notification enrichment falls back to identifiers for missing joins", () => {
  const enriched = enrichNotification(rawNotification, [], [], []);

  assert.equal(enriched.risk_title, "RSK-1");
  assert.equal(enriched.destination_label, channelWithoutName.destination_id);
  assert.equal(enriched.destination_primary, channelWithoutName.destination_id);
  assert.equal(enriched.destination_secondary, null);
});
