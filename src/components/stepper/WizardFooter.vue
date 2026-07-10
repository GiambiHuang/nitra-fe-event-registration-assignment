<script setup lang="ts">
import { computed } from 'vue'
import { useWizardNavigation, type WizardStep } from 'src/composables/useWizardNavigation'
import { useRegistrationStore } from 'src/composables/useRegistrationStore'
import { isAttendeeInfoComplete } from 'src/utils/registrationRules'

const { goBack, goNext, markComplete, state } = useWizardNavigation()
const { state: registrationState } = useRegistrationStore()

const NEXT_LABELS: Record<WizardStep, string> = {
  1: 'Next: Session Selection',
  2: 'Next: Add-ons',
  3: 'Next: Review',
  4: 'Submit Registration',
}

const nextLabel = computed(() => NEXT_LABELS[state.currentStep])

/**
 * Advances to the next step, except on Step 4 where the button submits
 * instead — gated on attendee info being complete. Silently blocked if
 * not (no error UI yet, see journal 09 for the fuller validation planned
 * on top of this).
 */
function handleNext(): void {
  if (state.currentStep === 4) {
    if (isAttendeeInfoComplete(registrationState)) {
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
          class="bg-accent-emphasis-rest border-0 text-subtitle2 text-inverse h-10 px-4 rounded-[10px] cursor-pointer"
          @click="handleNext"
        >
          {{ nextLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
