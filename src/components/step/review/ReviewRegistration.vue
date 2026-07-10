<script setup lang="ts">
import AttendeeReview from './AttendeeReview.vue';
import SessionsReview from './SessionsReview.vue';
import AddonsReview from './AddonsReview.vue';
</script>

<template>
  <div>
    <div class="text-h3 mb-6">
      Review Your Registration
    </div>
    <div class="flex flex-col gap-y-6">
      <AttendeeReview />
      <SessionsReview />
      <AddonsReview />
    </div>
  </div>
</template>
