<script setup lang="ts">
import {
  LinearPanel,
  LinearSidebarItem,
  LinearPageHeader,
  LinearListItem
} from '@dailyuse/ui-vue';
import { Button } from '@dailyuse/ui-vue-shadcn';
import {
  Inbox,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ListFilter,
  Plus,
  Clock,
  MoreHorizontal
} from 'lucide-vue-next';
</script>

<template>
  <div class="flex h-screen w-full bg-background overflow-hidden font-sans text-foreground">
    <!-- Sidebar -->
    <LinearPanel class="w-60 flex-shrink-0">
      <div class="p-3">
        <div class="flex items-center gap-2 mb-6 px-3 mt-2">
          <div class="w-5 h-5 rounded bg-primary/20 text-primary flex items-center justify-center text-xs font-bold ring-1 ring-primary/20">R</div>
          <span class="font-medium text-sm tracking-tight">Reminders</span>
        </div>

        <div class="space-y-0.5">
          <LinearSidebarItem label="Inbox" :count="4" active>
            <template #icon><Inbox class="w-4 h-4" /></template>
          </LinearSidebarItem>
          <LinearSidebarItem label="Today" :count="2">
            <template #icon><Calendar class="w-4 h-4" /></template>
          </LinearSidebarItem>
          <LinearSidebarItem label="Upcoming">
            <template #icon><CalendarDays class="w-4 h-4" /></template>
          </LinearSidebarItem>
          <LinearSidebarItem label="Completed">
            <template #icon><CheckCircle2 class="w-4 h-4" /></template>
          </LinearSidebarItem>
        </div>

        <div class="mt-8">
          <div class="text-[10px] font-semibold text-muted-foreground/70 px-3 mb-2 uppercase tracking-wider">Lists</div>
          <div class="space-y-0.5">
             <LinearSidebarItem label="Personal">
                <template #icon><div class="w-2 h-2 rounded-full bg-chart-1"></div></template>
             </LinearSidebarItem>
             <LinearSidebarItem label="Work">
                <template #icon><div class="w-2 h-2 rounded-full bg-chart-2"></div></template>
             </LinearSidebarItem>
             <LinearSidebarItem label="Shopping">
                <template #icon><div class="w-2 h-2 rounded-full bg-chart-3"></div></template>
             </LinearSidebarItem>
          </div>
        </div>
      </div>

      <div class="mt-auto p-3 border-t border-border/50">
        <div class="text-xs text-muted-foreground px-2">v0.1.0</div>
      </div>
    </LinearPanel>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 bg-background/50">
      <LinearPageHeader title="Inbox" description="4 active reminders">
        <template #actions>
          <Button variant="outline" size="sm">
            <ListFilter class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Filter
          </Button>
          <Button size="sm">
            <Plus class="w-3.5 h-3.5 mr-2" /> New Reminder
          </Button>
        </template>
      </LinearPageHeader>

      <div class="flex-1 overflow-auto">
        <div class="p-6 max-w-5xl mx-auto space-y-8">
           <!-- Section: Today -->
           <div>
              <h3 class="text-xs font-semibold text-muted-foreground mb-3 px-3 uppercase tracking-wider">Today</h3>
              <div class="border rounded-lg bg-card shadow-sm overflow-hidden">
                <LinearListItem title="Review pull request #123" subtitle="Project Phoenix" class="last:border-0">
                   <template #prefix><div class="w-4 h-4 rounded-full border-2 border-muted-foreground/30 hover:border-primary cursor-pointer transition-colors"></div></template>
                   <template #meta>
                      <span class="text-orange-500 font-medium">Today</span>
                      <span class="mx-1">·</span>
                      <span>2:00 PM</span>
                   </template>
                   <template #actions>
                      <Button variant="ghost" size="icon-xs" class="h-6 w-6"><Clock class="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon-xs" class="h-6 w-6"><MoreHorizontal class="w-3.5 h-3.5" /></Button>
                   </template>
                </LinearListItem>
                 <LinearListItem title="Call with design team" subtitle="Weekly sync" class="last:border-0">
                   <template #prefix><div class="w-4 h-4 rounded-full border-2 border-muted-foreground/30 hover:border-primary cursor-pointer transition-colors"></div></template>
                   <template #meta>
                      <span class="text-orange-500 font-medium">Today</span>
                      <span class="mx-1">·</span>
                      <span>4:00 PM</span>
                   </template>
                   <template #actions>
                      <Button variant="ghost" size="icon-xs" class="h-6 w-6"><Clock class="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon-xs" class="h-6 w-6"><MoreHorizontal class="w-3.5 h-3.5" /></Button>
                   </template>
                </LinearListItem>
              </div>
           </div>

            <!-- Section: Tomorrow -->
            <div>
              <h3 class="text-xs font-semibold text-muted-foreground mb-3 px-3 uppercase tracking-wider">Tomorrow</h3>
              <div class="border rounded-lg bg-card shadow-sm overflow-hidden">
                <LinearListItem title="Update documentation" subtitle="Q3 Roadmap" class="last:border-0">
                   <template #prefix><div class="w-4 h-4 rounded-full border-2 border-muted-foreground/30 hover:border-primary cursor-pointer transition-colors"></div></template>
                   <template #meta>
                      <span class="text-muted-foreground">Tomorrow</span>
                      <span class="mx-1">·</span>
                      <span>10:00 AM</span>
                   </template>
                   <template #actions>
                      <Button variant="ghost" size="icon-xs" class="h-6 w-6"><Clock class="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon-xs" class="h-6 w-6"><MoreHorizontal class="w-3.5 h-3.5" /></Button>
                   </template>
                </LinearListItem>
              </div>
           </div>

           <!-- Section: Later -->
           <div>
              <h3 class="text-xs font-semibold text-muted-foreground mb-3 px-3 uppercase tracking-wider">Later</h3>
              <div class="border rounded-lg bg-card shadow-sm overflow-hidden">
                <LinearListItem title="Prepare quarterly report" subtitle="Finance" class="last:border-0">
                   <template #prefix><div class="w-4 h-4 rounded-full border-2 border-muted-foreground/30 hover:border-primary cursor-pointer transition-colors"></div></template>
                   <template #meta>Fri, Oct 24</template>
                   <template #actions>
                      <Button variant="ghost" size="icon-xs" class="h-6 w-6"><Clock class="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon-xs" class="h-6 w-6"><MoreHorizontal class="w-3.5 h-3.5" /></Button>
                   </template>
                </LinearListItem>
              </div>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>
