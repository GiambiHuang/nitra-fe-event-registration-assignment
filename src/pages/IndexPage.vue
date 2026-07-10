<script setup lang="ts">
import { computed } from 'vue'
import Success from 'src/components/result/Success.vue'
import StepContent from 'src/components/stepper/StepContent.vue'
import WizardStepper from 'src/components/stepper/WizardStepper.vue'
import WizardFooter from 'src/components/stepper/WizardFooter.vue'
import AttendeeInfo from 'src/components/step/attendee/AttendeeInfo.vue'
import SessionSelection from 'src/components/step/sessions/SessionSelection.vue'
import AddonsSelection from 'src/components/step/addons/AddonsSelection.vue'
import ReviewRegistration from 'src/components/step/review/ReviewRegistration.vue'
import { useWizardNavigation } from 'src/composables/useWizardNavigation'
import { useRegistrationValidation } from 'src/composables/useRegistrationValidation'

const { state, goToStep } = useWizardNavigation()
const { result } = useRegistrationValidation()

// Only shown once a submit attempt has actually failed — see
// useWizardNavigation's hasAttemptedSubmit doc.
const errorSteps = computed(() => (state.hasAttemptedSubmit ? result.value.errorSteps : []))
</script>

<template>
  <Success v-if="state.isComplete" />
  <div
    v-else
    class="h-full flex flex-col"
  >
    <WizardStepper
      :current-step="state.currentStep"
      :error-steps="errorSteps"
      @change="goToStep"
    />
    <StepContent>
      <AttendeeInfo v-if="state.currentStep === 1" />
      <SessionSelection v-else-if="state.currentStep === 2" />
      <AddonsSelection v-else-if="state.currentStep === 3" />
      <ReviewRegistration v-else />
    </StepContent>
    <WizardFooter />
  </div>
</template>
