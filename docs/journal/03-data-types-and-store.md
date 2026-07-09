# Journal 03 — Phase 1 planning discussion: types & store

Unlike journals 01/02 (written after the work landed), this one records a
design discussion that happened **before** any Phase 1 code was written —
capturing the reasoning behind decisions made ahead of implementation.
Summarized in [`PLAN.md`](../../PLAN.md).

## Context

Phase 1 is: define types for the mock data and the wizard's own state, then
build a single shared store so all 4 step components can read/write the same
registration state. Three open questions came up before writing any code.

## Discussion 1 — Pinia vs. a native composable for the shared store

### What each actually is

- **Pinia** is Vue's official state-management library. A "store" is a
  formal unit (`defineStore`) with `state`/`getters`/`actions` (or the
  `setup`-style equivalent), registered once via a Vue plugin
  (`app.use(pinia)`), and consumed through `useXStore()` anywhere in the
  component tree — every call returns the same instance.
- A **native composable** here means: a plain `.ts` file that creates a
  `reactive()` object (or a few `ref()`s) **at module scope**, exports actions
  that mutate it, and exports a `useX()` function that returns it. Because ES
  modules are cached, every component that imports it gets the exact same
  object — no plugin registration needed. (Alternative wiring: `provide`/
  `inject` from a root component instead of a module-scope singleton — scopes
  the store to a component subtree rather than the whole app. Either
  satisfies "single source of truth"; module-scope singleton is simpler for a
  single-instance wizard.)

### Comparison, specific to this app

| | Pinia | Native composable |
| - | - | - |
| Setup cost | Install + register plugin + boot wiring | Zero — just a `.ts` file |
| Devtools | Dedicated store panel, time-travel debugging | Generic reactive-state inspection only |
| Boilerplate for one store | `defineStore` API, actions/getters wrapper | Plain functions on a `reactive()` object |
| SSR | Built-in support | N/A here — this app is `quasar.config.js` SPA mode, no SSR |
| Multiple independent instances | Supported (dynamic store ids) | Needs `provide`/`inject` per subtree; a bare module singleton is one instance app-wide |
| Testability | `createTestingPinia` helper | Import the module in a plain test file — same ergonomics for something this small |
| Fit for "1 wizard, 4 known steps, 1 shared state object" | More structure than the problem needs | Matches the problem size exactly |

### Recommendation

**Native composable.** Nothing in this app needs what Pinia adds: there's no
SSR, no multiple concurrent wizard instances on one page, and one shared
state object doesn't need a formal store-registry. Pinia isn't *wrong* here —
it would work fine — but it's ceremony (dependency, plugin registration,
`defineStore` wrapper) for a problem a 40-line composable file already
solves. This also matches what `CLAUDE.md` already committed to for
cross-step state (composable / provide-inject, no Pinia) before this
discussion happened; this section is the reasoning behind that call, made
concrete for this specific decision point.

**Naming note:** the file will still be called `useRegistrationStore` (or
similar) even though it's not a Pinia store — "store" here just names its
role (the one shared piece of state), not the mechanism.

**Decided: native composable.** Confirmed — this app only ever has a single
wizard instance on a single page, so Pinia's multi-instance/SSR features have
no problem to solve here.

## Discussion 2 — Derived logic lives in separate composables, not in the store

**Decided: yes.** The store (`useRegistrationStore`) owns state + the actions
that mutate it (`setAttendeeInfo`, `toggleSession`, `setAddonSelection`, ...).
Pricing, time-conflict detection, and per-step validity are **derived**
values — they get their own composables (`usePricing`, `useSessionConflicts`,
...) that take the store's state as input and expose `computed` results.
Reasoning: keeps the store from growing into a god-object, and each piece of
derived logic can be reasoned about (and later tested) independently of the
rest.

## Discussion 3 — Time zone handling for session/workshop grouping & display

Raised as a risk: `sessions.js`/`addons.js` timestamps are UTC ISO strings.
Grouping "by date" using the browser's local time zone (e.g.
`Date.prototype.getDate()`) would misgroup sessions/workshops that cross a
UTC-day boundary in the viewer's local time — for example `ws2`
(`2028-11-15T15:30:00Z` – `18:30:00Z`) falls on Nov 15 in UTC but crosses into
Nov 16 in a UTC+8 time zone.

**Decided:** the display will assume a **fixed Asia/Taipei (UTC+8)** time
zone rather than the viewer's local time zone, with a time zone indicator
shown in the UI (handled at the display layer). Because the target zone is
fixed rather than "whatever the browser reports," the underlying grouping/
parsing logic stays simple either way — grouping keys are derived from the
raw UTC ISO string (not from a locale-dependent `Date` accessor), and the
**UI layer** is responsible for formatting/labeling times in Asia/Taipei.
This keeps the type/parsing layer free of time zone concerns; formatting is a
presentation concern handled where sessions/workshops are rendered.

## Implementation

With all three discussions resolved, Phase 1 was implemented:

- **`src/types/`** — `event.ts` (`TicketType`, `EventInfo`), `session.ts`
  (`Session`, with `track` as a closed string-literal union since the mock
  dataset is fixed/static), `addon.ts` (`Addon` as the discriminated union
  from Discussion-adjacent design — `WorkshopAddon | MealAddon |
  MerchandiseAddon`), `registration.ts` (`AttendeeInfo`,
  `MerchandiseSelection`, `RegistrationState` — the wizard's own state,
  deliberately separate from the mock-data types), and an `index.ts` barrel.
- **`src/composables/useRegistrationStore.ts`** — the module-scoped singleton
  from Discussion 1. State is created once via `reactive()` at module scope
  and exposed through `useRegistrationStore()` as `readonly(state)`, forcing
  every mutation through a named action (`setAttendeeField`, `selectTicket`,
  `toggleSession`, `toggleWorkshop`, `toggleMeal`, `setMerchandiseQuantity`,
  `setMerchandiseSize`). No derived/computed values live here, per
  Discussion 2 — pricing, conflicts, and validation are deferred to their own
  composables in Phase 4.

**Verification beyond the usual gates:** wrote a throwaway file that tried to
mutate `store.state` directly (`store.state.selectedSessionIds.add(...)`,
`store.state.ticketTypeId = ...`) guarded by `@ts-expect-error`, ran
`yarn typecheck`, and confirmed both lines genuinely fail to compile — so the
read-only contract is enforced at the type level, not just by Vue's runtime
proxy. Deleted the file after confirming. `yarn typecheck` / `yarn lint` both
pass on the real files.

**Status:** implemented, not yet committed — pending review.

## Test-case validation against `RegistrationState`

Before committing, walked a set of concrete scenarios against the state shape
rather than assuming it was complete.

| # | Scenario | Verdict | Notes |
| - | -------- | ------- | ----- |
| 1 | Ticket type: single-select, or none selected | Matches | `ticketTypeId: string \| null`, defaults to `null`. |
| 2 | Shipping address optional, becomes required once any merchandise is selected | Matches (shape); rule itself deferred | `shippingAddress: string` is always present; the *conditional-required* rule is validation logic, not a shape concern — it reads `Object.keys(state.merchandiseSelections).length > 0` and belongs in the future validation composable, not the store. |
| 3 | Sessions span 2 days; can't multi-select two overlapping sessions | Shape matches; **timing changed** | `selectedSessionIds: Set<string>` needs no change — conflict prevention is derived logic, not stored state. But real-time disabling in Step 2 (this discussion) pulls conflict-detection work out of "Phase 4 only": it must exist by the time Step 2 is built, not after. |
| 4 | Workshops can't overlap a selected session | Shape matches; already spec'd as real-time | README already specifies workshops are marked unavailable in real time when they overlap a selected session — no timing deviation needed here (unlike session-vs-session, which README had deferred to submit). |
| 5 | Merchandise: optional size, quantity bounded by a max | Matches | `MerchandiseSelection { quantity, size? }`. |
| 6 | Validation runs in "another store" | Correction | Not another *store* — a separate **composable**, per Discussion 2. `useRegistrationStore` stays state + actions only; a future `useRegistrationValidation` composable reads its (read-only) state plus the catalog data and produces validation results. |

**No changes were needed** to `src/types/registration.ts` — every scenario is
satisfied by the existing shape. One change *was* made to
`useRegistrationStore.ts` as a direct result of scenario 1 (see Decision A
below).

### Decision A — `deselectTicket()` action added

Scenario 1 raised whether the store needs a way to return the ticket
selection to "none," not just switch between tickets. Decided **yes** — added
`deselectTicket()` (sets `state.ticketTypeId` back to `null`) alongside
`selectTicket()`. Verified with `yarn typecheck` / `yarn lint` after adding it.

### Decision B — workshop conflict scope: both directions

Scenario 4's open question — does "can't overlap" extend to workshop-vs-
workshop, or only workshop-vs-session (all README states)? **Decided: check
both.** The future conflict-detection composable compares a candidate
workshop against *all* currently selected sessions **and** all currently
selected workshops, not just sessions. More defensive than README strictly
requires, but avoids a rule that would only happen to hold because today's
two workshops (`ws1`, `ws2`) don't happen to share a day. No `RegistrationState`
change needed — `selectedWorkshopIds` already supports this as an input.

### Decision C — merchandise `maxQuantity` enforced in the UI layer, not the store

Scenario 5's open question. **Decided: the quantity-picker UI component
clamps to `addon.maxQuantity`** (e.g. a stepper control with a `max` prop) —
`setMerchandiseQuantity` never receives an out-of-range value in the first
place. The store stays decoupled from catalog data (it still doesn't import
`addons.js`) and doesn't need to re-validate a bound the UI already enforces.

### Decision D — "has the user attempted submit" is local Step 4 UI state, not shared

Raised as a new question: where does "a submit was attempted and failed"
live, given the Submit button's disable/re-enable behavior needs to survive
the user navigating away to fix a field and back? **Decided: don't persist it
anywhere shared at all.** The chosen UX is simpler than originally framed:
assume that once the user leaves Step 4 and comes back, they've already fixed
what was wrong, and Submit should be clickable again — no need to remember
the failed attempt across navigation. This can live as a plain local `ref`
inside the Step 4 component itself, not in `RegistrationState` and not in a
shared composable singleton, which is also fewer state fields to reason
about.

**Dependency to verify in Phase 2:** this only resets "for free" if the Step 4
component actually unmounts when the user navigates to another step (e.g. a
`v-if`/dynamic-component-style stepper). If Phase 2's wizard shell instead
keeps step components alive (`<keep-alive>` or `v-show`, e.g. to preserve
scroll position or animate transitions), the local `ref` would persist across
navigation and an explicit reset (e.g. on `onActivated`, or a watcher on the
current step) would be needed to get the same behavior. Flagged for when
Phase 2 is designed.

### Phase-sequencing note

Because session-conflict detection must be real-time in Step 2, the
conflict-detection composable can no longer be purely "Phase 4, built after
all 4 steps exist" — it needs to land alongside (or just before) Phase 3's
Step 2 work. Will fold this into the phase breakdown once Phase 3 starts.

## Discussion 4 — JSDoc completeness on the store's actions

Raised: do the store's action functions need JSDoc? `CLAUDE.md` already
commits to "JSDoc on every non-trivial function in `utils/`/`composables/`:
what it does, `@param`, `@returns`, and any rule/edge-case it encodes." The
store's actions are its entire public API — every step component calls
through them — so **decided: upgrade all of them to full JSDoc** (`@param`
per parameter; `@returns` only where something is actually returned, so void
actions don't carry a pointless empty tag). Applied across
`useRegistrationStore.ts`.

## Discussion 5 — State doesn't survive a page refresh; add persistence

Raised: the store is a plain in-memory `reactive()` object at module scope —
a full page reload re-evaluates the module from scratch, so all progress
(attendee info, selections) is lost. Confirmed this is real (not a
misunderstanding of Vue's reactivity), and the fix is genuine persistence,
not just "preserve across in-app step navigation" (which already worked,
since the store never got recreated as long as the page itself didn't reload).

### Decisions

- **`sessionStorage`, not `localStorage`.** The trigger was specifically "a
  page refresh," which `sessionStorage` covers — it survives a reload within
  the same tab. It also self-cleans when the tab closes, which fits an
  in-progress registration draft better than `localStorage`'s
  persist-until-explicitly-cleared semantics (which would otherwise need its
  own cleanup/expiry policy to avoid accumulating stale drafts).
- **`Set` fields need explicit (de)serialization.** `JSON.stringify(new
  Set(['a']))` produces `{}` — `Set` isn't natively JSON-serializable. Rather
  than change `RegistrationState`'s `Set<string>` fields to arrays (would
  lose the O(1) membership semantics and undo the Phase 1 type design, for a
  problem that's cheap to solve at the persistence boundary instead), added a
  `PersistedRegistrationState` shape (same fields, `Set`s swapped for
  `string[]`) with `toPersisted`/`fromPersisted` converters used only at the
  storage boundary. The in-memory `RegistrationState` type is untouched.
- **Auto-save via a `deep: true` watcher**, not manual save calls — every
  action already mutates the single `state` object, so one `watch(state, ...,
  { deep: true })` covers every action without each action needing its own
  persistence call.
- **Hydration is defensive.** `loadPersistedState()` wraps the read + parse +
  rehydrate in `try/catch` and falls back to `createInitialState()` on
  anything unexpected — missing key, disabled storage (e.g. private
  browsing), or a stored payload that no longer matches the current shape
  (e.g. after a future change to `RegistrationState` during development).
  Prevents a stale/incompatible blob from crashing the app on load.
- **Persistence logic stays private to `useRegistrationStore.ts`** — not
  factored into a separate reusable utility, since there is exactly one
  consumer today. Revisit only if a second piece of state needs the same
  treatment.
- **Added `resetRegistration()`** (resets in-memory state + clears
  `sessionStorage`). Unlike the `hasAttemptedSubmit` idea earlier in this
  journal, this isn't speculative: persistence creates a concrete new
  problem — without a way to clear it, a *completed* registration would
  resurrect itself as a draft on the next visit. Not yet called from
  anywhere; intended for Phase 4's post-submit success flow.

### Verification

`sessionStorage` is a browser API and nothing in the UI calls the store yet
(Phase 3 hasn't started), so there's no real page to refresh and check by
hand. Instead, isolated the highest-risk part — the `Set` ↔ `Array` ↔ JSON
round trip — into a standalone Node script mirroring `toPersisted`/
`fromPersisted`, ran it against a populated `RegistrationState` fixture, and
confirmed: ticket id, attendee fields, all three `Set` fields (including that
an *empty* `Set` round-trips to an empty `Set`, not `undefined`), and
merchandise quantity/size all survive a full `JSON.stringify` → `JSON.parse`
cycle. `yarn typecheck` / `yarn lint` also pass on the real file. A real
browser-refresh check is still owed once Phase 3 wires a step component to
the store.
