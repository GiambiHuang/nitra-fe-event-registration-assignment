<script setup lang="ts">
import { computed } from 'vue'
import ReviewSection from './ReviewSection.vue'
import { useRegistrationStore } from 'src/composables/useRegistrationStore'
import { useSessions } from 'src/composables/useSessions'
import { formatSessionDate, formatSessionTimeRange } from 'src/utils/formatSessionTime'
import type { Session } from 'src/types/session'

const { state } = useRegistrationStore()
const { resource } = useSessions()

// Sorted chronologically by start time, not selection order — a `Set`
// preserves insertion order, which isn't a meaningful order to review in.
const selectedSessions = computed(() => {
  if (resource.value.status !== 'success') return []

  const catalog = resource.value.data
  return Array.from(state.selectedSessionIds)
    .map(id => catalog.find(session => session.id === id))
    .filter((session): session is Session => session !== undefined)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(session => ({
      id: session.id,
      dateTime: `${formatSessionDate(session.date)}, ${formatSessionTimeRange(session.date, session.endDate)}`,
      title: session.title,
    }))
})
</script>

<template>
  <ReviewSection
    title="Selected Sessions"
    :step-index="2"
  >
    <div class="flex flex-col gap-y-3">
      <template v-if="selectedSessions.length > 0">
        <div
          v-for="session in selectedSessions"
          :key="session.id"
          class="flex flex-col md:flex-row items-start flex-nowrap gap-x-2 justify-between text-body-sm"
        >
          <span class="text-neutral-muted">{{ session.dateTime }}</span>
          <span class="text-neutral">{{ session.title }}</span>
        </div>
      </template>
      <template v-else>
        <div class="text-body-sm text-neutral-muted">
          -
        </div>
      </template>
    </div>
  </ReviewSection>
</template>
