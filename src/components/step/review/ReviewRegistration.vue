<script setup lang="ts">
import ReviewSection from './ReviewSection.vue';
import AttendeeReview from './AttendeeReview.vue';
</script>

<template>
  <div>
    <div class="text-h3 mb-6">
      Review Your Registration
    </div>
    <div class="flex flex-col gap-y-6">
      <ReviewSection
        title="Attendee Information"
        :step-index="1"
      >
        <AttendeeReview />
      </ReviewSection>
    </div>
  </div>
</template>
