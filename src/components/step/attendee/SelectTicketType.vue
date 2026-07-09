<script setup lang="ts">
import { computed } from 'vue'
import { useEventInfo } from 'src/composables/useEventInfo'
import { useRegistrationStore } from 'src/composables/useRegistrationStore'
import TicketCard from './TicketCard.vue'

const { resource } = useEventInfo()
const { state, selectTicket } = useRegistrationStore()

const ticketTypes = computed(() => resource.value.status === 'success' ? resource.value.data.ticketTypes : [])
</script>

<template>
  <div class="pb-8">
    <div class="text-subtitle1">
      Select Ticket Type
    </div>
    <div class="flex items-start gap-4 mt-4">
      <TicketCard
        v-for="ticket in ticketTypes"
        :key="ticket.id"
        :ticket="ticket"
        :selected="ticket.id === state.ticketTypeId"
        @select="selectTicket(ticket.id)"
      />
    </div>
  </div>
</template>
