import { reactive, readonly, watch } from 'vue'

const STORAGE_KEY = 'nitra:wizard-navigation'
const MIN_STEP = 1

/** The wizard's 4 steps, in order. The single source of truth for both the step count and their display labels — anything needing either (the stepper UI, `MAX_STEP` below) reads from this instead of hardcoding its own copy. */
export const WIZARD_STEPS: { index: WizardStep; label: string }[] = [
  { index: 1, label: 'Attendee Info' },
  { index: 2, label: 'Sessions' },
  { index: 3, label: 'Add-ons' },
  { index: 4, label: 'Review' },
]

// Safe: WIZARD_STEPS is fixed at exactly 4 entries, matching WizardStep's 1-4 range.
const MAX_STEP = WIZARD_STEPS.length as WizardStep

export type WizardStep = 1 | 2 | 3 | 4

interface WizardNavigationState {
  currentStep: WizardStep
  isComplete: boolean
  /** Whether Submit Registration has been clicked at least once this registration attempt. Gates whether Step 4's validation errors are actually shown (see `markSubmitAttempted`). */
  hasAttemptedSubmit: boolean
}

function createInitialState(): WizardNavigationState {
  return {
    currentStep: 1,
    isComplete: false,
    hasAttemptedSubmit: false,
  }
}

/**
 * Only `currentStep` is persisted — `isComplete` deliberately never is (see
 * journal 05), and neither is `hasAttemptedSubmit` for the same shape of
 * reason: a refresh should never resurrect "you just tried to submit and it
 * failed" as UI state.
 */
type PersistedNavigationState = Pick<WizardNavigationState, 'currentStep'>

function loadPersistedState(): WizardNavigationState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const persisted = JSON.parse(raw) as PersistedNavigationState
    return { ...createInitialState(), currentStep: persisted.currentStep }
  } catch {
    return createInitialState()
  }
}

function persistState(source: WizardNavigationState): void {
  try {
    const persisted: PersistedNavigationState = { currentStep: source.currentStep }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
  } catch {
    // Storage unavailable/full — in-memory state still works, just won't survive a refresh.
  }
}

// Module-scoped singleton — same reasoning as useRegistrationStore (see
// journal 03/05): one wizard instance, no SSR, so a plain reactive() at
// module scope is enough to share this across every consumer.
const state = reactive(loadPersistedState())

// Persisted to sessionStorage so a refresh lands back on the same step
// instead of resetting to Step 1 — consistent with how the registration
// data itself already survives a refresh (see journal 03). isComplete is
// excluded from what gets written (see PersistedNavigationState above).
watch(state, () => persistState(state), { deep: true })

/** Moves to the next step. A no-op if already on the last step (4). */
function goNext(): void {
  // Safe: MIN_STEP/MAX_STEP bound this to exactly 1-4.
  state.currentStep = Math.min(state.currentStep + 1, MAX_STEP) as WizardStep
}

/** Moves to the previous step. A no-op if already on the first step (1). */
function goBack(): void {
  // Safe: MIN_STEP/MAX_STEP bound this to exactly 1-4.
  state.currentStep = Math.max(state.currentStep - 1, MIN_STEP) as WizardStep
}

/**
 * Jumps directly to the given step, with no restriction on which one — the
 * spec requires free forward/back navigation. Also backs the stepper's
 * click-to-jump and Step 4's error navigation (jumping to whichever step
 * failed validation) — `hasAttemptedSubmit` deliberately stays set across
 * this jump, so the destination step actually shows its field-level errors
 * instead of the navigation silently clearing them.
 * @param step - The step to jump to.
 */
function goToStep(step: WizardStep): void {
  state.currentStep = step
}

/** Marks the registration as successfully submitted, switching the top-level view to the success screen. */
function markComplete(): void {
  state.isComplete = true
}

/**
 * Records that Submit Registration has been clicked, so Step 4's
 * validation errors start actually being shown everywhere (stepper, review
 * page, individual step inputs) instead of just gating the button. Stays
 * `true` across navigation — including jumping to a failing step to fix
 * it — so the errors it reveals don't just vanish before they can be
 * seen; the underlying validation result stays live throughout, so each
 * error clears itself the moment its field is actually fixed. Only a full
 * `resetNavigation` (Back to Home) clears it back to `false`.
 */
function markSubmitAttempted(): void {
  state.hasAttemptedSubmit = true
}

/** Removes the persisted `currentStep` from `sessionStorage`, if present. Shared by `resetNavigation` and `clearPersistedNavigation` — see the latter's doc for why they're split. */
function removePersistedNavigation(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable — nothing to clear.
  }
}

/**
 * Clears only the persisted `currentStep`, leaving in-memory navigation
 * state (including `isComplete`) untouched. Used when the Success screen
 * mounts, paired with `useRegistrationStore`'s `clearPersistedRegistration`
 * — a refresh from there should start the wizard over at Step 1 instead of
 * resurrecting the just-submitted step/data. Calling the full
 * `resetNavigation` here instead would flip `isComplete` back to `false`
 * immediately and kick the user off the success screen they're still on.
 */
function clearPersistedNavigation(): void {
  removePersistedNavigation()
}

/**
 * Resets navigation back to the first step, both in memory and in
 * `sessionStorage`. Used by the Success screen's "Back to Home" action,
 * once the user is actually navigating away (unlike `clearPersistedNavigation`,
 * which leaves the in-memory state alone so the success screen it's called
 * from doesn't unmount itself).
 */
function resetNavigation(): void {
  Object.assign(state, createInitialState())
  removePersistedNavigation()
}

const actions = {
  goNext,
  goBack,
  goToStep,
  markComplete,
  markSubmitAttempted,
  clearPersistedNavigation,
  resetNavigation,
}

/**
 * Tracks which wizard step is active and whether the registration has been
 * successfully submitted. Deliberately separate from `useRegistrationStore`
 * — this is navigation/flow state, not registration data (see journal 05).
 *
 * State is exposed read-only; components must go through the returned
 * actions to make changes.
 * @returns The read-only navigation state, plus the actions that mutate it.
 */
export function useWizardNavigation() {
  return {
    state: readonly(state),
    ...actions,
  }
}
