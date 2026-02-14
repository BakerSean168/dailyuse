<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@dailyuse/ui-vue-shadcn';
import MarkdownEditor from '../components/MarkdownEditor.vue';
import {
  ChevronLeft,
  MoreHorizontal,
  Bold,
  Italic,
  Underline,
  List,
  CheckSquare
} from 'lucide-vue-next';

const content = ref(`
## Overview

This project aims to revolutionize the way we handle task management. By integrating a linear-style interface, we can improve user efficiency by **30%**.

### Key Features
- Minimalist Design
- Keyboard First
- Lightning Fast

### Timeline
1. **Phase 1**: Design System (Current)
2. **Phase 2**: Core Features
3. **Phase 3**: Launch
`);
</script>

<template>
  <div class="flex h-screen w-full bg-background flex-col font-sans text-foreground">
     <!-- Minimal Header -->
    <div class="h-10 border-b border-border/50 flex items-center justify-between px-4 bg-background z-10 flex-shrink-0">
       <div class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <ChevronLeft class="w-3.5 h-3.5" />
          <span>Back to Projects</span>
       </div>
       <div class="flex items-center gap-2">
          <span class="text-[10px] text-muted-foreground mr-2">Saved</span>
          <Button variant="ghost" size="icon-xs"><MoreHorizontal class="w-3.5 h-3.5" /></Button>
       </div>
    </div>

    <!-- Editor Area -->
    <div class="flex-1 overflow-hidden relative group bg-background">
       <!-- Floating Toolbar (Mockup) -->
       <div class="absolute top-6 left-1/2 -translate-x-1/2 bg-popover border border-border shadow-sm rounded-md px-2 py-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
          <Button variant="ghost" size="icon-xs" class="h-7 w-7 rounded-sm"><Bold class="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon-xs" class="h-7 w-7 rounded-sm"><Italic class="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon-xs" class="h-7 w-7 rounded-sm"><Underline class="w-3.5 h-3.5" /></Button>
          <div class="w-px h-3 bg-border mx-1"></div>
          <Button variant="ghost" size="icon-xs" class="h-7 w-7 rounded-sm"><List class="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon-xs" class="h-7 w-7 rounded-sm"><CheckSquare class="w-3.5 h-3.5" /></Button>
       </div>

       <div class="max-w-3xl mx-auto h-full flex flex-col pt-12 px-8 pb-8">
          <!-- Title Input -->
          <input
             type="text"
             value="Project Proposal"
             class="w-full text-3xl font-bold bg-transparent border-none outline-none mb-6 placeholder:text-muted-foreground/30 text-foreground flex-shrink-0"
             placeholder="Untitled"
          />

          <!-- CodeMirror Container -->
          <div class="flex-1 min-h-0">
             <MarkdownEditor v-model="content" :dark-mode="true" />
          </div>
       </div>
    </div>
  </div>
</template>
