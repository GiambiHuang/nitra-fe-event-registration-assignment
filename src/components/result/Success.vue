<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRegistrationStore } from 'src/composables/useRegistrationStore'
import { useWizardNavigation } from 'src/composables/useWizardNavigation'
import { useEventInfo } from 'src/composables/useEventInfo'

const { state: registrationState, clearPersistedRegistration, resetRegistration } = useRegistrationStore()
const { clearPersistedNavigation, resetNavigation } = useWizardNavigation()
const { resource } = useEventInfo()

const selectedTicketName = computed(() =>
  resource.value.status === 'success'
    ? resource.value.data.ticketTypes.find(ticket => ticket.id === registrationState.ticketTypeId)?.name
    : undefined,
)

// Clears the persisted copies only — this screen still needs the
// in-memory attendee/ticket data to display below, but a refresh from
// here should start the wizard over instead of resurrecting the
// just-submitted registration.
onMounted(() => {
  clearPersistedRegistration()
  clearPersistedNavigation()
})

/** Leaving the success screen for good: unlike the mount-time clear above, this also blanks the in-memory state so the wizard re-renders fresh at Step 1. */
function handleBackToHome(): void {
  resetRegistration()
  resetNavigation()
}
</script>

<template>
  <div class="h-full flex flex-col items-center justify-center gap-4">
    <div class="size-20 rounded-full bg-success-emphasis-rest flex items-center justify-center">
      <img
        src="~/assets/icons/check-icon.svg"
        class="w-9 h-auto"
        alt="success"
      >
    </div>
    <div class="text-h2 text-success">
      Registration Complete!
    </div>
    <div class="text-body-lg text-neutral">
      Confirmation #TC2025-47291
    </div>
    <div class="text-body-sm text-neutral-muted text-center">
      Thank you, {{ registrationState.attendee.fullName }}!
      Your {{ selectedTicketName ?? '' }} registration for TechConf 2025 is confirmed.
      <br>
      You will receive a confirmation email at {{ registrationState.attendee.email }}.
    </div>
    <button
      class="px-4 h-10 bg-accent-emphasis-rest text-white text-subtitle2 border-0 rounded-[10px] cursor-pointer"
      @click="handleBackToHome"
    >
      Back to Home
    </button>
  </div>
</template>
