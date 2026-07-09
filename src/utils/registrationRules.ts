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
