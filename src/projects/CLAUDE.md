# src/projects/ — cloud save/load

- `cloud-save.js` — `saveProject(name, data)`, `loadProject(id)`, `listProjects()` against the Supabase `projects` table. After app boot, overrides `window.saveProject` / `window.loadProject` inside flowforge.html.
- `project-list.js` — UI for picking a project on login.
- `migration.js` — detects legacy local `.flowforge` / `.omninapkin` files on first cloud login and uploads them.

Schema for `projects` is in `/FLOWFORGE_SAAS_IMPLEMENTATION.md` §11. Every save writes a JSONB blob — keep the on-the-wire shape identical to the local file format so the existing `parseProjectPayload` / `applyLoadedProjectData` funnel in flowforge.html accepts it unchanged.
