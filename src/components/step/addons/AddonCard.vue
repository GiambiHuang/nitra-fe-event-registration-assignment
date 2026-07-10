<script setup lang="ts">
import { computed } from 'vue'
import type { MealAddon, WorkshopAddon } from 'src/types/addon'
import { formatCurrency } from 'src/utils/formatCurrency'
import { formatSessionTimeRange, formatSessionDate } from 'src/utils/formatSessionTime'

const { addon, selected, hasConflict = false } = defineProps<{
  addon: WorkshopAddon | MealAddon
  selected: boolean
  /** Workshops only — whether this overlaps a selected session or another selected workshop. */
  hasConflict?: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const isFull = computed(() => addon.category === 'workshop' && addon.registered >= addon.capacity)
const isUnavailable = computed(() => isFull.value || hasConflict)
</script>

<template>
  <button
    type="button"
    :disabled="isUnavailable"
    class="flex flex-col gap-y-2 p-4 rounded-md border border-neutral-muted border-solid text-left shadow-card"
    :class="isUnavailable
      ? 'bg-surface-l2'
      : selected
        ? 'border-selected bg-brand-muted-rest cursor-pointer'
        : 'bg-surface-l0 cursor-pointer'"
    @click="emit('toggle')"
  >
    <div class="flex items-center justify-between">
      <span class="text-subtitle2 text-neutral">{{ addon.name }}</span>
      <span class="text-subtitle2 text-brand-emphasis">{{ formatCurrency(addon.price) }}</span>
    </div>
    <div class="text-body-sm text-neutral-muted">
      {{ addon.description }}
    </div>
    <template v-if="addon.category === 'workshop'">
      <div class="text-body-xs text-neutral-quiet">
        {{ formatSessionDate(addon.date) }}, {{ formatSessionTimeRange(addon.date, addon.endDate) }}
        <span
          v-if="hasConflict"
          class="text-danger"
        >
          (Time conflict)
        </span>
      </div>
      <div
        class="text-body-xs text-neutral-quiet"
        :class="{ 'font-semibold': isFull }"
      >
        {{ isFull ? 'Sold Out' : `${addon.capacity - addon.registered} spots remaining` }}
      </div>
    </template>
  </button>
</template>
