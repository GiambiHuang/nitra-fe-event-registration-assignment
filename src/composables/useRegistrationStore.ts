import { reactive, readonly, watch } from 'vue'
import type { AttendeeInfo, RegistrationState } from 'src/types/registration'

const STORAGE_KEY = 'nitra:registration'

/** `RegistrationState` with its `Set` fields swapped for arrays — the shape actually written to `sessionStorage`, since `Set` doesn't survive `JSON.stringify`. */
type PersistedRegistrationState = Omit<
  RegistrationState,
  'selectedSessionIds' | 'selectedWorkshopIds' | 'selectedMealIds'
> & {
  selectedSessionIds: string[]
  selectedWorkshopIds: string[]
  selectedMealIds: string[]
}

function createInitialState(): RegistrationState {
  return {
    attendee: {
      fullName: '',
      email: '',
      phone: '',
      company: '',
      jobTitle: '',
      shippingAddress: '',
    },
    ticketTypeId: null,
    selectedSessionIds: new Set(),
    selectedWorkshopIds: new Set(),
    selectedMealIds: new Set(),
    merchandiseSelections: {},
  }
}

function toPersisted(source: RegistrationState): PersistedRegistrationState {
  return {
    ...source,
    selectedSessionIds: [...source.selectedSessionIds],
    selectedWorkshopIds: [...source.selectedWorkshopIds],
    selectedMealIds: [...source.selectedMealIds],
  }
}

function fromPersisted(source: PersistedRegistrationState): RegistrationState {
  return {
    ...source,
    selectedSessionIds: new Set(source.selectedSessionIds),
    selectedWorkshopIds: new Set(source.selectedWorkshopIds),
    selectedMealIds: new Set(source.selectedMealIds),
  }
}

/**
 * Reads and rehydrates state from `sessionStorage`, falling back to a fresh
 * state if nothing is stored, storage isn't available (e.g. private
 * browsing), or the stored payload doesn't parse — a stale or incompatible
 * blob (e.g. after a shape change during development) should never crash
 * the app on load.
 */
function loadPersistedState(): RegistrationState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    return fromPersisted(JSON.parse(raw) as PersistedRegistrationState)
  } catch {
    return createInitialState()
  }
}

/** Writes the current state to `sessionStorage`. Fails silently if storage is unavailable. */
function persistState(source: RegistrationState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toPersisted(source)))
  } catch {
    // Storage unavailable/full — in-memory state still works, just won't survive a refresh.
  }
}

// Module-scoped singleton: every `useRegistrationStore()` call below returns
// the same reactive object, since ES modules are cached. This is what makes
// it a single shared source of truth across all 4 wizard steps.
const state = reactive(loadPersistedState())

// Persisted to `sessionStorage` on every change (scoped to the tab session —
// survives a refresh, clears when the tab closes, doesn't accumulate stale
// drafts the way `localStorage` would). See journal 03 for the discussion.
watch(state, () => persistState(state), { deep: true })

/**
 * Updates a single Step 1 attendee field.
 * @param field - The attendee field to update.
 * @param value - The new value for that field.
 */
function setAttendeeField<K extends keyof AttendeeInfo>(field: K, value: AttendeeInfo[K]): void {
  state.attendee[field] = value
}

/**
 * Selects the given ticket type, replacing any previous selection (tickets are single-select).
 * @param ticketTypeId - The `TicketType.id` to select.
 */
function selectTicket(ticketTypeId: string): void {
  state.ticketTypeId = ticketTypeId
}

/** Clears the ticket selection, returning to the default "none selected" state. */
function deselectTicket(): void {
  state.ticketTypeId = null
}

/**
 * Adds the session to the selection if absent, removes it if already selected.
 * @param sessionId - The `Session.id` to toggle.
 */
function toggleSession(sessionId: string): void {
  if (state.selectedSessionIds.has(sessionId)) {
    state.selectedSessionIds.delete(sessionId)
  } else {
    state.selectedSessionIds.add(sessionId)
  }
}

/**
 * Adds the workshop to the selection if absent, removes it if already selected.
 * @param workshopId - The `WorkshopAddon.id` to toggle.
 */
function toggleWorkshop(workshopId: string): void {
  if (state.selectedWorkshopIds.has(workshopId)) {
    state.selectedWorkshopIds.delete(workshopId)
  } else {
    state.selectedWorkshopIds.add(workshopId)
  }
}

/**
 * Adds the meal package to the selection if absent, removes it if already selected.
 * @param mealId - The `MealAddon.id` to toggle.
 */
function toggleMeal(mealId: string): void {
  if (state.selectedMealIds.has(mealId)) {
    state.selectedMealIds.delete(mealId)
  } else {
    state.selectedMealIds.add(mealId)
  }
}

/**
 * Sets the quantity for a merchandise item. A quantity of 0 or less removes
 * the selection entirely, so `merchandiseSelections` only ever holds items
 * the user has actually added (used elsewhere to detect "any merch selected").
 * Callers are expected to clamp `quantity` to the addon's `maxQuantity` (the
 * UI layer's job — see journal 03); this action doesn't re-validate it.
 * @param addonId - The `MerchandiseAddon.id` being updated.
 * @param quantity - The new quantity; 0 or less removes the item.
 */
function setMerchandiseQuantity(addonId: string, quantity: number): void {
  if (quantity <= 0) {
    delete state.merchandiseSelections[addonId]
    return
  }
  const existing = state.merchandiseSelections[addonId]
  state.merchandiseSelections[addonId] = { ...existing, quantity }
}

/**
 * Sets the chosen size for a merchandise item that has already been added. No-op if it hasn't.
 * @param addonId - The `MerchandiseAddon.id` being updated.
 * @param size - The chosen size, one of `MerchandiseAddon.sizes`.
 */
function setMerchandiseSize(addonId: string, size: string): void {
  const existing = state.merchandiseSelections[addonId]
  if (!existing) return
  state.merchandiseSelections[addonId] = { ...existing, size }
}

/**
 * Resets the registration to a blank slate and clears the persisted copy.
 * Not yet called anywhere — intended for Phase 4's post-submit success flow,
 * so a completed registration doesn't resurrect itself on the next visit.
 */
function resetRegistration(): void {
  Object.assign(state, createInitialState())
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable — nothing to clear.
  }
}

const actions = {
  setAttendeeField,
  selectTicket,
  deselectTicket,
  toggleSession,
  toggleWorkshop,
  toggleMeal,
  setMerchandiseQuantity,
  setMerchandiseSize,
  resetRegistration,
}

/**
 * The single shared registration store used across all 4 wizard steps.
 * A plain composable, not Pinia (see journal 03) — a module-scoped `reactive`
 * singleton is enough for one wizard instance with no SSR requirement.
 *
 * State is exposed read-only; components must go through the returned
 * actions to make changes, keeping every mutation in one place. State is
 * seeded from `sessionStorage` on first load and kept in sync on every
 * change, so a page refresh doesn't lose an in-progress registration.
 * @returns The read-only registration state, plus the actions that mutate it.
 */
export function useRegistrationStore() {
  return {
    state: readonly(state),
    ...actions,
  }
}
