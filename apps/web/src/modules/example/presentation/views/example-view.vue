<script setup lang="ts">
import { onMounted } from 'vue';
import { useExample } from '../composables';
import ExampleItem from '../components/example-item.vue';

const { items, loading, fetchItems } = useExample();

onMounted(() => {
  fetchItems();
});
</script>

<template>
  <div class="example-view">
    <h1>Example Items</h1>
    <div v-if="loading">Loading...</div>
    <ul v-else>
      <li v-for="item in items" :key="item.itemId">
        <ExampleItem :item="item" />
      </li>
    </ul>
  </div>
</template>
