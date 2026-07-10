<script setup lang="ts">
import { computed } from 'vue'
import { useWizardNavigation, type WizardStep } from 'src/composables/useWizardNavigation'
import { useRegistrationValidation } from 'src/composables/useRegistrationValidation'

const { goBack, goNext, markComplete, markSubmitAttempted, state } = useWizardNavigation()
const { result } = useRegistrationValidation()

const NEXT_LABELS: Record<WizardStep, string> = {
  1: 'Next: Session Selection',
  2: 'Next: Add-ons',
  3: 'Next: Review',
  4: 'Submit Registration',
}

const nextLabel = computed(() => NEXT_LABELS[state.currentStep])

// Only disabled once a submit attempt has actually failed — the button
// starts out clickable even on a blank form, matching the "no inline
// validation, everything runs at submit time" spec.
const isSubmitDisabled = computed(() => state.currentStep === 4 && state.hasAttemptedSubmit && !result.value.isValid)

/**
 * Advances to the next step, except on Step 4 where the button submits
 * instead. The first click always runs validation (`markSubmitAttempted`
 * turns on error display everywhere); only completes the registration if
 * it actually passes.
 */
function handleNext(): void {
  if (state.currentStep === 4) {
    markSubmitAttempted()
    if (result.value.isValid) {
      markComplete()
    }
    return
  }
  goNext()
}
</script>

<template>
  <div class="h-[72px] flex items-center justify-center flex-shrink-0 box-content border-0 border-t divider-default border-solid">
    <div class="flex items-center justify-between page-container box-border">
      <div class="flex-1 flex justify-start">
        <button
          v-show="state.currentStep > 1"
          class="bg-neutral-muted-rest border-0 text-subtitle2 text-neutral-muted h-10 px-4 rounded-[10px] cursor-pointer"
          @click="goBack"
        >
          Back
        </button>
      </div>
      <div class="flex-1 flex justify-end">
        <button
          class="bg-accent-emphasis-rest border-0 text-subtitle2 text-inverse h-10 px-4 rounded-[10px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isSubmitDisabled"
          @click="handleNext"
        >
          {{ nextLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
