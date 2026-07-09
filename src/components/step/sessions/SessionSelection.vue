<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSessions } from 'src/composables/useSessions'
import { useRegistrationStore } from 'src/composables/useRegistrationStore'
import { groupSessionsByDate } from 'src/utils/groupSessionsByDate'
import { formatSessionDate } from 'src/utils/formatSessionTime'
import { findConflictingIds } from 'src/utils/timeConflicts'
import DaySection from './DaySection.vue'

const { resource } = useSessions()
const { state, toggleSession } = useRegistrationStore()

const sessionsByDate = computed(() =>
  resource.value.status === 'success' ? groupSessionsByDate(resource.value.data) : [],
)

// Checked against every session, not just the active day's — conflicts
// can't actually cross a calendar day in this dataset, but there's no
// reason to couple the check to which tab happens to be open.
const conflictingSessionIds = computed(() => {
  if (resource.value.status !== 'success') return new Set<string>()
  const allSessions = resource.value.data
  const selectedSessions = allSessions.filter(session => state.selectedSessionIds.has(session.id))
  return findConflictingIds(allSessions, selectedSessions)
})

const activeDate = ref<string>()

// Default to the first day once sessions load — there's nothing to select
// before that, and landing on Day 1 reads better than no tab being active.
watch(sessionsByDate, groups => {
  if (activeDate.value === undefined && groups.length > 0) {
    activeDate.value = groups[0]?.date
  }
})

const activeGroup = computed(() => sessionsByDate.value.find(group => group.date === activeDate.value))
</script>

<template>
  <div>
    <div class="text-h3">
      Select Sessions
    </div>

    <div v-if="resource.status === 'loading'">
      Loading…
    </div>
    <div v-else-if="resource.status === 'error'">
      Something went wrong loading sessions.
    </div>
    <template v-else>
      <div class="inline-flex gap-1 p-1 mt-6 border-0 bg-surface-l2 rounded-[10px]">
        <button
          v-for="group in sessionsByDate"
          :key="group.date"
          type="button"
          class="flex items-center justify-center text-subtitle2 border-0 outline-0 font-[13px] h-8 w-[83px] rounded-lg cursor-pointer"
          :class="group.date === activeDate ? 'bg-brand-emphasis-rest text-inverse' : 'border-transparent text-neutral-muted'"
          @click="activeDate = group.date"
        >
          {{ formatSessionDate(group.date) }}
        </button>
      </div>

      <div class="my-6 text-body-sm-medium text-brand-emphasis">
        {{ state.selectedSessionIds.size }} {{ state.selectedSessionIds.size === 1 ? 'session' : 'sessions' }} selected
      </div>

      <DaySection
        v-if="activeGroup"
        class="mt-8"
        :sessions="activeGroup.sessions"
        :selected-session-ids="state.selectedSessionIds"
        :conflicting-session-ids="conflictingSessionIds"
        @toggle="toggleSession"
      />
    </template>
  </div>
</template>
