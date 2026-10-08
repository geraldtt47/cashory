# Cashory Demo

![Bun](https://img.shields.io/badge/Bun-1.2%2B-black?logo=bun)
![Expo](https://img.shields.io/badge/Expo-SDK%2055-000020?logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.83-61dafb?logo=react)
![Hono](https://img.shields.io/badge/Hono-API-f97316)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6?logo=typescript)

Cashory Demo is a full-stack personal finance and lightweight invoicing application built as a Bun monorepo. It combines an Expo-powered React Native client, a Hono API, Better Auth authentication, Drizzle ORM, and PostgreSQL to deliver a mobile-first experience for onboarding users, managing wallets, recording transactions, reviewing reports, generating invoices, and exporting invoice PDFs.

> Repository audit note  
> This codebase currently implements a finance management product, not a YouTube long-form video creation and publishing workflow. There is no YouTube API, Google OAuth for YouTube upload, video rendering pipeline, or publishing automation in the repository at this time. This README documents the current implementation on disk so other developers can set it up and contribute accurately.

## Table of Contents

- [Project Overview](#project-overview)
- [Feature Highlights](#feature-highlights)
- [Workflow Guide](#workflow-guide)
- [Technical Architecture](#technical-architecture)
- [Requirements and Dependencies](#requirements-and-dependencies)
- [Setup and Installation](#setup-and-installation)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [API Surface](#api-surface)
- [Project Structure](#project-structure)
- [Contribution Guidelines](#contribution-guidelines)
- [License](#license)
- [Troubleshooting](#troubleshooting)

## Project Overview

Cashory Demo helps a user move through a simple money-management lifecycle:

1. **Authenticate** with email and password.
2. **Complete onboarding** by filling in profile data and selecting preferences.
3. **Create wallets** to represent cash, bank, credit, or mobile balances.
4. **Organize categories** for income and expenses.
5. **Add transactions** and review historical activity with filtering and summaries.
6. **Track invoices** for client work, update invoice status, and generate PDF exports.
7. **Review notifications and profile settings** from the in-app settings area.

For developers, the project demonstrates a strongly typed monorepo where schemas, environment validation, authentication, and database logic are shared across client and server packages.

## Feature Highlights

- **Mobile-first UX** with Expo Router navigation, onboarding screens, drawer and tab layouts, theming, and HeroUI Native components.
- **Typed API layer** using Hono on the server and Hono client bindings in the mobile app.
- **Authentication** with Better Auth, secure Expo storage, and session-aware API requests.
- **Finance data model** for wallets, categories, transactions, budgets, notifications, and invoices.
- **Invoice lifecycle support** including status changes, notification generation, server-side HTML creation, and client-side PDF export and sharing.
- **Shared schemas and validation** with Zod and workspace packages to reduce duplication across the stack.

## Workflow Guide

```mermaid
flowchart TD
    A[User opens app] --> B[Sign up or sign in]
    B --> C[Onboarding profile setup]
    C --> D[Dashboard]
    D --> E[Create wallets and categories]
    E --> F[Record income and expense transactions]
    F --> G[Review summaries and reports]
    D --> H[Create invoice]
    H --> I[Update invoice status]
    I --> J[Generate and share PDF]
    I --> K[Notification created by API]
```

## Technical Architecture

### Monorepo Layout

- `apps/native` contains the React Native application built with Expo and Expo Router.
- `apps/server` contains the Hono API, route registration, middleware, and business services.
- `packages/auth` centralizes Better Auth configuration and database-backed auth setup.
- `packages/db` contains Drizzle configuration, PostgreSQL schema definitions, and migrations.
- `packages/env` validates native and server environment variables with `@t3-oss/env-core`.
- `packages/schema` provides shared Zod schemas and input contracts for API operations.
- `packages/config` stores shared TypeScript configuration.

### Request Flow

1. The mobile app authenticates with Better Auth through the server.
2. Session state is stored using the Expo Better Auth client and secure storage.
3. The mobile app calls the Hono API through a typed client and injects the auth cookie.
4. Hono middleware validates the session and exposes `userId` to route handlers.
5. Service functions interact with PostgreSQL through Drizzle ORM.
6. Shared Zod schemas validate request payloads and query parameters.

### Runtime Components

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Client | Expo, React Native, Expo Router, HeroUI Native, TanStack Query | UI, navigation, mutation/query orchestration, secure auth session handling |
| API | Bun, Hono, Better Auth | REST endpoints, auth handling, request validation, business logic |
| Data | PostgreSQL, Drizzle ORM, Drizzle Kit | Persistence, typed schema access, migrations |
| Shared | Zod, workspace packages, TypeScript | Shared contracts, environment validation, reusable domain types |

## Requirements and Dependencies

### Prerequisites

- **Bun** `1.2.19` or newer
- **Docker Desktop** for local Postgres and Mailpit (`bun run docker:infra:up`)
- **Node-compatible mobile toolchain** for Expo development
- **Expo Go** or an iOS/Android simulator/device for running the native app

### Core Dependencies

#### Root workspace

- `turbo`
- `typescript`
- `dotenv`
- `zod`

#### Native app

- `expo`
- `react-native`
- `expo-router`
- `heroui-native`
- `@tanstack/react-query`
- `react-hook-form`
- `expo-image-picker`
- `expo-print`
- `expo-sharing`

#### Server app

- `hono`
- `better-auth`
- `@hono/zod-validator`

#### Shared packages

- `drizzle-orm`
- `drizzle-kit`
- `pg`
- `@t3-oss/env-core`

## Setup and Installation

### 1. Clone and install

```bash
git clone <your-fork-or-repo-url>
cd cashory-demo
bun install
```

### 2. Start local infrastructure

```bash
bun run docker:infra:up
```

This creates missing env files (root `.env`, `apps/server/.env`, `apps/native/.env`), starts Postgres and Mailpit, applies the schema, and prints a development access summary. `bun run docker:infra:verify` prints that summary again after the containers respond. Details: [docs/local-infrastructure.md](docs/local-infrastructure.md).

| Service | Link | Login |
| --- | --- | --- |
| Mailpit inbox | http://127.0.0.1:8026 | None. Open the link. |
| Postgres | `127.0.0.1:5432`, database `cashory` | `postgres` / `postgres`, or the user and password in root `.env` |
| Database UI | `bun run db:studio` → https://local.drizzle.studio | None. Uses the Postgres URL from the summary |
| API | http://127.0.0.1:3000 | Available after `bun run dev` |

The summary prints the Postgres user, password, and connection URL on separate lines so they can be copied from the terminal. It does not print `BETTER_AUTH_SECRET`. Sign-up stays in the mobile app.

To use your own Postgres instead of Docker, create `apps/server/.env` and `apps/native/.env` from the `.env.example` files in those apps, then run `bun run db:push`.

Optional database commands:

```bash
bun run db:generate
bun run db:migrate
bun run db:studio
```

### 3. Start the development environment

Run both the API and mobile app:

```bash
bun run dev
```

Run the server only:

```bash
bun run dev:server
```

Run the mobile app only:

```bash
bun run dev:native
```

### 4. Check types before opening a pull request

```bash
bun run check-types
```

## Configuration

### Environment Variables

| Variable | Scope | Required | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Server | Yes | PostgreSQL connection string used by Drizzle and runtime DB access |
| `BETTER_AUTH_SECRET` | Server | Yes | Secret used by Better Auth for signing and session security |
| `BETTER_AUTH_URL` | Server | Yes | Base URL for Better Auth endpoints |
| `CORS_ORIGIN` | Server | Yes | Allowed origin for client requests |
| `NODE_ENV` | Server | Yes | Runtime environment, defaults to `development` |
| `EXPO_PUBLIC_SERVER_URL` | Native | Yes | Base URL used by the Expo app for API requests |

### Authentication Configuration

- The server uses Better Auth with a Drizzle adapter backed by PostgreSQL.
- The native app uses the Expo Better Auth client with secure storage.
- Trusted origins include the configured CORS origin and native schemes used by the Expo app.

### Database Configuration

- Drizzle reads schema files from `packages/db/src/schema`.
- Drizzle Kit reads `DATABASE_URL` from `apps/server/.env`.
- A local Supabase configuration exists under `packages/db/supabase` for local database tooling.

### YouTube API Integration Status

The repository does **not** currently include any of the following:

- YouTube Data API credentials
- Google OAuth client setup for YouTube publishing
- Video upload or scheduling endpoints
- Rendering, transcoding, thumbnail generation, or script-to-video automation

If the product is intended to evolve into a YouTube publishing system, you will need to add new environment variables, API routes, background processing, and storage workflows before a YouTube configuration section would be actionable.

## Usage Guide

### 1. Create an account

- Launch the native app from Expo.
- Register with email and password from the sign-up screen.
- Existing users can sign in from the sign-in screen.

### 2. Complete onboarding

- Fill in profile information such as name, email, country, phone, and currency.
- Optionally choose a profile image through the native image picker.
- Finish onboarding to unlock the main application routes.

### 3. Set up wallets and categories

- Create at least one wallet for bank, cash, credit, or mobile money.
- Mark one wallet as the default if needed.
- Create income and expense categories to structure later transaction entry.

### 4. Record transactions

- Add income or expense entries from the transaction flow.
- Provide amount, category, wallet, date, description, and note.
- Review grouped transaction history and filter by type, wallet, category, or date range.

### 5. Review dashboard insights

- Open the home dashboard to view balance cards, monthly income and expenses, and invoice previews.
- Open the reports section to review overview, income, and expense visualizations.

### 6. Create and manage invoices

- Open the invoice section and create a new invoice with:
  - invoice number
  - client name and optional email
  - issue and due dates
  - tax rate
  - one or more line items
  - optional note
- Update invoice status to draft, sent, paid, overdue, or cancelled.
- Download and share the generated PDF from the invoice detail screen.

### 7. Review notifications and settings

- Visit the notifications screen to review status updates and alerts.
- Use the settings area to view profile information, notification preferences, and sign out.

## API Surface

The current API is mounted under the following route groups:

| Route Group | Purpose |
| --- | --- |
| `/api/auth/*` | Better Auth handlers for session and credential flows |
| `/api/category` | CRUD operations for income and expense categories |
| `/api/wallet` | CRUD operations for user wallets and default wallet lookup |
| `/api/budget` | Budget listing and management |
| `/api/transaction` | Transaction CRUD operations and summary reporting |
| `/api/invoice` | Invoice CRUD, status updates, and HTML generation for PDF export |
| `/api/notification` | Notification listing and read-state updates |

Example commands:

```bash
bun run dev
bun run dev:server
bun run check-types
```

## Project Structure

```text
cashory-demo/
├── apps/
│   ├── native/
│   │   ├── app/              # Expo Router screens
│   │   ├── components/       # UI building blocks, containers, templates
│   │   ├── contexts/         # Theme and app-level React context
│   │   ├── hooks/            # Query and mutation hooks
│   │   ├── lib/              # API client, auth client, shared helpers
│   │   └── types/            # Native app types
│   └── server/
│       └── src/
│           ├── middleware/   # Auth middleware
│           ├── routes/       # Hono route modules
│           └── services/     # Business logic and DB access
├── compose/                  # Postgres + Mailpit for local dev
├── docs/
│   └── local-infrastructure.md
├── scripts/                  # docker:infra:* helpers
├── packages/
│   ├── auth/                 # Better Auth server configuration
│   ├── config/               # Shared TypeScript config
│   ├── db/                   # Drizzle schema, migrations, Supabase config
│   ├── env/                  # Typed env validation
│   └── schema/               # Shared Zod contracts
├── turbo.json
└── package.json
```

## Contribution Guidelines

### Development Principles

- Keep shared contracts in `packages/schema` whenever client and server both depend on them.
- Update `packages/env` when adding new environment variables.
- Prefer typed API access through the existing Hono client instead of creating ad hoc fetch wrappers.
- Follow existing naming and folder conventions for screens, hooks, services, and schema files.

### Recommended Contribution Flow

1. Create a feature branch.
2. Install dependencies with `bun install`.
3. Run `bun run docker:infra:up` so Postgres and Mailpit are up and the access summary is printed.
4. Implement the change in the appropriate app or shared package.
5. Run `bun run check-types`.
6. Open a pull request with a clear summary of user-facing and technical changes.

### Current Quality Gates

- `bun run check-types` is available at the workspace level.
- No workspace `lint` or automated test script is currently defined in the repository root.
- When adding new functionality, include verification steps in your pull request description.

## License

There is currently **no `LICENSE` file** in this repository. Until a license is added by the maintainers, the project should be treated as all rights reserved.

If you plan to distribute or open-source the project, add a license file and update this section accordingly.

## Troubleshooting

### Environment validation fails on startup

- Recheck `apps/server/.env` and `apps/native/.env`.
- Make sure required values are present and valid URLs where applicable.
- Ensure `BETTER_AUTH_SECRET` is at least 32 characters long.

### The Expo app cannot reach the API

- Confirm the server is running.
- Confirm `EXPO_PUBLIC_SERVER_URL` points to the reachable API host.
- If testing on a physical device, replace `localhost` with your machine's LAN IP.

### Authentication returns unauthorized

- Verify `BETTER_AUTH_URL` matches the actual API origin.
- Verify `CORS_ORIGIN` matches the client origin used during development.
- Restart both the server and Expo after changing auth-related environment variables.

### Database commands fail

- Run `bun run docker:infra:verify` to confirm Postgres and reprint the development login summary.
- Verify `DATABASE_URL` in `apps/server/.env` matches the Postgres URL from that summary.
- Re-run `bun run db:push` after fixing connectivity or credential issues.

### PDF sharing does not open on device

- PDF export depends on `expo-print` and `expo-sharing`.
- Some simulators and environments have limited share-sheet support.
- Test on a physical device if share functionality appears unavailable.

### Metro or Expo behaves inconsistently

- Restart Expo with a cleared cache:

```bash
bun run dev:native
```

- If needed, start Expo directly with:

```bash
cd apps/native
bun run dev
```
