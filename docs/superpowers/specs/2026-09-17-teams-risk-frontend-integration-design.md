# Microsoft Teams Risk Frontend Integration Design

**Date:** 2026-09-17

## Purpose

Integrate the existing Next.js/Vinext frontend with the working FastAPI Microsoft Teams risk-notification backend. The integration must use real risks, destinations, notifications, and reactions without changing the verified Teams bot flow, Adaptive Cards, destination identifiers, MongoDB schemas, or delivery behavior.

## Existing System

The backend already supports the complete Teams lifecycle:

1. Teams posts installation and interaction activities to `POST /api/messages`.
2. Installation stores a tenant-scoped destination and its private conversation reference.
3. The frontend calls `POST /api/notifications/trigger` with only `risk_id` and `destination_id`.
4. The backend resolves the saved destination and proactively sends an Adaptive Card through `CloudAdapter`.
5. Card actions and Teams reaction activities return through `/api/messages` and are persisted by existing services.

The frontend already has screens and query hooks for risks, destinations, notifications, details, and dashboard metrics, but its current models assume enriched backend responses and non-null Teams metadata. Demo fallback is also enabled unless explicitly disabled.

## Scope and Constraints

The implementation will:

- Add configurable backend CORS support.
- Make frontend demo fallback opt-in.
- Support raw health/readiness responses separately from enveloped business APIs.
- Align destination types and presentation with nullable Teams metadata.
- Separate backend notification/reaction DTOs from frontend view models.
- Normalize and enrich notification data in the frontend API layer.
- Count only active reactions as current engagement.
- Update affected screens, tests, examples, and documentation.

The implementation will not change:

- `/api/messages` or Bot Framework authentication.
- Bot event handlers or installation callbacks.
- Adaptive Card builders or action behavior.
- Destination or risk identifier generation.
- MongoDB schemas, collections, or repositories.
- Conversation-reference storage or notification delivery logic.
- Teams manifest, app registration, or tunnel configuration.

## Backend Design

### CORS settings

`Settings` will accept `CORS_ALLOWED_ORIGINS` as a comma-separated environment value. Parsing will trim whitespace, remove empty entries, and return an explicit list of origins. An empty value means no cross-origin browser access. Wildcard configuration will be rejected because the middleware uses credentials-compatible behavior and production origins must be explicit.

The application factory will register Starlette/FastAPI `CORSMiddleware` with:

- origins from the parsed setting;
- credentials enabled for compatibility with future authenticated tenant context;
- standard methods and headers needed by the frontend;
- no hardcoded production origin.

The backend `.env.example` will include:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

The actual Vite configuration does not override the port, so Vite's normal local origin is port 5173. Both hostname variants are included for local use.

### Existing API behavior

Health and readiness endpoints will remain raw JSON responses. Business APIs will retain the existing `{ success, data, error }` envelope.

The destination service already returns `DestinationSummary` for lists, excluding tenant and private routing data. The destination detail route manually exposes only safe metadata. These boundaries will remain unchanged.

Notification and reaction persistence models remain unchanged. Tenant identifiers returned in their current raw API documents will not be represented in frontend public/view-model types or rendered by the UI.

## Frontend Data Model

### Public destination

The frontend `Destination` model will contain:

```ts
interface Destination {
  destination_id: string;
  team_id: string | null;
  team_name: string | null;
  channel_id: string | null;
  channel_name: string | null;
  scope_type: "channel" | "group" | "personal" | string;
  is_active: boolean;
  installed_at: string;
  updated_at: string;
}
```

It will not require or expose `tenant_id`.

### Backend DTOs

`BackendNotification` will reflect the backend notification response: identifiers, type, optional Teams message ID, timestamps, and delivery status. `BackendReaction` will reflect one persisted user's reaction state, including its active flag and timestamps. Backend-only tenant identifiers may be tolerated structurally when decoding, but will not be copied into frontend view models.

### Presentation models

The existing UI-facing notification model will be replaced or clarified as a view model containing:

- raw notification identifiers and status;
- resolved risk title with `risk_id` fallback;
- scope-aware destination labels with `destination_id` fallback;
- `created_at` presented as the current sent/created timestamp;
- normalized reactions.

Each normalized reaction will contain a stable reaction identifier, the raw Teams reaction type, a display icon/name, `user_aad_id` mapped to `user_identifier`, `count: 1`, timestamps, and `is_active`.

Known reactions will map to friendly icons and labels. Unknown types will use a neutral icon and a human-readable label derived from the raw value.

## Destination Presentation

Reusable helpers will produce consistent, null-safe labels:

- `personal` → primary label `Personal chat`.
- `group` → available group/team metadata, otherwise `Group chat`.
- `channel` → team name when available and channel name when available; a missing channel name becomes `Teams channel`.
- unknown scopes → best available metadata, otherwise `Teams destination`.

For the verified channel destination with `team_name = "rc-test"` and `channel_name = null`, the combined selector/history label will be `rc-test / Teams channel`.

Destination grouping will use scope-aware group keys instead of nullable team names. Search and filtering will normalize only already-safe strings; no nullable value will receive a direct `.toLowerCase()` call.

Inactive destinations remain visible but disabled in send controls. Submission retains a second active-state guard.

## API Client and Data Flow

The API client will expose two response modes:

- enveloped `get`/`post` methods for business APIs;
- raw `getRaw` for `/health` and `/ready`.

Both modes will preserve network and invalid-JSON error handling. Enveloped requests will continue surfacing backend error codes and messages through `ApiClientError`.

Demo fallback will be enabled only when:

```ts
process.env.NEXT_PUBLIC_ENABLE_DEMO_FALLBACK === "true"
```

When disabled, backend failures propagate to query error states and notification sends cannot fabricate success.

Notification list loading will:

1. Fetch raw notifications, risks, and destinations.
2. Fetch reaction history for each notification.
3. Normalize reactions.
4. Resolve risk and destination presentation metadata.
5. Return frontend notification view models.

Notification detail loading will apply the same enrichment rules to one notification. Missing related risk or destination records will not crash rendering; identifiers and generic destination labels will be used as fallbacks.

This MVP uses one reaction request per notification in the list. The code will keep this behavior centralized and understandable. A batch reaction-summary endpoint is a future optimization, not part of this integration.

## Screen Behavior

### Send notification

The dialog will continue sending exactly:

```json
{
  "risk_id": "...",
  "destination_id": "..."
}
```

Only active destinations can be selected or submitted. On success the dialog displays the real backend notification ID and invalidates notification queries so history/dashboard can refresh.

### Destinations

The screen will group channel, group-chat, and personal destinations cleanly. Null metadata will never render as `null`, `undefined`, or `# null`.

### Notification history

The screen will use enriched real notification data for identifiers, risk title, destination, type, status, active reaction count, timestamp, and detail navigation. Search, date filtering, and destination selectors will use safe display values.

### Notification detail

The screen will show the notification and risk identifiers, resolved title and destination, type, status, optional Teams message ID, timestamp, and complete reaction history. Active reactions contribute to the engagement total; removed reactions remain visible and are labeled `Removed`. User values are identified only as stored user identifiers, not names or email addresses.

### Dashboard

Metrics will derive from real query results:

- active risks;
- critical/high risks;
- active destinations;
- sent notifications;
- failed notifications;
- active Teams reactions.

Only reactions with `is_active === true` count as current engagement.

### Settings

The settings screen will accurately describe fallback as an explicit demo mode rather than an automatic response to backend failure.

## Error Handling

Backend envelope errors such as `DESTINATION_INACTIVE`, `DESTINATION_NOT_FOUND`, `NOTIFICATION_NOT_FOUND`, and `VALIDATION_ERROR` will preserve their messages. Network failures remain `BACKEND_UNAVAILABLE`. Components will show existing error states or send-dialog toasts without substituting mock success when demo mode is off.

Malformed raw or enveloped responses will surface as `INVALID_RESPONSE` or `REQUEST_FAILED`, as appropriate.

## Security Boundary

The browser will receive and send only public business data. No frontend environment variable or model will contain Microsoft credentials, access tokens, MongoDB URLs, conversation references, or service URLs. The frontend will not hardcode or submit a tenant ID. Local tenant selection remains a backend-only `DEV_TENANT_ID` configuration.

Only `NEXT_PUBLIC_API_BASE_URL` and the non-secret demo-mode flag are public frontend settings.

## Testing Strategy

Test-first regression coverage will be added before implementation where practical.

Backend tests will verify:

- comma-separated CORS origin parsing;
- whitespace/empty-entry handling;
- wildcard rejection;
- configured middleware behavior, including preflight from an allowed origin;
- unchanged trigger request constraints.

Frontend tests will verify pure normalization helpers:

- nullable channel metadata labels;
- personal and group labels;
- risk/destination fallbacks;
- known and unknown reaction mappings;
- removed reactions excluded from active totals;
- backend tenant fields absent from resulting view models.

Verification commands:

```bash
# Backend
pytest -q tests/test_cors.py tests/test_notifications.py
pytest -q

# Frontend
npm run lint
npm test
npm run build
```

If the current frontend test script requires tests that do not yet exist, normalization tests will establish that test suite rather than skipping it.

## Environment and Local Operation

Backend local environment names:

```env
APP_ENV=development
DEV_TENANT_ID=<real-development-Teams-tenant>
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Frontend local environment:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3978
NEXT_PUBLIC_ENABLE_DEMO_FALLBACK=false
```

Microsoft and MongoDB secret values remain in the existing backend `.env` and will not be read, printed, overwritten, or copied into frontend files.

## Acceptance Criteria

The integration is complete when:

- real backend risks and destinations render in the frontend;
- backend errors are visible with demo fallback disabled;
- nullable destination metadata renders cleanly across all screens;
- the browser sends only `risk_id` and `destination_id` to trigger delivery;
- real notification history/detail are enriched safely in the frontend;
- real reaction history renders, removed entries remain visible, and only active entries count as engagement;
- CORS allows configured frontend origins;
- health checks use raw-response parsing while business APIs retain envelope validation;
- no private routing data or credentials are introduced into frontend code;
- backend focused/full tests and frontend lint/tests/build pass;
- exact local run and manual Teams E2E steps are documented in the final report.

## Known Limitation

Notification list enrichment performs one reaction request per notification. This is acceptable for the current MVP, but a future backend batch summary endpoint may be warranted if notification volume makes the request count material.
