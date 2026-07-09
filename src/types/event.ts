/** A single conference ticket tier, as defined in `src/mocks/event.js`. */
export interface TicketType {
  id: string
  name: string
  price: number
  description: string
  perks: string[]
}

/** Static conference metadata, as defined in `src/mocks/event.js`. */
export interface EventInfo {
  id: string
  name: string
  description: string
  /** ISO date strings, one per conference day. */
  dates: string[]
  venue: {
    name: string
    address: string
  }
  ticketTypes: TicketType[]
}
