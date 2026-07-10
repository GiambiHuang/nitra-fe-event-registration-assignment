<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSessions } from 'src/composables/useSessions'
import { useAddons } from 'src/composables/useAddons'
import { useRegistrationStore } from 'src/composables/useRegistrationStore'
import { groupSessionsByDate } from 'src/utils/groupSessionsByDate'
import { formatSessionDate } from 'src/utils/formatSessionTime'
import { findConflictingIds } from 'src/utils/timeConflicts'
import type { WorkshopAddon } from 'src/types/addon'
import DaySection from './DaySection.vue'

const { resource } = useSessions()
const { resource: addonsResource } = useAddons()
const { state, toggleSession } = useRegistrationStore()

const sessionsByDate = computed(() =>
  resource.value.status === 'success' ? groupSessionsByDate(resource.value.data) : [],
)

// A session is in conflict if it overlaps another selected session, or a
// selected Step 3 workshop — the reverse of AddonsSelection.vue's workshop
// check. Without the workshop half, selecting a workshop that overlaps an
// unselected session left that session showing as available when it isn't.
const conflictingSessionIds = computed(() => {
  if (resource.value.status !== 'success') return new Set<string>()
  const allSessions = resource.value.data
  const selectedSessions = allSessions.filter(session => state.selectedSessionIds.has(session.id))
  const sessionVsSession = findConflictingIds(allSessions, selectedSessions)

  if (addonsResource.value.status !== 'success') return sessionVsSession
  const selectedWorkshops = addonsResource.value.data.filter(
    (addon): addon is WorkshopAddon => addon.category === 'workshop' && state.selectedWorkshopIds.has(addon.id),
  )
  const sessionVsWorkshop = findConflictingIds(allSessions, selectedWorkshops)

  return new Set([...sessionVsSession, ...sessionVsWorkshop])
})

const manuallySelectedDate = ref<string>()

// Falls back to the first day until the user actively picks a tab. A plain
// derived computed, not a watch copying groups[0]'s date into a separate
// ref — that version only fired on the loading→success *transition*, so
// re-entering Step 2 after sessions were already cached from an earlier
// visit (module-scoped cache, resolved instantly) left no tab selected at
// all, since there was no transition left to watch for.
const activeDate = computed(() => manuallySelectedDate.value ?? sessionsByDate.value[0]?.date)

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
          class="flex items-center justify-center text-body-xs lg:text-subtitle2 border-0 outline-0 font-[13px] h-8 w-[83px] rounded-lg cursor-pointer"
          :class="group.date === activeDate ? 'bg-brand-emphasis-rest text-inverse' : 'border-transparent text-neutral-muted'"
          @click="manuallySelectedDate = group.date"
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
