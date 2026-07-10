<script setup lang="ts">
import { useWizardNavigation, type WizardStep } from 'src/composables/useWizardNavigation'


const { title, stepIndex, error = false } = defineProps<{
  title: string
  stepIndex: WizardStep
  /** Shows the section with a danger border — driven by the caller's own validation state. */
  error?: boolean
}>()
const { goToStep } = useWizardNavigation();
</script>

<template>
  <div
    class="border-1 border-solid p-5 rounded-md bg-surface-l1"
    :class="error ? 'border-error' : 'border-neutral-muted'"
  >
    <div class="flex items-center justify-between mb-3">
      <span
        class="text-subtitle1"
        :class="{ 'text-danger': error }"
      >{{ title }}</span>
      <button
        class="bg-transparent border-0 text-[var(--bg-brand-emphasis-active)] text-body-sm-medium font-semibold underline cursor-pointer"
        @click="goToStep(stepIndex)"
      >
        Edit → Step {{ stepIndex }}
      </button>
    </div>
    <slot />
  </div>
</template>