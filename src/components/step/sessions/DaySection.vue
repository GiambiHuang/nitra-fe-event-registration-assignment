<script setup lang="ts">
import type { Session } from 'src/types/session'
import SessionCard from './SessionCard.vue'

defineProps<{
  sessions: Session[]
  // ReadonlySet, not Set: this only ever calls `.has()` — read-only usage —
  // and `state.selectedSessionIds` from useRegistrationStore is itself
  // readonly()-wrapped, so a mutable Set type wouldn't be assignable here anyway.
  selectedSessionIds: ReadonlySet<string>
  conflictingSessionIds: ReadonlySet<string>
}>()

const emit = defineEmits<{
  toggle: [sessionId: string]
}>()
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    <SessionCard
      v-for="session in sessions"
      :key="session.id"
      :session="session"
      :selected="selectedSessionIds.has(session.id)"
      :has-conflict="conflictingSessionIds.has(session.id)"
      @select="emit('toggle', session.id)"
    />
  </div>
</template>
