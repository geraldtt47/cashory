# Cashory — local Docker Compose

PostgreSQL and Mailpit for local development. The API and Expo app run on the host.

Full guide: [docs/local-infrastructure.md](../docs/local-infrastructure.md).

## Quick start

```bash
bun run docker:infra:up
bun run dev
```

`docker:infra:up` and a successful `docker:infra:verify` print clickable links and development Postgres logins from the root `.env`.

```bash
bun run docker:infra:down
bun run docker:infra:verify
```

## Host ports

| Service | Host | URL / notes |
| --- | --- | --- |
| Postgres | **5432** | User, password, and URL are printed after `docker:infra:up` |
| Mailpit SMTP | **1026** | `SMTP_PORT` |
| Mailpit UI | **8026** | http://127.0.0.1:8026 — no login |
