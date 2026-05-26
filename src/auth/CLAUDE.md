# src/auth/ — Supabase auth

- `supabase-client.js` — initializes the Supabase JS client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Exports one shared client.
- `login.js` — email/password + magic link UI rendered into `#auth-gate`.
- `session.js` — `getSession()`, `onAuthChange(cb)`, `signOut()` wrappers.

Anon key is safe in the browser; service role key NEVER ships to the frontend (it lives only in `/api/` functions).
