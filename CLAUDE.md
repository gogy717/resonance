# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev     # start dev server (http://localhost:3000)
npm run build   # production build
npm run lint    # eslint (flat config, eslint.config.mjs)
```

There is no test setup in this project.

## Architecture

Next.js 16 App Router project (React 19, TypeScript) using the `src/` directory layout with the `@/*` path alias mapping to `src/*`.

- `src/app/` — App Router pages and root layout. The root layout wraps everything in `ClerkProvider` and mounts the sonner `Toaster`.
- `src/components/ui/` — shadcn/ui components (new-york style, full set installed). These are generated via the shadcn CLI; add new ones with `npx shadcn add <component>` rather than writing them by hand, and don't worry about lint warnings inside this directory.
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge).
- `src/hooks/` — shared hooks (currently `use-mobile`).

### Styling

Tailwind CSS v4 — there is no `tailwind.config` file; theme tokens are defined as CSS variables in `src/app/globals.css` via `@theme inline`, with light/dark values in `:root` and `.dark` (oklch colors). Dark mode uses the `.dark` class custom variant.

### Auth

Clerk (`@clerk/nextjs`) running in keyless mode — credentials live in the gitignored `.clerk/` directory, not in `.env`.

Route protection lives in `src/proxy.ts` (Next.js 16 renamed `middleware.ts` to `proxy.ts`), which runs `clerkMiddleware` with this flow:

1. `/sign-in` and `/sign-up` are public.
2. Everything else requires a signed-in user (`auth.protect()` redirects to sign-in).
3. Signed-in users without an active organization are forced to `/org-selection` (which renders Clerk's `<OrganizationList hidePersonal>`), so every route beyond auth/org-selection assumes both `userId` and `orgId` are set — a B2B multi-tenant model.

Auth pages are catch-all routes: `src/app/sign-in/[[...sign-in]]/page.tsx` and `src/app/sign-up/[[...sign-up]]/page.tsx`.

### Database

Prisma 7 (`@prisma/client` + `@prisma/adapter-pg` + `pg`) against the project's Prisma Postgres primary database. `DATABASE_URL` lives in the gitignored `.env` and is loaded via `prisma.config.ts` (Prisma 7 CLI does not read `.env` on its own — the `dotenv/config` import there is required).

- Schema: `prisma/schema.prisma` — `Voice` and `Generation` models (voice-generation domain), scoped by Clerk `orgId` strings rather than FK relations to a user table.
- Client is generated into `src/generated/prisma` (gitignored, eslint-ignored) by the `prisma-client` generator. Regenerate with `npx prisma generate`.
- Migrations: `npx prisma migrate dev --name <name>` (note: `npx migrate` is a different, unrelated npm package).

### Deployment

Deployed on Prisma Compute (project `proj_cmr7atc680i5d3mcejhc591g1`, app `resonance`, region ap-southeast-1) via `npx @prisma/cli@latest app deploy --prod --env .env` from the repo root; config in `prisma.compute.ts`. `next.config.ts` must keep `output: "standalone"` — without it the artifact bundles all of `node_modules` (~490 MB) and the runtime VM crash-loops with "No space left on device".
