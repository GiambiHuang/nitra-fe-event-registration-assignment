# Journal 06 — Stepper components: status modeling, decomposition, chrome/content boundary

Phase 2 build-out of the actual `stepper/` components (continuing from
[journal 05](05-wizard-shell.md)'s shell design), plus the boundary decisions
made going into Phase 3. Summarized in [`PLAN.md`](../../PLAN.md).

## `WizardStepper` — a real bug from additive class-pushing

The first draft computed each step's icon/label classes by starting from a
base (active/inactive) array and `push()`-ing extra classes on top for the
error case:

```ts
const iconClass = isActive ? [...] : [...]
if (isError) iconClass.push('bg-danger-emphasis-rest')
```

This has two problems, one of which is a real, reproduced bug rather than a
theoretical one:

1. **Type-level**: `barClass` was a plain string in one branch, not an array,
   so `barClass.push(...)` failed `vue-tsc` outright — caught immediately by
   the gate, not hypothetical.
2. **Cascade-level**: with `isError` temporarily hardcoded `true` to preview
   the state, `text-danger` visually never showed up. Root-caused by running
   the dev server and reading the actual generated `__uno.css` rather than
   guessing: the `shortcuts` layer emits classes in the order they're
   declared in `semantic.js`'s `semanticTextShortcut`/`semanticBgShortcut`
   objects, and `text-danger`/`bg-danger-emphasis-rest` are declared *before*
   `text-neutral`/`text-neutral-quiet`/`bg-surface-l2` in that file. Two
   classes that both set `color` (or `background-color`) on the same element
   resolve by cascade order in the generated stylesheet, not by the order
   they're listed in `:class` — so the base-state class always won, no
   matter when the error class was pushed on top.

**Fix:** model status as a single discriminated union instead of three
independent booleans:

```ts
type StepStatus = 'upcoming' | 'active' | 'complete' | 'error'
```

resolved by one function (`getStepStatus`, priority: error > complete >
active > upcoming) and looked up in a `STATUS_STYLES: Record<StepStatus, {...}>`
table. Each status now owns one exhaustive, non-overlapping class set — never
two classes touching the same CSS property on one element — so the cascade
question can't come up again regardless of `semantic.js`'s declaration
order. This is the same "prefer discriminated unions over boolean flags for
mutually exclusive states" rule from `CLAUDE.md`, motivated here by an actual
reproduced defect rather than the rule alone.

`errorSteps: WizardStep[]` (default `[]`) is wired through `WizardStepper` →
`getStepStatus` already, ahead of Step 4's real validation logic — passing
`[]` today is a deliberate placeholder, not dead code, so the wiring doesn't
need to be revisited later.

## `WIZARD_STEPS` moved into `useWizardNavigation`

The step list (`{ index, label }[]` for all 4 steps) originally lived as a
local const in `WizardStepper.vue`. Moved into `useWizardNavigation.ts` as
`WIZARD_STEPS`, exported alongside `WizardStep`, with `MAX_STEP` now derived
from `WIZARD_STEPS.length` instead of a separately hardcoded `4`. Reason: the
step count was previously defined in two independent places (`MAX_STEP` and
`STEPS.length`) that could silently drift out of sync if the wizard ever
gained/lost a step. `useWizardNavigation`'s own `WizardStep` JSDoc already
named the 4 steps in prose; this closes the gap between "documented in a
comment" and "enforced in code."

## `StepNavItem` extracted from `WizardStepper` — one component, not four

Considered and rejected: one component per status (`UpcomingNav`,
`ActiveNav`, `ErrorNav`, ...). Status is a *data* variant, not a *structural*
one — all four statuses render identical markup, differing only in which
classes/icon apply, which `STATUS_STYLES` already handles. Splitting by
status would have re-scattered that single lookup table across N files.

Extracted instead along the actual responsibility boundary: `WizardStepper`
lays out all steps and the connecting progress bars between them;
`StepNavItem` owns a single step's clickable state (icon, label, aria-current)
and emits a bare `click` (no payload — the parent's `v-for` already has
`step.index` in scope to build the `change` event). `StepWithStatus`/
`StepStatus` moved to a colocated `stepper/types.ts` so neither component
has to import the other's internals.

## Chrome vs. content: `stepper/` never imports domain step components

Two related decisions, both driven by the same principle — components
within `stepper/` don't import each other, and `stepper/` doesn't import
from `attendee/`/`sessions/`/`addons/`/`review/`:

- **`StepContainer` collapsed to a pure layout primitive** — `<div
  class="h-full flex flex-col"><slot /></div>`, nothing else. An earlier
  draft had it internally importing and wiring `WizardStepper`/`WizardFooter`
  itself; reverted because that made `stepper/` components reach sideways
  into their siblings. Composition (which chrome pieces render, in what
  order) now happens explicitly in `IndexPage.vue`, which is allowed to know
  about everything. In the end `StepContainer`'s wrapper div was inlined
  directly into `IndexPage.vue` and the file was deleted — once it held zero
  logic, the extra indirection wasn't earning its keep.
- **Per-step content dispatch belongs in `IndexPage.vue`, not
  `StepContent.vue`.** Considered giving `StepContent` a `currentStep` prop
  and a `<component :is="...">` internally, resolving which of Step 1–4's
  components to render. Rejected: that would require `StepContent` (generic
  stepper chrome — a scrollable area with a scroll-reset watcher) to import
  all four domain step components, inverting the dependency direction so the
  generic piece breaks every time a domain step changes. `StepContent` stays
  a dumb `<slot>`; `IndexPage.vue` will hold the `Record<WizardStep,
  Component>` lookup and place `<component :is="STEP_COMPONENTS[state.currentStep]" />`
  inside the slot — same lookup-table pattern as `STATUS_STYLES` above,
  applied at the page-composition level instead of inside the chrome.

`StepContent.vue` itself carries journal 05's scroll-reset fix: a `watch(()
=> state.currentStep, ...)` (reading `useWizardNavigation` directly rather
than taking a redundant prop, since it already needs the composable) resets
`scrollTop` to 0 on every step change, since the scrollable element stays
mounted and only its slotted content swaps.

One more flexbox refinement found here: the scrollable middle originally had
`items-center justify-center` (copied from the very first placeholder markup).
Dropped `items-center` — vertically centering content taller than its
scroll container is a known flexbox+overflow trap (the content's top edge
can end up unreachable via scroll). `justify-center` was a no-op anyway
(the single child is already `w-full`).

## Naming: domain folders match their siblings' plain-noun style

Raised while starting Phase 3, for Step 1's orchestrating component
(composing ticket selection + the attendee form together): none of the
existing domain-folder components carry a `Step`-qualified name
(`SessionCard`, `DaySection`, `AddonCard`, `ShippingBanner`, `ReviewSection`,
`Success`) — the folder itself (`sessions/`, `addons/`, `review/`) already
encodes which step owns the file, so `Step` reads more like a `stepper/`
chrome concept (`StepContainer`, `StepContent`, `StepNavItem`) than a domain
one. Landed as `AttendeeInfo.vue` — named after what the step actually is
(`WIZARD_STEPS`' `'Attendee Info'` label), not a generic `*Step` suffix. Each
domain's orchestrating component follows this same rule going forward.
