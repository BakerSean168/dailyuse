<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-background p-8">
    <div class="text-center space-y-4">
      <h1 class="text-6xl font-bold text-muted-foreground">404</h1>
      <p class="text-xl text-muted-foreground">页面未找到</p>
      <button
        class="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
        @click="$router.push('/')"
      >
        返回首页
      </button>
    </div>
  </div>
</template>
