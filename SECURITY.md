# Security Policy

## Supported versions

SimOffice is currently pre-1.0. Security fixes will target the latest release branch.

## Reporting a vulnerability

Please do not open a public issue for sensitive vulnerabilities.

Report privately to the maintainer using the contact information on the repository profile or project website. Include:

- Affected version or commit.
- Reproduction steps.
- Impact.
- Suggested mitigation if known.

## Important warning

Do not put production API keys in Vite client variables. Anything beginning with `VITE_` can be exposed to browser users. Production integrations should route through the backend.
