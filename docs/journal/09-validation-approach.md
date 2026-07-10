# Journal 09 — Step 4 validation: zod vs. plain functions, and a reordering

Recorded ahead of Step 4's actual build. A first pass at the submit →
validate → `errorSteps` → stepper/footer flow was built and then
deliberately discarded — not because it was wrong, but to build the
happy-path review UI (summary blocks, Order Summary, Edit buttons) first and
design the error *display* against a real screen, rather than guessing at it
before the screen exists. This entry keeps the one decision from that pass
worth keeping: why validation is plain functions, not a schema library.

## Why not zod (or similar)

Raised directly: given zod's `safeParse()` naturally produces a field-level
error list, wouldn't it fit "show which fields are missing" better than
hand-rolled validation?

Looked at the actual rules Step 4 has to check, not the idea of validation
in the abstract:

- **Step 1** (required strings, email/phone format) — a plain object-shape
  check. This *is* zod's sweet spot.
- **Step 2** (do any two selected sessions overlap in time) — needs the full
  session catalog resolved and cross-referenced against
  `selectedSessionIds`. The catalog isn't part of the object being
  validated at all.
- **Step 3** (workshop-vs-session/workshop-vs-workshop conflicts,
  merchandise-size-required) — needs *both* the session catalog and the
  addon catalog, cross-referenced against `selectedWorkshopIds` and
  `merchandiseSelections`' keys respectively.

Three of the four checks aren't "is this object shaped correctly" at all —
they're "does this object, resolved against external data, satisfy a
relationship." zod's schema language describes one object's shape; making
it also reach out to session/addon catalogs means writing the exact same
imperative cross-referencing logic inside a `.superRefine()` callback. That
doesn't reduce the actual complexity, it just adds a translation layer
around code that was going to be plain functions either way.

Splitting the difference — zod for Step 1's fields, plain functions for
Steps 2/3 — was considered and rejected: `validateRegistration` needs to
return *one* coherent result (`errorSteps` derived uniformly across all
three steps), and reconciling two different validation styles/error shapes
into that one result is more bookkeeping than the Step 1 piece would save.

**On the "field-level error display" question specifically:** a flat
`AttendeeFieldErrors` object (one named boolean per field) is more directly
consumable by a template (`v-if="attendeeErrors.fullName"`) than zod's
generic `issues: { path, message }[]` array, which needs a `.find()` per
field to answer "is *this specific* field wrong." The shape this project
needs isn't actually zod's strength either way.

Not a closed door — if Phase 4's real implementation runs into something
zod would have handled more gracefully, worth revisiting then, with actual
code in front of us rather than a hypothetical.
