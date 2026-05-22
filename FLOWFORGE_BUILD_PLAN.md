# FlowForge Build Plan

**Mission:** Produce a single, self-contained `FlowForge.html` that combines the full feature set of `01-OmniNapkin-tcar-options.html` with the FlowForge brand identity, and then layers on a set of new features ("Section D") that strengthen FlowForge as both a standalone shop-floor layout tool and a sales artifact for the ShopFlow consulting practice.

**Critical strategic decision:** Start from OmniNapkin, not from the current FlowForge. The Napkin file has ~125 functions the current FlowForge does not — including the entire T-Car system, tag positioning, conveyor info labels, multi-object rigid rotation, anchored note arrows, export title block, and offline parser. Re-applying the brand to Napkin is a one-day job; re-porting all of Napkin's lost features into the current FlowForge is a multi-week job with high regression risk. **Direction matters.**

---

## How to use this plan

This document is meant to be picked up by Claude Code alongside two input files. Each phase is independently testable; complete one phase fully, verify, then move on. Do not interleave phases — the regression surface area is too large. Commit (or savepoint a copy of `FlowForge.html`) at the end of every phase so you can roll back without losing later work.

Effort sizing: **S** ≈ <1 hr of focused work, **M** ≈ 1–3 hrs, **L** ≈ 3–8 hrs, **XL** ≈ a full day or more.

---

## Inputs

1. `01-OmniNapkin-tcar-options.html` — the feature-complete baseline. Use this as the **starting point** for the new file. ~2.69 MB; ~1.4 MB of that is an embedded base64 PDF.js / JSZip bundle. Do not strip it.
2. `FlowForge.html` (current) — use this **only as a reference** for the brand palette, the drafting-paper canvas styling, the blueprint conveyor graphics, the upright counter-rotated BF label approach, the autosave indicator, the `.flowforge` / `.ffcustom` file extensions, the rebranded vendor terminology, and the explicit "+ Arrow" Notes button. Do not port functionality from this file; only its visual identity.

---

## Output

A single file: `FlowForge.html`. Single-file architecture is non-negotiable — the app must run from a double-click with no build step and no external dependencies except optional CDN fallbacks. The embedded base64 parsers stay so the app works offline.

---

## Architecture lock-ins (do not violate)

1. **Single file.** No external JS/CSS/JSON/images. The embedded parsers ship inline as base64. Optional CDN URLs may be tried as fallbacks but must never be required.
2. **No build step.** No bundler, no transpiler. Plain ES2020+ JS, plain CSS, plain HTML. Browser-runnable directly.
3. **Centralized state.** Everything lives in the global `S` object that Napkin already defines. New features extend `S`; they do not create parallel state stores.
4. **Undo/redo discipline.** Any function that mutates `S.objects`, `S.notes`, `S.customs`, `S.proj`, or any new persistent state **must** call `pushHistory()` at the end. No exceptions.
5. **Render through the existing pipeline.** New visual features hook into `render()`, `drawCanvas...`, or `addOverlay...` functions. Do not create a parallel render path.
6. **Project file format is append-only.** New fields can be added to the JSON payload, but every field that exists in Napkin today must still load. `parseProjectPayload` and `validateLoadedRecordList` are the single source of truth for the on-disk schema.
7. **Imperial/metric switching must keep working everywhere.** Any new dimension display goes through `fmt()`, `fmtDim()`, `fmtBF()`, etc.

---

## Brand spec (the FlowForge identity to apply)

These are the FlowForge-specific design tokens and terminology that must replace Napkin's. Source: `FlowForge.html`.

### Color tokens (CSS custom properties)
Find these in the `<style>` block of the current `FlowForge.html` and port them verbatim into the new file's root `:root` block:

- **Charcoal** (panel chrome, topbar): the dark slate used for the topbar and side panels
- **Hot orange** (`--forge-orange`): the accent color for primary actions, selected states, and brand wordmark
- **Cream / off-white** (`--forge-cream`, `--forge-cream2`): light panel text and the drafting-paper canvas background
- **Blueprint blue** for the line-drawing conveyor graphics on the cream canvas

The contrast pass from the previous session (invisible lib-item names, dim prop-labels, low-contrast input borders, dark-on-dark panel elements) must remain fixed. Re-verify after the brand port.

### Canvas treatment
- Workspace background is the cream drafting-paper color (not white, not Napkin's default light gray).
- Conveyor graphics on the canvas use blueprint-style line drawings with minimal transparent fills — port the `FILLS` / `STROKES` overrides or the canvas-side render adjustments from the current FlowForge.
- Side panels and topbar stay dark (charcoal chrome) — light work surface, dark chrome is the visual rule. Never mix them.

### Typography
- The wordmark splits into `<span class="brand-flow">Flow</span><span class="brand-forge">Forge</span>` in the topbar.

### Terminology replacements (global find-and-replace, case-sensitive)
- `Omni Metalcraft` → `Conveyor` (vendor tab label, library headers, anywhere user-visible)
- `NOR+ (24VDC)` → `Powered Roller (24V)`
- `Nor+` → `Powered Roller` (in conveyor type labels, e.g., "Nor+ Straight" → "Powered Roller Straight")
- `OmniNapkin` → `FlowForge` (titles, BOM badge, file dialog defaults, toast strings)
- `omninapkin` (lowercase, in keys and extensions) → `flowforge`
- `omnicustom` → `ffcustom`

Note: the **internal `family` values** (`nor-str`, `nor-cur`, `nor-merge`, `nor-spur`, `nor-360`, `nor-xfer`) stay unchanged — they're data keys, not user-visible strings. Only update display labels.

### File extensions
- Project files: `.flowforge` (was `.omninapkin`)
- Custom library files: `.ffcustom` (was `.omnicustom`)
- File pickers: `accept=".flowforge,.json"` and `accept=".ffcustom,.json"`
- LocalStorage autosave key: `flowforge_autosave` (was `omninapkin_autosave`)
- `defaultFileName('flowforge')`, `defaultFileName('ffcustom')`

### Autosave indicator
Add the visible "Saved HH:MM:SS" indicator in the topbar that fades in for 2 seconds after each autosave (Napkin autosaves silently). The CSS and JS for this lives in the current `FlowForge.html` — port it verbatim.

### Notes modal "+ Arrow" button
The current FlowForge added an explicit `+ Arrow` button alongside `+ Text` in the Notes modal. Napkin uses hover-deploy from text notes. **Keep both:** add the explicit `+ Arrow` button (better discoverability for first-time users) AND keep Napkin's hover-deploy arrow handles (faster for power users). Both write into the same `S.notes` array.

---

# PHASE 0 — Foundation

**Goal:** Create the working file and confirm the baseline runs.

**Effort:** S

**Steps:**
1. Copy `01-OmniNapkin-tcar-options.html` to `FlowForge.html`.
2. Open it in a browser and verify it loads, the library populates, you can drag a conveyor onto the canvas, save, and reload the autosave.

**Verification:**
- File opens with no console errors.
- All three vendor tabs render in the library.
- Dragging a CDLR Straight onto the canvas creates a conveyor box with BF and type label inside.
- Placing a T-Car Rail and then a T-Car shows the car snapping onto the rail.

**Don't break:** Nothing yet — this is the baseline.

**Commit point.**

---

# PHASE 1 — Apply the FlowForge brand

**Goal:** The file looks like FlowForge, not Napkin. Functionality unchanged.

**Effort:** M

**Steps:**
1. Replace the `:root` CSS custom properties in the main `<style>` block with FlowForge's industrial palette (charcoal, hot orange, cream variants). Pull the exact hex values from the current `FlowForge.html`.
2. Replace the wordmark in `#topbar` with the `<span class="brand-flow">Flow</span><span class="brand-forge">Forge</span>` markup. Add the corresponding `.brand-flow` / `.brand-forge` CSS.
3. Update the workspace background to the cream drafting-paper color.
4. Update the conveyor `FILLS` and `STROKES` lookup tables (or the canvas render adjustments) to the blueprint-style line drawings used in the current FlowForge.
5. Ensure side panels and topbar remain charcoal (do not pick up the cream from the workspace).
6. Update the `<title>` tag, the BOM template title and badge, and any other user-visible "OmniNapkin" strings to "FlowForge".
7. Update the autosave key constant: `AUTOSAVE_KEY='flowforge_autosave'`.
8. Update file extension accepts and the `askFileName(..., 'flowforge', ...)` and `'ffcustom'` calls.

**Verification:**
- Side-by-side with the current `FlowForge.html`, the new file is visually indistinguishable for the topbar, panels, and a blank canvas.
- Drop a conveyor: the box rendering matches FlowForge's blueprint style, not Napkin's filled style.
- Save a project: the suggested filename ends in `.flowforge`. The saved file loads cleanly back into the app.
- The `omninapkin_autosave` localStorage key from the old app does not get re-created.

**Don't break:**
- T-Car snapping still works.
- BF and conveyor type labels still appear inside conveyor boxes.
- Notes modal still opens.

**Commit point.**

---

# PHASE 2 — Terminology pass

**Goal:** All user-visible vendor and type strings reflect the new naming.

**Effort:** S

**Steps:**
1. Find every user-visible occurrence of `Omni Metalcraft` and replace with `Conveyor`. The vendor tab button label (`<button class="vtab active" data-vendor="omni">Conveyor</button>`) is the main one. Search for the string in tooltips, headers, BOM templates, and toasts too.
2. Replace `NOR+ (24VDC)` (vendor tab) with `Powered Roller (24V)`.
3. In the `conveyorTypeLabel()` map and anywhere `Nor+` appears as a display string, replace with `Powered Roller`. Specifically: `'nor-str':'Powered Roller Straight'`, `'nor-cur':'Powered Roller Curve'`, `'nor-merge':'Powered Roller Merge'`, `'nor-spur':'Powered Roller Spur'`, `'nor-360':'Powered Roller 360'`.
4. Library entry `name` fields for the `nor-*` family items: update the display names to use "Powered Roller" instead of "Nor+". (Example: `name:'Powered Roller Straight'` instead of `'Nor+ Straight'`.)
5. Custom modal labels, BOM column headers, and any toast strings that reference the old terminology: update.

**Verification:**
- `grep -i "omni metalcraft\|nor+\|omninapkin" FlowForge.html` returns only matches in internal `family` keys (e.g., `'nor-str'`, `data-vendor="omni"`) — never in user-visible strings.
- The library tabs read "Conveyor" and "Powered Roller (24V)".
- Selecting a Powered Roller Straight on the canvas shows "Powered Roller Straight" as the type label, not "Nor+ Straight".
- BOM export shows the new terminology.

**Don't break:**
- The `data-vendor="omni"` attribute and the `'nor-str'` family keys stay unchanged (data, not display).
- Loading a `.omninapkin` file saved before the rename still works (filter accepts both extensions for one transitional release).

**Commit point.**

---

# PHASE 3 — Notes modal: add explicit "+ Arrow" button

**Goal:** Match the current FlowForge's Notes modal affordance while keeping Napkin's hover-deploy.

**Effort:** S

**Steps:**
1. In the Notes modal markup, add `<button class="btn-primary" id="notesAddArrowBtn">+ Arrow</button>` next to the existing `+ Text Note` button. Rename the existing button label to `+ Text` for symmetry.
2. Implement `addArrowNoteAtCenter()` — analogous to `addTextNoteAtCenter()`. It places a fresh arrow note at the workspace center, ready for the user to position both endpoints.
3. Wire the new button: `document.getElementById('notesAddArrowBtn').addEventListener('click', addArrowNoteAtCenter);`
4. Keep the hover-deploy arrow handles on text notes — do not remove that path.
5. Keep the hint text "Hover over a text note to deploy arrows from its sides and corners." in the modal body — both methods are documented.

**Verification:**
- The Notes modal shows two primary buttons: `+ Text` and `+ Arrow`.
- Clicking `+ Arrow` adds a standalone arrow at workspace center.
- Hovering an existing text note still reveals the arrow handles.
- Arrows added via either method are interchangeable in the saved project file (same `S.notes` schema).

**Don't break:**
- `Clear All` still clears both types.
- Saving and reloading preserves arrows added via the new button.

**Commit point.**

---

# PHASE 4 — Parity verification

**Goal:** Prove the rebranded baseline has everything Napkin had plus FlowForge's brand additions, before adding new features.

**Effort:** S

**Steps:** Run through this manual checklist. Any failure → fix before moving on.

**Library & canvas:**
- [ ] Both vendor tabs (Conveyor, Powered Roller 24V) populate with their items.
- [ ] T-Car Rail and T-Car items appear in the Conveyor tab.
- [ ] Drag from the library: conveyor places on canvas.
- [ ] Place a T-Car Rail, then drag a T-Car near it — the car snaps and aligns to the rail.
- [ ] Move the rail — the attached car follows.

**Properties & dimensions:**
- [ ] Select a straight conveyor: length, width, BF inputs are bidirectionally synced.
- [ ] Edit BF on a conveyor with connected neighbors: the change propagates per linking rules.
- [ ] "Lock dims on sheet" works (single and multi-select).

**Tags:**
- [ ] Add a tag to a conveyor. Right-click → Move Tag. The tag becomes draggable. Click to drop.
- [ ] Right-click → Move Tag Anchor. The leader-line anchor point is repositionable.
- [ ] Right-click → Reset Tag Position / Reset Tag Anchor restore defaults.
- [ ] Hide Tags toggle in Options menu hides/shows all tag bubbles.

**Conveyor info labels:**
- [ ] BF and type are visible inside each conveyor box, always upright regardless of rotation.
- [ ] Show/Hide Conveyor Labels toggle in Options works.

**Notes:**
- [ ] Open Notes modal: `+ Text` and `+ Arrow` buttons present.
- [ ] Add a text note, hover it, deploy a side arrow, drop it on a conveyor — anchored.
- [ ] Hide Notes from the topbar hides all notes.

**Multi-select & rotation:**
- [ ] Marquee-select two conveyors. Press R: the selection rotates 45° as a rigid group around its centroid.
- [ ] Drag one item: the whole selection moves.
- [ ] Lock Dims, Duplicate, Delete apply to the whole selection.

**Z-order & free move:**
- [ ] Right-click an obstacle: Move Up in Stack / Move Down in Stack work.
- [ ] Right-click a conveyor: Free Move toggle detaches it from auto-linking.

**Export & BOM:**
- [ ] Export PNG: includes the title block in a corner, routed around occupied area.
- [ ] Export PDF: same title block, project metadata correct.
- [ ] Export Preview modal appears before download.
- [ ] BOM export opens in a new tab, lists every placed item with quantities.

**Save & load:**
- [ ] Save → file downloads with `.flowforge` extension.
- [ ] New → Open → load the saved file: every object, tag, note, custom library entry, and project metadata restored.
- [ ] Autosave indicator pulses in the topbar at the next 30-second autosave tick.

**Tutorial:**
- [ ] Options → Tutorial Mode runs the 5-step tour. Each step highlights the correct UI element.

**Parse Text:**
- [ ] Click Parse Text. Paste a sample quote. The parser extracts conveyor candidates. Approve → they land in the custom library.
- [ ] Drop a `.pdf` file on the quote drop zone — the offline parser handles it without internet.

If every box checks: proceed to Section D. If any box fails, fix the regression first.

**Commit point.**

---

# PHASE 5 — Demo Layout Library

**From Section D, item 2.** This is the cheapest sales-amplifier feature and unblocks demoing FlowForge cold.

**Goal:** A one-click way to load preset example layouts so a prospect (or a salesperson) doesn't start at an empty canvas.

**Effort:** M

**Design:**
- New menu entry in `#optionsMenu`: a section titled "Examples" with three buttons:
  - "Pick-Pack 12,000 sqft"
  - "Pallet-to-Piece Conversion"
  - "Multi-Lane Sortation"
- Clicking an example prompts: "Replace the current layout?" with confirm/cancel. On confirm, replaces `S.objects`, `S.proj`, `S.notes` with the example's payload (same shape as a `.flowforge` file).
- The three example payloads ship inline as JS constants near the top of the script (`const DEMO_LAYOUTS = { 'pickpack': {...}, 'pallet': {...}, 'sortation': {...} };`).

**Implementation:**
1. Add the menu markup.
2. Build the three example layouts by:
   - Starting from a blank FlowForge.
   - Manually constructing each layout (~10–25 objects, realistic BFs, a few tags, a couple of notes).
   - Saving the project file.
   - Pasting the JSON contents into the `DEMO_LAYOUTS` constant.
3. Implement `loadDemoLayout(key)` that confirms, then routes through `applyLoadedProjectData()` (which Napkin already has) to apply the payload safely.
4. Wire the buttons.

**Verification:**
- Click each example: layout loads, properties panel and canvas reflect it.
- Cancel keeps the current work.
- Undo after loading reverts to the previous layout.
- Save → reload: the example layout persists exactly.

**Don't break:**
- `applyLoadedProjectData` is the single funnel — don't bypass it.
- Pushes one history entry per load.

**Commit point.**

---

# PHASE 6 — Presentation Mode

**From Section D, item 1.**

**Goal:** A keystroke hides all UI chrome, leaving just the canvas — for projector demos.

**Effort:** S

**Design:**
- Press `Shift+P` (or click an Options menu entry "Presentation Mode") to enter.
- When active: `#topbar`, `#libPanel`, `#custPanel`, `#propsPanel`, and the canvas toolbar buttons (snap, zoom, fit) all hide. The workspace fills the viewport.
- A small floating pill in the top-right corner shows "Presentation — Esc to exit". Click it or press Esc to exit.
- Selection, drag, rotate keys, etc. all still work (this is a chrome-hide, not a true read-only mode).
- State stored in `S.presentationMode` (boolean). Not persisted in the project file — it's a UI state.

**Implementation:**
1. Add CSS class `body.presentation-mode` that sets `display:none` on the relevant elements via descendant selectors.
2. Add `togglePresentationMode()` that toggles the class and `S.presentationMode`.
3. Bind `Shift+P` and `Esc` (Esc only when in presentation mode and nothing else needs an Esc, e.g., not when a modal is open or a tag is being moved).
4. Add the floating exit pill element, hidden by default, shown when the class is on.

**Verification:**
- Shift+P enters: all chrome disappears. The exit pill appears top-right.
- Click conveyors, rotate, drag — all still works.
- Esc exits cleanly: chrome reappears in the exact same layout it had before.
- Modals (Notes, Export, etc.) opening while in presentation mode: think through. Simpler rule: presentation mode auto-exits when any modal opens.

**Don't break:**
- Esc still cancels tag-move, tag-anchor-move, marquee selection, and closes modals when those are active. Presentation Esc handler has lower priority.

**Commit point.**

---

# PHASE 7 — Smart Alignment Guides

**From Section D, item 7.**

**Goal:** When dragging an object, show snap lines to other objects' centers and edges, Figma-style.

**Effort:** M

**Design:**
- During a drag, sample every other on-canvas object's bounding box. For each, compute its left edge, right edge, top edge, bottom edge, horizontal center, and vertical center in world coordinates.
- For the dragged object, compute the same six values.
- For each pair (dragged value, other value) on the same axis: if the world-space delta is within `SNAP_TOLERANCE_IN = 0.5` inches (or `~6px` at the current zoom, whichever is larger), snap and draw a dashed guide line spanning from the dragged object to the matching other object.
- Guide line color: the FlowForge orange accent. 1px dashed, 50% opacity.
- Snap is in addition to grid snap — alignment guides override grid snap when they're active (so two aligned-but-non-grid items stay aligned).
- Hold `Alt` while dragging to disable alignment snapping (for fine positioning).

**Implementation:**
1. Add `S.alignmentGuides = []` — populated during drag, cleared on drop.
2. In the drag-update handler, after computing the candidate new position, compute alignment candidates and adjust the position if within tolerance. Populate `S.alignmentGuides` with the lines to draw.
3. In `render()` (or the overlay SVG drawing path), if `S.alignmentGuides.length`, draw each as a dashed line.
4. On drag end, clear `S.alignmentGuides`.

**Verification:**
- Place two conveyors. Drag one so its center crosses the other's center horizontally — a horizontal dashed orange guide appears and the dragged item snaps.
- Same for vertical center, all four edges.
- Hold Alt — guides do not appear and snapping does not occur.
- Guides clear immediately on drop.

**Don't break:**
- Multi-object drag (moving a group): use the group's AABB as the source of truth, not individual member positions.
- T-Car attachments still snap to their rail regardless of alignment guides.

**Commit point.**

---

# PHASE 8 — Object Grouping

**From Section D, item 8.**

**Goal:** Select N objects, press Ctrl+G, they behave as one for selection/move/rotate/duplicate until ungrouped.

**Effort:** M

**Design:**
- Each object can have a `groupId` field (string, optional). Members of the same group share a `groupId`.
- Clicking any group member selects all members (single-click expands the selection to the group).
- Shift+click on a group member toggles the whole group in or out of the selection.
- Ctrl+G on a multi-select assigns a new shared `groupId` to all selected objects.
- Ctrl+Shift+G removes `groupId` from all selected objects.
- Move/rotate/duplicate/delete operations on a group operate on every member.
- Visual cue: when any group member is selected, draw a faint dashed bounding box around the entire group.

**Implementation:**
1. Add `groupId` to the object schema. Update `validateLoadedRecordList` to permit it.
2. `groupObjects(ids)`: assigns `uid('grp')` to each. Pushes history.
3. `ungroupObjects(ids)`: removes `groupId` from each. Pushes history.
4. Modify the click/selection handlers: when selecting an object with a `groupId`, expand selection to all objects sharing that `groupId`.
5. Bind Ctrl+G and Ctrl+Shift+G.
6. In `render()`, if a group has any selected member, draw the dashed bounding box.

**Verification:**
- Select two objects. Ctrl+G. Click empty space to deselect. Click either of them: both highlight as selected.
- Move: both move together.
- Rotate (R): both rotate as a rigid group (this already exists via `rotateObjectsAsRigidSelection`).
- Duplicate (Ctrl+D): produces two new objects with a new shared `groupId`.
- Ctrl+Shift+G: ungroups; clicking one no longer selects the other.
- Save/reload preserves group membership.

**Don't break:**
- A T-Car attached to a rail: grouping them is allowed and useful. The car still follows the rail. When moving the group, the rail moves and the car re-aligns to it as it does today.
- Marquee selection still works on grouped objects (treats the group as a unit if any member is hit).

**Commit point.**

---

# PHASE 9 — Layers Panel

**From Section D, item 9.**

**Goal:** A flat, scrollable list of every object in the project. Click to select. Drag to reorder z-stack. Eye icon to hide.

**Effort:** M

**Design:**
- New panel that opens as a modal-style overlay (or as a fourth collapsible side panel). Recommend modal overlay (toggle button in the canvas toolbar, icon: `≣`) to avoid taking permanent horizontal space.
- Lists every renderable object, top-of-list = top-of-z-stack.
- Each row: drag handle, eye icon (toggle `obj.hidden`), object name (or family if unnamed), tag (if any), small color swatch.
- Click a row: selects that object on the canvas.
- Drag a row up/down: reorders `stackOrder`.
- Eye icon: toggles `obj.hidden`. Hidden objects don't render on the canvas or in exports, but stay in the project file.

**Implementation:**
1. Add `obj.hidden` to the schema (boolean, default false). Update `getRenderableObjects()` to filter hidden objects.
2. Add a `≣ Layers` button to the canvas toolbar.
3. Implement the panel as a modal overlay (similar pattern to Notes modal).
4. Populate from `getRenderableObjects()` sorted by `layerRank()` desc then `stackOrder` desc.
5. Make rows draggable using HTML5 drag and drop, or a manual mousedown-mousemove pattern (project uses the latter for canvas objects — reuse the pattern).
6. Reorder on drop: update `stackOrder` values, push history, re-render.

**Verification:**
- Place 5 conveyors. Open Layers. All 5 appear in order.
- Click row 3: that conveyor highlights on the canvas.
- Drag row 3 to row 1: it now renders on top.
- Click the eye on row 2: that conveyor disappears from the canvas. Toggle again: reappears.
- Hide a tagged conveyor: its tag bubble disappears too.
- Save/reload preserves hidden state and order.

**Don't break:**
- Multi-select still works on the canvas.
- T-Car attachments still re-align when the rail's stack order changes.

**Commit point.**

---

# PHASE 10 — Dimension Chain Tool (Measure)

**From Section D, item 6.**

**Goal:** A click-to-measure tool that places dimension lines on the canvas, supports chaining.

**Effort:** M

**Design:**
- New canvas toolbar button: `📏 Measure`. Activates measure mode.
- In measure mode, the cursor becomes a crosshair. Click anywhere on the canvas to set the first point. Click again to draw a dimension line with a label showing the distance (using `fmtDim()`).
- After the second click, the dimension is "active": click a third point and a chained dimension line extends from the second point to the third, sharing the same dimension axis style.
- Press Esc to exit measure mode. Press Enter or click the Measure button again to commit the chain.
- Dimensions are persistent canvas objects: stored in a new `S.dimensions` array. Each dimension is `{id, p1:{x,y}, p2:{x,y}}`. They render in a new overlay layer.
- Click an existing dimension to select it. Delete key removes it. Drag either endpoint to adjust.
- Dimension lines snap to object endpoints, centers, and corners when the cursor is within snap distance.

**Implementation:**
1. Add `S.dimensions = []` to state init. Add to project file schema in `parseProjectPayload` and `applyLoadedProjectData`.
2. Add the toolbar button and `S.measureMode` boolean.
3. Implement the click-to-measure state machine: idle → first-point-placed → dimension-active → chained.
4. Render dimensions in an overlay layer (analogous to how notes render). Use the FlowForge orange for dimension lines.
5. Implement snap-to-feature: on cursor move during measure mode, find the nearest object endpoint/center/corner within ~0.5". If found, draw a magenta crosshair and snap on click.
6. Selection, drag-endpoint, delete behaviors.

**Verification:**
- Click Measure. Click two points: dimension line appears with the correct label in current units.
- Switch units imperial → metric: label updates.
- Click a third point: chained dimension extends.
- Esc exits cleanly.
- Click an existing dimension: it highlights. Delete: removes it.
- Drag an endpoint: dimension updates live, label updates.
- Snap to a conveyor corner: cursor locks to the corner before click.
- Save/reload preserves dimensions.

**Don't break:**
- Tag-move and tag-anchor-move modes still work — measure mode is a fourth modal-cursor mode and must not collide.

**Commit point.**

---

# PHASE 11 — Throughput Estimate Overlay

**From Section D, item 4.**

**Goal:** Each powered conveyor segment can display an estimated cases-per-hour figure.

**Effort:** M

**Design:**
- New Options menu entry: "Show Throughput Estimates" (toggle, off by default).
- When on, each conveyor whose family is in the powered set (`cdlr`, `bdlr`, `belt`, `pbelt`, `nor-str`, `nor-cur`, `nor-merge`, `nor-spur`, `nor-360`, `chain`, `chain-xfer`, `tbelt-xfer`, `tt-pow`) shows a small badge near its info label with the estimate.
- Estimate formula: `throughput_cph = (speed_fpm × 60) / (case_length_in + case_gap_in) × 12 / 12`. With defaults `speed_fpm = 60`, `case_length_in = 18`, `case_gap_in = 6`.
- Defaults are configurable in a new "Throughput Defaults" modal accessible from the Options menu:
  - Speed (FPM), Case length (in), Case gap (in)
- Per-conveyor override: in the Properties panel, a new collapsed "Throughput" section with the three values (defaulting to the project defaults).
- Badge appears in a contrasting color (e.g., dark green pill) to distinguish from BF/type labels.

**Implementation:**
1. Add `S.throughputDefaults = {speedFpm: 60, caseLenIn: 18, caseGapIn: 6}` and `S.showThroughput = false`.
2. Per-object: optional `throughput: {speedFpm, caseLenIn, caseGapIn}` (any subset overrides defaults).
3. `computeThroughput(obj)` returns the cases/hr integer.
4. Add the Options toggle and the defaults modal.
5. Add the Properties panel section (collapsed by default).
6. In the overlay layer, after the conveyor info label, draw the throughput badge if `S.showThroughput` and the conveyor is in the powered set.

**Verification:**
- Toggle on: every powered conveyor shows a throughput pill. Gravity, skatewheel, ball-xfer, and T-Car do not.
- Change project default speed to 90 FPM: all pills update.
- Override one conveyor's speed to 30 FPM: only that pill updates.
- Toggle off: pills disappear.
- Save/reload: settings and overrides persist.

**Don't break:**
- Hide Labels toggle hides the throughput pill too (treat as part of the labels group).
- Counter-rotation rule applies — pills read upright regardless of conveyor rotation.

**Commit point.**

---

# PHASE 12 — PDF Cover Page

**From Section D, item 5.**

**Goal:** PDF export gets a branded cover sheet as page 1; the layout is page 2.

**Effort:** M

**Design:**
- New checkbox in the Export modal (PDF only): "Include cover page" (default on).
- The cover page is a full-page rendering with:
  - FlowForge wordmark at top (hot orange + cream on charcoal panel, matching the in-app brand)
  - Project name (large, centered)
  - Quote / Job number, Date, Customer (if a new project metadata field), Prepared by (new metadata field)
  - Summary stats: total conveyor count, total linear feet of conveyor, vendor split (count by `Conveyor` vs `Powered Roller`), turntable count, transfer count
  - The project notes textarea content (wrapped)
  - A small footer "Generated by FlowForge"
- The layout page comes after, exactly as today's PDF export renders.

**Implementation:**
1. Add `S.proj.customer` and `S.proj.preparedBy` to the project metadata (Properties panel "Project" section).
2. Add the "Include cover page" checkbox to the Export modal.
3. In the PDF export code path, when the checkbox is on:
   - Compute summary stats from `S.objects`.
   - Render the cover canvas (same size as the layout export canvas) with the wordmark, metadata, and stats.
   - Use jsPDF (already in the project) to add the cover as page 1, then the layout as page 2.
4. PNG export is unaffected (always single image, no cover).

**Verification:**
- Export PDF with cover on: page 1 is the cover, page 2 is the layout. Both fit their pages.
- Stats are correct: counted manually they match.
- Long project notes wrap correctly.
- Cover off: PDF is single-page (today's behavior).
- Cover off persisted in the export modal across sessions (sessionStorage is fine).

**Don't break:**
- Existing title block on the layout page still appears (it's redundant with the cover but consistent with current behavior).

**Commit point.**

---

# PHASE 13 — Before/After Split View

**From Section D, item 3.**

**Goal:** Load two project files side by side with a draggable divider to visually compare.

**Effort:** L

**Design:**
- New topbar button: "⇆ Compare". Opens a file picker to select a second `.flowforge` file.
- Once loaded, the workspace splits vertically into two scrollable canvases sharing a single zoom and grid setting. Left = current project, right = comparison project. A draggable divider in the middle adjusts the split.
- Above each canvas, a small label: project name + object count + total linear footage.
- Below the divider, a single info bar showing **deltas**: `Objects: 12 → 18 (+6)`, `Total BF: 5500" → 7200" (+1700")`, `Footprint: 28' × 60' → 32' × 75'`.
- Editing is **disabled** in compare mode. Selection works for inspection only.
- Click "Exit Compare" to return to single-view mode with the original project intact.

**Implementation:**
1. Two state slots: `S` (current, editable) and `S.compareProject` (the loaded comparison; read-only).
2. Add CSS class `body.compare-mode` that splits `#workspace` into two halves with a divider.
3. The right half is a second `#workspace2` element with its own `itemsLayer` and overlays, rendering `S.compareProject.objects`.
4. Shared zoom: both canvases use the same `S.ppi` and pan.
5. Lock all mutation entry points behind `if (S.compareMode) return;` early-outs.
6. The delta bar computes its values on entry to compare mode.

**Verification:**
- Save a layout. Modify it. Save as a second file. Load the first into FlowForge, click Compare, pick the second file. Both render side by side.
- Drag the divider: split adjusts.
- Pan the left canvas: right canvas pans in sync. Zoom on either: both zoom.
- Try to drag, rotate, delete — nothing happens, no error.
- Exit Compare: original project is restored exactly.
- Deltas are correct.

**Don't break:**
- Autosave continues (only the editable side autosaves).
- Undo history is preserved across compare entry/exit.

**Commit point.**

---

# PHASE 14 — Print Tiling

**From Section D, item 10.**

**Goal:** Export large layouts as multi-page PDFs with tile marks and a key plan.

**Effort:** L

**Design:**
- New checkbox in the PDF Export modal: "Tile across pages" (default off). When on, reveals:
  - Page size selector: Letter (8.5×11), Legal (8.5×14), Tabloid (11×17), A4, A3
  - Orientation: Portrait / Landscape
  - Scale: 1/8"=1', 1/4"=1', 1/2"=1', 1"=1', or "Fit to N pages"
- The export computes the tile grid (rows × columns) needed to cover the layout at the chosen scale.
- The first PDF page is a **key plan**: the whole layout scaled to fit one page, with tile boundaries marked and labeled A1, A2, B1, B2, …
- Each subsequent page is one tile, with tile marks (small registration crosses) in each corner and the tile label in a corner.
- Cover page (Phase 12), if enabled, precedes the key plan.

**Implementation:**
1. Compute the layout AABB in inches.
2. Compute tile size in inches at the selected scale and page size (e.g., Letter landscape at 1/4"=1' → each tile covers 44' × 34').
3. Compute rows × cols = ceil(layoutWidth / tileWidth) × ceil(layoutHeight / tileHeight).
4. Render the key plan: layout scaled to fit one page, with a grid drawn over it showing tile boundaries.
5. For each tile, render the layout offset and cropped to that tile's world rect. Add tile marks at the four corners and the label in the bottom-right.
6. jsPDF: add pages in order.

**Verification:**
- A small layout (fits one page): tile mode produces 1 key plan + 1 tile page.
- A large layout (4×3 tiles): produces 1 key plan + 12 tile pages, each with correct registration marks.
- Tile labels match the key plan grid.
- Scale lock: at 1/4"=1' Letter landscape, a known 12-inch ruler on the canvas measures exactly 0.25" on the printed page.

**Don't break:**
- Non-tiled PDF export still works.
- PNG export unaffected.

**Commit point.**

---

# PHASE 15 — Comments

**From Section D, item 11.**

**Goal:** Pinned, resolvable comments on objects — distinct from notes.

**Effort:** M

**Design:**
- Right-click on any object → "Add Comment". Opens a small popover near the object: textarea, optional author field, Save / Cancel.
- The object gets a small comment indicator badge (speech bubble icon, hot orange) in its top-left corner. Counter if multiple comments.
- Click the indicator to open a Comments side panel (or modal) showing all comments on that object, oldest first. Each comment has: author, timestamp, body, resolved checkbox, delete.
- A new topbar button "💬 Comments" opens a global Comments panel showing all comments project-wide, with filters: All / Open / Resolved.
- Comments are part of the project file (`S.comments = []`).

**Implementation:**
1. Schema: `S.comments = [{id, objectId, author, body, timestampMs, resolved}]`.
2. Right-click menu entry "Add Comment" + popover UI.
3. In `render()`, draw the comment indicator badge on objects with at least one comment.
4. Click indicator → open the per-object comments panel.
5. Global Comments topbar button → modal listing all comments with filters.
6. Resolve checkbox toggles `resolved`. Resolved comments hide their indicator by default (configurable).
7. Comments referencing deleted objects are auto-resolved on delete (not removed, in case of restore via undo).

**Verification:**
- Right-click a conveyor → Add Comment → type and save. Indicator appears.
- Click indicator: comment text shows.
- Add a second comment, counter shows "2".
- Resolve one: counter shows "1" (open comments only).
- Global Comments panel lists both, filters work.
- Save/reload: comments persist with author and timestamp.
- Delete the conveyor: comments survive (with `resolved: true` and orphan flag) so undo restores cleanly.

**Don't break:**
- Notes (text/arrow on canvas) are unaffected — different data structure, different UI surface.

**Commit point.**

---

# PHASE 16 — Revision History

**From Section D, item 12.**

**Goal:** Save labeled snapshots of the project, view them, restore one.

**Effort:** M

**Design:**
- New topbar button (or Options menu entry): "📌 Save Revision". Prompts for a label ("Rev A — initial walkthrough"). Captures a deep clone of the entire project state into `S.revisions`.
- Each revision: `{id, label, timestampMs, payload}` where `payload` is the same JSON shape as a saved `.flowforge` file (objects, notes, customs, proj, etc.).
- New topbar button: "🕘 History". Opens a modal listing all revisions, newest first: label, timestamp, object count.
- Each row has: Restore, Rename, Delete buttons.
- Restore: confirms, then routes through `applyLoadedProjectData()` with the snapshot's payload. The current state is **first** saved as a new revision labeled "Before restoring [label]" so the action is undoable.
- Revisions are saved as part of the project file (so revisions survive Save → Open).

**Implementation:**
1. Schema: `S.revisions = [{id, label, timestampMs, payload}]`. Update `parseProjectPayload` and `validateLoadedRecordList`.
2. `saveRevision(label)` deep-clones `S.proj`, `S.objects`, `S.notes`, `S.customs`, etc.
3. `restoreRevision(id)` saves the current state as an auto-revision, then applies the snapshot.
4. The History modal UI.
5. Warn the user that revisions inflate file size (each revision is roughly the size of a full save). Suggest using sparingly — show approximate combined size in the modal footer.

**Verification:**
- Save Revision "Rev A". Modify the layout. Save Revision "Rev B".
- Open History: both listed with timestamps.
- Restore "Rev A": auto-revision created, layout reverts.
- Save the project. Reopen it. History is intact.
- Delete a revision: it's gone permanently.

**Don't break:**
- Undo/redo still works in parallel — revisions are macro-level, undo is micro-level.

**Commit point.**

---

# PHASE 17 — BOM Line Annotations

**From Section D, item 13.**

**Goal:** The BOM export becomes the start of a quote: add lead time, vendor, list price, markup % per line.

**Effort:** M

**Design:**
- Before BOM export, open a BOM Editor modal. Show the consolidated BOM lines (today's BOM logic) with editable columns:
  - SKU / Name (read-only, from the placed item)
  - Qty (read-only)
  - Lead Time (free text, e.g., "4 wks")
  - Vendor (free text, defaults to the family vendor)
  - Unit List Price (number, USD)
  - Markup % (number, e.g., 25)
  - Computed: Unit Sell = List × (1 + Markup/100)
  - Computed: Extended Sell = Unit Sell × Qty
- Footer: Subtotal, Tax % field, Total.
- "Export BOM" button on the modal exports the BOM HTML with all these columns. "Save Quote" button saves these annotations into the project file so the next time you BOM, they're pre-filled.
- A new toggle "Include pricing" controls whether price columns appear in the export. Off by default — the lead time and vendor are always exported, prices only if explicitly on.

**Implementation:**
1. Schema: `S.bomAnnotations = { 'cdlr-Straight-27.25': {leadTime, vendor, listPrice, markupPct}, ... }` keyed by family+name+BF (stable key the user can identify across project edits).
2. BOM Editor modal: derive lines from `S.objects`, lookup annotations by key, render the table.
3. Update the BOM HTML template (the one at line ~4724 in OmniNapkin) to support the new columns. Add a "pricing on/off" branch in the template.
4. Save annotations on close.

**Verification:**
- Place 3 CDLRs and 2 Belts. Click BOM: editor shows 2 lines with quantities 3 and 2.
- Enter prices and markup. Subtotal updates live.
- Export: HTML BOM opens with all columns. Pricing toggle off: prices hidden.
- Reload the project: annotations are remembered.
- Place a 4th CDLR: the line quantity updates to 4 and the annotations apply.

**Don't break:**
- The base BOM export (no annotations) still works for users who skip the editor or click Export directly.

**Commit point.**

---

# PHASE 18 — Bottleneck / Flow Highlighter

**From Section D, item 14.**

**Goal:** Animated dots flowing along powered conveyor paths — pure demo polish.

**Effort:** L

**Design:**
- Options menu toggle: "▶ Animate Flow" (off by default).
- When on: for each powered conveyor, spawn a particle at the upstream endpoint that travels along the conveyor's geometry (straight or arc) at a speed proportional to its FPM, then despawns at the downstream endpoint.
- Particles are small filled circles, hot orange, ~6px diameter at the current zoom.
- Curved conveyors: particle follows the arc.
- Transfers and turntables: particles fade through them (no need to simulate the actual pop-up / rotation).
- The animation runs via `requestAnimationFrame`. Off by default to avoid battery drain.
- Spawning rate: ~1 particle per second per conveyor, with random jitter so it doesn't look mechanical.

**Implementation:**
1. `S.flowAnimation = {enabled: false, particles: [], lastTick: 0}`.
2. `startFlowAnimation()` / `stopFlowAnimation()` toggles the rAF loop.
3. Each tick: advance particle positions along their path; spawn new ones; remove off-the-end ones; re-render the overlay layer (or use a dedicated SVG layer for flow so we don't re-render the world).
4. Path geometry: straight conveyors are obvious; curved conveyors need arc-following based on `iR`, `oR`, `cAng`, `cHand`, and rotation.
5. Direction: for now, assume flow direction matches the conveyor's local +X axis after rotation. A future enhancement could let the user flip per-conveyor.

**Verification:**
- Toggle on: dots appear and flow along every powered conveyor.
- Curves: dots follow the arc, not a straight chord.
- Transfers / turntables: dots pass through (or fade) without breaking.
- Toggle off: animation stops cleanly, no leftover particles.
- Saving/loading does not capture animation state (it's transient).

**Don't break:**
- Frame rate stays above 30 fps on a 50-object layout with animation on. If not, throttle to 15 fps or reduce particle density.
- Selection, drag, all other interactions remain fully responsive.

**Commit point.**

---

# PHASE 19 — Final Integration Pass

**Goal:** Sanity check the whole product top-to-bottom after everything is layered in.

**Effort:** M

**Steps:**
1. **Re-run the Phase 4 parity checklist in full.** Every box must still check.
2. **Run a 50-object stress test:** build a layout with ~50 conveyors of mixed families, 5 T-Cars on 2 rails, 10 tags, 5 notes with arrows, 5 comments, 2 revisions, 1 group of 8 objects. Save. Reopen. Verify everything restores.
3. **Export everything:** PNG, PDF (with cover), PDF (with cover + tiled across 4 pages), BOM (with pricing). Visually check each output.
4. **Compare mode:** load a second project; pan and zoom; verify deltas; exit cleanly.
5. **Presentation mode:** toggle on, walk through the demo library examples, toggle off.
6. **Toggle every Options-menu toggle on, then off:** Hide Tags, Hide Labels, Hide Notes, Show Throughput, Animate Flow. No console errors, no orphaned visuals.
7. **Browser console:** must be clean of errors and warnings throughout the test.
8. **File size:** report the final file size. Expected: ~3.0 MB ± 0.3 MB (Napkin baseline + maybe 200–400 KB of new code).
9. **Performance:** with all features off on a blank canvas, drag-creating an object should feel instant (<50ms). With flow animation on and 50 objects, drag should still be smooth.

**If anything regresses, fix before declaring done.**

---

# Out of scope (do not build now)

These were considered but pushed:
- **Real flow simulation** with queueing, backpressure, blocking — Phase 18 is animation only, not physics.
- **Multi-user collaboration** — single-user single-file stays.
- **Cloud sync** — local file only.
- **Mobile / touch optimization** — desktop-first.
- **Localization** — English only.
- **Heatmap overlay** of utilization data — would need real-world data input; deferred.
- **Vendor-specific cut sheets** in the BOM — useful but a separate effort to gather and embed the PDFs.

If a feature isn't in Phases 0–19, it doesn't ship in this build.

---

# Guardrails reminder

Before shipping, the build owner re-confirms:
1. Single file. Double-click runs.
2. No external dependencies except the optional CDN fallbacks.
3. All Napkin features still work (Phase 4 checklist).
4. All Section D features work (Phases 5–18 verifications).
5. `.flowforge` file format is backward-compatible — files saved before annotations / revisions / dimensions still load.
6. Console is clean.
7. Brand identity is consistently FlowForge throughout (no stray "OmniNapkin" or "Omni Metalcraft" anywhere user-visible).

---

# Glossary (terms used in this plan)

- **BF** — Between Frames. The inside-frame-to-inside-frame width of a conveyor (the rolling surface usable width).
- **OW / OR / IR** — Overall Width / Outside Radius (curved conveyors) / Inside Radius.
- **CDLR** — Chain-Driven Live Roller.
- **BDLR** — Belt-Driven Live Roller.
- **T-Car** — A transfer car that rides on a T-rail; used to shuttle product between non-adjacent lanes.
- **Family** — The internal type key on a conveyor object (`cdlr`, `belt`, `nor-str`, `tcar-rail`, etc.).
- **Linked BF** — Two or more conveyors whose BF moves together because they're connected at endpoints.
- **Free Move** — A per-object flag that disables auto-linking, useful for floating service equipment.
- **Group** (new in Phase 8) — A set of objects sharing a `groupId` that move/rotate/duplicate as one.
- **Revision** (new in Phase 16) — A labeled snapshot of the full project state, stored inside the project file.
- **Annotation** (new in Phase 17) — Per-BOM-line pricing/sourcing metadata, keyed by family+name+BF.
