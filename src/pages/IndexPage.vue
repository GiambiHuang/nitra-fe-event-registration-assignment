<script setup lang="ts">
import Success from 'src/components/review/Success.vue'
import StepContent from 'src/components/stepper/StepContent.vue'
import WizardStepper from 'src/components/stepper/WizardStepper.vue'
import WizardFooter from 'src/components/stepper/WizardFooter.vue'
import AttendeeInfo from 'src/components/step/attendee/AttendeeInfo.vue'
import SessionSelection from 'src/components/step/sessions/SessionSelection.vue'
import { useWizardNavigation } from 'src/composables/useWizardNavigation'

const { state, goToStep } = useWizardNavigation()
</script>

<template>
  <Success v-if="state.isComplete" />
  <div
    v-else
    class="h-full flex flex-col"
  >
    <WizardStepper
      :current-step="state.currentStep"
      :error-steps="[]"
      @change="goToStep"
    />
    <StepContent>
      <AttendeeInfo v-if="state.currentStep === 1" />
      <SessionSelection v-else-if="state.currentStep === 2" />
      <!-- Addons/Review added as each is built -->
    </StepContent>
    <WizardFooter />
  </div>
</template>
