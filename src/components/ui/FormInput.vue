<script setup lang="ts">
import { useId } from 'vue'

const { label, placeholder } = defineProps<{
  label: string
  placeholder: string
}>()

const model = defineModel<string>()

const inputId = useId()
</script>

<template>
  <div class="flex flex-col gap-y-1.5">
    <label
      :for="inputId"
      class="text-body-sm-medium"
    >
      {{ label }}
    </label>
    <input
      :id="inputId"
      v-model="model"
      type="text"
      class="text-neutral text-body-lg px-3 rounded-md bg-surface-l0 border-neutral-muted placeholder:text-neutral-quiet w-full appearance-none outline-none border border-solid h-[44px]"
      :placeholder="placeholder"
    >
  </div>
</template>
