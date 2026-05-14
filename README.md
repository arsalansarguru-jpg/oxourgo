# Oxour Go — Luxury self-drive (Mumbai)

Production-oriented **Next.js 15 (App Router)** + **React 19** + **TypeScript** + **Tailwind CSS v4** + **Framer Motion** + **Lucide**.

## Scripts

```bash
npm install
npm run dev
npm run build
npm start
npm run lint
```

## Architecture

| Area | Location |
|------|----------|
| Routes & layouts | `app/` — `app/(main)/layout.tsx` (skip link + page transitions); `app/(main)/(public)/` uses `components/layout/PublicLayout.tsx` (marketing chrome + floating WhatsApp); `app/(main)/dashboard/` uses `components/layout/DashboardLayout.tsx` (SaaS topbar + slim footer + WhatsApp); `app/(main)/admin/` uses `AdminShell` |
| Feature screens (client views) | `features/*` — keep route files thin; logic lives here |
| UI primitives | `components/ui/` |
| Domain components | `components/layout`, `marketing`, `fleet`, `booking`, `auth`, `dashboard`, `support`, `legal` |
| Mock / seed data | `data/` |
| Types | `types/` |
| Brand & static config | `constants/` |
| Utilities | `lib/` (`lib/utils/cn.ts`, `lib/format.ts`) |
| Motion presets | `animations/presets.ts` |
| Client hooks | `hooks/` |
| Backend integration | `services/supabase/` — stubs + types; add `@supabase/ssr` when wiring |

Environment template: `.env.example` (`NEXT_PUBLIC_SUPABASE_*`).

## TLS / corporate proxy

If `npm install` fails with certificate errors, try:

```powershell
$env:NODE_OPTIONS='--use-system-ca'; npm install
```

---

Replace mock data under `data/` with Supabase queries via `services/supabase` when ready.
