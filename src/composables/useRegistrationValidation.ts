import { computed, type ComputedRef } from 'vue'
import { useRegistrationStore } from 'src/composables/useRegistrationStore'
import { useAddons } from 'src/composables/useAddons'
import { useSessions } from 'src/composables/useSessions'
import { validateRegistration, type ValidationResult } from 'src/utils/validateRegistration'

/**
 * Reactive, live Step 4 validation result — recomputes on every relevant
 * state change (registration data, or the session/addon catalogs
 * resolving). Holds no state of its own, so every call site shares the
 * same underlying `useRegistrationStore`/`useSessions`/`useAddons` sources
 * and stays in sync without any explicit wiring. Whether errors are
 * actually *shown* anywhere is a separate concern (`useWizardNavigation`'s
 * `hasAttemptedSubmit`) — this always reflects the current data, valid or
 * not.
 * @returns `result`, the live `ValidationResult`.
 */
export function useRegistrationValidation(): { result: ComputedRef<ValidationResult> } {
  const { state } = useRegistrationStore()
  const { resource: sessionsResource } = useSessions()
  const { resource: addonsResource } = useAddons()

  const result = computed<ValidationResult>(() => {
    const sessions = sessionsResource.value.status === 'success' ? sessionsResource.value.data : []
    const addons = addonsResource.value.status === 'success' ? addonsResource.value.data : []
    return validateRegistration(state, sessions, addons)
  })

  return { result }
}
