import assert from "node:assert/strict";
import test from "node:test";
import {
  getChannelDisplayName,
  getConfiguredChannels,
  getDisplayableChannels,
  getHierarchyDestinationOptions,
  getInstallationMetrics,
  getHierarchyMetrics,
  getTeamBranchKey,
  getTeamDisplayName,
  getTenantDisplayName,
  isHierarchyEmpty,
  shortenIdentifier,
} from "../lib/teams.ts";

const installedAt = "2026-09-17T04:00:00Z";
const updatedAt = "2026-09-17T04:30:00Z";

const hierarchy = {
  tenant_id: "11111111-2222-3333-4444-555555555555",
  tenant_name: null,
  teams: [
    {
      team_id: "TEAM-1",
      team_name: "rc-test",
      channels: [
        {
          destination_id: "DEST-ACTIVE",
          channel_id: "CHANNEL-111111111111",
          channel_name: null,
          is_active: true,
          installed_at: installedAt,
          updated_at: updatedAt,
        },
        {
          destination_id: "DEST-INACTIVE",
          channel_id: "CHANNEL-222222222222",
          channel_name: "Operations",
          is_active: false,
          installed_at: installedAt,
          updated_at: updatedAt,
        },
      ],
    },
    {
      team_id: "TEAM-2",
      team_name: null,
      channels: [],
    },
  ],
  personal: [
    {
      destination_id: "DEST-PERSONAL-123456",
      is_active: true,
      installed_at: installedAt,
      updated_at: updatedAt,
    },
  ],
};

test("nullable hierarchy names use safe Microsoft Teams fallbacks", () => {
  assert.equal(getTenantDisplayName(hierarchy), "Microsoft Teams Tenant");
  assert.equal(getTeamDisplayName(hierarchy.teams[1]), "Unnamed Team");
  assert.equal(
    getChannelDisplayName(hierarchy.teams[0].channels[0]),
    "Teams channel",
  );
});

test("blank hierarchy names use the same fallbacks as null names", () => {
  assert.equal(
    getTenantDisplayName({ ...hierarchy, tenant_name: "   " }),
    "Microsoft Teams Tenant",
  );
  assert.equal(
    getTeamDisplayName({ ...hierarchy.teams[0], team_name: " " }),
    "Unnamed Team",
  );
  assert.equal(
    getChannelDisplayName({
      ...hierarchy.teams[0].channels[0],
      channel_name: "",
    }),
    "Teams channel",
  );
});

test("channel labels prefer the backend display name", () => {
  assert.equal(
    getChannelDisplayName({
      channel_id: "TEAM-1",
      channel_name: null,
      display_name: "Default channel",
    }),
    "Default channel",
  );
  assert.equal(
    getChannelDisplayName({
      channel_id: "CHANNEL-2",
      channel_name: "Operations",
      display_name: "Operations",
    }),
    "Operations",
  );
});

test("hierarchy metrics count real teams, active channels, and personal destinations", () => {
  assert.deepEqual(getHierarchyMetrics(hierarchy), {
    connectedTeams: 2,
    activeChannels: 1,
    personalDestinations: 1,
  });
});

test("hierarchy is empty only when no team or personal branches exist", () => {
  assert.equal(
    isHierarchyEmpty({
      tenant_id: "tenant",
      tenant_name: null,
      teams: [],
      personal: [],
    }),
    true,
  );
  assert.equal(isHierarchyEmpty(hierarchy), false);
  assert.equal(
    isHierarchyEmpty({ ...hierarchy, teams: [hierarchy.teams[1]], personal: [] }),
    false,
  );
});

test("team branch options retain inactive channels and exact destination IDs", () => {
  const branch = getTeamBranchKey(hierarchy.teams[0]);
  const options = getHierarchyDestinationOptions(hierarchy, branch);

  assert.equal(branch, "team:TEAM-1");
  assert.equal(options.length, 2);
  assert.deepEqual(options[0], {
    destination_id: "DEST-ACTIVE",
    label: "Teams channel",
    secondary: "CHANNEL-…111111",
    is_active: true,
    installed_at: installedAt,
    updated_at: updatedAt,
    kind: "channel",
  });
  assert.equal(options[1].destination_id, "DEST-INACTIVE");
  assert.equal(options[1].is_active, false);
});

test("personal branch stays separate and resolves the exact destination ID", () => {
  const options = getHierarchyDestinationOptions(hierarchy, "personal");

  assert.equal(options.length, 1);
  assert.deepEqual(options[0], {
    destination_id: "DEST-PERSONAL-123456",
    label: "Personal chat",
    secondary: "DEST-PER…123456",
    is_active: true,
    installed_at: installedAt,
    updated_at: updatedAt,
    kind: "personal",
  });
});

test("identifier shortening preserves useful start and end context", () => {
  assert.equal(shortenIdentifier("SHORT"), "SHORT");
  assert.equal(
    shortenIdentifier("11111111-2222-3333-4444-555555555555"),
    "11111111…555555",
  );
});

test("installation metrics use configured state and omit unnamed internal records", () => {
  const installation = {
    tenant_id: "tenant",
    team_id: "team",
    team_name: "Risk",
    is_active: true,
    channels: [
      { tenant_id: "tenant", team_id: "team", channel_id: "primary", channel_name: null, is_primary: true, available: true },
      { tenant_id: "tenant", team_id: "team", channel_id: "configured", channel_name: "Risk", available: true, is_configured: true },
      { tenant_id: "tenant", team_id: "team", channel_id: "available", display_name: "test", available: true, is_configured: false },
      { tenant_id: "tenant", team_id: "team", channel_id: "unavailable", channel_name: "archive", available: false },
    ],
  };

  assert.deepEqual(getDisplayableChannels(installation).map((channel) => channel.channel_id), ["configured", "available", "unavailable"]);
  assert.deepEqual(getInstallationMetrics([installation]), {
    connectedTeams: 1,
    activeTeams: 1,
    totalChannels: 3,
    activeChannels: 2,
    configuredChannels: 1,
    availableChannels: 1,
  });
});

test("risk alert channels require configured state and a backend destination ID", () => {
  const installation = {
    tenant_id: "tenant",
    team_id: "team",
    team_name: "Risk",
    is_active: true,
    channels: [
      { tenant_id: "tenant", team_id: "team", channel_id: "configured", channel_name: "Channel2", is_configured: true, destination_id: "DEST-2" },
      { tenant_id: "tenant", team_id: "team", channel_id: "unconfigured", channel_name: "Channel1", is_configured: false, destination_id: null },
      { tenant_id: "tenant", team_id: "team", channel_id: "general", channel_name: "General", is_configured: false, destination_id: null },
      { tenant_id: "tenant", team_id: "team", channel_id: "missing-destination", channel_name: "Configured but incomplete", is_configured: true, destination_id: null },
    ],
  };

  const configuredChannels = getConfiguredChannels(installation);
  assert.deepEqual(configuredChannels.map((channel) => channel.channel_id), ["configured"]);
  assert.equal(configuredChannels[0].destination_id, "DEST-2");
  assert.deepEqual(getConfiguredChannels({ ...installation, channels: [] }), []);
});
