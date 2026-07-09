<script setup lang="ts">
import { useWizardNavigation } from 'src/composables/useWizardNavigation'

const { goBack, goNext } = useWizardNavigation()
</script>

<template>
  <div class="h-[72px] flex items-center justify-center flex-shrink-0 box-content border-0 border-t divider-default border-solid">
    <div class="flex items-center justify-between page-container box-border">
      <q-btn
        label="Back"
        @click="goBack"
      />
      <q-btn
        label="Next"
        @click="goNext"
      />
    </div>
  </div>
</template>
