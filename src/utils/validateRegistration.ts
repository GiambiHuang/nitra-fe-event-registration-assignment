import type { RegistrationState } from 'src/types/registration'
import type { Addon, MerchandiseAddon } from 'src/types/addon'
import type { WizardStep } from 'src/composables/useWizardNavigation'
import { isShippingAddressRequired } from 'src/utils/registrationRules'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** One boolean per Step 1 field — `true` means that field is currently invalid. */
export interface AttendeeFieldErrors {
  fullName: boolean
  email: boolean
  phone: boolean
  company: boolean
  jobTitle: boolean
  shippingAddress: boolean
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
  /** Merchandise addon ids that have a required size (`addon.sizes`) but none chosen. */
  merchandiseSizeErrors: Set<string>
  /** Steps with at least one failing check, in step order. */
  errorSteps: WizardStep[]
  /** One line per failing check, in the same order as errorSteps — feeds the Review page's "fix the following errors" banner. */
  messages: ValidationMessage[]
  isValid: boolean
}

interface RelevantState {
  attendee: RegistrationState['attendee']
  merchandiseSelections: RegistrationState['merchandiseSelections']
}

/**
 * Validates Step 1's attendee fields: all required strings must be
 * non-empty, email must additionally match a basic format, and
 * shippingAddress is only required when `isShippingAddressRequired`. Phone
 * is presence-only — no format check (per spec, only email format matters).
 * @param state - The current registration state (attendee + merchandiseSelections, the latter only to resolve whether shipping is required).
 * @returns One boolean per field — `true` means that field is invalid.
 */
function validateAttendee(state: RelevantState): AttendeeFieldErrors {
  const { fullName, email, phone, company, jobTitle, shippingAddress } = state.attendee
  return {
    fullName: fullName.trim().length === 0,
    email: email.trim().length === 0 || !EMAIL_PATTERN.test(email.trim()),
    phone: phone.trim().length === 0,
    company: company.trim().length === 0,
    jobTitle: jobTitle.trim().length === 0,
    shippingAddress: isShippingAddressRequired(state) && shippingAddress.trim().length === 0,
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
  if (attendeeErrors.phone) messages.phone = 'Phone number is required'
  if (attendeeErrors.company) messages.company = 'Company is required'
  if (attendeeErrors.jobTitle) messages.jobTitle = 'Job title is required'
  if (attendeeErrors.shippingAddress) messages.shippingAddress = 'Shipping address is required for merchandise orders'
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
 * Unified Step 4 submit-time validation: Step 1's attendee fields and Step
 * 3's merchandise size requirement. Sessions (Step 2) and workshop
 * conflicts aren't re-checked here — the Step 2/3 UI already prevents
 * creating a conflicting selection in the first place.
 * @param state - The current registration state.
 * @param addons - The full add-on catalog, needed to resolve merchandise size requirements.
 * @returns The granular per-field/per-step result, plus overall validity.
 */
export function validateRegistration(state: RelevantState, addons: Addon[]): ValidationResult {
  const attendeeErrors = validateAttendee(state)
  const attendeeFieldMessages = buildAttendeeFieldMessages(state, attendeeErrors)
  const merchandiseSizeErrors = findMerchandiseSizeErrors(state, addons)

  const errorSteps: WizardStep[] = []
  if (Object.values(attendeeErrors).some(Boolean)) errorSteps.push(1)
  if (merchandiseSizeErrors.size > 0) errorSteps.push(3)

  const messages: ValidationMessage[] = [
    ...Object.values(attendeeFieldMessages).map(message => ({ step: 1 as const, message })),
    ...buildMerchandiseMessages(merchandiseSizeErrors, addons),
  ]

  return {
    attendeeErrors,
    attendeeFieldMessages,
    merchandiseSizeErrors,
    errorSteps,
    messages,
    isValid: errorSteps.length === 0,
  }
}
