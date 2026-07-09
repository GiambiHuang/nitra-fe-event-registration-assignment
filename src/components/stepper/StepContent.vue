<script setup lang="ts">
import { ref, watch } from 'vue'
import { useWizardNavigation } from 'src/composables/useWizardNavigation'

const { state } = useWizardNavigation()

const scrollContainer = ref<HTMLElement | null>(null)

// The scrollable middle stays mounted across step changes — only its
// slotted content swaps — so scroll position doesn't reset on its own.
// Left scrolled down on Step 2 would otherwise land Step 3 already
// scrolled. See journal 05.
watch(
  () => state.currentStep,
  () => {
    if (scrollContainer.value) scrollContainer.value.scrollTop = 0
  },
)
</script>

<template>
  <div
    ref="scrollContainer"
    class="flex-1 min-h-0 overflow-y-auto w-full"
  >
    <div class="page-container mx-auto py-10">
      <Transition
        name="fade"
        mode="out-in"
      >
        <slot />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
