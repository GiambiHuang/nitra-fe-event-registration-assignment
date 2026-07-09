<script setup lang="ts">
import { computed } from 'vue'
import { useRegistrationStore } from 'src/composables/useRegistrationStore'
import { isShippingAddressRequired } from 'src/utils/registrationRules'

const { state } = useRegistrationStore()

const showBanner = computed(() => isShippingAddressRequired(state))
</script>

<template>
  <div
    v-if="showBanner"
    class="flex items-start gap-2 p-4 rounded-md border-info-opacity border-1 border-solid bg-info-subtle-rest text-body-sm text-info"
  >
    <img
      src="~/assets/icons/circle-info.svg"
      alt="info"
    >
    <div class="text-subtitle2 flex-1 text-neutral">
      <div class="text-subtitle2 font-bold">
        Shipping Information
      </div>
      <div class="font-regular mt-1">
        Merchandise items will be shipped to your address one week before the conference. Please ensure your shipping address in Step 1 is correct.
      </div>
    </div>
  </div>
</template>
