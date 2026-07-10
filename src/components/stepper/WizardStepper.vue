<script setup lang="ts">
import { computed } from 'vue'
import { WIZARD_STEPS, type WizardStep } from 'src/composables/useWizardNavigation'
import StepNavItem from './StepNavItem.vue'
import type { StepStatus, StepWithStatus } from './types'

const { currentStep, errorSteps = [] } = defineProps<{
  currentStep: WizardStep
  /** Steps currently failing validation, shown with error styling regardless of active/complete state. Only non-empty once a Step 4 submit attempt has actually failed (see useWizardNavigation's hasAttemptedSubmit). */
  errorSteps?: WizardStep[]
}>()

const emit = defineEmits<{
  change: [step: WizardStep]
}>()

/**
 * Visual treatment per mutually-exclusive step status. Add/adjust an entry
 * here when a status needs new styling — never push extra classes onto an
 * existing entry's arrays. Each status must stay a single, non-overlapping
 * class set: two classes that touch the same CSS property (e.g. two
 * `bg-*`/`text-*` utilities) don't both apply — whichever one is declared
 * later in `semantic.js` wins the cascade, regardless of the order they're
 * listed in `:class`. That's what silently ate `text-danger` before this
 * refactor (`text-neutral`/`text-neutral-quiet` are declared after
 * `text-danger` in `semanticTextShortcut`, so they always won).
 */
const STATUS_STYLES: Record<StepStatus, { iconClass: string[]; labelClass: string[] }> = {
  upcoming: {
    iconClass: ['bg-surface-l2', 'text-neutral-quiet'],
    labelClass: ['text-neutral-quiet', 'font-regular400'],
  },
  active: {
    iconClass: ['bg-brand-emphasis-rest', 'text-inverse'],
    labelClass: ['text-neutral', 'font-semibold'],
  },
  complete: {
    iconClass: ['bg-brand-emphasis-rest', 'text-inverse'],
    labelClass: ['text-neutral', 'font-medium500'],
  },
  error: {
    iconClass: ['bg-danger-emphasis-rest', 'text-inverse'],
    labelClass: ['text-danger', 'font-medium500'],
  },
}

/**
 * Resolves a step's single, mutually-exclusive status relative to the
 * current step. `error` takes priority over active/complete — a step still
 * shows as invalid even while it's the one currently being viewed.
 * @param step - The step being evaluated.
 * @param current - The wizard's current step.
 * @param errorSteps - Steps currently failing validation.
 * @returns The step's status, used to look up its visual treatment.
 */
function getStepStatus(step: WizardStep, current: WizardStep, errorSteps: WizardStep[]): StepStatus {
  if (errorSteps.includes(step)) return 'error'
  if (step < current) return 'complete'
  if (step === current) return 'active'
  return 'upcoming'
}

const stepsWithStatus = computed<StepWithStatus[]>(() =>
  WIZARD_STEPS.map(step => {
    const status = getStepStatus(step.index, currentStep, errorSteps)
    const { iconClass, labelClass } = STATUS_STYLES[status]
    const isLastStep = step.index === WIZARD_STEPS.length

    return {
      ...step,
      status,
      iconClass,
      // Review (the last step) reads bolder while active — kept relative to
      // WIZARD_STEPS.length rather than a literal index so it still targets
      // the actual last step if the wizard ever gains/loses a step.
      labelClass: status === 'active' && isLastStep ? [...labelClass, 'font-semibold'] : labelClass,
      barClass: status === 'complete' ? 'bg-brand-emphasis-rest' : 'bg-surface-l2',
      isLastStep,
    }
  }),
)
</script>

<template>
  <div class="flex items-center justify-center flex-shrink-0 h-20 border-0 border-b border-solid divider-default box-content">
    <div class="page-container">
      <div class="flex items-center gap-0">
        <div
          v-for="step in stepsWithStatus"
          :key="step.index"
          class="flex items-center justify-center gap-0"
          :class="{ 'flex-1': !step.isLastStep }"
        >
          <StepNavItem
            :step="step"
            @click="emit('change', step.index)"
          />
          <div
            v-if="!step.isLastStep"
            class="flex-1 mx-4 rounded-md h-0.5"
            :class="step.barClass"
          />
        </div>
      </div>
    </div>
  </div>
</template>
