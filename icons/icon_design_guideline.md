# Icon Design Guidelines
### Enterprise SVG Icon System — VSCode-style

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Canvas & Grid](#2-canvas--grid)
3. [Stroke System](#3-stroke-system)
4. [Color System](#4-color-system)
5. [Layout Modes](#5-layout-modes)
6. [DOM Structure & Addressability](#6-dom-structure--addressability)
7. [Badge Specification](#7-badge-specification)
8. [Edge Cases](#8-edge-cases)
9. [Consistency Rules](#9-consistency-rules)
10. [Anti-Patterns](#10-anti-patterns)
11. [Quick Reference](#11-quick-reference)
12. [Examples](#12-examples)

---

## 1. Design Principles

**Clarity first.** Every icon must be immediately legible at 16 × 16 px. If the concept cannot be represented cleanly at that size, simplify.

**One concept per icon.** The main symbol carries the noun. The badge (if present) carries the state or modifier. Never merge them into a single tangled shape.

**Consistent icon size.** The icon core is always drawn at full canvas size — regardless of whether a badge is present. Badged icons and solo icons have identical core dimensions. The badge is purely additive; the core is never shrunk, scaled, or translated to accommodate it.

**Independent layers.** The icon core and the badge are always wrapped in separate, named `<g>` elements. This makes each layer independently addressable from CSS and JavaScript — for theming, toggling, or animation — without affecting the other.

**Semantic color.** Color signals category and status, not aesthetics. A red badge means danger/failure; a green badge means success. These meanings are consistent across the entire set.

**Strokes only.** Icons are drawn with strokes, not fills, to remain theme-neutral. Any consumer can override `stroke` via CSS or the `color` attribute. Filled areas (e.g., status dots) use `fill-opacity` of 0.15–0.25 maximum so they read as subtle tints, not solid blocks.

**No invisible mass.** Badges carry no bounding shapes (circles, rectangles, backgrounds). Every pixel of SVG markup must contribute visible ink. Decorative containers add optical noise and break the stroke-only rendering contract.

---

## 2. Canvas & Grid

```
┌───────────────────────────────────────┐ ← canvas edge (0,0)–(24,24)
│ 1px inset │
│ ┌─────────────────────────────────┐ │
│ │ │ │
│ │ USABLE AREA (1,1)–(23,23) │ │
│ │ │ │
│ └─────────────────────────────────┘ │
│ │
└───────────────────────────────────────┘
```

| Property | Value |
|-----------------|-----------------------|
| ViewBox | `0 0 24 24` |
| Coordinate unit | 1 = 1 SVG unit |
| Minimum feature | 0.5 unit (half-pixel) |
| Usable area | (1,1) → (23,23) |
| Optical center | (12, 12) |

**Snap to 0.5 units.** Coordinates use whole or half values only (e.g., `12`, `11.5`). Sub-half coordinates (e.g., `11.3`) produce anti-aliasing artefacts at small render sizes and are forbidden.

---

## 3. Stroke System

All icons share the same stroke attributes set at the `<symbol>` root level. Child elements inherit these unless there is a documented reason to override.

```xml
stroke-width="1.5"
stroke-linecap="round"
stroke-linejoin="round"
fill="none"
```

### Stroke weight exceptions

| Situation | stroke-width | Reason |
|---|---|---|
| Standard icon — core or badge | `1.5` | Default, uniform across all icons |
| Emphasis line (e.g., a deliberate baseline) | `2` | Intentional visual hierarchy |
| Fine detail (e.g., inner clock tick marks) | `1` | Prevents fill-in at small sizes |

> **No compensated stroke weights.** The icon core is never scaled, so there is no need for any value other than `1.5` on regular paths. The old `stroke-width="2.2"` compensation is obsolete and must not be used.

### Fills

| Usage | Rule |
|---|---|
| Status dot (solid indicator) | `fill="<color>"` with `stroke="none"` |
| Tinted area (e.g., active-state ring) | `fill-opacity="0.15"` maximum |
| Badge symbol strokes | `fill="none"` |
| Icon body strokes | `fill="none"` |

---

## 4. Color System

Colors are baked into the `stroke` attribute on the core `<g>` and badge `<g>` within each `<symbol>`. They encode semantic category, not arbitrary aesthetics.

| Category | Hex | Examples |
|---|---|---|
| Navigation / Workspace | `#007ACC` (VSCode blue) | home, dashboard, workspace |
| Success / Confirmed | `#22C55E` (green) | answered-calls, lead-converted |
| Warning / Caution | `#F59E0B` (amber) | task-pending, dropped-calls |
| Error / Failure | `#EF4444` (red) | call-failed, customer-delete |
| Neutral / Inactive | `#858585` (grey) | agent-offline, cancelled |
| AI / Intelligence | `#C586C0` (purple) | ai, llm, nlp |
| Voice / Audio | `#4FC1FF` (light blue) | voice, voice-bot |
| Customers / CRM | `#9CDCFE` (pale blue) | customer, customers |
| Agents / Workforce | `#569CD6` (medium blue) | agent, agent-online |
| Leads / Sales | `#CE9178` (terracotta) | lead, sales-funnel |
| Analytics | `#DCDCAA` (khaki) | bar-chart, reports |
| Infrastructure | `#858585` + `#F48771` | server, cpu-usage |
| Logs | `#6A9955` (muted green) | audit-log, error-log |
| NLP / LLM | `#B5CEA8` (sage) | llm-chat, nlp-parser |
| Calls (operations) | `#4EC9B0` (teal) | calls, call-forward |
| Time | `#4EC9B0` / `#F59E0B` | hand-watch, stop-clock |

**Badge color independence.** The badge `<g>` always carries its own semantic color, independent of the core `<g>` color. A teal phone icon with a red missed-badge uses `stroke="#4EC9B0"` on the core group and `stroke="#EF4444"` on the badge group.

---

## 5. Layout Modes

There are two layout modes. The icon core is **always drawn at full canvas size** in both modes.

### Mode A — Solo (no badge)

The icon fills the full usable area `(1,1)–(23,23)`. The entire symbol contains one `<g class="icon-core">` and nothing else.

```
┌────────────────────────────┐
│ │
│ ┌──────────────────┐ │
│ │ │ │
│ │ ICON FILLS │ │
│ │ FULL CANVAS │ │
│ │ │ │
│ └──────────────────┘ │
│ │
└────────────────────────────┘
(0,0) (24,24)
```

### Mode B — Badged (full-size core + badge overlay)

The icon core is drawn identically to Mode A — full canvas, no scaling, no transform. A badge glyph is then overlaid in whichever corner is free. The badge is an additive element that sits on top without altering the core.

```
(0,0)──────────────────────────(24,0)
│ ┌──────┐ │
│ │ ✓ │ ← badge overlay (top-right DEFAULT)
│ └──────┘ │
│ ┌───────────────────────────┐ │
│ │ │ │
│ │ ICON CORE — FULL SIZE │ │
│ │ identical to solo mode │ │
│ │ │ │
│ └───────────────────────────┘ │
(0,24)──────────────────────────(24,24)
```

#### Badge corner priority

```
1st choice → TOP-RIGHT anchor (20, 4) ← DEFAULT
2nd choice → BOTTOM-RIGHT anchor (20, 20)
3rd choice → TOP-LEFT anchor ( 4, 4)
4th choice → BOTTOM-LEFT anchor ( 4, 20)
```

Select the **highest-priority corner whose exclusion zone is completely empty**. "Empty" means no strokes from **any source** — neither the `icon-core` group nor any existing `icon-badge` group — pass through the 7 × 7 exclusion zone for that corner (see §7). The check is against the final rendered canvas, not just the core paths.

Only fall through to the next corner when the exclusion zone is genuinely occupied by existing ink. Do not skip a corner out of aesthetic preference.

#### Canvas diagram — all four corners

```
(0,0)──────────────────────────────(24,0)
│ ┌──────┐ ┌──────┐ │
│ │ TL │ │ TR ● │ ← 1st choice
│ │ (4,4)│ │(20,4)│ │
│ └──────┘ └──────┘ │
│ │
│ ICON CORE (full size) │
│ no transform applied │
│ │
│ ┌──────┐ ┌──────┐ │
│ │ BL │ │ BR │ ← 2nd choice
│ │(4,20)│ │(20,20│ │
│ └──────┘ └──────┘ │
(0,24)──────────────────────────(24,24)
```

---

## 6. DOM Structure & Addressability

Every icon — solo or badged — must follow a strict two-layer `<g>` structure inside the `<symbol>`. This ensures that the core and the badge are independently selectable by CSS class, JavaScript querySelector, or GSAP/Motion animation targets.

### Solo icon structure (Mode A)

```xml
<symbol id="calls" viewBox="0 0 24 24"
fill="none" stroke-linecap="round" stroke-linejoin="round">

<g class="icon-core" stroke="#4EC9B0" stroke-width="1.5">
<!-- all icon paths go here -->
<path d="M22 16.92v3 ... z"/>
</g>

<!-- no badge group in solo mode -->

</symbol>
```

### Badged icon structure (Mode B)

```xml
<symbol id="answered-calls" viewBox="0 0 24 24"
fill="none" stroke-linecap="round" stroke-linejoin="round">

<g class="icon-core" stroke="#4EC9B0" stroke-width="1.5">
<!-- all icon paths — full size, no transform -->
<path d="M22 16.92v3 ... z"/>
</g>

<g class="icon-badge" stroke="#22C55E" stroke-width="1.5">
<!-- badge paths — in chosen corner -->
<polyline points="17.5,4 19.5,6.5 22.5,1.5" fill="none"/>
</g>

</symbol>
```

### Naming rules

| Element | Required attribute | Purpose |
|---|---|---|
| Core group | `class="icon-core"` | Selects/animates the icon body independently |
| Badge group | `class="icon-badge"` | Selects/animates the badge independently |
| Symbol | `id="<icon-name>"` | Unique identifier for `<use href="#...">` |

### CSS targeting examples

```css
/* Dim the core when the badge indicates failure */
.icon-missed_calls .icon-core { opacity: 0.6; }
.icon-missed_calls .icon-badge { stroke: #EF4444; }

/* Hide all badges globally */
.icon-badge { display: none; }

/* Highlight only the badge on hover */
.icon-card:hover .icon-badge { filter: brightness(1.4); }
```

### JavaScript / animation targeting examples

```js
// Toggle badge visibility
const badge = document.querySelector('#my-icon .icon-badge');
badge.style.display = badge.style.display === 'none' ? '' : 'none';

// Animate the badge in with GSAP
gsap.from('#answered-calls .icon-badge', {
scale: 0, transformOrigin: '20px 4px', duration: 0.3, ease: 'back.out'
});

// Swap badge color dynamically
document.querySelectorAll('.icon-badge').forEach(b => {
b.setAttribute('stroke', newColor);
});
```

### `<use>` in HTML

When an icon is referenced via `<use>`, the shadow DOM exposes the class names and they remain targetable through the host element:

```html
<svg class="icon icon-answered_calls" viewBox="0 0 24 24" width="24" height="24">
<use href="#answered-calls"/>
</svg>
```

```css
/* Target via the host class */
.icon-answered_calls .icon-badge { opacity: 1; }
```

---

## 7. Badge Specification

### Corner positions — full specification

| Priority | Corner | Anchor | Symbol box (5×5) | Exclusion zone (7×7) |
|---|---|---|---|---|
| **1st — DEFAULT** | **Top-right** | `(20, 4)` | x: 17.5→22.5 y: 1.5→6.5 | x: 16.5→23.5 y: 0.5→7.5 |
| 2nd | Bottom-right | `(20, 20)` | x: 17.5→22.5 y: 17.5→22.5 | x: 16.5→23.5 y: 16.5→23.5 |
| 3rd | Top-left | `(4, 4)` | x: 1.5→6.5 y: 1.5→6.5 | x: 0.5→7.5 y: 0.5→7.5 |
| 4th | Bottom-left | `(4, 20)` | x: 1.5→6.5 y: 17.5→22.5 | x: 0.5→7.5 y: 16.5→23.5 |

### Exclusion zone

Before placing a badge in a corner, verify that the **7 × 7 exclusion zone** for that corner is completely empty — containing no strokes from any source:

- **Icon core strokes** — any path inside `<g class="icon-core">`
- **Existing badge strokes** — any path inside an already-placed `<g class="icon-badge">`

Both sources must be checked. A corner is only eligible if it is free of all existing ink. The exclusion zone is 1 unit larger than the 5 × 5 symbol box on each side, providing a clear visual gap between whatever is already drawn and the new badge glyph.

Because the core is never scaled or transformed, this check is performed directly against the original path coordinates. No transform arithmetic is required.

### Symbol box

The badge glyph must fit within the **5 × 5 symbol box** centered on the anchor. No stroke endpoint or arc may reach outside this box. This guarantees the badge never clips at the canvas edge and never visually collides with the icon core.

### No containers

**Badges have no bounding shape.** Do not use `<circle>`, `<rect>`, `<ellipse>`, or any filled shape behind the badge glyph. Containers occlude the icon core at small sizes, add optical noise, and break the stroke-only rendering contract.

### Badge stroke weight

```
stroke-width="1.5"
```

Set on the `<g class="icon-badge">` element. Matches the icon core weight exactly. No compensation is ever needed.

### Badge symbol catalog

| Badge glyph | Symbol | Semantic meaning |
|---|---|---|
| **✓ checkmark** | `polyline` (3 points) | Success, answered, confirmed |
| **× cross** | two `line` elements | Failure, missed, declined |
| **/ slash** | single diagonal `line` | Dropped, degraded, partial |
| **+ plus** | two perpendicular `line` elements | New, added, created |
| **− minus** | single horizontal `line` | Removed, none, unpicked |
| **↑ up arrow** | `line` + arrowhead `polyline` | Escalated, ascending |
| **↓ down arrow** | `line` + arrowhead `polyline` | Lowered, descending |
| **→ right arrow** | `line` + arrowhead `polyline` | Converted, forwarded, next |
| **← left arrow** | `line` + arrowhead `polyline` | Abandoned, returned |
| **● dot** | filled `circle`, `stroke="none"` | Live, active, online status |

### Badge glyph SVG snippets

All snippets below go inside `<g class="icon-badge" stroke="<color>" stroke-width="1.5">`. The `stroke` color is set on the group, not on individual elements.

---

#### Top-right corner — anchor (20, 4) — DEFAULT

```xml
<!-- ✓ Checkmark -->
<polyline points="17.5,4 19.5,6.5 22.5,1.5" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>

<!-- × Cross -->
<line x1="17.5" y1="1.5" x2="22.5" y2="6.5" stroke-linecap="round"/>
<line x1="22.5" y1="1.5" x2="17.5" y2="6.5" stroke-linecap="round"/>

<!-- / Slash -->
<line x1="18" y1="7" x2="22" y2="1" stroke-linecap="round"/>

<!-- + Plus -->
<line x1="20" y1="1.5" x2="20" y2="6.5" stroke-linecap="round"/>
<line x1="17.5" y1="4" x2="22.5" y2="4" stroke-linecap="round"/>

<!-- − Minus -->
<line x1="17.5" y1="4" x2="22.5" y2="4" stroke-linecap="round"/>

<!-- ↑ Up arrow -->
<line x1="20" y1="7" x2="20" y2="1.5" stroke-linecap="round"/>
<polyline points="17.5,4 20,1.5 22.5,4" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>

<!-- ↓ Down arrow -->
<line x1="20" y1="1" x2="20" y2="6.5" stroke-linecap="round"/>
<polyline points="17.5,4 20,6.5 22.5,4" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>

<!-- → Right arrow -->
<line x1="17.5" y1="4" x2="23" y2="4" stroke-linecap="round"/>
<polyline points="20.5,1.5 23,4 20.5,6.5" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>

<!-- ← Left arrow -->
<line x1="22.5" y1="4" x2="17" y2="4" stroke-linecap="round"/>
<polyline points="19.5,1.5 17,4 19.5,6.5" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>

<!-- ● Dot (use fill, not stroke) -->
<circle cx="20" cy="4" r="2" fill="currentColor" stroke="none"/>
```

---

#### Bottom-right corner — anchor (20, 20) — 2nd choice

```xml
<!-- ✓ Checkmark -->
<polyline points="17.5,20 19.5,22.5 22.5,17.5" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>

<!-- × Cross -->
<line x1="17.5" y1="17.5" x2="22.5" y2="22.5" stroke-linecap="round"/>
<line x1="22.5" y1="17.5" x2="17.5" y2="22.5" stroke-linecap="round"/>

<!-- / Slash -->
<line x1="18" y1="23" x2="22" y2="17" stroke-linecap="round"/>

<!-- + Plus -->
<line x1="20" y1="17.5" x2="20" y2="22.5" stroke-linecap="round"/>
<line x1="17.5" y1="20" x2="22.5" y2="20" stroke-linecap="round"/>

<!-- − Minus -->
<line x1="17.5" y1="20" x2="22.5" y2="20" stroke-linecap="round"/>

<!-- ↑ Up arrow -->
<line x1="20" y1="23" x2="20" y2="17.5" stroke-linecap="round"/>
<polyline points="17.5,20 20,17.5 22.5,20" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>

<!-- ↓ Down arrow -->
<line x1="20" y1="17" x2="20" y2="22.5" stroke-linecap="round"/>
<polyline points="17.5,20 20,22.5 22.5,20" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>

<!-- ● Dot -->
<circle cx="20" cy="20" r="2" fill="currentColor" stroke="none"/>
```

---

#### Top-left corner — anchor (4, 4) — 3rd choice

```xml
<!-- ✓ Checkmark -->
<polyline points="1.5,4 3.5,6.5 6.5,1.5" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>

<!-- × Cross -->
<line x1="1.5" y1="1.5" x2="6.5" y2="6.5" stroke-linecap="round"/>
<line x1="6.5" y1="1.5" x2="1.5" y2="6.5" stroke-linecap="round"/>

<!-- / Slash -->
<line x1="2" y1="7" x2="6" y2="1" stroke-linecap="round"/>

<!-- + Plus -->
<line x1="4" y1="1.5" x2="4" y2="6.5" stroke-linecap="round"/>
<line x1="1.5" y1="4" x2="6.5" y2="4" stroke-linecap="round"/>

<!-- − Minus -->
<line x1="1.5" y1="4" x2="6.5" y2="4" stroke-linecap="round"/>

<!-- ↑ Up arrow -->
<line x1="4" y1="7" x2="4" y2="1.5" stroke-linecap="round"/>
<polyline points="1.5,4 4,1.5 6.5,4" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>

<!-- ↓ Down arrow -->
<line x1="4" y1="1" x2="4" y2="6.5" stroke-linecap="round"/>
<polyline points="1.5,4 4,6.5 6.5,4" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>

<!-- → Right arrow -->
<line x1="1.5" y1="4" x2="7" y2="4" stroke-linecap="round"/>
<polyline points="4.5,1.5 7,4 4.5,6.5" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>

<!-- ● Dot -->
<circle cx="4" cy="4" r="2" fill="currentColor" stroke="none"/>
```

---

#### Bottom-left corner — anchor (4, 20) — 4th choice

```xml
<!-- ✓ Checkmark -->
<polyline points="1.5,20 3.5,22.5 6.5,17.5" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>

<!-- × Cross -->
<line x1="1.5" y1="17.5" x2="6.5" y2="22.5" stroke-linecap="round"/>
<line x1="6.5" y1="17.5" x2="1.5" y2="22.5" stroke-linecap="round"/>

<!-- / Slash -->
<line x1="2" y1="23" x2="6" y2="17" stroke-linecap="round"/>

<!-- + Plus -->
<line x1="4" y1="17.5" x2="4" y2="22.5" stroke-linecap="round"/>
<line x1="1.5" y1="20" x2="6.5" y2="20" stroke-linecap="round"/>

<!-- − Minus -->
<line x1="1.5" y1="20" x2="6.5" y2="20" stroke-linecap="round"/>

<!-- ↑ Up arrow -->
<line x1="4" y1="23" x2="4" y2="17.5" stroke-linecap="round"/>
<polyline points="1.5,20 4,17.5 6.5,20" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>

<!-- ↓ Down arrow -->
<line x1="4" y1="17" x2="4" y2="22.5" stroke-linecap="round"/>
<polyline points="1.5,20 4,22.5 6.5,20" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>

<!-- ● Dot -->
<circle cx="4" cy="20" r="2" fill="currentColor" stroke="none"/>
```

---

## 8. Edge Cases

### How to read path coordinates against exclusion zones

Every SVG path command produces one or more anchor coordinates that must each be checked independently. Do not rely on visual impression — trace the numbers.

| Command | Coordinates to check |
|---|---|
| `M x y` | `(x, y)` — the move-to start point |
| `L x y` / `l dx dy` | endpoint |
| `H x` / `h dx` | horizontal endpoint |
| `V y` / `v dy` | vertical endpoint |
| `C … x y` / `c` | the final control point and endpoint |
| `A … x y` / `a` | the arc endpoint **AND** the full arc curve (see below) |
| `Z` / `z` | no new coordinate |
| `<line x1 y1 x2 y2>` | both `(x1,y1)` and `(x2,y2)` |
| `<polyline points="…">` | every point in the list |
| `<rect x y width height>` | all four corners: `(x,y)`, `(x+w,y)`, `(x,y+h)`, `(x+w,y+h)` |
| `<circle cx cy r>` | the four extremes: `(cx±r, cy)` and `(cx, cy±r)` |

### Arc curves — endpoint is not enough

For `A` / `a` commands, checking only the declared endpoint is insufficient. An arc is a continuous curve that can bulge into a corner zone even when both its start and end points are outside that zone.

**The rule for arcs:** If any part of the arc's bounding box overlaps a corner's exclusion zone, treat that corner as occupied. The safe practical test is: mentally draw the arc's extreme reach in both x and y — if those extremes enter the exclusion zone, the corner is blocked.

For a circular arc, the extremes can reach `cx ± r` and `cy ± r` depending on the arc's sweep. When in doubt, render the icon and visually inspect whether any visible stroke sits inside the exclusion zone before placing the badge.

**Example:** The phone signal-arc `M14.05 2 a9 9 0 0 1 8 7.94` starts at `(14.05, 2)` and ends at `(22.05, 9.94)`. Both endpoints are outside TR. However the arc sweeps through an area whose x-extent reaches toward x=22 while y is near 2 — meaning the arc curve itself can pass through the TR zone `(x:16.5–23.5, y:0.5–7.5)`. That corner is therefore occupied by the arc curve even though neither endpoint lands in it.

**Common traps:**

- **`M` start point** — `M22 16.92` places a coordinate at `(22, 16.92)`, inside BR. The path does not have to *end* in a zone to block it.
- **Arc endpoint mid-path** — `… A2 2 0 0 1 4.11 2 h3 …` places a point at `(4.11, 2)`, inside TL. Even if the path continues elsewhere, this blocks TL.
- **Arc curve bulge** — An arc from `(14, 2)` to `(22, 10)` with r=9 bulges rightward and upward. Visually inspect whether the curve passes through any corner zone, even if the endpoints don't.
- **Baseline** — `<line x1="2" y1="20" x2="22" y2="20"/>` has endpoint `(22, 20)` inside BR.
- **Rounded rect corners** — `<rect x="16" y="2" width="6" height="5"/>` has a corner at `(22, 2)` inside TR.

### Verification workflow

1. List every anchor coordinate from every path command in `icon-core`.
2. Check each against all four exclusion zones.
3. For any `A`/`a` arc commands, additionally inspect the rendered arc curve visually.
4. Mark corners as occupied or free.
5. Place the badge in the highest-priority free corner.



The check at each step is: **does any existing stroke** (from `icon-core` or any `icon-badge` already placed) **pass through this corner's exclusion zone?** If yes, that corner is occupied — fall through to the next.

```
Does ANY existing stroke occupy the TR exclusion zone?
(icon-core OR icon-badge strokes · x: 16.5→23.5, y: 0.5→7.5)
│
┌─────┴─────┐
NO YES — TR is occupied
│ │
Use TR Does ANY existing stroke occupy the BR zone?
(20,4) (x: 16.5→23.5, y: 16.5→23.5)
DEFAULT │
┌─────┴─────┐
NO YES — BR is occupied
│ │
Use BR Does ANY existing stroke occupy the TL zone?
(20,20) (x: 0.5→7.5, y: 0.5→7.5)
│
┌─────┴─────┐
NO YES — TL is occupied
│ │
Use TL Use BL
(4,4) (4,20)
```

> **Why "any existing stroke" and not just "core stroke"?** A corner may be clear of icon core paths but already contain a previously placed badge, or the icon design may have a core element that sits in BR even though the icon's primary body is elsewhere. The rule is simple: if there is any ink in the exclusion zone, that corner is off-limits.

### Case 1 — Top-right clear (standard, most common)

The vast majority of icons have their visual mass centered or left-leaning, leaving the top-right corner free. The phone handset, user avatar, document, bar chart, and most others fall into this case.

```xml
<symbol id="answered-calls" viewBox="0 0 24 24"
fill="none" stroke-linecap="round" stroke-linejoin="round">

<g class="icon-core" stroke="#4EC9B0" stroke-width="1.5">
<path d="M22 16.92v3 ... z"/>
</g>

<g class="icon-badge" stroke="#22C55E" stroke-width="1.5">
<!-- top-right checkmark -->
<polyline points="17.5,4 19.5,6.5 22.5,1.5" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>
</g>

</symbol>
```

### Case 2 — Top-right occupied, bottom-right also occupied → check top-left

Both right corners can be occupied by a single icon whose paths span the entire right side. This is more common than it appears — any path that starts at `M22` immediately occupies BR, and a path that has an arc endpoint near `(4, 2)` simultaneously occupies TL.

```xml
<symbol id="bar-chart-add" viewBox="0 0 24 24"
fill="none" stroke-linecap="round" stroke-linejoin="round">

<!--
Tallest bar at x=18 runs y=4→y=20.
Top end (18,4) is inside TR (x>16.5, y<7.5).
Bottom end (18,20) is inside BR (x>16.5, y>16.5).
TR occupied, BR occupied → check TL → TL zone is empty → use TL.
-->
<g class="icon-core" stroke="#DCDCAA" stroke-width="1.5">
<line x1="18" y1="20" x2="18" y2="4"/> <!-- top (18,4)→TR, bottom (18,20)→BR -->
<line x1="12" y1="20" x2="12" y2="8"/>
<line x1="6" y1="20" x2="6" y2="14"/>
<line x1="2" y1="20" x2="22" y2="20"/> <!-- baseline end (22,20)→BR -->
</g>

<g class="icon-badge" stroke="#22C55E" stroke-width="1.5">
<!-- top-left: TL zone is empty -->
<line x1="4" y1="1.5" x2="4" y2="6.5" stroke-linecap="round"/>
<line x1="1.5" y1="4" x2="6.5" y2="4" stroke-linecap="round"/>
</g>

</symbol>
```

### Case 3 — Three corners occupied → use bottom-left

This case is more common than "radial icons only". Any icon whose path starts at a high x,y (e.g., `M22 16.92`) occupies BR, and whose path also passes through the top-left area (e.g., arc endpoint near `(4, 2)`) simultaneously occupies TL. Add an outgoing arrow that reaches TR, and all three preferred corners are blocked — only BL remains.

**Worked example — `make-call` icon:**

The make-call icon uses the standard phone handset path plus an outgoing arrow. Tracing every coordinate:

| Coordinate | Value | Zone hit |
|---|---|---|
| Phone `M` start | `(22, 16.92)` | **BR** — x=22>16.5, y=16.92>16.5 |
| Phone arc endpoint | `(4.11, 2)` | **TL** — x=4.11<7.5, y=2<7.5 |
| Arrow point | `(21, 3)` | **TR** — x=21>16.5, y=3<7.5 |
| Arrow line end | `(21, 3)` | **TR** |

Result: TR, BR, and TL are all occupied by the phone/arrow paths. **Only BL is free.**

```xml
<symbol id="make-call" viewBox="0 0 24 24"
fill="none" stroke-linecap="round" stroke-linejoin="round">

<!--
Check every coordinate:
Phone M22 16.92 → (22, 16.92) inside BR (x>16.5, y>16.5) ← BLOCKS BR
Phone A…4.11 2 → (4.11, 2) inside TL (x<7.5, y<7.5) ← BLOCKS TL
Arrow (21,3) → inside TR (x>16.5, y<7.5) ← BLOCKS TR
BL zone (x:0.5–7.5, y:16.5–23.5) → no path coordinates → FREE
-->
<g class="icon-core" stroke="#4EC9B0" stroke-width="1.5">
<path d="M22 16.92v3a2 2 0 0 1-2.18 2
19.79 19.79 0 0 1-8.63-3.07
19.5 19.5 0 0 1-6-6
19.79 19.79 0 0 1-3.07-8.67
A2 2 0 0 1 4.11 2h3
a2 2 0 0 1 2 1.72
12.84 12.84 0 0 0 .7 2.81
2 2 0 0 1-.45 2.11L8.09 9.91
a16 16 0 0 0 6 6
l1.27-1.27a2 2 0 0 1 2.11-.45
12.84 12.84 0 0 0 2.81.7
A2 2 0 0 1 22 16.92z" fill="none"/>
<polyline points="15 3 21 3 21 9" fill="none"/>
<line x1="10" y1="14" x2="21" y2="3"/>
</g>

<g class="icon-badge" stroke="#22C55E" stroke-width="1.5">
<!-- bottom-left: the only free corner -->
<polyline points="1.5,20 3.5,22.5 6.5,17.5" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>
</g>

</symbol>
```

### Case 4 — All four corners examined, only one free

The same logic applies to any icon where path arithmetic reveals three occupied corners. It is not limited to radially symmetric icons. Always compute, never guess.

```xml
<!-- radial icon — concentric circles fill all corners -->
<symbol id="live-calls" viewBox="0 0 24 24"
fill="none" stroke-linecap="round" stroke-linejoin="round">

<g class="icon-core" stroke="#4EC9B0" stroke-width="1.5">
<circle cx="12" cy="12" r="9"/>
<!-- r=9: extremes at (3,12),(21,12),(12,3),(12,21) — all corners occupied -->
<circle cx="12" cy="12" r="5" fill="#4EC9B0" fill-opacity="0.15"/>
<circle cx="12" cy="12" r="1.5" fill="#4EC9B0" stroke="none"/>
</g>

<g class="icon-badge" fill="#22C55E">
<circle cx="4" cy="20" r="2" stroke="none"/>
</g>

</symbol>
```

### Case 5 — Partial encroachment (trim before falling through)

Before falling to the next corner, check whether the encroaching element is minor (a tick mark, a small arc tip). If so, apply a `clipPath` to exclude the exclusion zone from the core group rather than relocating the badge.

```xml
<clipPath id="clip-no-tr-my-icon">
<!-- everything except the top-right exclusion zone -->
<path d="M0 0 H16.5 V24 H24 V7.5 H16.5 V0 Z"/>
</clipPath>

<g class="icon-core" stroke="#4EC9B0" stroke-width="1.5"
clip-path="url(#clip-no-tr-my-icon)">
<!-- icon paths, trimmed away from TR zone -->
</g>

<g class="icon-badge" stroke="#22C55E" stroke-width="1.5">
<!-- badge at top-right, undisturbed -->
<polyline points="17.5,4 19.5,6.5 22.5,1.5" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>
</g>
```

Only fall through to the next corner if clipping visibly disfigures the icon's recognisability.

### Case 6 — State via color only (no badge shape)

If an icon's state is communicated by changing its `stroke` color alone (e.g., green for available, grey for offline), no badge group is needed. Use Mode A with a color override.

---

## 9. Consistency Rules

These rules must hold for every icon. Verify before committing.

| # | Rule | Correct | Incorrect |
|---|---|---|---|
| 1 | Badge placed in highest-priority corner whose exclusion zone contains no existing strokes (core or badge) | TR used when TR zone has no ink | TR skipped when TR zone is actually empty; or BR used when BR zone already has core strokes |
| 2 | Icon core always full canvas, no scaling | Direct full-size paths | `scale(0.68)` or any transform on core |
| 3 | Core and badge in separate `<g>` with correct `class` | `class="icon-core"` / `class="icon-badge"` | Paths loose inside `<symbol>`, no class |
| 4 | Core and badge visually the same size as their solo counterparts | Identical paths, identical coordinates | Core paths nudged or resized to avoid badge |
| 5 | Badge fits inside its 5×5 symbol box | All points within box | Any point outside box |
| 6 | No badge has a container shape | Raw strokes only | `<rect>` or `<circle>` behind badge |
| 7 | `stroke-width="1.5"` set on `<g>`, not on individual paths | Group-level stroke | Per-path overrides |
| 8 | No compensated stroke weights | Only `1.5` (and `1` or `2` for exceptions) | `stroke-width="2.2"` anywhere |
| 9 | `fill="none"` at `<symbol>` level, inherited by children | Symbol-level default | Per-element `fill="none"` repetition |
| 10 | Badge color is semantic and independent of core color | Red badge on teal core | Teal badge on teal core |
| 11 | Status dots are badges (Mode B), never embedded in solo icon body in an exclusion zone | `<circle cx="20" cy="4">` in badge group | `<circle cx="19" cy="5">` loose in core |
| 12 | Coordinates snap to 0.5-unit grid | `17.5`, `4`, `22.5` | `17.3`, `4.1` |
| 13 | `stroke-linecap` and `stroke-linejoin` set at `<symbol>` level | Inherited by all | Per-element repetition |

---

## 10. Anti-Patterns

### ❌ Scaling the icon core to make room for a badge

The core is never scaled. The badge is an additive overlay.

```xml
<!-- WRONG: core shrunk to 68% -->
<g class="icon-core" transform="scale(0.68) translate(0,1.5)" stroke-width="2.2">
<path d="..."/>
</g>

<!-- CORRECT: core full size -->
<g class="icon-core" stroke="#4EC9B0" stroke-width="1.5">
<path d="..."/>
</g>
```

### ❌ Skipping to a lower-priority corner when a higher one is free

Always use the highest-priority corner that is actually empty. Do not skip a corner unless its exclusion zone genuinely contains existing strokes.

```xml
<!-- WRONG: BR badge when TR zone has no strokes at all -->
<g class="icon-badge" stroke="#22C55E" stroke-width="1.5">
<polyline points="17.5,20 19.5,22.5 22.5,17.5" fill="none"/> <!-- BR -->
</g>

<!-- CORRECT: TR badge (TR zone was empty) -->
<g class="icon-badge" stroke="#22C55E" stroke-width="1.5">
<polyline points="17.5,4 19.5,6.5 22.5,1.5" fill="none"/> <!-- TR -->
</g>
```

### ❌ Placing a badge in a corner that the icon core already occupies

The exclusion zone check covers **all existing strokes**, not only strokes that look like the main body. A baseline, a tick mark, or a corner element of the core that happens to fall inside an exclusion zone blocks that corner just as firmly as a large path does.

```xml
<!--
Icon: bar chart with tallest bar at x=18, running y=4 to y=20.
That bar's top (18, 4) is inside TR zone.
That bar's bottom (18, 20) is inside BR zone.
Both TR and BR are blocked by core strokes.
TL zone is empty → badge goes to TL.
-->

<!-- WRONG: badge in BR even though bar's bottom sits in BR zone -->
<g class="icon-core" stroke="#DCDCAA" stroke-width="1.5">
<line x1="18" y1="20" x2="18" y2="4"/> <!-- bottom at (18,20) is inside BR zone -->
<line x1="2" y1="20" x2="22" y2="20"/>
</g>
<g class="icon-badge" stroke="#22C55E" stroke-width="1.5">
<polyline points="17.5,20 19.5,22.5 22.5,17.5" fill="none"/> <!-- BR — OCCUPIED -->
</g>

<!-- CORRECT: badge in TL — the first genuinely empty corner -->
<g class="icon-core" stroke="#DCDCAA" stroke-width="1.5">
<line x1="18" y1="20" x2="18" y2="4"/>
<line x1="2" y1="20" x2="22" y2="20"/>
</g>
<g class="icon-badge" stroke="#22C55E" stroke-width="1.5">
<line x1="4" y1="1.5" x2="4" y2="6.5" stroke-linecap="round"/>
<line x1="1.5" y1="4" x2="6.5" y2="4" stroke-linecap="round"/>
</g>
```

### ❌ Status dot embedded in icon body inside exclusion zone

```xml
<!-- WRONG: dot at (19,5) inside TR exclusion zone, not a badge -->
<g class="icon-core" stroke="#4EC9B0" stroke-width="1.5">
<path d="M22 16.92v3 ... z"/>
<circle cx="19" cy="5" r="2" fill="#22C55E"/> <!-- inside TR zone -->
</g>

<!-- CORRECT: dot as a proper badge group -->
<g class="icon-core" stroke="#4EC9B0" stroke-width="1.5">
<path d="M22 16.92v3 ... z"/>
</g>
<g class="icon-badge" fill="#22C55E">
<circle cx="20" cy="4" r="2" stroke="none"/>
</g>
```

### ❌ Paths loose in `<symbol>` without a `<g>` wrapper

All paths must belong to either `icon-core` or `icon-badge`. Loose paths cannot be targeted independently.

```xml
<!-- WRONG: paths not in named groups -->
<symbol id="calls" viewBox="0 0 24 24" ...>
<path d="..." stroke="#4EC9B0"/>
<polyline points="..." stroke="#22C55E"/>
</symbol>

<!-- CORRECT: wrapped in named groups -->
<symbol id="answered-calls" viewBox="0 0 24 24" ...>
<g class="icon-core" stroke="#4EC9B0" stroke-width="1.5">
<path d="..."/>
</g>
<g class="icon-badge" stroke="#22C55E" stroke-width="1.5">
<polyline points="..." fill="none"/>
</g>
</symbol>
```

### ❌ Badge with a container (bounding shape)

```xml
<!-- WRONG: filled circle container behind badge glyph -->
<g class="icon-badge">
<circle cx="20" cy="4" r="5" fill="#22C55E" fill-opacity="0.2" stroke="#22C55E"/>
<polyline points="17.5,4 19.5,6.5 22.5,1.5" stroke="#22C55E"/>
</g>

<!-- CORRECT: raw badge strokes, no container -->
<g class="icon-badge" stroke="#22C55E" stroke-width="1.5">
<polyline points="17.5,4 19.5,6.5 22.5,1.5" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>
</g>
```

### ❌ Compensated or non-uniform stroke weights

```xml
<!-- WRONG: old scale-compensation weight -->
<g class="icon-core" stroke-width="2.2"> ... </g>

<!-- CORRECT: uniform 1.5 everywhere -->
<g class="icon-core" stroke-width="1.5"> ... </g>
<g class="icon-badge" stroke-width="1.5"> ... </g>
```

### ❌ Sub-half-unit coordinates

```xml
<!-- WRONG -->
<line x1="17.3" y1="4.1" x2="22.7" y2="6.8"/>

<!-- CORRECT -->
<line x1="17.5" y1="4" x2="22.5" y2="6.5"/>
```

---

## 11. Quick Reference

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ICON DESIGN QUICK REFERENCE v3 │
├──────────────────────────────┬───────────────────────────────────────────────┤
│ Canvas │ viewBox="0 0 24 24" │
│ Default stroke │ 1.5 / round / round / fill="none" │
│ set at │ <symbol> level — inherited by all children │
│ Coord snap │ 0.5 unit minimum │
├──────────────────────────────┼───────────────────────────────────────────────┤
│ ICON CORE │ Always full canvas — solo and badged alike │
│ │ No scaling, no transform, no nudging │
│ │ Wrapped in <g class="icon-core"> │
├──────────────────────────────┼───────────────────────────────────────────────┤
│ BADGE │ Additive overlay, does not affect core │
│ │ Wrapped in <g class="icon-badge"> │
│ │ No container shape — raw strokes only │
│ │ stroke-width="1.5" — same as core │
├──────────────────────────────┼───────────────────────────────────────────────┤
│ BADGE CORNER PRIORITY │ TR → BR → TL → BL │
│ │ Use first corner whose exclusion zone is │
│ │ empty of ALL strokes — core AND badge │
├──────────────────────────────┼───────────────────────────────────────────────┤
│ TOP-RIGHT (1st / DEFAULT) │ Anchor (20, 4) │
│ │ Symbol box x:17.5→22.5 y:1.5→6.5 (5×5) │
│ │ Exclusion x:16.5→23.5 y:0.5→7.5 (7×7) │
├──────────────────────────────┼───────────────────────────────────────────────┤
│ BOTTOM-RIGHT (2nd) │ Anchor (20, 20) │
│ │ Symbol box x:17.5→22.5 y:17.5→22.5 (5×5) │
│ │ Exclusion x:16.5→23.5 y:16.5→23.5 (7×7) │
├──────────────────────────────┼───────────────────────────────────────────────┤
│ TOP-LEFT (3rd) │ Anchor (4, 4) │
│ │ Symbol box x:1.5→6.5 y:1.5→6.5 (5×5) │
│ │ Exclusion x:0.5→7.5 y:0.5→7.5 (7×7) │
├──────────────────────────────┼───────────────────────────────────────────────┤
│ BOTTOM-LEFT (4th) │ Anchor (4, 20) │
│ │ Symbol box x:1.5→6.5 y:17.5→22.5 (5×5) │
│ │ Exclusion x:0.5→7.5 y:16.5→23.5 (7×7) │
└──────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 12. Examples

---

### Example 1 — Solo icon: `calls` (Mode A)

```xml
<symbol id="calls" viewBox="0 0 24 24"
fill="none" stroke-linecap="round" stroke-linejoin="round">

<g class="icon-core" stroke="#4EC9B0" stroke-width="1.5">
<path d="M22 16.92v3a2 2 0 0 1-2.18 2
19.79 19.79 0 0 1-8.63-3.07
19.5 19.5 0 0 1-6-6
19.79 19.79 0 0 1-3.07-8.67
A2 2 0 0 1 4.11 2h3
a2 2 0 0 1 2 1.72
12.84 12.84 0 0 0 .7 2.81
2 2 0 0 1-.45 2.11L8.09 9.91
a16 16 0 0 0 6 6
l1.27-1.27a2 2 0 0 1 2.11-.45
12.84 12.84 0 0 0 2.81.7
A2 2 0 0 1 22 16.92z"/>
</g>

</symbol>
```

**Checklist:**
- ✅ Core in `<g class="icon-core">`
- ✅ `stroke` and `stroke-width` on the group
- ✅ No badge group — solo icon
- ✅ No transform, no scaling

---

### Example 2 — Badged icon: `answered-calls` (Mode B, top-right — DEFAULT)

The phone handset body sits in the lower-left quadrant. The top-right corner `(x:16.5–23.5, y:0.5–7.5)` is clear — default badge placement applies.

```xml
<symbol id="answered-calls" viewBox="0 0 24 24"
fill="none" stroke-linecap="round" stroke-linejoin="round">

<!-- Core: full-size, identical to solo calls icon -->
<g class="icon-core" stroke="#4EC9B0" stroke-width="1.5">
<path d="M22 16.92v3a2 2 0 0 1-2.18 2
19.79 19.79 0 0 1-8.63-3.07
19.5 19.5 0 0 1-6-6
19.79 19.79 0 0 1-3.07-8.67
A2 2 0 0 1 4.11 2h3
a2 2 0 0 1 2 1.72
12.84 12.84 0 0 0 .7 2.81
2 2 0 0 1-.45 2.11L8.09 9.91
a16 16 0 0 0 6 6
l1.27-1.27a2 2 0 0 1 2.11-.45
12.84 12.84 0 0 0 2.81.7
A2 2 0 0 1 22 16.92z"/>
</g>

<!-- Badge: green checkmark, top-right (default) -->
<g class="icon-badge" stroke="#22C55E" stroke-width="1.5">
<polyline points="17.5,4 19.5,6.5 22.5,1.5" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>
</g>

</symbol>
```

**Checklist:**
- ✅ Core in `<g class="icon-core">` — full size, no transform
- ✅ Core visually identical to solo `calls`
- ✅ Badge in `<g class="icon-badge">` — independently targetable
- ✅ Badge at top-right anchor `(20, 4)` — first-choice corner
- ✅ Badge fits in 5×5 symbol box `(17.5–22.5, 1.5–6.5)`
- ✅ No container behind badge
- ✅ `stroke-width="1.5"` on both groups

---

### Example 3 — Badged icon: `active-call` (dot badge, top-right)

```xml
<symbol id="active-call" viewBox="0 0 24 24"
fill="none" stroke-linecap="round" stroke-linejoin="round">

<g class="icon-core" stroke="#4EC9B0" stroke-width="1.5">
<path d="M22 16.92v3 ... z"/>
</g>

<!-- Green live-indicator dot at top-right anchor -->
<g class="icon-badge" fill="#22C55E">
<circle cx="20" cy="4" r="2" stroke="none"/>
</g>

</symbol>
```

---

### Example 4 — Fallback: top-right occupied → bottom-right

Icon has signal arcs sweeping into the top-right zone. Falls to bottom-right.

```xml
<symbol id="make-call" viewBox="0 0 24 24"
fill="none" stroke-linecap="round" stroke-linejoin="round">

<!--
Phone + outgoing arrow: arrow points to (21,3), inside TR exclusion zone.
TR occupied → fall to BR.
-->
<g class="icon-core" stroke="#4EC9B0" stroke-width="1.5">
<path d="M22 16.92v3 ... z"/>
<polyline points="15 3 21 3 21 9"/> <!-- reaches TR zone -->
<line x1="10" y1="14" x2="21" y2="3"/>
</g>

<!-- Badge at bottom-right (2nd choice) -->
<g class="icon-badge" stroke="#22C55E" stroke-width="1.5">
<polyline points="17.5,20 19.5,22.5 22.5,17.5" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>
</g>

</symbol>
```

---

### Example 5 — Structural anatomy

```
calls (Mode A) answered-calls (Mode B)
────────────────────────── ──────────────────────────────────
<symbol> <symbol>
<g class="icon-core"> <g class="icon-core">
<path … /> <path … /> ← IDENTICAL
</g> </g>
<g class="icon-badge">
</symbol> <polyline … />
</g>
</symbol>

Visual result:
┌──────────────────────┐ ┌──────────────────────┬──────┐
│ │ │ │ ✓ │
│ │ │ │ │
│ 📞 FULL SIZE │ │ 📞 FULL SIZE │ │
│ (icon-core) │ │ (icon-core) │ │
│ │ │ identical size │ │
└──────────────────────┘ └──────────────────────┴──────┘
icon-badge
```

---

### Example 6 — Anti-pattern reference

```xml
<!-- ❌ WRONG: scaled core, loose paths, compensated stroke, wrong corner -->
<symbol id="answered-bad" viewBox="0 0 24 24" fill="none">
<g transform="scale(0.68) translate(0,1.5)" stroke-width="2.2">
<path d="..."/> <!-- scaled — WRONG -->
</g>
<polyline points="1.5,4 3.5,6.5 6.5,1.5"/> <!-- TL used, TR was free — WRONG -->
<!-- no class on groups — WRONG -->
</symbol>

<!-- ✅ CORRECT -->
<symbol id="answered-calls" viewBox="0 0 24 24"
fill="none" stroke-linecap="round" stroke-linejoin="round">

<g class="icon-core" stroke="#4EC9B0" stroke-width="1.5">
<path d="M22 16.92v3 ... z"/> <!-- full size, no transform -->
</g>

<g class="icon-badge" stroke="#22C55E" stroke-width="1.5">
<polyline points="17.5,4 19.5,6.5 22.5,1.5" fill="none"
stroke-linecap="round" stroke-linejoin="round"/>
<!-- TR default, named group -->
</g>

</symbol>
```

---

*End of Design Guidelines v3*