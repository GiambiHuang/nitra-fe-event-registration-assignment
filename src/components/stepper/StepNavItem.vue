<script setup lang="ts">
import type { StepWithStatus } from './types'

defineProps<{
  step: StepWithStatus
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    class="flex items-center gap-2.5 border-0 bg-transparent cursor-pointer p-0"
    :aria-current="step.status === 'active' ? 'step' : undefined"
    @click="emit('click')"
  >
    <div
      class="flex items-center justify-center size-8 rounded-full text-subtitle2"
      :class="step.iconClass"
    >
      <img
        v-if="step.status === 'error'"
        src="~assets/icons/exclamation-icon.svg"
        alt="error"
        class="w-[2px] h-auto"
      >
      <img
        v-else-if="step.status === 'complete'"
        src="~assets/icons/check-icon.svg"
        alt="check"
        class="w-[14px] h-auto"
      >
      <span v-else>{{ step.index }}</span>
    </div>
    <span
      class="max-lg:hidden"
      :class="step.labelClass"
    >
      {{ step.label }}
    </span>
  </button>
</template>
