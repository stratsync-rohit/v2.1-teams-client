# Enterprise Risk Operations Frontend

Production-ready Next.js frontend for enterprise risk monitoring and Microsoft Teams notification management.

## Stack

- Next.js App Router, React and strict TypeScript
- Tailwind CSS and shadcn/ui
- TanStack Query for API state
- React Hook Form and Zod for validated notification forms
- Lucide icons

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the local URL printed by the development server.

## Environment

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3978
NEXT_PUBLIC_ENABLE_DEMO_FALLBACK=false
```

Set `NEXT_PUBLIC_API_BASE_URL` to the deployed FastAPI HTTPS origin in production. Demo data is opt-in: set `NEXT_PUBLIC_ENABLE_DEMO_FALLBACK=true` only for an isolated demo. With the default `false`, backend failures remain visible and notification sends never fabricate success.

The Teams package points at `https://www.stratsync.ai/teams/channel-context`.
The deployed frontend must serve that route, and its production
`NEXT_PUBLIC_API_BASE_URL` must point to the deployed FastAPI HTTPS origin.

The backend must allow the frontend origin through CORS and expose:

- `GET /api/risks`
- `GET /api/risks/{risk_id}`
- `GET /api/destinations`
- `GET /api/destinations/{destination_id}`
- `GET /api/teams/hierarchy`
- `POST /api/notifications/trigger`
- `GET /api/notifications`
- `GET /api/notifications/{notification_id}`
- `GET /api/notifications/{notification_id}/reactions`
- `POST /api/teams/channel-context` (authenticated Teams tab SSO)
- `GET /health`
- `GET /ready`

For local real integration, configure the backend (not the browser) with the real development tenant and explicit frontend origins:

```env
APP_ENV=development
DEV_TENANT_ID=<real development Teams tenant>
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Keep the existing Microsoft and MongoDB settings private in the backend `.env`. Start the backend from `enterprise-risk-bot`:

```bash
source .venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 3978 --reload
```

Keep ngrok running against port 3978 so the configured Bot Framework messaging endpoint continues to reach `/api/messages`. In a second terminal, start this frontend:

```bash
npm run dev
```

Open the Vite URL printed by the development server (normally `http://localhost:5173`).

## Manual Microsoft Teams E2E check

1. Open Destinations and confirm the real tenant → `rc-test` → channel hierarchy appears, with personal destinations in a separate section.
2. Open Risks and confirm `RSK-21132-0472` comes from the backend.
3. Open **Send Risk Alert**, choose `rc-test`, choose its active channel, and send.
4. Confirm the frontend displays the real backend notification ID.
5. Confirm the Adaptive Card arrives in Microsoft Teams.
6. Use **Mitigation Plan** and **View Details** and confirm both follow-up cards work.
7. Add a Teams reaction, then confirm notification detail/history show it and active engagement increases.
8. Remove the reaction, then confirm active engagement decreases while the detail history labels the record **Removed**.

## Security boundary

The frontend sends only public business identifiers (`risk_id` and `destination_id`). Microsoft credentials, access tokens, conversation references, private service URLs and MongoDB connection details must stay in the backend.

The Teams channel-context page at `/teams/channel-context` initializes the
Teams JavaScript SDK, reads the channel/team/tenant context, obtains a short-
lived Teams SSO token with `authentication.getAuthToken()`, and sends it only
as an Authorization header. The token is not stored in browser storage.

The hierarchy request surfaces backend failures directly and does not use demo data. Notification trigger requests remain exactly `{ risk_id, destination_id }`; tenant, Team, and channel IDs are never included in that payload.

## Verification

```bash
npm run lint
npm run test
npm run build
```
