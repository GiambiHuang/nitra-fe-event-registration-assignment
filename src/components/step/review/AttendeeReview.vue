<script setup lang="ts">
import { computed } from 'vue'
import ReviewSection from './ReviewSection.vue';
import { useRegistrationStore } from 'src/composables/useRegistrationStore'
import { useEventInfo } from 'src/composables/useEventInfo'
import { useWizardNavigation } from 'src/composables/useWizardNavigation'
import { useRegistrationValidation } from 'src/composables/useRegistrationValidation'
import { isShippingAddressRequired } from 'src/utils/registrationRules'
import { formatCurrency } from 'src/utils/formatCurrency'
import type { AttendeeFieldErrors } from 'src/utils/validateRegistration'

const { state } = useRegistrationStore()
const { resource } = useEventInfo()
const { state: navigationState } = useWizardNavigation()
const { result } = useRegistrationValidation()

const selectedTicket = computed(() =>
  resource.value.status === 'success'
    ? resource.value.data.ticketTypes.find(ticket => ticket.id === state.ticketTypeId)
    : undefined,
)

const requireShippingAddress = computed(() => isShippingAddressRequired(state))

// Only shown once a submit attempt has actually failed — same gating as
// Step 1's own form.
const attendeeErrors = computed(() =>
  navigationState.hasAttemptedSubmit ? result.value.attendeeErrors : null,
)
const hasAnyError = computed(() => !!attendeeErrors.value && Object.values(attendeeErrors.value).some(Boolean))

interface AttendeeField {
  label: string
  value: string
  errorKey?: keyof AttendeeFieldErrors
}

const fields = computed<AttendeeField[]>(() => {
  const base: AttendeeField[] = [
    { label: 'Name', value: state.attendee.fullName, errorKey: 'fullName' },
    { label: 'Email', value: state.attendee.email, errorKey: 'email' },
    { label: 'Phone', value: state.attendee.phone, errorKey: 'phone' },
    { label: 'Company', value: state.attendee.company, errorKey: 'company' },
    { label: 'Job Title', value: state.attendee.jobTitle, errorKey: 'jobTitle' },
    {
      label: 'Ticket Type',
      value: selectedTicket.value
        ? `${selectedTicket.value.name} (${formatCurrency(selectedTicket.value.price)})`
        : '—',
    },
  ]
  if (requireShippingAddress.value) {
    base.push({ label: 'Shipping Address', value: state.attendee.shippingAddress, errorKey: 'shippingAddress' })
  }
  return base
})

function isFieldInvalid(errorKey: keyof AttendeeFieldErrors | undefined): boolean {
  return !!errorKey && !!attendeeErrors.value?.[errorKey]
}

/**
 * A blank required field renders as empty text otherwise — swaps in a
 * placeholder that says what's missing, once that field is actually
 * invalid. Email is the one field that can be invalid while non-blank
 * (a bad format, not a missing value) — that case gets its own suffix
 * instead of the generic "(required)", which would be misleading since
 * the field isn't actually empty.
 */
function displayValue(field: AttendeeField): string {
  if (!isFieldInvalid(field.errorKey)) return field.value

  const isBlank = field.value.trim().length === 0
  if (isBlank) {
    return field.errorKey === 'shippingAddress' ? '— (required for merchandise)' : '— (required)'
  }
  if (field.errorKey === 'email') {
    return `${field.value} (invalid format)`
  }
  return `${field.value} (required)`
}
</script>

<template>
  <ReviewSection
    title="Attendee Information"
    :step-index="1"
    :error="hasAnyError"
  >
    <div class="flex flex-col gap-y-3">
      <div
        v-for="field in fields"
        :key="field.label"
        class="flex items-start flex-nowrap gap-x-2 justify-between text-body-sm"
      >
        <span class="text-neutral-muted whitespace-nowrap">{{ field.label }}</span>
        <span
          class="text-right"
          :class="isFieldInvalid(field.errorKey) ? 'text-danger' : 'text-neutral'"
        >{{ displayValue(field) }}</span>
      </div>
    </div>
  </ReviewSection>
</template>
