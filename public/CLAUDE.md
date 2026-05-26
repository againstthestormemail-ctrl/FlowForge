# public/ — single-file FlowForge tool

This folder holds `flowforge.html`, the original ~9k-line single-file conveyor layout tool that the SaaS wrapper boots into. The file runs by double-click (no build step, no external deps — parsers for PDF/DOCX are base64-embedded). Forked from OmniNapkin and rebranded.

**Do not rewrite this file in React.** The SaaS plan (`/FLOWFORGE_SAAS_IMPLEMENTATION.md`) is explicit on this. Behavior changes go through runtime monkey-patching from `/src/`, not edits here, unless the change is intrinsic to the single-file tool itself.

## File layout inside flowforge.html

The script is structured as numbered MODULE comments:

- **State (`S`)** at the top — every mutable runtime field is on a single global. New fields go here with a one-line comment naming the phase.
- **Catalog (`CAT`)** — conveyor / powered-roller specs.
- **Geometry / render / overlay** — `getSize`, `getAABB`, `drawObjOnCanvas`, `renderItems`, `drawOverlay`.
- **Drag controller** (`startObjectDrag`) — single handler for all placed-object movement. Don't add parallel drag paths.
- **History** — `pushHistory` serializes via JSON.stringify; `undo`/`redo` apply via JSON.parse. **Every new persisted field must be added to the snapshot shape in pushHistory + undo + redo + parseProjectPayload + applyLoadedProjectData + the save payload.**
- **Persistence** — `parseProjectPayload` validates; `applyLoadedProjectData` is the **single load funnel** (don't bypass).
- **MODULE 10/11/12** — library panel, properties panel, modals.
- **Bottom of script** — DOMContentLoaded wiring + `setInterval(autosave, AUTOSAVE_INTERVAL_MS)`.

## Brand

Charcoal `#2a2f36`, hot orange `#ff6a18`, cream `#f5efde`, blueprint blue `#1d4f8a`. Wordmark is a split span: `<span class="brand-flow">Flow</span><span class="brand-forge">Forge</span>`. Conveyor families use transparent fill (`rgba(...,0.07)`) over blueprint-line strokes — see `FILLS`/`STROKES` maps.

## Coordinate systems

- **World pixels**: `obj.x`, `obj.y` are in world pixels. `S.ppi` (default 1.2) is pixels per inch.
- **World inches**: divide world pixels by `S.ppi`.
- **Screen pixels**: world pixels × `S.zoom`. Use `clientToWS(clientX, clientY)` for screen→world.
- **Conveyor dimensions** (`obj.length`, `obj.width`, `obj.bf`) are in inches; `getSize(obj)` returns world pixels via `px(inches)` = `inches * S.ppi`.

## Adding a new feature (the pattern)

1. **State field on `S`** with a one-line `// Phase N — purpose` comment.
2. **Persistence**: add the field to the save payload literal, the autosave snapshot, `pushHistory`'s snapshot, `parseProjectPayload`'s return object (with validation/defaults), `applyLoadedProjectData`'s assignments, and the New-project clear block. Also `captureProjectPayload` for Phase 16 revisions.
3. **UI**: edit `flowforge.html`'s markup (top-of-file modals are conventionally grouped together).
4. **Wiring** at the bottom of the script inside the DOMContentLoaded block. Group by phase with a comment header.
5. **Mutation lock**: if the feature mutates, add `if(compareModeBlocking())return;` so Phase 13 compare mode doesn't allow editing through it.
6. **History**: any mutation should call `pushHistory` on commit (typically on `blur` for input-driven flows, on `mouseup` for drags).

## Don't-break list

- `applyLoadedProjectData` is the **single load funnel**.
- `mkObj(spec, pos)` is the **single object constructor** — demos, library drag, duplicate, and load all go through it.
- `pushHistory` is the **single history writer**.
- `getRenderableObjects()` filters `obj.hidden` — hidden objects must not appear in canvas, exports, or BOM.
- `compareModeBlocking()` short-circuit must exist on every mutation entry point. Currently locked: `startObjectDrag`, `delSel`, `dupSel`, `groupObjects`, `ungroupObjects`, `rotateSelectedObjects`, `handleMeasureClick`, `beginPlacement`, `loadDemoLayout`, WS `drop` handler.

## File-format extension

`.flowforge` (new) and `.omninapkin` (legacy) both accepted. The IIFE `migrateLegacyAutosave` at ~line 1498 moves `omninapkin_autosave` localStorage → `flowforge_autosave` on first load. Open-file input has `accept=".flowforge,.omninapkin,.json"`. New fields are append-only — old files must continue to load.

## Verification

When changing rendering/mutation logic, verify headlessly with Playwright (already a system dep). Pattern:

```js
const { chromium } = require('playwright');
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('file:///home/user/FlowForge/public/flowforge.html', { waitUntil: 'load' });
await p.waitForTimeout(800);
// drive via p.evaluate(() => loadDemoLayout('pickpack')) etc.
```

Always confirm `0 console errors, 0 warnings` before committing. Use the existing console listener pattern to catch regressions.

## Phase reference (single-file tool, pre-SaaS)

Phases 0-4: brand port (terminology, file extensions, +Arrow note button, parity).
Phase 5: demo layout library (Options → Examples).
Phase 6: presentation mode (Shift+P).
Phase 7: smart alignment guides (Alt to bypass).
Phase 8: object grouping (Ctrl+G).
Phase 9: layers panel (≣).
Phase 10: measure tool (📏, click-chain dimensions).
Phase 11: throughput overlay (cph badges).
Phase 12: PDF cover page.
Phase 13: split-canvas compare mode (read-only side-by-side).
Phase 14: print tiling (multi-page PDF).
Phase 15: comments (pinned per-object, resolvable).
Phase 16: revision history (📌).
Phase 17: BOM annotations / quote editor.
Phase 18: flow animation (▶ Animate Flow).
Phase 19: integration pass.

The full single-file plan is `/FLOWFORGE_BUILD_PLAN.md`. The SaaS wrapper plan is `/FLOWFORGE_SAAS_IMPLEMENTATION.md`.
