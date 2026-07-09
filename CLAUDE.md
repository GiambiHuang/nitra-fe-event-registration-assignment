# CLAUDE.md

Engineering conventions for this repo. Read before writing code; follow these over personal habits.

## Stack

Vue 3.5 (Composition API, `<script setup>`) · Quasar v2.18 (`@quasar/app-vite`) · UnoCSS 66 (custom semantic tokens) · TypeScript · ESLint · Node 22.17 · Yarn 4.6.

## Commands

```bash
yarn            # install
yarn dev        # dev server @ http://localhost:9001
yarn build      # production build
yarn lint       # ESLint
yarn typecheck  # vue-tsc --noEmit
```

Run `lint` + `typecheck` before every commit. Pre-commit and pre-push hooks enforce this — never bypass with `--no-verify`.

## Directory layout

```
src/
  components/     # presentational + composed UI, decomposed by responsibility
  composables/    # reactive logic (state, derivations, rules) — the app's brain
  services/       # data access — the only files that import from mocks/; async-shaped
  utils/          # pure, framework-free helpers (format, date math, grouping)
  types/          # shared TS types / interfaces
  pages/          # route-level views
  mocks/          # provided data — read by services/ only; never hardcode its values in components
  unocss/         # design-token system (semantic.js is source of truth)
  css/            # CSS variable definitions (colors, typography)
```

Keep the boundary sharp: **services** fetch (today: read local mocks; async-shaped so a real API is a services-only change), **utils** transform that data (pure, testable), **composables** own reactive state and wire services/utils to the view, **components** render and delegate. Logic does not live in templates or in `.vue` script blocks beyond binding glue. Components and composables never import from `mocks/` directly — always through `services/`.

## Vue conventions

- `<script setup>` only. Order: imports → props/emits/models → composables → local state → computed → functions → lifecycle.
- **State lives in composables, not components.** Shared cross-view state is a single module-scoped reactive store exposed via one composable (or `provide`/`inject`); every consumer reads/writes that one source of truth so nothing is duplicated or lost.
- **`defineModel()`** for two-way bindings. Do not hand-roll `props` + `update:` emit pairs.
- **Derive with `computed`, never sync with `watch`.** Totals, validity, flags, filtered/grouped lists → `computed`. Use `watch` only for real side effects (never to copy one reactive value into another).
- One responsibility per component. A card, a section, a summary, a step are each their own component. If a component both fetches/derives and renders complex UI, split it.
- Props in, events out. Children don't mutate parent state directly — they emit or write through the shared composable.

## TypeScript conventions

- No `any`. Model data shapes as explicit `interface`/`type` in `src/types/` and reuse them; derive types from mock data shapes.
- Type composable return values, function params, and returns. Let inference handle trivial locals only.
- Prefer discriminated unions over boolean flags for mutually exclusive states.
- No non-null `!` assertions unless provably safe with a comment saying why.

## Styling — design tokens only

**Never hardcode hex / rgb.** Use the semantic UnoCSS shortcuts exclusively:

- Text `text-neutral(-muted)`, `text-danger`, `text-brand` · Background `bg-surface-l0…l3`, `bg-brand-emphasis-rest` · Border `border-neutral-muted` · Divider `divider-default` · Type `text-h1…h4`, `text-subtitle1/2`.
- Interactive states use the `-rest` / `-hover` / `-active` suffix convention.
- The authoritative class list is **`src/unocss/semantic.js`** — grep it before inventing a class; anything not in those maps compiles to nothing.
- Spacing/sizing via Uno/Quasar utilities, not inline styles. Prefer semantic tokens over Quasar's raw defaults when they diverge from the design.

## Naming

- Components `PascalCase.vue`; composables `useThing.ts`; utils `camelCase.ts`.
- Booleans read as predicates: `isFull`, `hasConflict`, `canProceed`.
- Handlers `handleX` / `onX`; derived values named for the value, not the computation.
- Names reveal intent — no `data`, `temp`, `list2`.

## Documentation

- **JSDoc on every non-trivial function** in `services/`, `utils/`, and `composables/`: what it does, `@param`, `@returns`, and any rule/edge-case it encodes. TS carries the shapes; JSDoc carries the *why*.
- No comments that restate code. Comment the non-obvious: business rules, boundary handling, why-not-the-simpler-way.

## Edge cases & correctness

Business logic (pricing, conflicts, validation, grouping) is pure functions in `utils/`, unit-reasoned in isolation from the UI. Every such function handles empties, boundaries, and single-vs-many explicitly. Format currency and dates through shared utils, never ad hoc.

## Commits

Atomic, well-described, in dependency order. One logical change per commit; don't fold unrelated changes together. Each commit builds and passes hooks.
