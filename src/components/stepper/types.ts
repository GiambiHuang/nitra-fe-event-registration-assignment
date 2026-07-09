import type { WizardStep } from 'src/composables/useWizardNavigation'

export type StepStatus = 'upcoming' | 'active' | 'complete' | 'error'

/** A step plus everything the template needs to render it — status and its resolved classes. */
export interface StepWithStatus {
  label: string
  index: WizardStep
  status: StepStatus
  iconClass: string[]
  labelClass: string[]
  barClass: string
  isLastStep: boolean
}
