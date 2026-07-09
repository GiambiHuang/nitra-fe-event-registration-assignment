import { createAsyncResource } from './useAsyncResource'
import { getEventInfo } from 'src/services'

/**
 * Fetches and caches the conference's static metadata (event info + ticket
 * types), shared across every caller (Step 1, Step 3's VIP check, Step 4's
 * review) via one module-scoped cache. See `createAsyncResource` for the
 * shared loading/error/refetch/staleness behavior.
 */
export const useEventInfo = createAsyncResource(getEventInfo)
