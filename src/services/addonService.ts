import { addons } from 'src/mocks/addons.js'
import type { Addon } from 'src/types/addon'

/**
 * Fetches every add-on (workshops, meal packages, merchandise). Backed by
 * local mock data today; see `eventService.getEventInfo` for why this is
 * `async`.
 *
 * `Addon` is a discriminated union on `category`, and the plain .js mock
 * literal widens that field to `string` when TypeScript infers its export
 * type — the same widening `sessionService` narrows per-field, but a
 * distributive per-variant version of that fix isn't worth the extra utility
 * type for a fixed, already-inspected fixture. Cast once here instead; each
 * variant's shape was hand-verified against `src/types/addon.ts` when the
 * types were authored (see journal 03/04).
 * @returns All add-ons, ungrouped and unfiltered by category.
 */
export async function getAddons(): Promise<Addon[]> {
  return addons as Addon[]
}
