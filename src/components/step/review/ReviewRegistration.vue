<script setup lang="ts">
import AttendeeReview from './AttendeeReview.vue';
import SessionsReview from './SessionsReview.vue';
import AddonsReview from './AddonsReview.vue';
import PricingSummary from './PricingSummary.vue';
import ValidationSummary from './ValidationSummary.vue';
</script>

<template>
  <div>
    <div class="text-h3 mb-6">
      Review Your Registration
    </div>
    <ValidationSummary class="mb-6" />
    <div class="flex flex-col gap-y-6">
      <AttendeeReview />
      <SessionsReview />
      <AddonsReview />
      <PricingSummary />
    </div>
  </div>
</template>
