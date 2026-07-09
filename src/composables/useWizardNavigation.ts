import { reactive, readonly, watch } from 'vue'

const STORAGE_KEY = 'nitra:wizard-navigation'
const MIN_STEP = 1
const MAX_STEP = 4

/** The wizard's 4 steps: Attendee Info, Session Selection, Add-ons, Review & Submit. */
export type WizardStep = 1 | 2 | 3 | 4

interface WizardNavigationState {
  currentStep: WizardStep
  isComplete: boolean
}

function createInitialState(): WizardNavigationState {
  return {
    currentStep: 1,
    isComplete: false,
  }
}

/**
 * Only `currentStep` is persisted — `isComplete` deliberately never is (see
 * journal 05). Otherwise, marking the registration complete would get
 * written to sessionStorage and every subsequent refresh would land back on
 * the success screen forever, with nothing to ever clear it.
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
 * click-to-jump and Step 4's future error navigation (jumping to whichever
 * step failed validation).
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
 * Resets navigation back to the first step (in memory) and clears the
 * persisted `currentStep`. Not yet called anywhere — intended for a future
 * "start a new registration" action, so a stale step doesn't resurface on
 * the next visit. `isComplete` never persists in the first place (see
 * `PersistedNavigationState`), so this isn't what prevents the success
 * screen from getting stuck — that's handled at the persistence layer.
 */
function resetNavigation(): void {
  Object.assign(state, createInitialState())
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable — nothing to clear.
  }
}

const actions = {
  goNext,
  goBack,
  goToStep,
  markComplete,
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
