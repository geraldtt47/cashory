# Local infrastructure (Docker)

PostgreSQL and Mailpit for local development. The Hono API and Expo app run on the host. Compose files: [`compose/`](../compose/).

`bun run docker:infra:up` and a successful `bun run docker:infra:verify` print the same access summary: clickable links and development logins copied from the root `.env`. These values are for local development.

## Access summary

| Service | Link | Login |
| --- | --- | --- |
| Mailpit inbox | http://127.0.0.1:8026 | None. Open the link. |
| Postgres | `127.0.0.1` port `5433` (default), database `cashory` | User `postgres`, password `postgres`, unless root `.env` overrides them |
| Database UI | `bun run db:studio` then https://local.drizzle.studio | None. Studio uses the Postgres URL from the summary |
| API | http://127.0.0.1:3000 | Available after `bun run dev` |

The Postgres user, password, database, port, and connection URL are printed on their own lines. HTTP links are terminal hyperlinks, and the plain URL stays visible so it can be copied.

Mailpit has no password. There is no seeded Cashory account; create one from the mobile sign-up screen. The summary does not print `BETTER_AUTH_SECRET`.

`http://localhost:…` usually works. If a page does not load on Windows, use `127.0.0.1`.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Compose v2)
- [Bun](https://bun.sh/) `1.2.19` or newer

## Environment files

| File | Purpose |
| --- | --- |
| **`.env`** | Docker Compose (`POSTGRES_*`, `SMTP_*`). Created from [`.env.example`](../.env.example). |
| **`apps/server/.env`** | API (`DATABASE_URL`, Better Auth). Created from [`apps/server/.env.example`](../apps/server/.env.example). The first create generates `BETTER_AUTH_SECRET`. |
| **`apps/native/.env`** | Expo public server URL. Created from [`apps/native/.env.example`](../apps/native/.env.example). |

Scripts do not overwrite an existing env file unless you pass `--force` (prompts first) or `--merge-missing`.

## First-time setup

```bash
bun install
bun run docker:infra:up
```

That creates missing env files, starts Postgres and Mailpit, runs `db:push`, and prints the access summary.

Confirm:

```bash
bun run docker:infra:verify
```

Then start the API and the mobile app:

```bash
bun run dev
```

## Day-to-day

```bash
bun run docker:infra:up
bun run dev
```

Shutdown (data volume is kept):

```bash
bun run docker:infra:down
```

Reprint links and logins without recreating containers:

```bash
bun run docker:infra:verify
```

## Ports

| Service | Host | Container |
| --- | --- | --- |
| Postgres | **5433** (`POSTGRES_HOST_PORT`) | 5432 |
| Mailpit SMTP | **1026** (`SMTP_PORT`) | 1025 |
| Mailpit UI | **8026** | 8025 |

Mailpit uses 8026/1026 so another local project can keep 8025/1025. Docker Postgres defaults to host port **5433** so it does not collide with a local PostgreSQL on 5432. `docker:infra:up` syncs `apps/server/.env` `DATABASE_URL` from root `.env` and can move you to 5433 automatically when 5432 points at another server.

## Env maintenance

| Command | Behavior |
| --- | --- |
| `bun run setup:local-env` | Create root `.env` from `.env.example` when missing |
| `bun run setup:local-env --merge-missing` | Append keys that are not already in `.env` |
| `bun run setup:local-env --force` | Prompt, then replace `.env` |
| `bun run setup:app-env` | Same rules for `apps/server/.env` and `apps/native/.env` |
| `bun run docker:infra:verify` | Container status, Mailpit HTTP check, Postgres `pg_isready`, then the access summary |

## Troubleshooting

### Mailpit does not load

Use **http://127.0.0.1:8026**. Port 1026 is SMTP, not the inbox. Check `bun run docker:compose -- ps`.

### Postgres connection fails

Read the user, password, and URL from the summary (`bun run docker:infra:verify`). Those values come from root `.env`. `apps/server/.env` `DATABASE_URL` must point at the same host, port, database, and password. Re-run `bun run docker:infra:up` to sync it from root `.env`.

### Port already allocated

Change the host port in root `.env` (`POSTGRES_HOST_PORT` or `SMTP_PORT`) and keep `apps/server/.env` `DATABASE_URL` in sync for Postgres. Mailpit's UI host port is **8026** in [`compose/docker-compose.local.yml`](../compose/docker-compose.local.yml).

### Physical device cannot sign in ("Network request failed")

The API URL in the access summary (`http://127.0.0.1:3000`) only works on the development PC. A phone must use your PC's LAN address.

1. Run `bun run docker:infra:verify` and copy the **API (phone)** line, or set `EXPO_PUBLIC_SERVER_URL` in `apps/native/.env` to `http://<LAN-IPv4>:3000`.
2. Restart Expo/Metro so `EXPO_PUBLIC_SERVER_URL` is picked up.
3. On the phone (same Wi‑Fi), open `http://<LAN-IPv4>:3000/api/auth/get-session` in the browser. If it does not load, check firewall rules for port **3000**.
4. Android dev builds use HTTP in development; after changing `usesCleartextTraffic` in `app.config.js`, run prebuild and reinstall the app.
