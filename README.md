# DigiSakhi — Your Digital Safety Companion

DigiSakhi is a mobile-first digital-safety platform designed for women’s self-help groups. It combines warm, non-technical learning content with a private scam checker, anonymous incident reporting, emergency contacts, community support, and an administrator surface for alerts and programme oversight.

## Product overview

The current experience is deliberately demo-ready for a college viva: it presents the member learning space, bilingual English/Hindi controls, lesson and quiz interactions, a rule-based offline-friendly scam checker, anonymous incident reporting, Quick Exit, community posting, and a role-aware admin console with sample analytics and urgent-alert publishing.

## Run locally

From the project root, install dependencies and start the managed development server:

```bash
pnpm install
pnpm dev
```

The application is served by the Vite/Express entry point. The scaffold expects the provided database and authentication environment variables to be available through the project runtime. For a local deployment outside the managed environment, create a `.env` file containing the equivalent values for `DATABASE_URL`, `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, and the built-in Forge/storage variables.

Useful commands are `pnpm check` for TypeScript validation, `pnpm test` for Vitest, and `pnpm build` for the production bundle.

## Folder overview

| Area | Purpose |
|---|---|
| `client/src/pages/Home.tsx` | DigiSakhi product shell, member learning, toolkit, forum, and admin demo surface |
| `client/src/index.css` | Editorial visual system, theme tokens, responsive helpers, focus styles, and reduced-motion support |
| `client/src/App.tsx` | Application routing and providers |
| `client/src/components/ui/` | Reusable accessible UI primitives from the scaffold |
| `server/` | Express/tRPC server, auth context, database helpers, and tests |
| `drizzle/` | Database schema and migration location |
| `shared/` | Shared constants and types |
| `todo.md` | Feature history and implementation checklist |

## UX and safety decisions

The Quick Exit control redirects to a neutral weather website so a user can leave the application quickly. Incident reporting intentionally supports anonymous submission. The scam checker evaluates text locally using transparent red-flag keywords such as OTP, PIN, urgent, prize, verify, blocked, click, and refund; it does not send the pasted message to a third party. These patterns are educational guidance rather than a guarantee that a message is safe.

## Demo flow

Open the home page, choose English or हिंदी, select **Start learning**, or open any learning card to view the lesson and knowledge-check flow. Use the toolkit to paste a suspicious message, open the anonymous report form, or review emergency numbers. Use the sign-in modal’s **Admin** role to open the coordinator dashboard, review sample programme metrics, and publish an urgent alert.
