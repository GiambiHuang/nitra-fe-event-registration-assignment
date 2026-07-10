<script setup lang="ts">
import { computed } from 'vue'
import { useRegistrationStore } from 'src/composables/useRegistrationStore'
import { useEventInfo } from 'src/composables/useEventInfo'
import { isShippingAddressRequired } from 'src/utils/registrationRules'
import { formatCurrency } from 'src/utils/formatCurrency'

const { state } = useRegistrationStore()
const { resource } = useEventInfo()

const selectedTicket = computed(() =>
  resource.value.status === 'success'
    ? resource.value.data.ticketTypes.find(ticket => ticket.id === state.ticketTypeId)
    : undefined,
)

const requireShippingAddress = computed(() => isShippingAddressRequired(state))

const fields = computed(() => {
  const base = [
    { label: 'Name', value: state.attendee.fullName },
    { label: 'Email', value: state.attendee.email },
    { label: 'Phone', value: state.attendee.phone },
    { label: 'Company', value: state.attendee.company },
    { label: 'Job Title', value: state.attendee.jobTitle },
    {
      label: 'Ticket Type',
      value: selectedTicket.value
        ? `${selectedTicket.value.name} (${formatCurrency(selectedTicket.value.price)})`
        : '—',
    },
  ]
  if (requireShippingAddress.value) {
    base.push({ label: 'Shipping Address', value: state.attendee.shippingAddress })
  }
  return base
})
</script>

<template>
  <div class="flex flex-col gap-y-3">
    <div
      v-for="field in fields"
      :key="field.label"
      class="flex items-center justify-between text-body-sm"
    >
      <span class="text-neutral-muted">{{ field.label }}</span>
      <span class="text-neutral">{{ field.value }}</span>
    </div>
  </div>
</template>
