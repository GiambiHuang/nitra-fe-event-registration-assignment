<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAddons } from 'src/composables/useAddons'
import { useSessions } from 'src/composables/useSessions'
import { useRegistrationStore } from 'src/composables/useRegistrationStore'
import { useWizardNavigation } from 'src/composables/useWizardNavigation'
import { useRegistrationValidation } from 'src/composables/useRegistrationValidation'
import { groupAddonsByCategory } from 'src/utils/groupAddonsByCategory'
import { findConflictingIds } from 'src/utils/timeConflicts'
import OrderSummary from 'src/components/order-summary/OrderSummary.vue'
import AddonCard from './AddonCard.vue'
import MerchandiseCard from './MerchandiseCard.vue'
import ShippingBanner from './ShippingBanner.vue'

const { resource: addonsResource } = useAddons()
const { resource: sessionsResource } = useSessions()
const { state, toggleWorkshop, toggleMeal, setMerchandiseQuantity, setMerchandiseSize } = useRegistrationStore()
const { state: navigationState } = useWizardNavigation()
const { result } = useRegistrationValidation()

// Only shown once a submit attempt has actually failed — same gating as
// Step 1's field errors.
const merchandiseSizeErrors = computed(() =>
  navigationState.hasAttemptedSubmit ? result.value.merchandiseSizeErrors : new Set<string>(),
)

const grouped = computed(() =>
  addonsResource.value.status === 'success'
    ? groupAddonsByCategory(addonsResource.value.data)
    : { workshops: [], meals: [], merchandise: [] },
)

// A workshop is unavailable if it overlaps a selected session (Step 2) or
// another selected workshop — README requires the former; the latter is the
// same rule applied to Step 3's own selections (see PLAN.md).
const conflictingWorkshopIds = computed(() => {
  const workshops = grouped.value.workshops
  const selectedWorkshops = workshops.filter(workshop => state.selectedWorkshopIds.has(workshop.id))
  const workshopVsWorkshop = findConflictingIds(workshops, selectedWorkshops)

  if (sessionsResource.value.status !== 'success') return workshopVsWorkshop
  const selectedSessions = sessionsResource.value.data.filter(session => state.selectedSessionIds.has(session.id))
  const workshopVsSession = findConflictingIds(workshops, selectedSessions)

  return new Set([...workshopVsWorkshop, ...workshopVsSession])
})

type Category = 'workshops' | 'meals' | 'merchandise'
const CATEGORIES: Category[] = ['workshops', 'meals', 'merchandise']
const CATEGORY_LABELS: Record<Category, string> = {
  workshops: 'Workshops',
  meals: 'Meal Packages',
  merchandise: 'Merchandise',
}
const activeCategory = ref<Category>('workshops')
</script>

<template>
  <div class="flex gap-8 items-start flex-col lg:flex-row">
    <div class="flex-1 max-lg:w-full">
      <div class="text-h3">
        Select Add-ons
      </div>

      <div v-if="addonsResource.status === 'loading'">
        Loading…
      </div>
      <div v-else-if="addonsResource.status === 'error'">
        Something went wrong loading add-ons.
      </div>
      <template v-else>
        <div class="inline-flex gap-1 p-1 mt-6 border-0 bg-surface-l2 rounded-[10px]">
          <button
            v-for="category in CATEGORIES"
            :key="category"
            type="button"
            class="flex items-center justify-center text-subtitle2 border-0 outline-0 h-8 px-4 rounded-lg cursor-pointer"
            :class="category === activeCategory ? 'bg-brand-emphasis-rest text-inverse' : 'text-neutral-muted'"
            @click="activeCategory = category"
          >
            {{ CATEGORY_LABELS[category] }}
          </button>
        </div>

        <ShippingBanner
          v-if="activeCategory === 'merchandise'"
          class="mt-6"
        />

        <div class="grid grid-cols-1 gap-4 mt-6">
          <template v-if="activeCategory === 'workshops'">
            <AddonCard
              v-for="workshop in grouped.workshops"
              :key="workshop.id"
              :addon="workshop"
              :selected="state.selectedWorkshopIds.has(workshop.id)"
              :has-conflict="conflictingWorkshopIds.has(workshop.id)"
              @toggle="toggleWorkshop(workshop.id)"
            />
          </template>
          <template v-else-if="activeCategory === 'meals'">
            <AddonCard
              v-for="meal in grouped.meals"
              :key="meal.id"
              :addon="meal"
              :selected="state.selectedMealIds.has(meal.id)"
              @toggle="toggleMeal(meal.id)"
            />
          </template>
          <template v-else>
            <MerchandiseCard
              v-for="item in grouped.merchandise"
              :key="item.id"
              :addon="item"
              :quantity="state.merchandiseSelections[item.id]?.quantity ?? 0"
              :size="state.merchandiseSelections[item.id]?.size"
              :has-size-error="merchandiseSizeErrors.has(item.id)"
              @quantity-change="quantity => setMerchandiseQuantity(item.id, quantity)"
              @size-change="size => setMerchandiseSize(item.id, size)"
            />
          </template>
        </div>
      </template>
    </div>

    <OrderSummary class="w-[360px] flex-shrink-0" />
  </div>
</template>
