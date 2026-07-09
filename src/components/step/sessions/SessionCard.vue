<script setup lang="ts">
import { computed } from 'vue'
import type { Session, SessionTrack } from 'src/types/session'
import { formatSessionTimeRange } from 'src/utils/formatSessionTime'

const { session, selected, hasConflict } = defineProps<{
  session: Session
  selected: boolean
  /** Whether this session overlaps in time with another already-selected session. */
  hasConflict: boolean
}>()

const emit = defineEmits<{
  select: []
}>()

const TRACK_LABELS: Record<SessionTrack, string> = {
  main: 'Main',
  frontend: 'Frontend',
  backend: 'Backend',
  devops: 'DevOps',
}

/** Track-specific badge colors — overridden to a muted gray when full/conflicting (see `badgeClass` below). */
const TRACK_BADGE_CLASSES: Record<SessionTrack, string> = {
  main: 'text-gray-700 bg-gray-50',
  backend: 'text-blue-600 bg-blue-50',
  frontend: 'text-yellow-900 bg-yellow-200',
  devops: 'text-orange-600 bg-orange-50',
}
const MUTED_BADGE_CLASS = 'text-gray-700 bg-gray-50'

type CardStatus = 'full' | 'conflict' | 'low' | 'available'

/**
 * Visual treatment per mutually-exclusive card status — same discriminated
 * union + lookup approach as `WizardStepper`'s `StepStatus`, so the spots
 * label and progress bar can never end up showing two contradictory states
 * at once. Priority: full (can't be selected at all) > conflict (selectable,
 * but warned) > low (available, running out) > available.
 */
const STATUS_STYLES: Record<CardStatus, { spotsClass: string; barClass: string }> = {
  full: { spotsClass: 'text-neutral', barClass: 'bg-danger-emphasis-rest' },
  conflict: { spotsClass: 'text-warning-default', barClass: 'bg-warning-bold-rest' },
  low: { spotsClass: 'text-orange-700', barClass: 'bg-orange-600' },
  available: { spotsClass: 'text-brand-emphasis', barClass: 'bg-brand-emphasis-rest' },
}

const isFull = computed(() => session.registered >= session.capacity)
const remainingSpots = computed(() => Math.max(session.capacity - session.registered, 0))

const status = computed<CardStatus>(() => {
  if (isFull.value) return 'full'
  if (hasConflict) return 'conflict'
  return remainingSpots.value / session.capacity <= 0.5 ? 'low' : 'available'
})

const badgeClass = computed(() =>
  isFull.value || hasConflict ? MUTED_BADGE_CLASS : TRACK_BADGE_CLASSES[session.track],
)
</script>

<template>
  <button
    type="button"
    :disabled="isFull || status === 'conflict'"
    class="flex flex-col gap-y-2 p-4 rounded-md border border-neutral-muted border-solid text-left shadow-card"
    :class="isFull || status === 'conflict'
      ? 'bg-surface-l2'
      : selected
        ? 'border-selected bg-brand-muted-rest cursor-pointer'
        : 'bg-surface-l0 cursor-pointer'"
    @click="emit('select')"
  >
    <div class="flex items-center justify-between">
      <span
        class="text-body-xs font-medium text-uppercase rounded-full px-[9px] py-[3px]"
        :class="badgeClass"
      >
        {{ TRACK_LABELS[session.track] }}
      </span>
      <div
        v-if="!isFull && status !== 'conflict'"
        class="size-4 rounded flex items-center justify-center border border-solid flex-shrink-0"
        :class="selected ? 'bg-brand-emphasis-rest border-transparent' : 'border-neutral-muted bg-surface-l0'"
      >
        <img
          v-if="selected"
          src="~assets/icons/check-icon.svg"
          alt=""
          class="size-2.5"
        >
      </div>
    </div>
    <div class="text-subtitle1">
      {{ session.title }}
    </div>
    <div class="text-body-sm text-neutral-muted">
      {{ session.speaker }}, {{ session.speakerTitle }}
    </div>
    <div class="text-body-xs text-neutral-quiet">
      {{ formatSessionTimeRange(session.date, session.endDate) }}
      <span
        v-if="status === 'conflict'"
        class="text-danger"
      >
        (Time conflict)
      </span>
    </div>
    <div class="h-1.5 w-full bg-surface-l2 rounded-md overflow-hidden">
      <div
        class="h-full rounded-md"
        :class="STATUS_STYLES[status].barClass"
        :style="{ width: `${(session.registered / session.capacity) * 100}%` }"
      />
    </div>
    <div
      class="text-body-xs"
      :class="STATUS_STYLES[status].spotsClass"
    >
      {{ isFull ? 'Sold Out' : `${remainingSpots} spots left` }}
    </div>
  </button>
</template>
