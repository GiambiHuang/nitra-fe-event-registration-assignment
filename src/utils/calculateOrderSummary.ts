import type { RegistrationState } from 'src/types/registration'
import type { EventInfo } from 'src/types/event'
import type { Addon, MealAddon, MerchandiseAddon, WorkshopAddon } from 'src/types/addon'

const VIP_TICKET_ID = 'vip'
const VIP_WORKSHOP_DISCOUNT_RATE = 0.1

/** One priced row in the order summary. */
export interface OrderLineItem {
  id: string
  label: string
  quantity: number
  unitPrice: number
  total: number
}

/**
 * The full, itemized order breakdown — shared by Step 3's live running total
 * and Step 4's itemized review (both required by the README). The VIP
 * workshop discount is its own line rather than folded into each workshop's
 * price, so the discount stays visible instead of silently changing the
 * per-item numbers.
 */
export interface OrderSummary {
  ticket: OrderLineItem | null
  workshops: OrderLineItem[]
  meals: OrderLineItem[]
  merchandise: OrderLineItem[]
  /** Positive amount subtracted from `subtotal` — 0 for non-VIP tickets. */
  workshopDiscount: number
  subtotal: number
  total: number
}

// ReadonlySet, not Set, for the id fields: this only ever calls `.has()` —
// read-only usage — and callers pass the readonly()-wrapped store state, so
// a mutable Set type wouldn't be assignable here anyway (see DaySection.vue
// for the same fix applied to Step 2).
interface RelevantState {
  ticketTypeId: RegistrationState['ticketTypeId']
  selectedWorkshopIds: ReadonlySet<string>
  selectedMealIds: ReadonlySet<string>
  merchandiseSelections: RegistrationState['merchandiseSelections']
}

/**
 * Computes the itemized order summary: ticket price, selected workshops/
 * meals/merchandise, the VIP 10% workshop discount, and the grand total.
 * Pure — takes the catalog data (`eventInfo`, `addons`) as arguments rather
 * than fetching, so it's reusable from any component that already has both
 * loaded (Step 3 and Step 4 each fetch independently via `useEventInfo`/
 * `useAddons`'s shared cache).
 * @param state - The current registration state (only the fields this needs).
 * @param eventInfo - Ticket type catalog, for the selected ticket's price.
 * @param addons - The full add-on catalog, for selected items' prices/details.
 * @returns The itemized summary; no selections yields empty line arrays and a 0 total.
 */
export function calculateOrderSummary(
  state: RelevantState,
  eventInfo: EventInfo,
  addons: Addon[],
): OrderSummary {
  const selectedTicket = eventInfo.ticketTypes.find(ticket => ticket.id === state.ticketTypeId)
  const ticket: OrderLineItem | null = selectedTicket
    ? {
        id: selectedTicket.id,
        label: selectedTicket.name,
        quantity: 1,
        unitPrice: selectedTicket.price,
        total: selectedTicket.price,
      }
    : null

  const workshops: OrderLineItem[] = addons
    .filter((addon): addon is WorkshopAddon => addon.category === 'workshop' && state.selectedWorkshopIds.has(addon.id))
    .map(workshop => ({ id: workshop.id, label: workshop.name, quantity: 1, unitPrice: workshop.price, total: workshop.price }))

  const meals: OrderLineItem[] = addons
    .filter((addon): addon is MealAddon => addon.category === 'meal' && state.selectedMealIds.has(addon.id))
    .map(meal => ({ id: meal.id, label: meal.name, quantity: 1, unitPrice: meal.price, total: meal.price }))

  const merchandiseById = new Map(
    addons
      .filter((addon): addon is MerchandiseAddon => addon.category === 'merchandise')
      .map(addon => [addon.id, addon] as const),
  )
  const merchandise: OrderLineItem[] = Object.entries(state.merchandiseSelections)
    .map(([addonId, selection]) => {
      const item = merchandiseById.get(addonId)
      if (!item) return null
      return {
        id: item.id,
        label: selection.size ? `${item.name} (${selection.size})` : item.name,
        quantity: selection.quantity,
        unitPrice: item.price,
        total: item.price * selection.quantity,
      }
    })
    .filter((line): line is OrderLineItem => line !== null)

  const workshopsSubtotal = workshops.reduce((sum, line) => sum + line.total, 0)
  const isVip = state.ticketTypeId === VIP_TICKET_ID
  const workshopDiscount = isVip ? workshopsSubtotal * VIP_WORKSHOP_DISCOUNT_RATE : 0

  const subtotal =
    (ticket?.total ?? 0) +
    workshopsSubtotal +
    meals.reduce((sum, line) => sum + line.total, 0) +
    merchandise.reduce((sum, line) => sum + line.total, 0)

  return {
    ticket,
    workshops,
    meals,
    merchandise,
    workshopDiscount,
    subtotal,
    total: subtotal - workshopDiscount,
  }
}
