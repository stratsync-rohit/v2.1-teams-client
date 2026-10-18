# Microsoft Teams Hierarchy Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render and select real Microsoft Teams destinations through the authenticated tenant → team → channel hierarchy while preserving the exact two-field notification trigger.

**Architecture:** Add a dedicated hierarchy API/query and a pure `lib/teams.ts` presentation layer. Destinations and send selection consume hierarchy, while notification history/detail retain the already-working flat destination enrichment path; dashboard replaces its one flat destination metric with an active-channel hierarchy metric.

**Tech Stack:** Next.js 16/Vinext, React 19, TypeScript 5.9, TanStack Query 5, React Hook Form, Zod, existing shadcn-style components, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-17-teams-hierarchy-frontend-design.md`

## Global Constraints

- Modify frontend files only; do not modify `../enterprise-risk-bot` or any backend/API implementation.
- Consume `GET /api/teams/hierarchy` through the existing response-envelope client.
- Preserve `POST /api/notifications/trigger` with exactly `risk_id` and `destination_id`.
- Do not add browser tenant handling, routing fields, Microsoft credentials, or mock hierarchy data.
- Preserve existing risk, notification, reaction, Adaptive Card, and query-invalidation flows.
- Render personal destinations separately, never as fabricated teams/channels.
- Never call string methods directly on nullable hierarchy names.
- Git metadata is absent, so checkpoint commits cannot be created.

---

## File Map

- `lib/types.ts`: hierarchy DTOs and renamed dashboard channel metric.
- `lib/teams.ts`: pure hierarchy display, lookup, selection-option, count, and empty-state helpers.
- `tests/teams-hierarchy.test.mjs`: helper regression coverage.
- `lib/api/index.ts`: `teamsApi.hierarchy()`.
- `lib/hooks.ts`: hierarchy query key and hook.
- `components/destinations-screen.tsx`: tenant/team/channel/personal hierarchy UI.
- `components/send-notification-dialog.tsx`: display-only tenant plus team/personal and channel selection.
- `components/dashboard-screen.tsx`: active-channel metric from hierarchy.

---

### Task 1: Hierarchy Types and Pure Helpers

**Files:**
- Modify: `lib/types.ts`
- Create: `lib/teams.ts`
- Create: `tests/teams-hierarchy.test.mjs`

**Interfaces:**
- Produces DTOs: `TeamsHierarchy`, `TeamHierarchy`, `ChannelHierarchy`, `PersonalDestination`.
- Produces selection types: `HierarchyBranchKey`, `HierarchyDestinationOption`.
- Produces helpers: `getTenantDisplayName`, `getTeamDisplayName`, `getChannelDisplayName`, `getTeamBranchKey`, `getHierarchyDestinationOptions`, `getHierarchyMetrics`, `isHierarchyEmpty`, `shortenIdentifier`.

- [x] **Step 1: Write failing fallback and structure tests**

Create `tests/teams-hierarchy.test.mjs` with a literal hierarchy fixture containing a null tenant name, one named team with active and inactive null-named channels, one null-named team, and one personal destination. Assert:

```js
assert.equal(getTenantDisplayName(hierarchy), "Microsoft Teams Tenant");
assert.equal(getTeamDisplayName(hierarchy.teams[1]), "Unnamed Team");
assert.equal(getChannelDisplayName(hierarchy.teams[0].channels[0]), "Teams channel");
assert.deepEqual(getHierarchyMetrics(hierarchy), {
  connectedTeams: 2,
  activeChannels: 1,
  personalDestinations: 1,
});
assert.equal(isHierarchyEmpty(hierarchy), false);
```

Also assert an empty hierarchy is empty and blank names use the same fallbacks as null names.

- [x] **Step 2: Write failing selection-option tests**

For `getHierarchyDestinationOptions(hierarchy, "team:TEAM-1")`, assert both active and inactive channels remain present, null names become `Teams channel`, and the first option resolves to the fixture’s exact `destination_id`. For the `personal` branch, assert one option with label `Personal chat` and the exact personal `destination_id`.

- [x] **Step 3: Run tests and confirm RED**

Run:

```bash
npm run test:unit
```

Expected: failure because `lib/teams.ts` does not exist.

- [x] **Step 4: Add hierarchy DTOs**

Add the four backend-contract interfaces to `lib/types.ts`:

```ts
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
```

Rename `DashboardMetrics.activeDestinations` to `activeChannels`.

- [x] **Step 5: Implement minimal pure helpers**

In `lib/teams.ts`, guard names with a private `nonEmpty()` function. Define:

```ts
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
```

`getHierarchyDestinationOptions` must return backend items even when inactive. A null-named channel uses `Teams channel`; a null-named channel may use shortened `channel_id` as `secondary`. Personal items use `Personal chat` and a shortened destination ID as secondary when multiple records need distinction.

- [x] **Step 6: Run helper tests and confirm GREEN**

Run:

```bash
npm run test:unit
```

Expected: all existing and hierarchy helper tests pass.

---

### Task 2: Hierarchy API and TanStack Query

**Files:**
- Modify: `lib/api/index.ts`
- Modify: `lib/hooks.ts`

**Interfaces:**
- Consumes: `TeamsHierarchy` from Task 1.
- Produces: `teamsApi.hierarchy(): Promise<TeamsHierarchy>`.
- Produces: `queryKeys.teamsHierarchy` and `useTeamsHierarchy()`.

- [x] **Step 1: Add the hierarchy API function**

Import `TeamsHierarchy` and add:

```ts
export const teamsApi = {
  hierarchy: () => apiClient.get<TeamsHierarchy>("/api/teams/hierarchy"),
};
```

Do not wrap this function with `withFallback`; no hierarchy mock exists.

- [x] **Step 2: Add query key and hook**

Import `teamsApi`, add:

```ts
teamsHierarchy: ["teams-hierarchy"] as const,
```

and:

```ts
export function useTeamsHierarchy() {
  return useQuery({
    queryKey: queryKeys.teamsHierarchy,
    queryFn: teamsApi.hierarchy,
  });
}
```

- [x] **Step 3: Run unit tests and typecheck**

Run:

```bash
npm run test:unit
npx tsc --noEmit
```

Expected: unit tests pass; typecheck remains green before component migration.

---

### Task 3: Hierarchical Destinations Page

**Files:**
- Modify: `components/destinations-screen.tsx`

**Interfaces:**
- Consumes: `useTeamsHierarchy()` and Task 1 display/count/empty helpers.
- Produces: hierarchy page with real team nesting and a separate personal section.

- [x] **Step 1: Replace the flat query and metrics**

Use `useTeamsHierarchy()`. Loading returns `LoadingState`; errors pass `query.error.message` to `ErrorState`. Compute the helper metrics and show `Connected Teams`, `Active Channels`, and `Personal Destinations` summaries.

- [x] **Step 2: Render tenant and team hierarchy**

Render a tenant card headed by `getTenantDisplayName(hierarchy)` with shortened tenant ID as secondary metadata. Map every real team to a bordered section headed by `getTeamDisplayName(team)`. If a team has no channels, render `No connected channels for this team.`

- [x] **Step 3: Render channel destinations**

Within each team, render every channel with `getChannelDisplayName(channel)`, active/inactive badge, full destination ID, installed date, and shortened channel ID when the name is missing. Inactive channel cards remain visible with subdued styling.

- [x] **Step 4: Render personal separately and handle empty hierarchy**

Render `hierarchy.personal` under a separate `Personal` section with `Personal chat` cards. If `isHierarchyEmpty(hierarchy)` is true, render `No Microsoft Teams destinations connected`.

- [x] **Step 5: Run lint and typecheck**

Run:

```bash
npm run lint
npx tsc --noEmit
```

Expected: both commands exit successfully.

---

### Task 4: Hierarchical Send Selection

**Files:**
- Modify: `components/send-notification-dialog.tsx`

**Interfaces:**
- Consumes: `useTeamsHierarchy`, `getTeamBranchKey`, `getHierarchyDestinationOptions`, and hierarchy display helpers.
- Preserves: `FormValues = { risk_id: string; destination_id: string }` and `trigger.mutateAsync(values)`.

- [x] **Step 1: Replace flat destination loading**

Remove `useDestinations` and flat destination helpers. Load `useTeamsHierarchy()` and store local `selectedBranch` state as `HierarchyBranchKey | ""`.

- [x] **Step 2: Derive branch and destination options**

Team select options use `getTeamBranchKey(team)` and `getTeamDisplayName(team)`. Add `Personal` only when personal destinations exist. Derive second-level options with `getHierarchyDestinationOptions(hierarchy, selectedBranch)` and resolve `selectedDestination` by `destination_id`.

- [x] **Step 3: Reset destination on branch change**

The Team/Personal select handler must execute:

```ts
setSelectedBranch(value as HierarchyBranchKey);
form.setValue("destination_id", "", { shouldValidate: false });
form.clearErrors("destination_id");
```

Dialog close resets both the form and `selectedBranch`.

- [x] **Step 4: Render display-only tenant and two-stage selectors**

Show `getTenantDisplayName(hierarchy)` above the Team/Personal selector. The second selector is disabled until a branch exists, shows all branch options, and disables any option where `is_active` is false. Show hierarchy loading, empty, and real API error text without substituting mock data.

- [x] **Step 5: Preserve active guard and two-field request**

Submission finds the selected option and rejects it unless `is_active` is true. Keep:

```ts
const result = await trigger.mutateAsync(values);
```

Do not construct a request containing tenant, team, or channel fields.

- [x] **Step 6: Run unit tests, lint, and typecheck**

Run:

```bash
npm run test:unit
npm run lint
npx tsc --noEmit
```

Expected: all commands exit successfully.

---

### Task 5: Dashboard Hierarchy Metric and Full Regression

**Files:**
- Modify: `components/dashboard-screen.tsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: `useTeamsHierarchy()` and `getHierarchyMetrics()`.
- Preserves: risks, notifications, active reactions, and recent-notification data sources.

- [x] **Step 1: Replace flat destination metric source**

Remove `useDestinations`; add `useTeamsHierarchy`. Include hierarchy in loading and error aggregation. Set:

```ts
activeChannels: hierarchy
  ? getHierarchyMetrics(hierarchy).activeChannels
  : 0
```

Change the existing metric metadata key/label from `activeDestinations`/`Active destinations` to `activeChannels`/`Active channels`.

- [x] **Step 2: Document hierarchy endpoint and behavior**

Add `GET /api/teams/hierarchy` to the frontend endpoint list and state that hierarchy failures are never replaced by demo data. Note that notification submission still sends only `risk_id` and `destination_id`.

- [x] **Step 3: Run complete frontend verification**

Run:

```bash
npm run lint
npx tsc --noEmit
npm test
```

Expected: lint and typecheck pass, all unit tests pass, and Vinext production build completes.

- [x] **Step 4: Audit frontend-only scope and payload boundary**

Run:

```bash
rg -n "teams/hierarchy|teamsHierarchy|useTeamsHierarchy" lib components README.md tests
rg -n "tenant_id|team_id|channel_id" components/send-notification-dialog.tsx
rg -n "mutateAsync\(values\)|notifications/trigger" components/send-notification-dialog.tsx lib/api/index.ts
```

Expected: hierarchy references exist only in frontend files; the dialog contains no tenant/team/channel request fields; notification mutation still receives the two-field form values.

- [x] **Step 5: Record workspace handoff**

Report that no Git repository exists, so the verified files remain in the current workspace without a commit or PR.
