import type { Addon, WorkshopAddon, MealAddon, MerchandiseAddon } from 'src/types/addon'

/** Add-ons split by category — the shape Step 3's category tabs consume directly. */
export interface AddonsByCategory {
  workshops: WorkshopAddon[]
  meals: MealAddon[]
  merchandise: MerchandiseAddon[]
}

/**
 * Splits the flat add-on list into its three categories, narrowing each
 * item to its specific variant of the `Addon` discriminated union.
 * @param addons - The full, ungrouped add-on list.
 * @returns The three category arrays; empty input gives three empty arrays.
 */
export function groupAddonsByCategory(addons: Addon[]): AddonsByCategory {
  const workshops: WorkshopAddon[] = []
  const meals: MealAddon[] = []
  const merchandise: MerchandiseAddon[] = []

  for (const addon of addons) {
    if (addon.category === 'workshop') workshops.push(addon)
    else if (addon.category === 'meal') meals.push(addon)
    else merchandise.push(addon)
  }

  return { workshops, meals, merchandise }
}
