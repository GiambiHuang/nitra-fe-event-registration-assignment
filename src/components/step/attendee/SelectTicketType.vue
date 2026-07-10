<script setup lang="ts">
import { computed } from 'vue'
import { useEventInfo } from 'src/composables/useEventInfo'
import { useRegistrationStore } from 'src/composables/useRegistrationStore'
import { useWizardNavigation } from 'src/composables/useWizardNavigation'
import { useRegistrationValidation } from 'src/composables/useRegistrationValidation'
import TicketCard from './TicketCard.vue'

const { resource } = useEventInfo()
const { state, selectTicket } = useRegistrationStore()
const { state: navigationState } = useWizardNavigation()
const { result } = useRegistrationValidation()

const ticketTypes = computed(() => resource.value.status === 'success' ? resource.value.data.ticketTypes : [])

// Only shown once a submit attempt has actually failed — same gating as
// every other piece of Step 4's error UI.
const hasError = computed(() => navigationState.hasAttemptedSubmit && result.value.attendeeErrors.ticketType)
const errorMessage = computed(() => result.value.attendeeFieldMessages.ticketType)
</script>

<template>
  <div class="pb-8">
    <div class="text-subtitle1">
      Select Ticket Type
    </div>
    <div class="flex flex-col lg:flex-row items-start gap-4 mt-4">
      <TicketCard
        v-for="ticket in ticketTypes"
        :key="ticket.id"
        :ticket="ticket"
        :selected="ticket.id === state.ticketTypeId"
        @select="selectTicket(ticket.id)"
      />
    </div>
    <div
      v-if="hasError"
      class="text-danger text-body-sm mt-2"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>
