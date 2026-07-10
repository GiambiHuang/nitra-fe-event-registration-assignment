import type { RegistrationState } from 'src/types/registration'
import type { Addon, MerchandiseAddon, WorkshopAddon } from 'src/types/addon'
import type { Session } from 'src/types/session'
import type { WizardStep } from 'src/composables/useWizardNavigation'
import { isShippingAddressRequired } from 'src/utils/registrationRules'
import { findConflictingIds } from 'src/utils/timeConflicts'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Lenient on purpose — digits/spaces/+-() only, at least 7 characters. Not
// tied to one country's format (the mock data/README don't specify one).
const PHONE_PATTERN = /^[0-9+\-() ]{7,}$/

/** One boolean per Step 1 field — `true` means that field is currently invalid. Includes `ticketType` (not part of `AttendeeInfo`, but conceptually "Step 1 is incomplete" the same way). */
export interface AttendeeFieldErrors {
  fullName: boolean
  email: boolean
  phone: boolean
  company: boolean
  jobTitle: boolean
  shippingAddress: boolean
  ticketType: boolean
}

/** One human-readable line for the Review page's error summary banner. */
export interface ValidationMessage {
  step: WizardStep
  message: string
}

/** One message per currently-failing attendee field — absent (not just empty string) for fields that are valid. */
export type AttendeeFieldMessages = Partial<Record<keyof AttendeeFieldErrors, string>>

/** The full result of validating a registration, granular enough to drive both step-level (stepper) and field-level (form/review) error UI. */
export interface ValidationResult {
  attendeeErrors: AttendeeFieldErrors
  /** Human-readable per-field message, e.g. for a field's own inline error text — same wording `messages` builds its Step 1 lines from. */
  attendeeFieldMessages: AttendeeFieldMessages
  /** Ids of selected sessions that overlap another selected session. */
  sessionConflictIds: Set<string>
  /** Ids of selected workshops that overlap another selected workshop or a selected session. */
  workshopConflictIds: Set<string>
  /** Merchandise addon ids that have a required size (`addon.sizes`) but none chosen. */
  merchandiseSizeErrors: Set<string>
  /** Steps with at least one failing check, in step order. */
  errorSteps: WizardStep[]
  /** One line per failing check, in the same order as errorSteps — feeds the Review page's "fix the following errors" banner. */
  messages: ValidationMessage[]
  isValid: boolean
}

// ReadonlySet, not Set, for the id fields — this only ever calls `.has()`
// (read-only usage), and callers pass the readonly()-wrapped store state, so
// a mutable Set type wouldn't be assignable here anyway (same reasoning as
// calculateOrderSummary.ts's RelevantState).
interface RelevantState {
  attendee: RegistrationState['attendee']
  ticketTypeId: RegistrationState['ticketTypeId']
  selectedSessionIds: ReadonlySet<string>
  selectedWorkshopIds: ReadonlySet<string>
  merchandiseSelections: RegistrationState['merchandiseSelections']
}

/**
 * Validates Step 1: all required attendee strings must be non-empty, email
 * and phone must additionally match a basic format, shippingAddress is only
 * required when `isShippingAddressRequired`, and a ticket type must be
 * selected.
 * @param state - The current registration state (attendee/ticketTypeId/merchandiseSelections — the latter only to resolve whether shipping is required).
 * @returns One boolean per field — `true` means that field is invalid.
 */
function validateAttendee(state: RelevantState): AttendeeFieldErrors {
  const { fullName, email, phone, company, jobTitle, shippingAddress } = state.attendee
  return {
    fullName: fullName.trim().length === 0,
    email: email.trim().length === 0 || !EMAIL_PATTERN.test(email.trim()),
    phone: phone.trim().length === 0 || !PHONE_PATTERN.test(phone.trim()),
    company: company.trim().length === 0,
    jobTitle: jobTitle.trim().length === 0,
    shippingAddress: isShippingAddressRequired(state) && shippingAddress.trim().length === 0,
    ticketType: state.ticketTypeId === null,
  }
}

/**
 * Finds selected merchandise items that offer sizes but don't have one
 * chosen yet. Needs the addon catalog (not just `merchandiseSelections`)
 * since only items with `addon.sizes` require a size in the first place.
 * @param state - The current registration state (`merchandiseSelections`).
 * @param addons - The full add-on catalog, to resolve which selected items require a size.
 * @returns The addon ids missing a required size.
 */
function findMerchandiseSizeErrors(state: Pick<RegistrationState, 'merchandiseSelections'>, addons: Addon[]): Set<string> {
  const merchandiseById = new Map(
    addons
      .filter((addon): addon is MerchandiseAddon => addon.category === 'merchandise')
      .map(addon => [addon.id, addon] as const),
  )
  const missing = Object.entries(state.merchandiseSelections)
    .filter(([addonId, selection]) => {
      const item = merchandiseById.get(addonId)
      return !!item?.sizes && !selection.size
    })
    .map(([addonId]) => addonId)
  return new Set(missing)
}

/**
 * Finds selected sessions that overlap another selected session. The Step 2
 * UI already disables cards that would create a conflict, so this can only
 * ever fire from state that bypassed the UI (e.g. sessionStorage edited
 * directly) — checked anyway per the README's explicit "time-conflict
 * validation is deferred to Step 4 submit time" requirement.
 * @param state - The current registration state (`selectedSessionIds`).
 * @param sessions - The full session catalog, to resolve ids into time ranges.
 * @returns The ids of selected sessions that conflict with another selected session.
 */
function findSessionConflicts(state: Pick<RelevantState, 'selectedSessionIds'>, sessions: Session[]): Set<string> {
  const selectedSessions = sessions.filter(session => state.selectedSessionIds.has(session.id))
  return findConflictingIds(selectedSessions, selectedSessions)
}

/**
 * Finds selected workshops that overlap another selected workshop or a
 * selected session — the same union `AddonsSelection.vue` already computes
 * for its own live UI, just against the *selected* sets only (not the whole
 * catalog, since this only needs to know whether the current selection is
 * internally consistent, not which other cards to disable). Same
 * unreachable-via-normal-use caveat as `findSessionConflicts`.
 * @param state - The current registration state (`selectedWorkshopIds`, `selectedSessionIds`).
 * @param sessions - The full session catalog.
 * @param addons - The full add-on catalog, to resolve workshop ids into time ranges.
 * @returns The ids of selected workshops that conflict with another selected workshop or session.
 */
function findWorkshopConflicts(
  state: Pick<RelevantState, 'selectedWorkshopIds' | 'selectedSessionIds'>,
  sessions: Session[],
  addons: Addon[],
): Set<string> {
  const selectedWorkshops = addons.filter(
    (addon): addon is WorkshopAddon => addon.category === 'workshop' && state.selectedWorkshopIds.has(addon.id),
  )
  const selectedSessions = sessions.filter(session => state.selectedSessionIds.has(session.id))
  const workshopVsWorkshop = findConflictingIds(selectedWorkshops, selectedWorkshops)
  const workshopVsSession = findConflictingIds(selectedWorkshops, selectedSessions)
  return new Set([...workshopVsWorkshop, ...workshopVsSession])
}

/**
 * Builds one message per conflicting session or workshop.
 * @param step - Which step these conflicts belong to (2 for sessions, 3 for workshops).
 * @param conflictIds - The result of `findSessionConflicts`/`findWorkshopConflicts`.
 * @param items - The catalog (sessions or workshops) to resolve each id's display name from.
 * @returns One message per conflicting item.
 */
function buildConflictMessages(
  step: WizardStep,
  conflictIds: Set<string>,
  items: { id: string; title?: string; name?: string }[],
): ValidationMessage[] {
  const nameById = new Map(items.map(item => [item.id, item.title ?? item.name ?? 'Selected item']))
  return [...conflictIds].map(id => ({
    step,
    message: `"${nameById.get(id) ?? 'Selected item'}" overlaps with another selection`,
  }))
}

/**
 * Builds one human-readable message per failing attendee field, from the
 * already-computed `attendeeErrors` — re-derives only the email case,
 * since that's the one field with two distinct failure reasons (missing
 * vs. wrong format) that a single boolean can't distinguish. Deliberately
 * independent of each field's display `label` (which can carry a `*` or
 * `(Optional)` suffix meant for the form, not for embedding in a sentence)
 * — this is the one source of truth both the Review banner and each
 * field's own inline error text read from.
 * @param state - The current registration state (`attendee`).
 * @param attendeeErrors - The result of `validateAttendee`.
 * @returns One message per failing field, keyed by field name.
 */
function buildAttendeeFieldMessages(state: RelevantState, attendeeErrors: AttendeeFieldErrors): AttendeeFieldMessages {
  const messages: AttendeeFieldMessages = {}
  if (attendeeErrors.fullName) messages.fullName = 'Full name is required'
  if (attendeeErrors.email) {
    messages.email = state.attendee.email.trim().length === 0 ? 'Email is required' : 'Email format is invalid'
  }
  if (attendeeErrors.phone) {
    messages.phone = state.attendee.phone.trim().length === 0 ? 'Phone number is required' : 'Phone number format is invalid'
  }
  if (attendeeErrors.company) messages.company = 'Company is required'
  if (attendeeErrors.jobTitle) messages.jobTitle = 'Job title is required'
  if (attendeeErrors.shippingAddress) messages.shippingAddress = 'Shipping address is required for merchandise orders'
  if (attendeeErrors.ticketType) messages.ticketType = 'Please select a ticket type'
  return messages
}

/**
 * Builds one message per merchandise item missing a required size, from
 * the already-computed `merchandiseSizeErrors` ids.
 * @param merchandiseSizeErrors - The result of `findMerchandiseSizeErrors`.
 * @param addons - The full add-on catalog, to resolve each id's display name.
 * @returns One Step 3 message per item missing a size.
 */
function buildMerchandiseMessages(merchandiseSizeErrors: Set<string>, addons: Addon[]): ValidationMessage[] {
  const nameById = new Map(addons.map(addon => [addon.id, addon.name]))
  return [...merchandiseSizeErrors].map(addonId => ({
    step: 3,
    message: `${nameById.get(addonId) ?? 'Selected item'} requires a size selection`,
  }))
}

/**
 * Unified Step 4 submit-time validation: Step 1's attendee fields, Step 2
 * session conflicts, Step 3's workshop conflicts and merchandise size
 * requirement. The conflict re-checks can only ever fire from state that
 * bypassed the Step 2/3 UI (which already disables cards that would create
 * one) — kept anyway for README/spec compliance ("time-conflict validation
 * is deferred to Step 4 submit time") and as defense-in-depth against a
 * future UI bug.
 * @param state - The current registration state.
 * @param sessions - The full session catalog, needed to resolve session/workshop conflicts.
 * @param addons - The full add-on catalog, needed to resolve workshop conflicts and merchandise size requirements.
 * @returns The granular per-field/per-step result, plus overall validity.
 */
export function validateRegistration(state: RelevantState, sessions: Session[], addons: Addon[]): ValidationResult {
  const attendeeErrors = validateAttendee(state)
  const attendeeFieldMessages = buildAttendeeFieldMessages(state, attendeeErrors)
  const sessionConflictIds = findSessionConflicts(state, sessions)
  const workshopConflictIds = findWorkshopConflicts(state, sessions, addons)
  const merchandiseSizeErrors = findMerchandiseSizeErrors(state, addons)

  const errorSteps: WizardStep[] = []
  if (Object.values(attendeeErrors).some(Boolean)) errorSteps.push(1)
  if (sessionConflictIds.size > 0) errorSteps.push(2)
  if (workshopConflictIds.size > 0 || merchandiseSizeErrors.size > 0) errorSteps.push(3)

  const messages: ValidationMessage[] = [
    ...Object.values(attendeeFieldMessages).map(message => ({ step: 1 as const, message })),
    ...buildConflictMessages(2, sessionConflictIds, sessions),
    ...buildConflictMessages(3, workshopConflictIds, addons),
    ...buildMerchandiseMessages(merchandiseSizeErrors, addons),
  ]

  return {
    attendeeErrors,
    attendeeFieldMessages,
    sessionConflictIds,
    workshopConflictIds,
    merchandiseSizeErrors,
    errorSteps,
    messages,
    isValid: errorSteps.length === 0,
  }
}
