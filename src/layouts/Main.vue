<script setup lang="ts">
import MainHeader from 'src/components/layout/MainHeader.vue';
</script>

<template>
  <div class="h-screen flex flex-col">
    <MainHeader />
    <div class="border-0 border-b divider-default border-solid" />
    <div class="flex-1">
      <router-view />
    </div>
  </div>
</template>
