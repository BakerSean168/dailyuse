<script setup lang="ts">
import {
  LinearPanel,
  LinearSidebarItem,
  LinearPageHeader
} from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import {
  FolderOpen,
  Star,
  Clock,
  Plus,
  ChevronRight,
  LayoutGrid,
  List,
  FileText,
  Image,
  MoreHorizontal
} from 'lucide-vue-next';
</script>

<template>
  <div class="flex h-screen w-full bg-background overflow-hidden font-sans text-foreground">
    <!-- Sidebar: File Tree -->
    <LinearPanel class="w-60 flex-shrink-0">
      <div class="p-3">
        <div class="flex items-center gap-2 mb-4 px-3 mt-2">
          <div class="w-5 h-5 rounded bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold ring-1 ring-blue-500/20">K</div>
          <span class="font-medium text-sm tracking-tight">Knowledge Base</span>
        </div>

        <div class="space-y-0.5">
          <LinearSidebarItem label="All Files" active>
             <template #icon><FolderOpen class="w-4 h-4" /></template>
          </LinearSidebarItem>
          <LinearSidebarItem label="Favorites">
             <template #icon><Star class="w-4 h-4" /></template>
          </LinearSidebarItem>
          <LinearSidebarItem label="Recent">
             <template #icon><Clock class="w-4 h-4" /></template>
          </LinearSidebarItem>
        </div>

        <div class="mt-6 px-2">
           <div class="flex items-center justify-between group px-1 mb-1">
              <div class="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Folders</div>
              <Plus class="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-pointer hover:text-foreground transition-opacity" />
           </div>

           <!-- Mock Tree -->
           <div class="space-y-0.5">
              <LinearSidebarItem label="Projects">
                 <template #icon><ChevronRight class="w-3.5 h-3.5 text-muted-foreground/70" /></template>
              </LinearSidebarItem>
              <LinearSidebarItem label="Resources">
                 <template #icon><ChevronRight class="w-3.5 h-3.5 text-muted-foreground/70" /></template>
              </LinearSidebarItem>
              <LinearSidebarItem label="Archive">
                 <template #icon><ChevronRight class="w-3.5 h-3.5 text-muted-foreground/70" /></template>
              </LinearSidebarItem>
           </div>
        </div>
      </div>

      <div class="mt-auto p-3 border-t border-border/50">
         <div class="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
            <div class="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Synced</span>
         </div>
      </div>
    </LinearPanel>

    <!-- Main Content: File Grid/List -->
    <div class="flex-1 flex flex-col min-w-0 bg-background/50">
       <LinearPageHeader title="All Files" description="12 items">
          <template #actions>
             <div class="flex items-center bg-muted/50 rounded-md p-0.5 border border-border/50">
                <Button variant="ghost" size="icon-xs" class="h-6 w-6 bg-background shadow-sm text-foreground"><LayoutGrid class="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon-xs" class="h-6 w-6 text-muted-foreground"><List class="w-3.5 h-3.5" /></Button>
             </div>
             <div class="w-px h-4 bg-border mx-2"></div>
             <Button size="sm">
                <Plus class="w-3.5 h-3.5 mr-2" /> New File
             </Button>
          </template>
       </LinearPageHeader>

       <div class="flex-1 overflow-auto p-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
             <!-- File Card 1 -->
             <div class="group relative border border-border/60 rounded-lg p-4 bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                <div class="flex items-start justify-between mb-3">
                   <div class="p-2 bg-blue-500/10 rounded-md">
                      <FileText class="w-5 h-5 text-blue-500" />
                   </div>
                   <Button variant="ghost" size="icon-xs" class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal class="w-3.5 h-3.5" /></Button>
                </div>
                <div class="text-sm font-medium truncate pr-4">Project Proposal.md</div>
                <div class="text-[10px] text-muted-foreground mt-1">Edited 2h ago</div>
             </div>

             <!-- File Card 2 -->
             <div class="group relative border border-border/60 rounded-lg p-4 bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                <div class="flex items-start justify-between mb-3">
                   <div class="p-2 bg-purple-500/10 rounded-md">
                      <FileText class="w-5 h-5 text-purple-500" />
                   </div>
                   <Button variant="ghost" size="icon-xs" class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal class="w-3.5 h-3.5" /></Button>
                </div>
                <div class="text-sm font-medium truncate pr-4">Meeting Notes.md</div>
                <div class="text-[10px] text-muted-foreground mt-1">Edited yesterday</div>
             </div>

             <!-- File Card 3 -->
             <div class="group relative border border-border/60 rounded-lg p-4 bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                <div class="flex items-start justify-between mb-3">
                   <div class="p-2 bg-green-500/10 rounded-md">
                      <Image class="w-5 h-5 text-green-500" />
                   </div>
                   <Button variant="ghost" size="icon-xs" class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal class="w-3.5 h-3.5" /></Button>
                </div>
                <div class="text-sm font-medium truncate pr-4">Design_System_v2.png</div>
                <div class="text-[10px] text-muted-foreground mt-1">Edited 3d ago</div>
             </div>

             <!-- File Card 4 -->
             <div class="group relative border border-border/60 rounded-lg p-4 bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                <div class="flex items-start justify-between mb-3">
                   <div class="p-2 bg-orange-500/10 rounded-md">
                      <FileText class="w-5 h-5 text-orange-500" />
                   </div>
                   <Button variant="ghost" size="icon-xs" class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal class="w-3.5 h-3.5" /></Button>
                </div>
                <div class="text-sm font-medium truncate pr-4">Q3 Budget.csv</div>
                <div class="text-[10px] text-muted-foreground mt-1">Edited 1w ago</div>
             </div>
          </div>
       </div>
    </div>
  </div>
</template>
