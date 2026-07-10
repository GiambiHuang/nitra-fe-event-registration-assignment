<script setup lang="ts">
import type { MerchandiseAddon } from 'src/types/addon'
import { formatCurrency } from 'src/utils/formatCurrency'

const { addon, quantity, hasSizeError = false } = defineProps<{
  addon: MerchandiseAddon
  /** 0 means not selected — mirrors the store's own "quantity <= 0 removes the selection" rule. */
  quantity: number
  size: string | undefined
  /** True when this item is selected, offers sizes, but none is chosen — driven by the caller's validation state. */
  hasSizeError?: boolean
}>()

const emit = defineEmits<{
  quantityChange: [quantity: number]
  sizeChange: [size: string]
}>()

function increment(): void {
  emit('quantityChange', Math.min(quantity + 1, addon.maxQuantity))
}

function decrement(): void {
  emit('quantityChange', Math.max(quantity - 1, 0))
}
</script>

<template>
  <div
    class="flex flex-col gap-y-2 p-4 rounded-md border border-neutral-muted border-solid shadow-card"
    :class="quantity > 0 ? 'border-selected bg-brand-muted-rest' : 'bg-surface-l0'"
  >
    <div class="flex items-center justify-between">
      <span class="text-subtitle2">{{ addon.name }}</span>
      <span class="text-subtitle2">{{ formatCurrency(addon.price) }}</span>
    </div>
    <div class="text-body-sm text-neutral-muted">
      {{ addon.description }}
    </div>

    <div class="flex items-center gap-x-4">
      <div
        v-if="addon.sizes"
        class="flex items-center gap-x-2 text-body-sm"
      >
        <span class="text-neutral-muted font-medium500">Size:</span>
        <select
          :value="size"
          :disabled="quantity === 0"
          class="h-[27px] rounded-md border border-solid bg-surface-l0 px-2 outline-none font-medium500 disabled:text-neutral-disabled"
          :class="hasSizeError ? 'border-danger-emphasis' : 'border-neutral-muted'"
          @change="emit('sizeChange', ($event.target as HTMLSelectElement).value)"
        >
          <option
            value=""
            disabled
          >
            Size
          </option>
          <option
            v-for="option in addon.sizes"
            :key="option"
            :value="option"
          >
            {{ option }}
          </option>
        </select>
      </div>
      <div class="flex items-center gap-x-2 text-body-sm">
        <span class="text-neutral-muted font-medium500">Qty:</span>
        <button
          type="button"
          class="size-7 p-0 bg-transparent border-0 cursor-pointer disabled:cursor-not-allowed"
          :disabled="quantity <= 0"
          @click="decrement"
        >
          <img
            src="~/assets/icons/minus.svg"
            alt="minus"
          >
        </button>
        <span class="text-subtitle2 w-6 text-center">{{ quantity }}</span>
        <button
          type="button"
          class="size-7 p-0 bg-transparent border-0 cursor-pointer disabled:cursor-not-allowed"
          :disabled="quantity >= addon.maxQuantity"
          @click="increment"
        >
          <img
            src="~/assets/icons/plus.svg"
            alt="plus"
          >
        </button>
        <span class="text-neutral-quiet">max {{ addon.maxQuantity }}</span>
      </div>
    </div>
    <div
      v-if="quantity > 0"
      class="flex items-center gap-x-1 text-body-xs font-semibold text-success"
    >
      <svg
        class="w-2"
        width="16"
        height="13"
        viewBox="0 0 16 13"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 6.86669L5.9 12L15 1.00003"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span>Added to order</span>
    </div>
  </div>
</template>
