import { createAsyncResource } from './useAsyncResource'
import { getSessions } from 'src/services'

/**
 * Fetches and caches every conference session, shared across every caller
 * (Step 2's selection, Step 4's conflict/summary display) via one
 * module-scoped cache. See `createAsyncResource` for the shared
 * loading/error/refetch/staleness behavior.
 */
export const useSessions = createAsyncResource(getSessions)
