<script setup lang="ts">
import type { TicketType } from 'src/types/event'

const { ticket, selected } = defineProps<{
  ticket: TicketType
  selected: boolean
}>()

const emit = defineEmits<{
  select: []
}>()
</script>

<template>
  <button
    type="button"
    class="flex max-lg:w-full flex-col gap-y-3 flex-1 p-5 rounded-md border border-neutral-muted border-solid cursor-pointer min-h-[288px] shadow-card"
    :class="{
      'border-selected bg-brand-muted-rest': selected,
      'bg-surface-l1': !selected
    }"
    @click="emit('select')"
  >
    <div class="flex items-center justify-between text-subtitle1 text-neutral">
      <span>{{ ticket.name }}</span>
      <span>${{ ticket.price }}</span>
    </div>
    <div class="text-body-sm text-neutral-muted text-left">
      {{ ticket.description }}
    </div>
    <div
      v-for="perk in ticket.perks"
      :key="perk"
      class="text-body-sm text-neutral-muted flex items-center gap-x-2"
    >
      <img
        src="~/assets/icons/circle-check.svg"
        alt="check-perk"
        class="size-3.5"
      >
      <span>{{ perk }}</span>
    </div>
    <div
      v-show="selected"
      class="flex-1 text-body-xs text-inverse font-medium flex items-end -mt-0.5"
    >
      <span class="bg-success-bold-rest rounded-full h-5 w-[78px] inline-flex items-center justify-center gap-x-1">
        <img
          src="~/assets/icons/check-icon.svg"
          alt="check"
          class="size-2"
        >
        <span>Selected</span>
      </span>
    </div>
  </button>
</template>