# Journal 10 — Step 4: review screen + unified validation

Phase 3's last step, built in two passes (two PRs, #7 and #8) on top of
Steps 1–3's established patterns ([journal 06](06-stepper-components.md),
[journal 07](07-step2-sessions.md), [journal 08](08-step3-addons.md)) and
the pre-implementation decision recorded in
[journal 09](09-validation-approach.md) (plain functions over zod). That
decision held, but the actual validation *scope* that shipped is narrower
than journal 09 assumed — see below.

## Pass 1 (PR #7): the happy-path review screen first

Per journal 09, the first validation pass was built and then deliberately
discarded to build the review UI against a real screen instead of a
guessed one. `ReviewRegistration.vue` composes four section components
(`AttendeeReview`, `SessionsReview`, `AddonsReview`, `PricingSummary`),
each self-contained and pulling from the shared store/composables
directly — matching `CLAUDE.md`'s section-level-components-call-composables
rule, the same pattern `OrderSummary.vue` already used in journal 08.

**Each section owns its own `ReviewSection` wrapper**, not
`ReviewRegistration.vue` wrapping children from the outside. The first cut
had `ReviewRegistration.vue` doing `<ReviewSection title="..."><AttendeeReview
/></ReviewSection>`, which meant every new section required editing two
files (the section's own component *and* the composition point) just to
add a title/edit-link. Moving the wrapper inside each section
(`AttendeeReview.vue` itself renders `<ReviewSection title="Attendee
Information" :step-index="1">`) means `ReviewRegistration.vue` is just a
flat list of `<XReview />` tags — composing a new section is a one-line
addition.

**`SessionsReview` sorts by start time**, not `Set` insertion/selection
order — `selectedSessionIds` is a `Set`, which preserves click order, not
a meaningful review order. Also keys rows by `session.id` instead of a
derived date/time string (the original version keyed by the formatted
label, which collided whenever two sessions happened to render the same
text) and filters out ids that don't resolve in the catalog instead of
rendering a broken "unknown / unknown" row.

**`AddonsReview` covers all three categories** (workshops, meals,
merchandise) — the initial version only handled workshops, mirroring
`calculateOrderSummary.ts`'s per-category filtering (journal 08) once
extended. Merchandise rows read `name (size) × qty (line total)`, prices
go through `formatCurrency` everywhere (the original had raw `` `$${price}` ``
string interpolation, against `CLAUDE.md`'s "format currency through
shared utils, never ad hoc" rule).

### `components/review/` renamed to `components/result/`

`CLAUDE.md` originally documented the post-submit `Success.vue` as living
in `components/review/` (a sibling of the wizard, per journal 05). Once
Step 4 introduced `components/step/review/` for its own in-wizard content,
having a *second*, unrelated `review/` folder one level up read as an easy
mix-up — "review" now means two different things depending on whether
you're under `step/` or not. Renamed the post-submit one to
`components/result/`, and `CLAUDE.md`'s directory-layout section updated
to match.

### Success screen: dynamic data, and a persisted-vs-in-memory split

`Success.vue` initially had a hardcoded confirmation blurb ("Thanks for
registering..."). It now reads the actual attendee name/email and resolves
the selected ticket's name via `useEventInfo`.

Two different "reset" actions were needed, and conflating them breaks the
screen:

- **On mount**, the persisted copies (`sessionStorage`) of both
  registration data and navigation state need clearing, so a refresh from
  the success screen starts the wizard over at Step 1 instead of
  resurrecting the just-submitted registration (which is what happens
  otherwise: `isComplete` never persists, but `currentStep` and the
  registration data do, so a refresh would land back on a fully-populated
  Step 4). But the screen is *still displaying* that data — calling a
  full reset here would blank the in-memory state mid-render and, worse,
  flip `isComplete` back to `false`, immediately kicking the user off the
  success screen they're still looking at.
- **"Back to Home"** is the opposite case: the user is actually leaving,
  so it should reset everything, in memory too.

Split into two actions per store (`clearPersistedRegistration` /
`resetRegistration` in `useRegistrationStore`, `clearPersistedNavigation` /
`resetNavigation` in `useWizardNavigation`) — the `clearPersisted*` pair
only touches `sessionStorage`, the full `reset*` pair does both.
`resetRegistration`/`resetNavigation` already existed (written speculatively
in an earlier session, "not yet called anywhere") and just needed wiring
up; the `clearPersisted*` half was new.

## Pass 2 (PR #8): unified validation

### Scope: narrower than the README's literal text, by direction

Journal 09 anticipated re-checking Step 2 session conflicts and Step 3
workshop conflicts at submit time (the README asks for this explicitly,
even though the Step 2/3 UI already prevents *creating* a conflict by
disabling cards). The actual scope that got built, on explicit direction,
is smaller:

- **Step 1** — all required fields present; only **email** gets a format
  check (a basic `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), not phone; shipping
  address required only when `isShippingAddressRequired` (merchandise
  selected).
- **Step 2** — not re-checked at all.
- **Step 3** — only "selected merchandise item offers sizes but none is
  chosen" is checked; workshop-vs-session/workshop-vs-workshop conflicts
  are not re-verified at submit time.

This is a deliberate reduction from both the README's literal wording and
journal 09's own assumption, not an oversight — recorded here so it reads
as a decision, not a gap, if revisited later.

### One pure function, one reactive wrapper

`validateRegistration(state, addons)` in `src/utils/validateRegistration.ts`
is the single source of truth, returning a granular result:
`attendeeErrors` (one boolean per Step 1 field), `attendeeFieldMessages`
(one human-readable string per *failing* field, keyed the same way),
`merchandiseSizeErrors` (a `Set` of addon ids), `errorSteps`, `messages`
(the flat list the Review page's summary banner renders), and `isValid`.
`useRegistrationValidation()` wraps it in a `computed()` sourced from
`useRegistrationStore` + `useAddons` — no state of its own, so every call
site (stepper, footer, each step's form, each review section) shares the
same live result without any explicit wiring between them.

zod was reconsidered given the narrower final scope (Step 1's checks
*are* schema-shaped) and rejected again for the same reason as journal 09:
the merchandise-size check still needs to cross-reference the addon
catalog to know which selected items require a size in the first place —
that's not an object-shape check, and splitting Step 1 into zod while
Step 3 stays a plain function means reconciling two different validation
styles into the one `errorSteps`/`messages` result, for one schema-shaped
step's worth of savings.

### Interaction model: nothing shown until the first failed attempt, then live

Specified as: click Submit → if it fails, mark the failing step red on the
stepper, mark the failing section(s) red on the Review page (border +
the specific invalid value's text, not the whole row), mark the actual
input red on that step's own form, disable the Submit button — and all of
that should update live as fields get fixed, without needing another
click.

This needs two separate pieces of state, not one:

- **A live validation result** (`useRegistrationValidation`'s `computed`)
  — always reflects the current data, valid or not, regardless of whether
  the user has ever tried to submit.
- **A `hasAttemptedSubmit` flag** (`useWizardNavigation`, non-persisted
  like `isComplete`) — gates whether any of that result is actually
  *shown*. Every error-UI computed in every component follows the same
  `hasAttemptedSubmit ? result.value.X : <nothing>` shape.

`markSubmitAttempted()` sets it; `WizardFooter`'s Submit click calls it
unconditionally, then only calls `markComplete()` if the result is
actually valid. The button's `disabled` state is
`currentStep === 4 && hasAttemptedSubmit && !isValid` — enabled on a blank
form until the first click, matching the README's "no inline validation
until submit."

### A real bug: clearing `hasAttemptedSubmit` on navigation defeated the point

The first implementation cleared `hasAttemptedSubmit` inside `goNext` /
`goBack` / `goToStep`, reasoning (by analogy to the *other* "fresh
attempt" decision already in `PLAN.md`, made for the discarded first pass
in journal 09) that leaving Step 4 should reset the attempt. Caught by
actually driving the flow with Playwright: clicking "Edit → Step 1" from
a failed Review page jumped to Step 1 with every field showing blank/valid
— the navigation itself cleared the flag before the destination step could
render its own red state, so the very feature ("navigate to the failing
step to fix it") silently broke itself on arrival.

Fixed by leaving `hasAttemptedSubmit` set across all navigation — the
underlying validation result is already live, so each error clears itself
the moment its field is actually fixed; nothing needs the flag to reset on
navigation to behave correctly. It's cleared only by a full
`resetNavigation` (Back to Home). **This supersedes the older `PLAN.md`
entry** ("Submit was attempted and failed is local Step 4 UI state...
leaving Step 4 and returning is treated as a fresh attempt") — that
decision was made for the discarded pass, before there was a real
navigate-to-fix-it flow to test it against.

### `FormInput`'s error text needed its own prop, not `label`

`Shipping Address`'s displayed label is `Shipping Address *` (or
`(Optional)`) depending on `isShippingAddressRequired` — text meant for
the form, not for embedding in a sentence. A first version generated the
inline error as `` `${label} is required` ``, which rendered `Shipping
Address * is required`. Fixed by giving `FormInput` a separate
`errorMessage` prop (the caller supplies the actual sentence) instead of
deriving one from `label`; `AttendeeForm.vue` passes
`attendeeFieldMessages[field]`, the same per-field text the Review page's
summary banner uses, so the wording matches everywhere it appears.

### Review page: blank vs. invalid-but-present read differently

A blank required field rendered as empty text next to its label — not
wrong, but easy to miss. Blank + invalid now shows a placeholder
(`— (required)`, or `— (required for merchandise)` for shipping address
specifically) instead of nothing. Email is the one field that can be
*invalid while non-blank* (a bad format, not a missing value) — that case
gets `(invalid format)` instead of the generic `(required)`, which would
otherwise misleadingly imply the field was empty. Merchandise rows follow
a different convention again: there's already a real value to show (item
+ quantity), so a missing size appends `(required for size selection)`
after it in its own danger-colored span, rather than recoloring or
replacing the whole line.

## Commit/PR structure

Both passes shipped as multiple small commits rather than one, split by
concern and checked in dependency order (each commit's own snapshot needs
to actually build, not just the final working tree) — e.g. PR #8 landed
the pure `validateRegistration`/`useRegistrationValidation` pair first
(unwired, self-contained), then submit-gating + stepper wiring, then each
UI surface (Step 1 form, Step 3 merchandise, Review page) as its own
commit. Verified with ad hoc Playwright scripts at each stage — the
project has no formal e2e suite, so this was the practical way to actually
drive the interaction (submit, see the error, fix it, watch it clear
live) rather than trust the code by inspection alone.
