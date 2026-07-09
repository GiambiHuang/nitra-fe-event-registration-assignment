<script setup lang="ts">
import { computed } from 'vue'
import { useRegistrationStore } from 'src/composables/useRegistrationStore'
import { useEventInfo } from 'src/composables/useEventInfo'
import { useAddons } from 'src/composables/useAddons'
import { calculateOrderSummary } from 'src/utils/calculateOrderSummary'
import { formatCurrency } from 'src/utils/formatCurrency'

const { state } = useRegistrationStore()
const { resource: eventResource } = useEventInfo()
const { resource: addonsResource } = useAddons()

// Both resources load independently (separate module-scoped caches) —
// summary only computes once both have actually resolved, rather than
// juggling two loading/error states in the template.
const summary = computed(() => {
  if (eventResource.value.status !== 'success' || addonsResource.value.status !== 'success') return null
  return calculateOrderSummary(state, eventResource.value.data, addonsResource.value.data)
})
</script>

<template>
  <div class="p-6 rounded-md border border-neutral-muted border-solid bg-surface-l1 max-lg:w-full">
    <div class="text-subtitle1">
      Order Summary
    </div>

    <div
      v-if="!summary"
      class="mt-4 text-body-sm text-neutral-muted"
    >
      Loading…
    </div>
    <div
      v-else
      class="flex flex-col gap-y-4 mt-4"
    >
      <div
        v-if="summary.ticket"
        class="flex items-center justify-between text-body-sm text-neutral-muted"
      >
        <span>{{ summary.ticket.label }} Ticket</span>
        <span>{{ formatCurrency(summary.ticket.total) }}</span>
      </div>

      <div
        v-for="line in summary.workshops"
        :key="line.id"
        class="flex items-center justify-between text-body-sm text-neutral-muted"
      >
        <span>{{ line.label }}</span>
        <span>{{ formatCurrency(line.total) }}</span>
      </div>

      <div
        v-for="line in summary.meals"
        :key="line.id"
        class="flex items-center justify-between text-body-sm text-neutral-muted"
      >
        <span>{{ line.label }}</span>
        <span>{{ formatCurrency(line.total) }}</span>
      </div>

      <div
        v-for="line in summary.merchandise"
        :key="line.id"
        class="flex items-center justify-between text-body-sm text-neutral-muted"
      >
        <span>{{ line.label }} × {{ line.quantity }}</span>
        <span>{{ formatCurrency(line.total) }}</span>
      </div>

      <div
        v-if="summary.workshopDiscount > 0"
        class="flex items-center justify-between text-body-xs text-brand-emphasis"
      >
        <span>Workshop Discount (VIP 10%)</span>
        <span>-{{ formatCurrency(summary.workshopDiscount) }}</span>
      </div>

      <div class="border-0 border-t border-solid divider-default pt-4 flex items-center justify-between text-body-sm-medium">
        <span>Total</span>
        <span>{{ formatCurrency(summary.total) }}</span>
      </div>
    </div>
  </div>
</template>
