<script setup lang="ts">
import { computed } from 'vue'
import { useWizardNavigation } from 'src/composables/useWizardNavigation'
import { useRegistrationValidation } from 'src/composables/useRegistrationValidation'

const { state: navigationState } = useWizardNavigation()
const { result } = useRegistrationValidation()

// Only shown once a submit attempt has actually failed — same gating as
// every other piece of Step 4's error UI.
const messages = computed(() => (navigationState.hasAttemptedSubmit ? result.value.messages : []))
</script>

<template>
  <div
    v-if="messages.length > 0"
    class="flex items-start gap-2 p-4 rounded-md border-danger-muted border-1 border-solid bg-danger-muted-rest text-body-sm"
  >
    <div class="flex-1 text-danger">
      <div class="text-body-sm-medium">
        Please fix the following errors before submitting
      </div>
      <ul class="mt-2 mb-0 pl-4 list-disc">
        <li
          v-for="(item, idx) in messages"
          :key="`${item.step}-${item.message}`"
          class="font-regular"
          :class="{ 'mt-2': idx > 0 }"
        >
          Step {{ item.step }}: {{ item.message }}
        </li>
      </ul>
    </div>
  </div>
</template>
