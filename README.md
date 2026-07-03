# Analytics Dashboard Big Screen Designer

Vue 3 big-screen dashboard designer for an AI data Q&A platform.

This repository contains a working product slice with a dashboard library, free-canvas designer, mock data adapter, publish/version workflow, share links, and a read-only runtime renderer that scales the whole 1920 x 1080 canvas proportionally on mismatched screens.

## Local Setup

```bash
git clone https://github.com/1017293270/analytics-dashboard-.git
cd analytics-dashboard-
npm ci
npm --workspace apps/api run prisma:generate
npm --workspace apps/api run prisma:migrate
npm run dev
```

Web: http://localhost:5174

API health: http://localhost:4000/api/health

## Core Flows

- Dashboard library: `/big-screens`
- New designer draft: `/big-screens/new`
- Existing designer: `/big-screens/:id`
- Published runtime: `/runtime/:id`
- Public share runtime: `/share/:token`

The first version uses mock data only. Real AI question, dataset, and SQL data adapters are reserved extension points and must add tenant-aware permission checks before querying source data.

## Verification

```bash
npm run test
npm run lint
npm run build
npm run e2e
```

The web build currently emits a Vite large chunk warning for the designer bundle. It does not fail the build, but future production hardening should split ECharts/designer-only code into manual chunks.
