# marketing/ — public landing page (Phase 5)

Static HTML served at the apex domain `flowforge.app`.

- `index.html` — hero, problem/solution, pricing, case-study link, contact form.
- `pricing.html` — two-tier comparison ($249 / $499).
- `case-study-omninapkin.html` — case study (publish only after Andrew confirms Omni approval).
- `outreach-template.md` — three variant cold-outreach emails. Andrew sends them, not Claude.

Contact form POSTs to a `leads` Supabase table (schema in §11 of the SaaS plan).
