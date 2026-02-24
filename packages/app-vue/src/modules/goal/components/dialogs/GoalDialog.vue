<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[600px] gap-6">
      <DialogHeader>
        <DialogTitle class="text-xl font-semibold tracking-tight">Create new goal</DialogTitle>
        <DialogDescription class="text-sm text-muted-foreground">
          Set a clear objective and define key results to measure success.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-5 py-2">
        <!-- Title Input -->
        <div class="grid gap-2">
          <Label htmlFor="title" class="font-medium">Goal Title</Label>
          <Input id="title" placeholder="e.g. Increase Monthly Recurring Revenue" class="h-10" />
        </div>

        <!-- Description -->
        <div class="grid gap-2">
          <Label htmlFor="description" class="font-medium">Description</Label>
          <Textarea id="description" placeholder="Add details about why this goal matters..." class="min-h-[100px] resize-none" />
        </div>

        <!-- Meta Grid -->
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label class="font-medium">Team</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-2">
            <Label class="font-medium">Owner</Label>
            <div class="flex items-center gap-2 border rounded-md px-3 h-10 bg-muted/20">
              <Avatar class="h-6 w-6">
                <AvatarFallback class="text-[10px]">ME</AvatarFallback>
              </Avatar>
              <span class="text-sm">Me</span>
            </div>
          </div>
        </div>

        <!-- Date Range (Mock) -->
        <div class="grid gap-2">
          <Label class="font-medium">Timeframe</Label>
          <div class="flex items-center gap-2 border rounded-md px-3 h-10 bg-background hover:bg-muted/50 transition-colors cursor-pointer">
            <Calendar class="h-4 w-4 text-muted-foreground" />
            <span class="text-sm">Q1 2024 (Jan 1 - Mar 31)</span>
          </div>
        </div>
      </div>

      <DialogFooter class="gap-2 sm:gap-0">
        <Button variant="outline" @click="isOpen = false">Cancel</Button>
        <Button @click="handleSave">Create Goal</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import { Textarea } from '@dailyuse/ui-vue-shadcn';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@dailyuse/ui-vue-shadcn';
import { Avatar, AvatarFallback } from '@dailyuse/ui-vue-shadcn';
import { Calendar } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

const isOpen = ref(false);

const openForCreate = () => {
  isOpen.value = true;
};

const openForEdit = (goal: any) => {
  isOpen.value = true;
  // Mock populating data
  toast.info('Editing goal: ' + goal.title);
};

const handleSave = () => {
  toast.success('Goal created successfully', {
    description: 'This is a mock action.'
  });
  isOpen.value = false;
};

defineExpose({
  openForCreate,
  openForEdit
});
</script>
