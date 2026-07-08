# Journal 01 — Project tooling: TypeScript + ESLint

Detailed notes for the first step. Summarized in [`PLAN.md`](../../PLAN.md).

## Goal

The starter repo ships as plain-JS Quasar with no linter or type checker.
Before any feature code, stand up the two quality gates the rest of the work
relies on:

- **TypeScript** — typed data models (tickets, sessions, add-ons) and typed
  composables/utils so business logic (pricing, conflict detection, validation)
  is checked at compile time, not discovered at runtime.
- **ESLint (flat config)** — one style/correctness baseline across `.js`, `.ts`,
  and `.vue`.

Provided mock data stays `.js` (`allowJs: true`, `checkJs: false`) — no need to
convert given fixtures; application code is authored in TS.

## Dependencies added (all dev-only)

| Dependency | Problem it solves | Truly required? | Alternative considered |
| ---------- | ----------------- | --------------- | ---------------------- |
| `typescript` | The type system itself. | Yes | — |
| `vue-tsc` | `tsc` can't type-check `.vue` SFCs (template + `<script>`); `vue-tsc` can, and backs `typecheck`. | Yes (to check SFCs) | Plain `tsc` — blind to SFCs, misses most of the app. |
| `eslint` | The linter. | Yes | — |
| `eslint-plugin-vue` | Lint rules for SFC templates/scripts; brings `vue-eslint-parser`. | Yes (to lint `.vue`) | — |
| `@vue/tsconfig` | Canonical Vue+Vite compiler-option base (`tsconfig.dom.json`). | No — convenience | Hand-write `compilerOptions` (more to maintain, easy to get subtly wrong). |
| `@types/node` | Node globals for typed files; paired with tsconfig `types: ["node"]`. | No — marginal now | Drop it (and the `types` entry) until Node APIs are actually used. |
| `@vue/eslint-config-typescript` | Meta-package: bundles `typescript-eslint` and auto-wires the Vue + TS parser; exposes `defineConfigWithVueTs` / `vueTsConfigs`. | No — replaceable | Wire `typescript-eslint` + `@eslint/js` + the `.vue` parser override by hand (more explicit, more boilerplate). |
| `globals` | Predefined browser/node global sets; avoids `no-undef` false positives. | No — standard | Declare globals by hand (incomplete, error-prone). |

**Truly non-optional:** `typescript`, `vue-tsc`, `eslint`, `eslint-plugin-vue`.
The other four are convenience/replaceable and documented as such.

## Key decisions

- **Flat config (`eslint.config.js`)** over legacy `.eslintrc` — the only
  forward-supported format on ESLint 9/10.
- **`eslint-plugin-vue` `flat/recommended`** (not the lighter `flat/essential`)
  — stronger baseline incl. template consistency, fits an assessment weighted on
  code quality and design fidelity.
- **`vueTsConfigs.recommended`** (non-type-checked) rather than the type-checked
  variant — keeps lint fast and avoids needing full type info per file;
  correctness typing is covered by `vue-tsc`.
- **`vue/multi-word-component-names: off`** — route/step components like
  `IndexPage` and future single-word step components are intentional here.
- **Path aliases** (`src/*`, `@/*`) in `tsconfig.json` to match how the project
  already references `src` (e.g. in `app.scss`).
- **Scripts:** `lint` (`eslint .`), `lint:fix`, `typecheck` (`vue-tsc --noEmit`).

## Challenges & fixes

- **TypeScript 6 deprecation.** TS 6 flags `baseUrl` as deprecated
  (`TS5101`). Removed it, kept `paths` with relative `./src/*` targets — TS 6
  resolves paths without `baseUrl`.
- **Recommended Vue rule vs the starter stub.** `flat/recommended` flagged
  `IndexPage.vue` for a missing `<script lang="ts">` (`vue/block-lang`) and
  singleline formatting. Rather than relax the rule, updated the stub to
  `<script setup lang="ts">` with clean formatting — standardizing every SFC on
  TS from the start.

## Verification

On Node 22, on the current tree:

- `yarn typecheck` → 0 errors
- `yarn lint` → 0 errors, 0 warnings
- `yarn build` → succeeds (SPA output)
- `yarn dev` → dev server boots and serves (HTTP 200)

## AI usage (this step)

- **Tool:** Claude Code (Opus 4.8).
- **Worked well:** scaffolding the flat ESLint config and Vue-flavored `tsconfig`
  correctly for the installed majors; flagging that `vue-tsc` (not `tsc`) is
  required for SFC checking.
- **Reviewed / corrected:** the fresh toolchain majors (ESLint 10, TS 6, vue-tsc
  3) surfaced two runtime-only issues — the `baseUrl` deprecation and the
  `flat/recommended` `block-lang` error. Found by actually running
  `typecheck`/`lint`/`build`, not by trusting the generated config. Takeaway:
  treat generated config as a draft and gate it behind a real run.

## Open / revisit later

- `@vue/eslint-config-typescript` vs a hand-wired `typescript-eslint` +
  `@eslint/js` config (more explicit, plus ignoring provided `src/mocks` /
  `src/unocss`) — evaluated, not yet decided.
- Pinning the exact Node `22.17.0` via a version-manager file.
