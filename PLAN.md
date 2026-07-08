# PLAN.md — Development Journal

A concise record of the development journey. Detailed, per-step notes live in
[`docs/journal/`](docs/journal/) and are linked from each section.

## 1. Planning & task breakdown

The wizard is built in phases, tooling first so every later phase ships behind
type + lint gates:

- **Phase 0 — Tooling** _(done)_ — TypeScript + ESLint. See
  [journal 01](docs/journal/01-tooling.md).
- **Phase 1 — Data & types** — model the mocks (tickets/sessions/add-ons) and
  the shared registration state.
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
| `eslint-plugin-vue` **flat/recommended** | Stronger baseline (template consistency) — fits a quality-weighted assessment. |
| Non-type-checked TS lint rules | Fast lint; correctness typing handled by `vue-tsc`. |

Full reasoning per decision: [journal 01](docs/journal/01-tooling.md#key-decisions).

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

Full table with "truly required?" column:
[journal 01](docs/journal/01-tooling.md#dependencies-added-all-dev-only).

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

Details: [journal 01](docs/journal/01-tooling.md#challenges--fixes).

## 6. What I'd improve given more time

- Pin the exact Node `22.17.0` via a version-manager file.
- Revisit the ESLint config approach (meta-package vs hand-wired, ignoring
  provided files) once the tradeoff is decided.
