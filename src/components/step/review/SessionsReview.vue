<script setup lang="ts">
import { computed } from 'vue'
import { useRegistrationStore } from 'src/composables/useRegistrationStore'
import { useSessions } from 'src/composables/useSessions'
import { formatSessionDate, formatSessionTimeRange } from 'src/utils/formatSessionTime'

const { state } = useRegistrationStore()
const { resource } = useSessions();

const selectedSessions = computed(() => {
  if (resource.value.status !== 'success') return [];

  return Array.from(state.selectedSessionIds).map(id => {
    const session = resource.value.status === 'success' ? resource.value.data.find(session => session.id === id) : null;
    return {
      label: session?.date ? `${formatSessionDate(session.date)}, ${formatSessionTimeRange(session.date, session.endDate)}` : 'unknown',
      value: session?.title ?? 'unknown',
    }
  })
})
</script>

<template>
  <div class="flex flex-col gap-y-3">
    <div
      v-for="field in selectedSessions"
      :key="field.label"
      class="flex items-center justify-between text-body-sm"
    >
      <span class="text-neutral-muted">{{ field.label }}</span>
      <span class="text-neutral">{{ field.value }}</span>
    </div>
  </div>
</template>
