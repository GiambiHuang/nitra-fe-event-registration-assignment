<script setup lang="ts">
import { useId } from 'vue'

const { label, placeholder, error = false, errorMessage = undefined } = defineProps<{
  label: string
  placeholder: string
  /** Shows the input with danger styling — driven by the caller's own validation state, this component just renders it. */
  error?: boolean
  /**
   * The inline error text shown below the input. Deliberately separate
   * from `label` — `label` can carry a form-only suffix (e.g. `Shipping
   * Address *`) that reads wrong once dropped into a sentence, so the
   * caller supplies the actual message instead of this component
   * building one from the label.
   */
  errorMessage?: string
}>()

const model = defineModel<string>()

const inputId = useId()
</script>

<template>
  <div class="flex flex-col gap-y-1.5">
    <label
      :for="inputId"
      class="text-body-sm-medium"
      :class="error ? 'text-danger' : 'text-neutral'"
    >
      {{ label }}
    </label>
    <input
      :id="inputId"
      v-model="model"
      type="text"
      class="text-neutral text-body-lg px-3 rounded-md bg-surface-l0 placeholder:text-neutral-quiet w-full appearance-none outline-none border border-solid h-[44px]"
      :class="error ? 'border-danger-emphasis' : 'border-neutral-muted focus:border-neutral-emphasis'"
      :placeholder="placeholder"
    >
    <div
      v-if="error && errorMessage"
      class="text-danger text-body-sm"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>
