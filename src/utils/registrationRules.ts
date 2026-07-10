import type { RegistrationState } from 'src/types/registration'

/**
 * Shipping address becomes required once any merchandise item is selected
 * in Step 3 — otherwise it's optional. Shared by Step 1's label text and
 * Step 4's submit-time validation so the two can't drift apart.
 * @param state - The current registration state.
 * @returns Whether `shippingAddress` must be filled in to submit.
 */
export function isShippingAddressRequired(state: Pick<RegistrationState, 'merchandiseSelections'>): boolean {
  return Object.keys(state.merchandiseSelections).length > 0
}

/**
 * Whether every required Step 1 field is filled in. Shipping address only
 * counts when `isShippingAddressRequired` is true. Presence-only check (no
 * email/phone format validation yet) — Step 4's fuller validation is being
 * built incrementally on top of the review screen (see journal 09).
 * @param state - The current registration state.
 * @returns Whether the attendee form has everything required to submit.
 */
export function isAttendeeInfoComplete(state: Pick<RegistrationState, 'attendee' | 'merchandiseSelections'>): boolean {
  const { fullName, email, phone, company, jobTitle, shippingAddress } = state.attendee
  const requiredFields = [fullName, email, phone, company, jobTitle]
  if (isShippingAddressRequired(state)) {
    requiredFields.push(shippingAddress)
  }
  return requiredFields.every(field => field.trim().length > 0)
}
