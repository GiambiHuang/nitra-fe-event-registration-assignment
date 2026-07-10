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
- **Phase 1 — Data & types** _(done)_ — types before store, store before UI:
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
  6. **A `src/services/` data-access layer** in front of the mocks —
     `getEventInfo` / `getSessions` / `getAddons`, all `async`-shaped so a
     future real API only changes the service internals, not every caller.
     Components/composables never import `mocks/` directly.

  Full discussion (Pinia vs. composable, state design):
  [journal 03](docs/journal/03-data-types-and-store.md).
  Full discussion (service layer, async-vs-sync, a type-widening gap found
  and fixed along the way): [journal 04](docs/journal/04-data-services.md).
- **Phase 2 — Wizard shell** _(done)_ — stepper + free forward/back
  navigation with preserved state. `MainHeader`/`Main` layout landed; the
  stepper/step-container shell built by hand (not by me) with review after
  each piece. Plain flexbox for the fixed-stepper / scrollable-middle /
  fixed-footer shape (no nested `q-layout`), and the post-submit success
  screen is a sibling of the step container, not a 5th step. Full discussion:
  [journal 05](docs/journal/05-wizard-shell.md).
  - `WizardStepper`/`StepNavItem`/`StepContent`/`WizardFooter` built out:
    step status modeled as a discriminated union
    (`upcoming`/`active`/`complete`/`error`) resolved through a lookup table,
    not additive class-pushing — the latter caused a real cascade-order bug
    (see below). `stepper/` components never import each other or reach into
    domain folders; composition happens in `IndexPage.vue`. Full discussion:
    [journal 06](docs/journal/06-stepper-components.md).
- **Phase 3 — Steps 1–4** _(done)_ — attendee info, session selection,
  add-ons, review.
  - **Step 1 (done)** — ticket selection + attendee form, wired to
    `useRegistrationStore`.
  - **Step 2 (done)** — session selection: day-tab switcher, capacity/full
    state, and a visual (non-blocking-at-Step-4, but selection-blocking in
    the UI) time-conflict warning against already-selected sessions.
    `useAsyncResource` factored out of `useEventInfo` for `useSessions` to
    share; `groupSessionsByDate`/`formatSessionTime`/`timeConflicts` added to
    `utils/` (the latter generic, for Step 3's workshop conflicts to reuse).
    Full discussion: [journal 07](docs/journal/07-step2-sessions.md).
  - **Step 3 (done)** — add-ons: category tabs (Workshops / Meal Packages /
    Merchandise), workshop conflicts checked both against Step 2's selected
    sessions and Step 3's own selected workshops (and the reverse, on Step
    2's side — see journal 08), merchandise quantity/size controls, shipping
    banner, and a live Order Summary (shared `components/order-summary/`,
    used again in Step 4). `calculateOrderSummary`/`formatCurrency` added to
    `utils/`, ahead of Phase 4's own validation work, since Step 3's running
    total needs the pricing math now. Full discussion:
    [journal 08](docs/journal/08-step3-addons.md).
  - **Step 4 (done)** — built in two passes. First, the happy-path review
    screen (per-section `AttendeeReview`/`SessionsReview`/`AddonsReview`/
    `PricingSummary`, each self-wrapping its own `ReviewSection` with an
    Edit-back link) plus a dynamic post-submit success screen, once the
    discarded first validation attempt (journal 09) was set aside to build
    against a real screen instead of a guessed one. Second, the actual
    unified validation: one pure `validateRegistration()` plus a live
    `useRegistrationValidation()` composable driving error UI across the
    stepper, the Review page, and each step's own form, gated on a
    `hasAttemptedSubmit` flag so nothing is flagged before the first
    Submit click. Scope ended up narrower than the README's literal text
    (Step 1 fields + email format + merchandise-size-required only — no
    Step 2/3 conflict re-checks), by explicit direction. Full discussion,
    including a real bug (`hasAttemptedSubmit` originally cleared on
    navigation, which broke "jump to the failing step to fix it" on
    arrival) and why zod was rejected again with the narrower scope in
    hand: [journal 10](docs/journal/10-step4-review-and-validation.md).
- **Phase 4 — Cross-cutting logic** _(done, folded into Steps 3–4 as they
  landed rather than run separately)_ — pricing (`calculateOrderSummary`,
  journal 08) and unified validation (journal 10) both ended up built
  alongside the step that first needed them instead of as a later,
  separate pass. Time-conflict detection is UI-level only (Step 2/3 cards
  disable rather than warn-and-flag — see the Step 2 decision row below);
  it is not re-verified at Step 4 submit time, a deliberate scope
  reduction recorded in journal 10.
- **Phase 5 — Polish** — design-fidelity pass, states, transitions.
  - **To revisit here:** `text-h1`–`text-h4` already have a built-in RWD
    effect from the starter scaffold — `src/css/typography.scss` swaps the
    `--font-size-h*`/`--line-height-h*` CSS variables at `max-width: 1023px`
    (h4: 20px/24px → 18px/24px, etc.), so those shortcuts shrink automatically
    below the `desktop: 1024px` breakpoint already defined in
    `src/unocss/index.js`. `subtitle1`/`subtitle2`/`body-*` have no such
    media query and stay fixed. Noted 2026-07-09 when a heading looked
    smaller than expected below 1024px — not a bug, but worth deciding
    deliberately (keep / extend to more tokens / override) once the RWD pass
    actually happens instead of leaving it as an unexamined scaffold default.

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
| `hasAttemptedSubmit` (Step 4's "a submit was tried and failed" flag) is non-persisted UI state that stays `true` across navigation, cleared only by a full reset | Revised after building the real flow: the original plan (clear it on every `goNext`/`goBack`/`goToStep`, so leaving Step 4 counts as a fresh attempt) was written for the discarded first pass in journal 09 and never tested against an actual navigate-to-fix-it interaction. Once built, it broke exactly that — clicking "Edit → Step 1" from a failed Review page cleared the flag before Step 1 could render its own red state. The underlying validation result is already live, so nothing needs the flag to reset on navigation to behave correctly. See [journal 10](docs/journal/10-step4-review-and-validation.md). |
| Store's action functions get full JSDoc (`@param`/`@returns`) | They're the store's entire public API — every step component calls through them, so complete docs pay off in IDE tooltips, per the `CLAUDE.md` composable-documentation rule. |
| Registration state persisted to `sessionStorage` (not `localStorage`), auto-saved via a deep watcher | Survives a page refresh within the tab (the actual trigger) without accumulating stale drafts across browser sessions the way `localStorage` would. `Set` fields are converted to arrays only at the storage boundary — the in-memory type is unchanged. |
| `src/services/` data-access layer, `async`-shaped, built in Phase 1 rather than deferred | Real chance this becomes an actual API integration later; async-shaped services mean that change touches only the service internals, not every caller. Doing it now (alongside `src/types/`) avoids a second refactor once components already depend on `mocks/` directly. |
| `Session`'s mock-to-type mapping narrows only the `track` field; `Addon`'s casts the whole array | Plain `.js` mock literals widen string-literal fields to `string` under TS inference (verified empirically, not assumed) — `Session` isn't a union so a per-field narrow cast keeps every other field structurally checked; `Addon` is a discriminated union where the equivalent precise fix needs a distributive `Omit` utility type, judged not worth it for a fixed, hand-verified fixture. |
| Step status (`upcoming`/`active`/`complete`/`error`) as a discriminated union + `STATUS_STYLES` lookup table, not 3 booleans + additive class-pushing | The additive version caused a real bug: two classes setting the same CSS property (base state + error) can both be present on one element, and cascade order (declaration order in `semantic.js`, not `:class` order) decides which wins — `text-danger` silently lost every time. A lookup table keyed by one mutually-exclusive status makes that impossible by construction. |
| `WIZARD_STEPS` (index + label for all 4 steps) lives in `useWizardNavigation`, not in `WizardStepper` | Single source of truth for the step count — `MAX_STEP` is derived from its length instead of a separately hardcoded `4`, so the two can't drift out of sync if a step is ever added/removed. |
| `stepper/` components don't import each other or reach into domain folders (`attendee/`, `sessions/`, ...); composition happens in `IndexPage.vue` | Keeps generic wizard chrome (`StepContainer`, `StepContent`, `WizardFooter`, `WizardStepper`/`StepNavItem`) reusable and decoupled from what any given step actually renders — the step→component lookup lives at the page level, not inside the chrome. `StepContainer` ended up deleted entirely once it held zero logic beyond a wrapper `<div>`. |
| Domain-folder components (including each domain's orchestrating component, e.g. `AttendeeInfo.vue`) match the plain-noun style of their siblings (`SessionCard`, `AddonCard`, `ReviewSection`) rather than a `Step`-qualified name (`AttendeeStep`) | `Step` reads as a `stepper/`-chrome concept; the domain folder already encodes which step owns the file. Each domain's orchestrator is named after what the step actually is (`AttendeeInfo` for Step 1's "Attendee Info", matching `WIZARD_STEPS`' label), not a generic `*Step` suffix. |
| Native `Intl.DateTimeFormat` over dayjs for session time/date formatting | The hard part (UTC → fixed Asia/Taipei conversion) isn't simpler with dayjs — its timezone plugin wraps the same `Intl` API, plus plugin-registration ceremony. No dayjs-specific pain point exists yet (fixed well-formed data, no DST in Taiwan, no i18n need). Revisit if later date work gets genuinely harder. |
| `createAsyncResource` factored out of `useEventInfo` when `useSessions` needed the identical shape | Extracted on the second concrete instance, not after a third — both copies existed in the same sitting, so the shared shape wasn't speculative. |
| `timeConflicts.ts`'s overlap check is typed against a minimal `{ id, date, endDate }` shape, not `Session` specifically | `WorkshopAddon` has the same shape and Step 3 will need the identical overlap math for workshop-vs-session/workshop-vs-workshop conflicts — built reusable once instead of duplicated per step. |
| A conflicting session's card is fully `disabled` in Step 2, not just visually warned | Stricter than a literal README reading (conflicts are framed as selectable-but-flagged-at-Step-4); this is what was actually built. Consequence: two mutually-conflicting sessions can never both end up selected through normal clicking, since selecting one disables the other before it can be clicked. |
| Session-vs-selected-workshop conflict is a symmetric check: `SessionSelection.vue` and `AddonsSelection.vue` each check against the other's selections | Fixed a real gap — only the workshop side originally checked against sessions, so selecting a workshop that overlapped an unselected session left that session showing as available on Step 2. |
| `activeDate`/day-tab default is a `computed` fallback (`manualPick ?? groups[0]?.date`), not a `ref` + `watch` copying `groups[0]` into it | Fixed a real bug: the `watch` version only fired on the loading→success *transition*; re-entering Step 2 after sessions were already resolved from an earlier visit (module-scoped cache) left no tab selected at all, since there was no transition left to fire on. Matches `CLAUDE.md`'s "derive with `computed`, don't sync with `watch`" rule — this bug is exactly what that rule exists to prevent. |
| `AddonCard.vue` handles both workshops and meals (branches on `addon.category` internally for the time/conflict/capacity bits); merchandise gets its own `MerchandiseCard.vue` | Workshops/meals share the same interaction model (click the card to toggle) that `AddonCard` already generalizes; merchandise's quantity stepper + size `<select>` are real nested interactive controls, which can't live inside one big clickable `<button>` the way the other two do. |
| VIP's 10% workshop discount is its own summary line, not folded into each workshop's displayed price | Keeps the discount visible/auditable rather than silently changing per-item numbers — matches the README's "ticket price, add-ons, VIP discount, total" as separate concerns. |
| `calculateOrderSummary`/`formatCurrency` built now (nominally "Phase 4 — pricing") rather than deferred | Step 3's own Order Summary requirement needs a live running total immediately; the phase label was about when validation/pricing get hardened, not a hard gate on when the math can exist. |
| Plain validation functions over zod for Step 4's unified validation | Most of the actual rules (session/workshop time conflicts, merchandise-size-required) need to cross-reference external catalogs (sessions, addons) that live outside the object being validated — not what a schema library validates well. Only Step 1's field checks (required strings, email/phone format) are a natural schema fit, and splitting just that piece into zod would mean reconciling two different validation styles into one result. Reconsidered once the real scope (narrower — see below) landed and rejected again for the same reason: merchandise-size-required still needs the addon catalog, so the cross-referencing problem doesn't go away. |
| Step 4's real validation scope is narrower than the README's literal text: Step 1 fields (presence + email format only, not phone) and merchandise-size-required only — no Step 2 session-conflict or Step 3 workshop-conflict re-checks at submit time | Explicit direction, not an oversight. The Step 2/3 UI already prevents *creating* a conflicting selection by disabling cards, so a submit-time re-check is defense-in-depth the project chose not to build (yet). Recorded in [journal 10](docs/journal/10-step4-review-and-validation.md) so it reads as a decision if revisited. |
| One pure `validateRegistration()` returning a granular result (`attendeeErrors`, `attendeeFieldMessages`, `merchandiseSizeErrors`, `errorSteps`, `messages`, `isValid`), wrapped in a stateless `useRegistrationValidation()` computed | Every consumer — stepper, footer, each step's form, each Review section — needs a different *slice* of the same validation, computed live off the same store/catalog. One shared source avoids the step-status bug class from journal 06 (drift between multiple derived copies) recurring for validation. |
| Step 4's error UI follows an "attempt-then-live" model: nothing shown until the first failed Submit click, then every error clears itself live as its field is fixed, without needing another click | Matches the spec directly and avoids two worse alternatives: showing errors on a blank form before the user has done anything (noisy), or requiring a fresh Submit click after every fix (slow feedback loop). Needs the validation result to always be live (regardless of attempt state) plus one separate boolean (`hasAttemptedSubmit`) gating whether it's *displayed* — conflating the two into one flag can't represent "valid data, never submitted" and "invalid data, already tried" differently. |
| `FormInput` takes a separate `errorMessage` prop instead of deriving error text from `label` | Caught a real bug: Shipping Address's `label` is `"Shipping Address *"` (form-only suffix), and `` `${label} is required` `` rendered "Shipping Address * is required". The caller now supplies the actual sentence — the same per-field text (`attendeeFieldMessages`) the Review page's summary banner uses, so wording matches everywhere. |
| Each `step/review/` section owns its own `ReviewSection` wrapper (title + Edit link) instead of `ReviewRegistration.vue` wrapping children from the outside | The externally-wrapped version meant adding a section required editing two files. Self-wrapping makes `ReviewRegistration.vue` a flat list of `<XReview />` tags — adding a section is a one-line change. |
| `components/review/` (the post-submit screen, journal 05) renamed to `components/result/` | Once Step 4 introduced `components/step/review/` for its own in-wizard content, a second, unrelated top-level `review/` folder was an easy mix-up. `CLAUDE.md` updated to match. |
| `useRegistrationStore`/`useWizardNavigation` each split their "clear" action in two: `clearPersisted*` (storage only) vs. `reset*` (storage + in-memory) | The Success screen needs both, for different moments: on mount, only `sessionStorage` should clear (so a refresh starts over) while the screen still displays the in-memory data it's showing; "Back to Home" needs the full reset, in memory too, since the user is actually leaving. Conflating them would either blank the success screen the instant it renders or leave stale data after Back to Home. |

Full walk-through against concrete test scenarios:
[journal 03](docs/journal/03-data-types-and-store.md#test-case-validation-against-registrationstate).

Full reasoning per decision: [journal 01](docs/journal/01-tooling.md#key-decisions),
[journal 02](docs/journal/02-design-tokens.md#findings--color-tokens),
[journal 03](docs/journal/03-data-types-and-store.md),
[journal 04](docs/journal/04-data-services.md),
[journal 06](docs/journal/06-stepper-components.md),
[journal 07](docs/journal/07-step2-sessions.md),
[journal 08](docs/journal/08-step3-addons.md),
[journal 09](docs/journal/09-validation-approach.md),
[journal 10](docs/journal/10-step4-review-and-validation.md).

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
- Step 4's validation scope stopped short of the README's literal text —
  no phone format check, no Step 2/3 conflict re-verification at submit
  time (the UI already prevents creating one, but a submit-time re-check
  would be more defensive). Add both if there's time.
