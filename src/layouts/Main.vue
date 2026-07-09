<script setup lang="ts">
import MainHeader from 'src/components/layout/MainHeader.vue';
</script>

<template>
  <div class="h-screen flex flex-col">
    <MainHeader />
    <div class="flex-1 min-h-0">
      <router-view />
    </div>
  </div>
</template>
