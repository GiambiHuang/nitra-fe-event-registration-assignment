<script setup lang="ts">
import { computed } from 'vue'
import { useRegistrationStore } from 'src/composables/useRegistrationStore'
import { useAddons } from 'src/composables/useAddons';

const { state } = useRegistrationStore()
const { resource } = useAddons();

const selectedWorkshops = computed(() => {
  if (resource.value.status !== 'success') return [];
  return [
    ...state.selectedWorkshopIds,
  ].map(id => {
    const addon = resource.value.status === 'success' ? resource.value.data.find(addons => addons.id === id) : null;
    return {
      label: 'Workshop',
      value: `${addon?.name || 'Unknown'} ($${addon?.price})`,
    }
  })
})
</script>

<template>
  <div class="flex flex-col gap-y-3">
    <template v-if="selectedWorkshops.length > 0">
      <div
        v-for="field in selectedWorkshops"
        :key="field.label"
        class="flex items-center justify-between text-body-sm"
      >
        <span class="text-neutral-muted">{{ field.label }}</span>
        <span class="text-neutral">{{ field.value }}</span>
      </div>
    </template>
    <template v-else>
      <div class="text-body-sm text-neutral-muted">
        -
      </div>
    </template>
  </div>
</template>
