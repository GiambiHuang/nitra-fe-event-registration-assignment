<script setup lang="ts">
import { computed } from 'vue'
import ReviewSection from './ReviewSection.vue'
import { useRegistrationStore } from 'src/composables/useRegistrationStore'
import { useAddons } from 'src/composables/useAddons'
import { useWizardNavigation } from 'src/composables/useWizardNavigation'
import { useRegistrationValidation } from 'src/composables/useRegistrationValidation'
import { formatCurrency } from 'src/utils/formatCurrency'
import type { MealAddon, MerchandiseAddon, WorkshopAddon } from 'src/types/addon'

const { state } = useRegistrationStore()
const { resource } = useAddons()
const { state: navigationState } = useWizardNavigation()
const { result } = useRegistrationValidation()

interface AddonRow {
  id: string
  label: string
  value: string
  /** Appended after `value` in danger color — `value` itself keeps its normal color even on an errored row. */
  errorNote?: string
}

// Only shown once a submit attempt has actually failed — same gating as
// Step 1's own form.
const merchandiseSizeErrors = computed(() =>
  navigationState.hasAttemptedSubmit ? result.value.merchandiseSizeErrors : new Set<string>(),
)
const hasAnyError = computed(() => merchandiseSizeErrors.value.size > 0)

// One flat list across all three add-on categories — same {label, value}
// row shape as the workshop-only version, just filtered/mapped per
// category like calculateOrderSummary.ts does for pricing.
const addonRows = computed<AddonRow[]>(() => {
  if (resource.value.status !== 'success') return []
  const addons = resource.value.data

  const workshops: AddonRow[] = addons
    .filter((addon): addon is WorkshopAddon => addon.category === 'workshop' && state.selectedWorkshopIds.has(addon.id))
    .map(addon => ({ id: addon.id, label: 'Workshop', value: `${addon.name} (${formatCurrency(addon.price)})` }))

  const meals: AddonRow[] = addons
    .filter((addon): addon is MealAddon => addon.category === 'meal' && state.selectedMealIds.has(addon.id))
    .map(addon => ({ id: addon.id, label: 'Meal', value: `${addon.name} (${formatCurrency(addon.price)})` }))

  const merchandiseById = new Map(
    addons
      .filter((addon): addon is MerchandiseAddon => addon.category === 'merchandise')
      .map(addon => [addon.id, addon] as const),
  )
  const merchandise: AddonRow[] = Object.entries(state.merchandiseSelections)
    .map(([addonId, selection]): AddonRow | null => {
      const item = merchandiseById.get(addonId)
      if (!item) return null
      const hasError = merchandiseSizeErrors.value.has(item.id)
      const sizeLabel = selection.size ? ` (${selection.size})` : ''
      return {
        id: item.id,
        label: 'Merchandise',
        value: `${item.name}${sizeLabel} × ${selection.quantity} (${formatCurrency(item.price * selection.quantity)})`,
        errorNote: hasError ? ' (required for size selection)' : undefined,
      }
    })
    .filter((row): row is AddonRow => row !== null)

  return [...workshops, ...meals, ...merchandise]
})
</script>

<template>
  <ReviewSection
    title="Add-ons"
    :step-index="3"
    :error="hasAnyError"
  >
    <div class="flex flex-col gap-y-3">
      <template v-if="addonRows.length > 0">
        <div
          v-for="row in addonRows"
          :key="row.id"
          class="flex items-start flex-nowrap gap-x-2 justify-between text-body-sm"
        >
          <span class="text-neutral-muted whitespace-nowrap">{{ row.label }}</span>
          <span class="text-right">
            <span class="text-neutral">{{ row.value }}</span>
            <span
              v-if="row.errorNote"
              class="text-danger"
            >{{ row.errorNote }}</span>
          </span>
        </div>
      </template>
      <template v-else>
        <div class="text-body-sm text-neutral-muted">
          -
        </div>
      </template>
    </div>
  </ReviewSection>
</template>
