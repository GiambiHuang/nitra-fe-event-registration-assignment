<script setup lang="ts">
import { computed } from 'vue'
import FormInput from 'src/components/ui/FormInput.vue'
import { useRegistrationStore } from 'src/composables/useRegistrationStore'
import { useWizardNavigation } from 'src/composables/useWizardNavigation'
import { useRegistrationValidation } from 'src/composables/useRegistrationValidation'
import { isShippingAddressRequired } from 'src/utils/registrationRules'

const { state, setAttendeeField } = useRegistrationStore()
const { state: navigationState } = useWizardNavigation()
const { result } = useRegistrationValidation()

const requireShippingAddress = computed(() => isShippingAddressRequired(state))

// Only shown once a submit attempt has actually failed — matches the
// README's "no inline validation on this step" until then.
const attendeeErrors = computed(() =>
  navigationState.hasAttemptedSubmit ? result.value.attendeeErrors : null,
)
const attendeeFieldMessages = computed(() =>
  navigationState.hasAttemptedSubmit ? result.value.attendeeFieldMessages : null,
)
</script>

<template>
  <div>
    <div class="text-h3">
      Attendee Information
    </div>
    <div class="flex flex-col gap-y-5 mt-8">
      <div class="grid grid-cols-1 gap-y-5 gap-x-6 lg:grid-cols-2">
        <FormInput
          label="Full Name"
          placeholder="Enter your full name"
          :model-value="state.attendee.fullName"
          :error="!!attendeeErrors?.fullName"
          :error-message="attendeeFieldMessages?.fullName"
          @update:model-value="setAttendeeField('fullName', $event ?? '')"
        />
        <FormInput
          label="Email"
          placeholder="Enter your email"
          :model-value="state.attendee.email"
          :error="!!attendeeErrors?.email"
          :error-message="attendeeFieldMessages?.email"
          @update:model-value="setAttendeeField('email', $event ?? '')"
        />
        <FormInput
          label="Phone"
          placeholder="Enter your phone number"
          :model-value="state.attendee.phone"
          :error="!!attendeeErrors?.phone"
          :error-message="attendeeFieldMessages?.phone"
          @update:model-value="setAttendeeField('phone', $event ?? '')"
        />
        <FormInput
          label="Company"
          placeholder="Enter your company name"
          :model-value="state.attendee.company"
          :error="!!attendeeErrors?.company"
          :error-message="attendeeFieldMessages?.company"
          @update:model-value="setAttendeeField('company', $event ?? '')"
        />
      </div>
      <FormInput
        label="Job Title"
        placeholder="Enter your job title"
        :model-value="state.attendee.jobTitle"
        :error="!!attendeeErrors?.jobTitle"
        :error-message="attendeeFieldMessages?.jobTitle"
        @update:model-value="setAttendeeField('jobTitle', $event ?? '')"
      />
      <FormInput
        :label="requireShippingAddress ? 'Shipping Address *' : 'Shipping Address (Optional)'"
        placeholder="Enter your shipping address"
        :model-value="state.attendee.shippingAddress"
        :error="!!attendeeErrors?.shippingAddress"
        :error-message="attendeeFieldMessages?.shippingAddress"
        @update:model-value="setAttendeeField('shippingAddress', $event ?? '')"
      />
    </div>
  </div>
</template>
