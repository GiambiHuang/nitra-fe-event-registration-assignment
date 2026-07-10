<script setup lang="ts">
import { useWizardNavigation, type WizardStep } from 'src/composables/useWizardNavigation'


const { title, stepIndex } = defineProps<{
  title: string
  stepIndex: WizardStep
}>()
const { goToStep } = useWizardNavigation();
</script>

<template>
  <div class="border-1 border-neutral-muted border-solid p-5 rounded-md bg-surface-l1">
    <div class="flex items-center justify-between mb-3">
      <span class="text-subtitle1">{{ title }}</span>
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