# Microsoft Teams Hierarchy Frontend Design

**Date:** 2026-09-17

## Purpose

Replace flat destination browsing and selection in the frontend with the backend-provided tenant → team → channel hierarchy while preserving notification delivery as exactly `risk_id` plus `destination_id`.

This task changes frontend code only. No backend, Bot Framework, MongoDB, Adaptive Card, manifest, authentication, destination-ID, reaction, or routing code will change.

## Backend Contract

The frontend consumes the existing enveloped endpoint:

```text
GET /api/teams/hierarchy
```

Its data contains one authenticated tenant, zero or more teams with channels, and zero or more personal destinations. Tenant, team, and channel names may be null. Routing internals and Microsoft credentials are not part of this contract.

Notification delivery remains:

```json
{
  "risk_id": "...",
  "destination_id": "..."
}
```

## Types

Add `TeamsHierarchy`, `TeamHierarchy`, `ChannelHierarchy`, and `PersonalDestination` to the existing frontend type module. The interfaces mirror the public backend contract without adding tenant, team, or channel routing data to the notification trigger type.

The existing flat `Destination` type remains because notification enrichment already uses the stable flat destination API successfully.

## API and Query Layer

Add `teamsApi.hierarchy()` to the existing API module. It uses the standard enveloped `apiClient.get<TeamsHierarchy>()` method.

Hierarchy retrieval will not have a mock fallback. A hierarchy API failure therefore reaches TanStack Query and the existing error UI in both real and demo configurations.

Add:

- query key `teamsHierarchy: ["teams-hierarchy"]`;
- reusable `useTeamsHierarchy()` hook.

The hook follows existing query conventions and does not send or derive tenant headers in the browser.

## Hierarchy Helpers

Create `lib/teams.ts` as a focused, pure presentation module. It will provide:

- `getTenantDisplayName(hierarchy)` → `tenant_name` or `Microsoft Teams Tenant`;
- `getTeamDisplayName(team)` → `team_name` or `Unnamed Team`;
- `getChannelDisplayName(channel)` → `channel_name` or `Teams channel`;
- channel and personal destination labels;
- safe team/channel lookup for dialog selection;
- active channel, connected team, and personal destination counts;
- an empty-hierarchy check.

All helpers guard nullable names before trimming or comparing. Tenant/team/channel identifiers are secondary metadata only and may be shortened for presentation.

## Destinations Page

The page loads only `useTeamsHierarchy()` and renders:

1. A tenant summary headed by its display name.
2. One team section per backend team.
3. Channel cards nested within their real team.
4. A separate Personal section containing personal-chat destinations.

Each channel or personal destination shows:

- safe display name;
- active/inactive badge;
- destination ID;
- installed timestamp;
- optional shortened channel/team ID metadata when a name is missing.

Inactive destinations stay visible. If teams and personal arrays contain no destinations, the page shows `No Microsoft Teams destinations connected`. Loading and API failures use existing loading/error components and real backend messages.

## Send Notification Dialog

The dialog continues using React Hook Form with only:

```ts
{ risk_id: string; destination_id: string }
```

Hierarchy selection adds local UI state for a selected branch:

- tenant is display-only;
- first select chooses a real team or the separate Personal branch;
- second select chooses a channel or personal destination;
- inactive second-level options are visible but disabled;
- changing the first select clears `destination_id` and its validation state;
- selected second-level item resolves directly to its backend `destination_id`.

Submission, success state, notification-ID display, query invalidation, and toast behavior remain unchanged. Team and channel IDs never enter the mutation input.

## Notification History and Detail

Existing flat destination retrieval remains the source for notification enrichment. This avoids changing a working notification/reaction pipeline and already produces labels such as `rc-test / Teams channel` safely.

No notification or reaction contract changes are required.

## Dashboard

Replace the dashboard’s current flat `activeDestinations` metric source with the hierarchy query. The existing card becomes `Active channels` and counts only active team channels.

No new dashboard cards are added. Personal destinations remain visible and counted on the Destinations page, where the hierarchy is fully represented.

Dashboard loading/error behavior includes the hierarchy query alongside risks and notifications.

## Error and Empty States

- Hierarchy network/envelope errors propagate to the existing `ErrorState` with the backend message.
- No mock hierarchy is returned.
- Empty hierarchy data produces a dedicated empty state.
- A team with no channels remains visible and shows that it has no connected channels.
- Personal destinations are never fabricated as teams or channels.

## Test Strategy

Add test-first unit coverage for pure hierarchy helpers:

- null tenant name → `Microsoft Teams Tenant`;
- null team name → `Unnamed Team`;
- null channel name → `Teams channel`;
- personal labels remain separate;
- connected-team and active-channel counts;
- inactive channels remain in lookup results but retain `is_active: false`;
- team/channel lookup resolves the correct `destination_id`;
- hierarchy emptiness detection.

Existing API-client and notification-normalization tests remain unchanged. After implementation run:

```bash
npm run lint
npx tsc --noEmit
npm test
```

`npm test` executes unit tests and the production build.

## Acceptance Criteria

- Tenant → Team → Channel renders from `GET /api/teams/hierarchy`.
- Personal destinations render in a separate branch.
- Null names always use the specified fallback labels.
- Inactive destinations remain visible and cannot be selected.
- Changing Team/Personal branch resets destination selection.
- The selected item resolves to one real `destination_id`.
- Notification trigger payload remains exactly `risk_id` and `destination_id`.
- Existing notification/reaction enrichment remains intact.
- Demo fallback does not conceal hierarchy errors.
- No backend file changes.
- Unit tests, TypeScript, lint, and production build pass.

## Known Limitation

The current frontend supports one authenticated tenant at a time, matching the backend endpoint. Tenant selection is therefore display-only. Multi-tenant switching would require a separate authenticated product flow and is outside this task.
