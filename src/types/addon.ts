interface AddonBase {
  id: string
  name: string
  description: string
  price: number
}

/**
 * A workshop add-on. Has capacity and a UTC ISO time range, so it can sell
 * out and can conflict with a selected session (see journal 03 for the UTC
 * time-zone handling rule).
 */
export interface WorkshopAddon extends AddonBase {
  category: 'workshop'
  /** UTC ISO start timestamp. */
  date: string
  /** UTC ISO end timestamp. */
  endDate: string
  capacity: number
  registered: number
}

/** A meal package add-on. No capacity or time range — always selectable. */
export interface MealAddon extends AddonBase {
  category: 'meal'
}

/** A merchandise add-on. May offer sizes, and is bounded by `maxQuantity`. */
export interface MerchandiseAddon extends AddonBase {
  category: 'merchandise'
  sizes?: string[]
  maxQuantity: number
}

/**
 * An add-on from `src/mocks/addons.js`. Modeled as a discriminated union on
 * `category` so category-specific fields (capacity/date, sizes/maxQuantity)
 * narrow safely instead of being optional on every variant.
 */
export type Addon = WorkshopAddon | MealAddon | MerchandiseAddon

export type AddonCategory = Addon['category']
