import { createAsyncResource } from './useAsyncResource'
import { getAddons } from 'src/services'

/**
 * Fetches and caches every add-on (workshops, meals, merchandise), shared
 * across every caller (Step 3's selection, Step 4's review) via one
 * module-scoped cache. See `createAsyncResource` for the shared
 * loading/error/refetch/staleness behavior.
 */
export const useAddons = createAsyncResource(getAddons)
