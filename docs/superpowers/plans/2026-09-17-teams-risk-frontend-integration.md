# Microsoft Teams Risk Frontend Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the existing frontend to the real Microsoft Teams risk backend with explicit CORS, safe contract normalization, opt-in demo data, and real notification/reaction views.

**Architecture:** Keep every working Bot Framework and persistence path unchanged. Add only backend CORS configuration, then adapt raw backend DTOs into stable frontend view models in one normalization module; React screens consume those view models without joining nullable data themselves.

**Tech Stack:** FastAPI 0.116, Starlette CORSMiddleware, Pydantic Settings 2, pytest, Next.js 16/Vinext, React 19, TypeScript 5.9, TanStack Query, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-17-teams-risk-frontend-integration-design.md`

## Global Constraints

- Preserve `/api/messages`, Bot Framework authentication, Adaptive Cards, card actions, destination IDs, risk IDs, MongoDB schemas/collections, conversation references, notification delivery, reaction persistence, manifest, and ngrok configuration.
- The trigger browser payload contains only `risk_id` and `destination_id`.
- Do not add a frontend tenant ID or any Microsoft/MongoDB secret to a `NEXT_PUBLIC_*` variable.
- Health/readiness responses remain raw JSON; business APIs retain `{ success, data, error }` envelope validation.
- Demo fallback is enabled only when `NEXT_PUBLIC_ENABLE_DEMO_FALLBACK === "true"`.
- Only `is_active === true` reactions count as current engagement; removed reactions remain visible in history.
- The backend sibling directory is outside the initial writable root, so edits require a sandbox approval.
- Git metadata is absent from both project directories; checkpoint commits cannot be created in this workspace.

---

## File Map

### Backend

- `../enterprise-risk-bot/src/config/settings.py`: parse and validate explicit CORS origins.
- `../enterprise-risk-bot/src/application.py`: install `CORSMiddleware` using settings.
- `../enterprise-risk-bot/tests/test_cors.py`: settings and preflight regression coverage.
- `../enterprise-risk-bot/.env.example`: document local origins.
- `../enterprise-risk-bot/README.md`: document CORS variable and local frontend run flow.

### Frontend

- `lib/types.ts`: raw DTOs, public destination contract, and UI view models.
- `lib/api/normalization.ts`: pure destination/reaction/notification presentation functions.
- `tests/notification-normalization.test.mjs`: normalization regression tests.
- `lib/api/client.ts`: raw response support and strict demo opt-in.
- `lib/api/index.ts`: centralized fetching, fallback, and notification enrichment.
- `lib/hooks.ts`: invalidation and view-model query hooks.
- `components/send-notification-dialog.tsx`: safe destination labels and active-only selection.
- `components/destinations-screen.tsx`: scope-aware grouping and null-safe display.
- `components/notifications-screen.tsx`: real enriched history and active counts.
- `components/notification-detail-screen.tsx`: real metadata and active/removed reaction history.
- `components/dashboard-screen.tsx`: real metrics and active-only reaction counts.
- `components/settings-screen.tsx`: accurate explicit demo-mode copy.
- `lib/api/mock-data.ts`: mock records aligned to the public/view contracts.
- `.env.example`, `.env.local`: real integration defaults with fallback disabled.
- `package.json`: focused Node TypeScript normalization-test command.
- `README.md`: real local run and configuration instructions.

---

### Task 1: Configurable FastAPI CORS

**Files:**
- Create: `../enterprise-risk-bot/tests/test_cors.py`
- Modify: `../enterprise-risk-bot/src/config/settings.py`
- Modify: `../enterprise-risk-bot/src/application.py`
- Modify: `../enterprise-risk-bot/.env.example`

**Interfaces:**
- Produces: `Settings.cors_allowed_origins: str` and `Settings.cors_origin_list: list[str]`.
- Consumes: `create_app()` reads `settings.cors_origin_list` and passes it to `CORSMiddleware`.

- [x] **Step 1: Write failing settings tests**

Create `tests/test_cors.py` with isolated settings construction:

```python
import pytest
from pydantic import ValidationError

from src.config.settings import Settings


def test_cors_origins_parse_csv_and_ignore_blanks():
    settings = Settings(
        _env_file=None,
        cors_allowed_origins=" http://localhost:5173, ,http://127.0.0.1:5173 ",
    )
    assert settings.cors_origin_list == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


def test_cors_origins_reject_wildcard():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, cors_allowed_origins="*")
```

- [x] **Step 2: Run the focused settings tests and confirm RED**

Run from `../enterprise-risk-bot`:

```bash
pytest -q tests/test_cors.py
```

Expected: failure because `cors_origin_list` and wildcard validation do not exist.

- [x] **Step 3: Implement minimal origin parsing**

Add a string-backed setting, a validator that rejects `*`, and a parsed property:

```python
from pydantic import Field, field_validator

cors_allowed_origins: str = ""

@field_validator("cors_allowed_origins")
@classmethod
def validate_cors_allowed_origins(cls, value: str) -> str:
    if "*" in {origin.strip() for origin in value.split(",")}:
        raise ValueError("CORS_ALLOWED_ORIGINS must contain explicit origins")
    return value

@property
def cors_origin_list(self) -> list[str]:
    return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]
```

- [x] **Step 4: Add a failing allowed-origin preflight test**

In `tests/test_cors.py`, construct the app with a cleared settings cache and environment override, then use `TestClient` without entering lifespan:

```python
from fastapi.testclient import TestClient
from src.application import create_app
from src.config.settings import get_settings


def test_cors_preflight_allows_configured_frontend(monkeypatch):
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173")
    get_settings.cache_clear()
    client = TestClient(create_app())
    response = client.options(
        "/api/risks",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    get_settings.cache_clear()
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
```

- [x] **Step 5: Run preflight test and confirm RED**

Run:

```bash
pytest -q tests/test_cors.py::test_cors_preflight_allows_configured_frontend
```

Expected: missing `access-control-allow-origin` header.

- [x] **Step 6: Register CORS middleware**

In `src/application.py`, import `CORSMiddleware` and add it immediately after application creation:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Add to `.env.example`:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

- [x] **Step 7: Run focused backend tests and confirm GREEN**

Run:

```bash
pytest -q tests/test_cors.py tests/test_notifications.py
```

Expected: all tests pass and the trigger schema still rejects routing/tenant fields.

---

### Task 2: Frontend Contracts and Pure Normalization

**Files:**
- Modify: `lib/types.ts`
- Create: `lib/api/normalization.ts`
- Create: `tests/notification-normalization.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `getDestinationPresentation(destination)`, `getDestinationLabel(destination)`, `getDestinationGroupLabel(destination)`, `normalizeReaction(raw)`, `enrichNotification(raw, risks, destinations, reactions)`, and `countActiveReactions(reactions)`.
- Produces types: `BackendNotification`, `BackendReaction`, `ReactionViewModel`, `NotificationViewModel`, and nullable `Destination`.

- [x] **Step 1: Add a focused test command**

Add this script while preserving existing scripts:

```json
"test:unit": "node --experimental-strip-types --test tests/*.test.mjs"
```

Change the existing `test` script to:

```json
"test": "npm run test:unit && npm run build"
```

- [x] **Step 2: Write failing normalization tests**

Create `tests/notification-normalization.test.mjs` importing from `../lib/api/normalization.ts`. Cover these exact assertions:

```js
assert.equal(getDestinationLabel(channelWithoutName), "rc-test / Teams channel");
assert.equal(getDestinationLabel(personalDestination), "Personal chat");
assert.equal(getDestinationGroupLabel(personalDestination), "Personal chats");

const active = normalizeReaction(rawLike);
assert.equal(active.icon, "👍");
assert.equal(active.label, "Like");
assert.equal(active.user_identifier, "aad-user-1");
assert.equal(active.count, 1);

const removed = normalizeReaction({ ...rawLike, is_active: false });
assert.equal(countActiveReactions([active, removed]), 1);

const enriched = enrichNotification(rawNotification, [], [], [rawLike]);
assert.equal(enriched.risk_title, rawNotification.risk_id);
assert.equal(enriched.destination_label, rawNotification.destination_id);
assert.equal("tenant_id" in enriched, false);
```

- [x] **Step 3: Run normalization tests and confirm RED**

Run:

```bash
npm run test:unit
```

Expected: module-not-found failure for `lib/api/normalization.ts`.

- [x] **Step 4: Align frontend types**

Update `Destination` to remove `tenant_id`, make all Teams IDs/names nullable, allow arbitrary scope strings, and require `updated_at`.

Define raw DTOs exactly matching backend JSON fields. Define view models with these presentation fields:

```ts
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
  notification_type: NotificationType;
  status: NotificationStatus;
  teams_message_id: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string;
  reactions: ReactionViewModel[];
}
```

- [x] **Step 5: Implement pure normalization**

Implement scope-aware destination fallbacks and reaction presentation in `lib/api/normalization.ts`. Known mappings are:

```ts
const reactionPresentation = {
  like: { icon: "👍", label: "Like" },
  heart: { icon: "❤️", label: "Heart" },
  laugh: { icon: "😆", label: "Laugh" },
} as const;
```

Unknown types use `icon: "•"` and a title-cased label. `countActiveReactions` filters `is_active === true` before summing `count`. `enrichNotification` finds related records by identifier and never copies `tenant_id`.

- [x] **Step 6: Run normalization tests and confirm GREEN**

Run:

```bash
npm run test:unit
```

Expected: all normalization tests pass.

---

### Task 3: API Client, Strict Demo Mode, and Enriched Fetching

**Files:**
- Modify: `lib/api/client.ts`
- Modify: `lib/api/index.ts`
- Modify: `lib/api/mock-data.ts`
- Modify: `lib/hooks.ts`

**Interfaces:**
- Consumes normalization functions from Task 2.
- Produces `apiClient.getRaw<T>(path)` for non-enveloped endpoints.
- Produces `notificationApi.list(): Promise<NotificationViewModel[]>` and `notificationApi.get(id): Promise<NotificationViewModel>`.

- [x] **Step 1: Refactor response parsing without changing envelope behavior**

Extract a shared fetch/JSON function returning `{ response, payload }`. Keep `request<T>` validating HTTP status plus `{ success, data, error }`. Add `requestRaw<T>` that requires only an OK HTTP status and returns parsed JSON.

Export:

```ts
getRaw: <T>(path: string) => requestRaw<T>(path)
```

Set:

```ts
export const isDemoFallbackEnabled =
  process.env.NEXT_PUBLIC_ENABLE_DEMO_FALLBACK === "true";
```

- [x] **Step 2: Centralize real notification enrichment**

In `notificationApi.list`, wrap one real loader with `withFallback`. The real loader uses `Promise.all` for raw notifications, risks, and destinations, then loads each reaction list and calls `enrichNotification`.

In `notificationApi.get`, load the raw notification plus risk/destination lists, fetch that notification's reactions, and call the same `enrichNotification` function. Missing related records use normalization fallbacks; failed required API calls remain real errors.

Keep `notificationApi.reactions` returning normalized reaction view models for compatibility, but do not duplicate mapping in components.

Use:

```ts
systemApi.health = () => withFallback(
  () => apiClient.getRaw<{ status: string }>("/health"),
  () => ({ status: "demo" }),
);
```

- [x] **Step 3: Preserve exact trigger payload**

Keep the trigger generic body typed as `TriggerNotificationInput`. Do not spread destination objects or add headers. Its only serialized keys remain `risk_id` and `destination_id`.

- [x] **Step 4: Align mocks with view contracts**

Remove mock tenant IDs, add nullable/public destination fields and `updated_at`, and update mock notifications/reactions to the Task 2 view-model fields. Preserve mocks only for explicitly enabled demo mode.

- [x] **Step 5: Update invalidation**

On trigger success, invalidate notifications and the specific new notification key only when useful; retain risks invalidation if the backend may update risk state. The required visible behavior is a refetched notification list after dialog completion.

- [x] **Step 6: Run unit tests and TypeScript build**

Run:

```bash
npm run test:unit
npm run build
```

Expected: normalization tests pass and any remaining component contract errors identify Task 4 work; do not treat expected pre-Task-4 type errors as completion.

---

### Task 4: Null-Safe Real-Data Screens

**Files:**
- Modify: `components/send-notification-dialog.tsx`
- Modify: `components/destinations-screen.tsx`
- Modify: `components/notifications-screen.tsx`
- Modify: `components/notification-detail-screen.tsx`
- Modify: `components/dashboard-screen.tsx`
- Modify: `components/settings-screen.tsx`

**Interfaces:**
- Consumes Task 2 destination helpers, `NotificationViewModel`, and `countActiveReactions`.
- Preserves the existing routes and dialog behavior.

- [x] **Step 1: Update send destination labels**

Use `getDestinationLabel` for select items. Use `getDestinationPresentation` for the selected card. Keep inactive items disabled and retain the submit-time `destination.is_active` check. Keep `trigger.mutateAsync(values)` unchanged so only the validated two-field form object is sent.

- [x] **Step 2: Replace nullable destination grouping**

Group destinations by `getDestinationGroupLabel`. Within each group, render primary/secondary presentation strings and a scope-appropriate icon. Count distinct non-null channel teams for the Teams summary; personal and group records remain included in total destinations and active routes.

- [x] **Step 3: Update notification history**

Search over an explicitly constructed string array:

```ts
[
  item.notification_id,
  item.risk_id,
  item.risk_title,
  item.destination_id,
  item.destination_label,
]
```

Render `destination_primary`, optional `destination_secondary`, `countActiveReactions(item.reactions)`, and `created_at`. Destination filter labels use `getDestinationLabel`.

- [x] **Step 4: Update notification detail**

Remove the separate `useReactions` dependency because the enriched notification already carries reaction history. Show risk title, destination primary/secondary, status/type, Teams message ID only when present, and created timestamp. Render `reaction.icon`, `reaction.label`, raw `user_identifier`, created time, and `Active`/`Removed`. The summary total calls `countActiveReactions`.

- [x] **Step 5: Update dashboard metrics and recent activity**

Compute active reaction engagement with:

```ts
notificationData.reduce(
  (total, notification) => total + countActiveReactions(notification.reactions),
  0,
)
```

Render destination presentation fields without `#` prefixes that could imply a missing channel. Change the metric label to `Active reactions`.

- [x] **Step 6: Correct settings copy**

Describe demo mode as explicit sample data for isolated demos. Do not say it automatically activates when the backend is unreachable.

- [x] **Step 7: Run frontend verification**

Run:

```bash
npm run lint
npm run test
```

Expected: lint, normalization tests, TypeScript compilation, and production build pass.

---

### Task 5: Environment Examples, Documentation, and Full Regression

**Files:**
- Modify: `.env.example`
- Modify: `.env.local`
- Modify: `README.md`
- Modify: `../enterprise-risk-bot/README.md`

**Interfaces:**
- Documents only environment variable names and safe local origins/URLs.
- Does not read or overwrite `../enterprise-risk-bot/.env`.

- [x] **Step 1: Disable frontend fallback by default**

Set both frontend files to:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3978
NEXT_PUBLIC_ENABLE_DEMO_FALLBACK=false
```

- [x] **Step 2: Document backend CORS and local integration**

Add `CORS_ALLOWED_ORIGINS` to the backend environment table and document that production values must be explicit. Add run commands:

```bash
cd enterprise-risk-bot
source .venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 3978 --reload
```

```bash
cd client
npm run dev
```

Document that ngrok remains pointed at port 3978 for `/api/messages`.

- [x] **Step 3: Document the manual E2E path**

Record the required sequence: Destinations → verify `rc-test` → Risks → verify `RSK-21132-0472` → send to `DEST-EFA9E4ED15F563E9` → capture real notification ID → verify Teams card/actions → add reaction → verify active count/history → remove reaction → verify count decreases and Removed history remains.

- [x] **Step 4: Run focused and full backend verification**

Run from `../enterprise-risk-bot`:

```bash
pytest -q tests/test_cors.py tests/test_notifications.py
pytest -q
```

Expected: all backend tests pass.

- [x] **Step 5: Run complete frontend verification**

Run from `client`:

```bash
npm run lint
npm run test
npm run build
```

Expected: all commands exit successfully. `npm test` already runs a build, but the explicit final build provides separate completion evidence requested by the integration brief.

- [x] **Step 6: Inspect the final diff and security boundary**

Search changed frontend files for forbidden names and verify no matches were introduced outside explanatory UI/docs text:

```bash
rg -n "MICROSOFT_APP_PASSWORD|conversation_reference|service_url|MONGODB_URL|X-Tenant-ID" lib components app .env.example .env.local
```

Inspect the final file list and confirm no Bot handlers, card builders, services, repositories, schemas, manifest files, or secret `.env` files changed.
