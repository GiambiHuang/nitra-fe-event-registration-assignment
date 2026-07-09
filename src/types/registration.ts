/**
 * Step 1 attendee form fields. All plain strings (empty = not yet filled) —
 * Step 1 has no inline validation, everything is checked together at submit.
 */
export interface AttendeeInfo {
  fullName: string
  email: string
  phone: string
  company: string
  jobTitle: string
  /** Optional unless merchandise is selected in Step 3. */
  shippingAddress: string
}

/** A single merchandise line: how many, and which size (if the item has sizes). */
export interface MerchandiseSelection {
  quantity: number
  size?: string
}

/**
 * The full, mutable state of an in-progress registration, shared across all
 * 4 wizard steps via `useRegistrationStore`.
 */
export interface RegistrationState {
  attendee: AttendeeInfo
  /** Selected ticket type id (`ticketTypes[].id`), or `null` if none chosen yet. */
  ticketTypeId: string | null
  selectedSessionIds: Set<string>
  selectedWorkshopIds: Set<string>
  selectedMealIds: Set<string>
  /** Keyed by merchandise addon id. */
  merchandiseSelections: Record<string, MerchandiseSelection>
}
