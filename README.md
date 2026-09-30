# Yamaha Service Booking

## Setup

1. Copy `.env.example` to `.env.local` and add the Supabase project URL and public anon key.
2. Apply [001_booking_security.sql](supabase/migrations/001_booking_security.sql) in the Supabase SQL editor.
3. Assign workshop staff with the server-managed Supabase `app_metadata.role = 'admin'`. Do not use user metadata or an email address for roles.
4. Start the app with `npm run dev` from this directory.

Bookings require the `create_booking_transaction` and `get_booking_availability` functions from the migration. The client intentionally does not fall back to local storage or direct table inserts because those paths cannot enforce ownership, capacity, quota, or token uniqueness.

## Checks

```text
npm run lint
npm run build
```

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
