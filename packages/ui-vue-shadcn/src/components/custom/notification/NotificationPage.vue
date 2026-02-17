<template>
  <div class="container mx-auto p-4">
    <Card>
      <CardHeader>
        <CardTitle>通知中心</CardTitle>
      </CardHeader>
      <CardContent>
        <slot />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
</script>
