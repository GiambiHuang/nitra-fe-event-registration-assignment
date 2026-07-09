# Journal 05 — Wizard shell: layout technique & the success/in-progress split

Phase 2 design discussion: how the wizard's chrome (layout, stepper,
scrollable step content, fixed footer, and the post-submit success screen)
fits together. Summarized in [`PLAN.md`](../../PLAN.md).

## Decision 1 — plain flexbox, not nested `q-layout`

`src/layouts/Main.vue` (the app's one route-level layout) already uses a
plain flexbox sticky-header pattern instead of Quasar's `q-header`/
`q-page-container` components:

```html
<div class="h-screen flex flex-col">
  <MainHeader />
  <div class="flex-1"><router-view /></div>
</div>
```

The wizard's own chrome — a fixed stepper on top, a scrollable middle, a
fixed footer on the bottom — needs the exact same "fixed / scroll / fixed"
shape one level deeper. **Decided: keep using plain flexbox for this too,
not a second `q-layout`.** Nesting `q-layout` inside another `q-layout` is a
known Quasar anti-pattern (`q-layout` is meant to be a single top-level
page-layout construct), and using one consistent technique throughout beats
mixing Quasar's layout components with hand-rolled flexbox depending on
which screen you're looking at.

### Three flexbox pitfalls worth writing down before they become bugs

1. **`min-h-0` has to be on every `flex-1` ancestor, not just the innermost
   one.** Flex items default to `min-height: auto`, which stops them
   shrinking below their content size — so `overflow-y-auto` on the
   scrollable middle silently never triggers a scrollbar, and the *whole
   page* scrolls instead. This applies to `Main.vue`'s own `flex-1` wrapper
   around `<router-view>` too, not just the wizard's internal structure — the
   chain breaks wherever `min-h-0` is missing.
2. **Scroll position doesn't reset automatically when the step changes**, if
   the scrollable container itself stays mounted and only its child (the
   active step) swaps. Needs an explicit reset (e.g. a watcher on the current
   step setting `scrollTop = 0`) — otherwise going Step 2 (scrolled down) →
   Step 3 lands already scrolled.
3. **Step content must actually unmount on navigation (`v-if` / dynamic
   `<component>`), not just hide (`v-show`/`keep-alive`).** This isn't only a
   flexbox note — it's a hard dependency on [journal 03's Decision
   D](03-data-types-and-store.md#decision-d--has-the-user-attempted-submit-is-local-step-4-ui-state-not-shared),
   which deliberately made Step 4's "submit attempted and failed" flag local
   component state specifically because leaving-and-returning was expected to
   reset it for free via unmount. If the step content were kept alive
   instead, that decision's assumption breaks silently.

## Decision 2 — success screen is a sibling of the step container, not a 5th step

Once Step 4's submit succeeds, the spec calls for a full confirmation screen
("Registration Complete!"), replacing the wizard entirely — no stepper, no
footer, nothing left to navigate.

Considered folding this into step navigation as a pseudo-step (`currentStep:
1 | 2 | 3 | 4 | 'success'`), but decided against it: `currentStep` staying a
closed `1 | 2 | 3 | 4` keeps the stepper/footer components' logic exhaustive
over exactly the 4 real steps, without every consumer needing a branch for a
value most of them structurally can't render anything for (success has no
stepper position and no back/next footer).

**Decided:** a separate `isComplete` flag, orthogonal to `currentStep`,
decides which of two siblings renders at the top level:

```
IndexPage.vue
  isComplete === false → StepContainer.vue   (stepper + scrollable step + fixed footer)
  isComplete === true  → Success.vue          (standalone, no wizard chrome)
```

- **The branch lives directly in `IndexPage.vue`**, not behind an extra
  `RegistrationWizard.vue` wrapper (an earlier draft of this decision
  proposed one). Revised: this app has exactly one route, so `IndexPage.vue`
  *is* the wizard's entry point already — a wrapper component with a single
  possible caller wasn't earning its keep. `pages/` staying "thin" is a
  guideline for when a page has real routing concerns to stay clear of, not
  a rule to satisfy by adding an empty pass-through layer.
- `StepContainer` owns the in-progress wizard chrome only; it isn't
  responsible for deciding whether it should render at all.
- `isComplete` lives alongside `currentStep` in `useWizardNavigation` (not in
  `useRegistrationStore` — same reasoning as journal 03 Decision D: this is
  flow/navigation state, not registration data). It needs a shared composable
  rather than local state because the flag is *read* at the top
  (`IndexPage.vue`) but will eventually be *set* from deep inside Step 4's
  submit handler once Phase 4's validation lands — prop-drilling an emit up
  through Stepper/Footer/StepContainer for that is exactly the kind of
  friction cross-step composables already exist to avoid.
- `Success.vue` lives in `components/review/` — it's the successful outcome
  of the review/submit flow, not a distinct domain of its own.
- Not a routed page (no `/success` URL) — the spec asks for a confirmation
  *screen*, not a bookmarkable route, and a real route would need guarding
  against direct navigation to it.

### `useWizardNavigation` shape agreed for the build

```
currentStep: 1 | 2 | 3 | 4
isComplete: boolean
goNext() / goBack() / goToStep(n)   // goToStep for stepper click-to-jump
                                     // and Step 4's future error navigation
markComplete()
```

### Recommended build order (skeleton before real content)

Build the shell against placeholder step content before Step 1's real form
exists, rather than only integrating/testing navigation once all 4 steps are
built:

1. `useWizardNavigation` — small and independently verifiable.
2. `StepContainer.vue` with a placeholder in the middle slot (e.g. plain text
   showing the current step number), footer Back/Next wired to
   `goBack`/`goNext`. Verify the three pitfalls above for real: resize the
   window and confirm only the middle region scrolls (not the whole page);
   confirm scroll position resets between steps; add a throwaway
   `onUnmounted(() => console.log(...))` in the placeholder to confirm each
   step really unmounts on navigation, rather than assuming it.
3. `Success.vue`, minimal ("Registration Complete!" heading is enough for now).
4. Wire the `isComplete` branch into `IndexPage.vue`.
5. Click through the whole placeholder flow in the browser, including
   temporarily forcing `isComplete = true` (e.g. via devtools or a throwaway
   test button) to confirm `Success` actually renders.
6. Only then replace the Step 1 placeholder with real content, continuing
   step by step.

## A real bug found by actually doing step 5 above

Running the recommended click-through test — including the "temporarily
force `isComplete = true`" step — surfaced a genuine bug rather than just
confirming the happy path: `isComplete` was being persisted to
`sessionStorage` along with `currentStep`. Once set via the throwaway test
button, **every subsequent refresh loaded `isComplete: true` back from
storage and landed on `Success.vue` again, with no code path anywhere that
ever cleared it** — the success screen got permanently stuck for that
browser tab.

**Fixed:** `isComplete` is now excluded from what gets written to
`sessionStorage` entirely (a `PersistedNavigationState = Pick<..,
'currentStep'>` type at the persistence boundary, mirroring the pattern
`useRegistrationStore` already uses for its `Set` fields). `currentStep`
still persists (refreshing mid-form still lands on the same step), but
`isComplete` always starts `false` on a fresh page load regardless of what
was last written — it only becomes `true` again by actually calling
`markComplete()` within the current session.

Verified with a standalone script mirroring the persist/load logic: after a
simulated "mark complete → persist → refresh," `isComplete` is `false`,
`currentStep` is preserved, and the persisted JSON literally has no
`isComplete` key at all.

This is exactly the kind of bug the "build the skeleton and click through it
for real" recommendation above was for — it wouldn't have been caught by
`typecheck`/`lint`, only by actually exercising the flow.

## Found during review — fixed

`MainHeader.vue` used to have a class `border-divider`, which wasn't a real
shortcut — confirmed at the time that it compiled to nothing by diffing the
actual UnoCSS dev-server output. Since fixed by moving the divider into its
own dedicated element in `Main.vue`, matching the pattern already used there.
