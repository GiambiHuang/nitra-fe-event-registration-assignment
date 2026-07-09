# PLAN.md — Development Journal

A concise record of the development journey. Detailed, per-step notes live in
[`docs/journal/`](docs/journal/) and are linked from each section.

## 1. Planning & task breakdown

The wizard is built in phases, tooling first so every later phase ships behind
type + lint gates:

- **Phase 0 — Tooling** _(done)_ — TypeScript + ESLint. See
  [journal 01](docs/journal/01-tooling.md).
- **Phase 0.5 — Design tokens** _(done)_ — reconcile colors/typography against
  Figma, self-host the font. See [journal 02](docs/journal/02-design-tokens.md).
- **Phase 1 — Data & types** _(implemented, pending review — not yet
  committed)_ — types before store, store before UI:
  1. **Mock-data types** (`src/types/`) mirroring `event.js` / `sessions.js` /
     `addons.js` — `Addon` modeled as a discriminated union on `category`
     (`workshop` / `meal` / `merchandise`) so category-only fields (`sizes`,
     `maxQuantity`, `capacity`/`date`) narrow safely instead of being optional
     on every variant.
  2. **Wizard-state types** — attendee form fields, selected ticket id,
     selected session ids, per-addon selection (quantity/size). Kept as a
     separate type family from the mock-data types: raw catalog data and the
     user's in-progress selections are different concerns and shouldn't share
     a shape.
  3. **One composable-based store** (e.g. `useRegistrationStore`) holding this
     state, shared across all 4 step components — no Pinia; consistent with
     the cross-step-state approach already set in `CLAUDE.md`
     (composable / provide-inject, single source of truth).
  4. **Derived logic as separate composables** layered on the store — pricing,
     conflict detection, per-step validity — rather than folded into the store
     itself, so each stays independently reasoned about / testable. Store
     owns state + actions; composables own derivations.
  5. **No time-zone conversion in the data/grouping layer** — session/workshop
     grouping keys come from the raw UTC ISO strings. Display assumes a fixed
     Asia/Taipei time zone (with an on-screen indicator), handled entirely at
     the UI layer.

  Full discussion (Pinia vs. composable, and the reasoning above):
  [journal 03](docs/journal/03-data-types-and-store.md).
- **Phase 2 — Wizard shell** — stepper + free forward/back navigation with
  preserved state.
- **Phase 3 — Steps 1–4** — attendee info, session selection, add-ons, review.
- **Phase 4 — Cross-cutting logic** — pricing, time-conflict detection, unified
  validation.
- **Phase 5 — Polish** — design-fidelity pass, states, transitions.

## 2. Key decisions

| Decision | Rationale |
| -------- | --------- |
| TypeScript across app code; mocks stay `.js` | Type business logic without converting provided fixtures (`allowJs`). |
| ESLint **flat config** | Only forward-supported format on ESLint 9/10. |
| `eslint-plugin-vue` **flat/recommended** | Stronger baseline than `flat/essential` — also catches template consistency issues, not just correctness bugs. |
| Non-type-checked TS lint rules | Fast lint; correctness typing handled by `vue-tsc`. |
| Hand-verify every Figma color token against the existing scaffold | Most already matched — confirmed the scaffold is a real (if incomplete) implementation, not placeholders, and surfaced the 3 that genuinely differed. |
| Named font-weight steps (`extrabold`/`bold`/`semibold`/`medium`/`regular`) instead of raw numbers | Each heading level maps to a distinct, correct weight instead of sharing one generic "bold". |
| Native composable (module-scoped `reactive` singleton) over Pinia for the shared registration store | One wizard instance, one page, no SSR — nothing Pinia adds (multi-instance stores, SSR support, devtools time-travel) solves a real problem here; a plain composable matches the problem's actual size. |
| Store state exposed via `readonly()`; all mutation through named actions | Single choke point for every state change — confirmed at the type level (not just Vue's runtime proxy) that direct mutation from outside the store fails to compile. |
| Workshop conflict check compares both workshop-vs-session and workshop-vs-workshop | README only requires workshop-vs-session; checking both is more defensive and isn't coincidentally correct just because today's 2 workshops don't share a day. |
| Merchandise `maxQuantity` enforced by the UI control's `max`, not the store | Keeps the store decoupled from catalog data (`addons.js`) — it never needs to know the bound, only receive already-valid values. |
| "Submit was attempted and failed" is local Step 4 UI state, not shared/persisted | Simpler UX: leaving Step 4 and returning is treated as a fresh attempt. Fewer state fields to reason about — no shared flag needed at all. |
| Store's action functions get full JSDoc (`@param`/`@returns`) | They're the store's entire public API — every step component calls through them, so complete docs pay off in IDE tooltips, per the `CLAUDE.md` composable-documentation rule. |
| Registration state persisted to `sessionStorage` (not `localStorage`), auto-saved via a deep watcher | Survives a page refresh within the tab (the actual trigger) without accumulating stale drafts across browser sessions the way `localStorage` would. `Set` fields are converted to arrays only at the storage boundary — the in-memory type is unchanged. |

Full walk-through against concrete test scenarios:
[journal 03](docs/journal/03-data-types-and-store.md#test-case-validation-against-registrationstate).

Full reasoning per decision: [journal 01](docs/journal/01-tooling.md#key-decisions),
[journal 02](docs/journal/02-design-tokens.md#findings--color-tokens),
[journal 03](docs/journal/03-data-types-and-store.md).

## 3. Dependencies & why

Dev-only tooling so far. Truly non-optional: `typescript`, `vue-tsc`, `eslint`,
`eslint-plugin-vue`. The rest are convenience/replaceable.

| Dependency | Problem it solves | Alternative |
| ---------- | ----------------- | ----------- |
| `typescript` | The type system. | — |
| `vue-tsc` | Type-checks `.vue` SFCs (`tsc` can't). | Plain `tsc` (blind to SFCs). |
| `eslint` + `eslint-plugin-vue` | Lint `.js`/`.ts`/`.vue`. | — |
| `@vue/tsconfig` | Canonical Vue+Vite tsconfig base. | Hand-written compiler options. |
| `@vue/eslint-config-typescript` | Auto-wires Vue + TS ESLint parser. | Hand-wire `typescript-eslint` + `@eslint/js`. |
| `@types/node`, `globals` | Node types / global sets. | Omit until needed. |
| `@fontsource-variable/inter` | Self-hosts the actual Inter **variable** font. The design's weights (485/550/600/680/700) are arbitrary points, not the standard steps a fixed-weight font ships — only a variable font renders those precisely. Bundled locally via npm, no CDN call at runtime. | Google Fonts `<link>` (adds an external runtime dependency, and the plain endpoint doesn't solve the variable-weight problem); hand-downloaded `.woff2` files (unversioned, no upgrade path). |

Full table with "truly required?" column:
[journal 01](docs/journal/01-tooling.md#dependencies-added-all-dev-only).
Full font reasoning: [journal 02](docs/journal/02-design-tokens.md#font-self-hosted-inter).

## 4. AI tools

- **Tool:** Claude Code (Opus 4.8).
- Scaffolded the ESLint/`tsconfig` configs and caught the `tsc` vs `vue-tsc`
  distinction; two runtime-only issues in fresh toolchain majors were found by
  running the gates, not trusting generated config.
- Per-step prompts and what worked/fell short:
  [journal 01](docs/journal/01-tooling.md#ai-usage-this-step).

## 5. Challenges & solutions

- **TS 6 deprecated `baseUrl`** → removed it, used relative `paths`.
- **Vue rule flagged the starter stub** → standardized the SFC on
  `<script setup lang="ts">`.
- **Design tokens looked plausible but weren't verified** → hand-converted
  every given Figma `hsla()` to RGB/hex and diffed against the existing
  scaffold instead of assuming it was already correct; found 3 real color
  mismatches and a font-weight scale that was a placeholder, not real values.

Details: [journal 01](docs/journal/01-tooling.md#challenges--fixes),
[journal 02](docs/journal/02-design-tokens.md#findings--color-tokens).

## 6. What I'd improve given more time

- Revisit the ESLint config approach (meta-package vs hand-wired, ignoring
  provided files) once the tradeoff is decided.
- Cross-check the 3 corrected color tokens directly against Figma (Dev Mode /
  MCP) rather than relying on hand HSL→RGB conversion.
- Pull spacing/radius/shadow tokens from Figma once component work needs them.
