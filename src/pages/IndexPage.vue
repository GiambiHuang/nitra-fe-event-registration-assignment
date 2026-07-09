<script setup lang="ts">
import Success from 'src/components/review/Success.vue'
import { useWizardNavigation } from 'src/composables/useWizardNavigation'

const { state, goBack, goNext } = useWizardNavigation()
</script>

<template>
  <Success v-if="state.isComplete" />
  <div
    v-else
    class="h-full flex flex-col"
  >
    <div class="flex items-center justify-center flex-shrink-0">
      <div class="page-container">
        Stepper
      </div>
    </div>
    <div class="flex items-center justify-center flex-1 min-h-0 overflow-y-auto w-full">
      <div class="page-container">
        Content
      </div>
    </div>
    <!-- Temporary, for verifying useWizardNavigation before StepContainer exists -->
    <div class="h-[72px] flex items-center justify-center flex-shrink-0 box-content border-0 border-t divider-default border-solid">
      <div class="flex items-center justify-between page-container box-border">
        <q-btn
          label="Back"
          @click="goBack"
        />
        <q-btn
          label="Next"
          @click="goNext"
        />
      </div>
    </div>
  </div>
</template>
