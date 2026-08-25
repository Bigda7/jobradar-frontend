# JobRadar Frontend

JobRadar Frontend is a responsive web application for discovering job opportunities, reviewing ranked matches, monitoring ingestion sources, and managing a private application pipeline in the browser.

The project uses strict runtime validation at API and storage boundaries, route-level code splitting, accessible UI primitives, and a security-focused deployment configuration.

## Features

- **Matches feed** — Browse AI-scored opportunities grouped into Top (`85–100`), Strong (`70–84`), Good (`55–69`), and Below Target tiers. Switch between board and compact list views, sort the loaded page, and inspect reasons, concerns, descriptions, and verified vacancy links in a details drawer.
- **Job catalog** — Search the complete catalog with a debounced query, work mode, employment type, minimum salary, and pagination controls.
- **Source monitoring** — Review each configured source, its enabled state, last run, last successful run, and the latest reported error without synthetic health labels.
- **Application tracker** — Manage a local Kanban pipeline: `Saved -> Applied -> Interview -> Offer`, with a separate archive, drag-and-drop movement, accessible status controls, job snapshots, autosaved notes, and cross-tab synchronization.
- **Command palette** — Use `Cmd+K` or `Ctrl+K` to navigate between sections, search loaded matches, and query remote jobs.
- **Responsive dark interface** — Includes keyboard-accessible dialogs and drawers, focus management, reduced-motion support, and layouts tested down to a 320 px viewport.

## Technology Stack

- React 19 and React Router 7
- TypeScript 5
- Vite 8
- Tailwind CSS 4
- TanStack Query 5
- Zod 4
- dnd-kit
- Radix UI
- cmdk and Lucide React
- Vitest and ESLint

## Requirements

- Node.js `22.13.0` or newer
- npm
- A compatible JobRadar API for live data

The local Vite proxy expects the API to be available at `http://localhost:8000` unless the configuration is changed.

## Getting Started

Clone the repository and enter the project directory:

```bash
git clone https://github.com/your-org/jobradar-frontend.git
cd jobradar-frontend
```

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:5173`. With the default environment value, requests to `/api` are proxied to `http://localhost:8000`, and the `/api` prefix is removed before forwarding.

## Environment Variables

| Variable | Local value | Production example | Purpose |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | `https://api.yourdomain.com` | Base URL for the JobRadar REST API |

Vite exposes every `VITE_*` variable to client-side JavaScript. Never place credentials, private tokens, database passwords, or other secrets in these variables.

The committed [`.env.example`](./.env.example) contains documentation only. Local `.env*` files are excluded from Git, except for `.env.example`.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm test` | Run the Vitest test suite once |
| `npm run lint` | Run ESLint across the project |
| `npx tsc --noEmit` | Run an explicit TypeScript check |
| `npm run build` | Type-check and create the production bundle |
| `npm run preview` | Preview the production bundle locally |

For reproducible CI installations, use `npm ci` with the committed lockfile.

## API Boundaries

The frontend keeps endpoint contracts intentionally separate:

- `/matches` accepts only `min_score`, `limit`, and `offset`. It is the only feed that exposes `source_url`.
- `/jobs` accepts `q`, `work_mode`, `employment_type`, `min_salary`, `limit`, and `offset`. It does not render an external vacancy link.
- `/sources` displays factual source fields returned by the API.
- `/ready` powers the API readiness indicator.

All successful responses are validated with Zod before they reach the UI. Network failures, validation errors, server failures, malformed JSON, and unexpected response shapes are converted into explicit application error states.

## Local Tracker Data

Tracker records are stored under the versioned key `jobradar.tracker.v1` in `localStorage`.

- Stored values are parsed and validated before use.
- Corrupted records are isolated where possible instead of resetting the entire tracker.
- Unsafe external URL schemes are removed.
- Notes are limited to 5,000 characters.
- Storage access failures degrade to in-memory session behavior instead of crashing the application.
- Updates are synchronized across tabs through the browser `storage` event.

Tracker data is device-local, unencrypted, and not backed up. Do not store passwords, access tokens, financial information, medical information, or other sensitive data in personal notes.

## Security

- Untrusted descriptions, reasons, concerns, source errors, and notes are rendered as React text nodes. The application does not use `dangerouslySetInnerHTML`.
- External vacancy links accept only absolute HTTP or HTTPS URLs and use `target="_blank"` with `rel="noopener noreferrer"`.
- API and persisted-state payloads are validated with Zod.
- Query retries are limited to transient network and server errors.
- A root error boundary handles unexpected render and lazy-chunk failures without exposing stack traces.
- [`vercel.json`](./vercel.json) defines a Content Security Policy and additional browser security headers.

Run `npm audit` regularly and review every dependency update before merging it.

## Deployment to Vercel

1. Import the repository into Vercel.
2. Set the build command to `npm run build`.
3. Set the output directory to `dist`.
4. Add the following environment variable for Preview and Production environments:

   ```text
   VITE_API_BASE_URL=https://api.yourdomain.com
   ```

5. Replace the neutral API placeholder in the `connect-src` directive inside [`vercel.json`](./vercel.json) with the same trusted API origin.
6. Ensure the API CORS allowlist includes the deployed frontend origins.
7. Deploy and verify direct navigation to `/matches`, `/jobs`, `/tracker`, and `/sources`.

The SPA rewrite in `vercel.json` serves `index.html` for application routes. Its security headers include CSP, clickjacking protection, MIME sniffing protection, Referrer Policy, Permissions Policy, and Cross-Origin Opener Policy.

## Project Structure

```text
src/
|-- api/                 # API client, endpoint modules, schemas, and DTOs
|-- components/          # Shared shell, command palette, and UI primitives
|-- features/
|   |-- jobs/            # Job catalog and filters
|   |-- matches/         # Ranked feed, score tiers, and details
|   |-- sources/         # Source monitoring dashboard
|   `-- tracker/         # Local CRM store and Kanban board
|-- hooks/               # Debounce and accessibility hooks
|-- security/            # External URL policy
`-- styles.css           # Tailwind import, design tokens, and global styles
```

## Publication Notes

- Handoff documents, local environment files, database dumps, private keys, generated output, and `.openai/` metadata are excluded through `.gitignore`.
- Review `git status` before every commit.
- Run a secret scanner in CI in addition to dependency auditing.
- Add an appropriate `LICENSE` file before accepting external contributions or redistribution.

