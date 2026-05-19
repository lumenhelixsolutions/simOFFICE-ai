# Security Model

## Current posture

SimOffice is a local-first alpha. It is suitable for development, demos, and controlled internal experimentation. It is not yet a hardened multi-user SaaS.

## Secrets

Backend secrets belong in `backend/.env` and should never be committed.

Client-side variables prefixed with `VITE_` are visible in the browser bundle. Do not place production API keys in `VITE_SIM_API_KEY`. Use a backend proxy for production.

## Human-in-the-loop policy

The UI and backend should preserve approval controls for:

- Posting publicly.
- Sending emails.
- Spending money.
- Changing external account settings.
- Deleting data.
- Accessing sensitive private records.
- Irreversible workflow actions.

## Production requirements

Before production use, add:

- Authentication.
- Authorization / RBAC.
- Tenant/workspace isolation.
- Persistent audit logs.
- Secret manager integration.
- Connector permission scopes.
- Strict CORS policy.
- Rate limiting.
- Server-side SimAI proxy.
- Database persistence.
- Structured event logs.

## Responsible disclosure

See `SECURITY.md` at the repository root.
