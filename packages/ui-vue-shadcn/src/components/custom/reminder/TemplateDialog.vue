<template>
  <Dialog :open="visible" @update:open="handleVisibleChange">
    <DialogContent class="max-w-3xl max-h-[700px] flex flex-col p-0">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b">
        <Button variant="destructive" @click="close" :disabled="saving">Cancel</Button>
        <DialogTitle class="text-xl">{{ isEditMode ? 'Edit Reminder Template' : 'Create Reminder Template' }}</DialogTitle>
        <Button variant="default" @click="handleSave" :disabled="!formValid || saving">Done</Button>
      </div>

      <!-- Content -->
      <ScrollArea class="flex-1 px-6">
        <div class="space-y-6 py-6">
          <!-- Basic Info -->
          <div class="space-y-3">
            <div class="flex items-center gap-2 mb-3">
              <Info class="h-5 w-5 text-primary" />
              <h3 class="text-sm font-semibold">Basic Information</h3>
            </div>
            <Separator />

            <div class="flex gap-3">
              <div class="flex-1">
                <Label>Title *</Label>
                <Input v-model="formData.title" placeholder="e.g., Daily Water Reminder" class="mt-1.5" />
              </div>
              <div class="flex flex-col items-center justify-start pt-6">
                <div class="w-10 h-10 rounded-full cursor-pointer border-2" :style="{ backgroundColor: formData.color }" @click="showColorPicker = !showColorPicker" />
                <Popover v-model:open="showColorPicker">
                  <PopoverTrigger as-child>
                    <Button variant="ghost" size="sm" class="mt-1 h-6 text-xs">Pick</Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-3">
                    <div class="grid grid-cols-4 gap-2">
                      <div v-for="color in colorOptions" :key="color" class="w-8 h-8 rounded-full cursor-pointer" :style="{ backgroundColor: color }" @click="formData.color = color; showColorPicker = false" />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea v-model="formData.description" placeholder="Describe this reminder..." rows="2" class="mt-1.5" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <Label>Group</Label>
                <Select v-model="formData.groupId">
                  <SelectTrigger class="mt-1.5">
                    <SelectValue placeholder="Select group (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="group in groupOptions" :key="group.id" :value="group.id">
                      {{ group.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Importance</Label>
                <Select v-model="formData.importanceLevel">
                  <SelectTrigger class="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VITAL">Extremely Important</SelectItem>
                    <SelectItem value="IMPORTANT">Very Important</SelectItem>
                    <SelectItem value="MODERATE">Normal</SelectItem>
                    <SelectItem value="MINOR">Less Important</SelectItem>
                    <SelectItem value="TRIVIAL">Trivial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <!-- Time Configuration -->
          <div class="space-y-3">
            <div class="flex items-center gap-2 mb-3">
              <Clock class="h-5 w-5 text-primary" />
              <h3 class="text-sm font-semibold">Time Configuration</h3>
            </div>
            <Separator />

            <div>
              <Label>Trigger Type *</Label>
              <Select v-model="formData.triggerType">
                <SelectTrigger class="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED_TIME">Fixed Time</SelectItem>
                  <SelectItem value="INTERVAL">Interval</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div v-if="formData.triggerType === 'FIXED_TIME'">
              <Label>Fixed Time (HH:MM)</Label>
              <Input v-model="formData.fixedTime" placeholder="09:00" class="mt-1.5" />
              <p class="text-xs text-muted-foreground mt-1">Format: hour:minute (e.g., 09:00, 14:30)</p>
            </div>

            <div v-if="formData.triggerType === 'INTERVAL'">
              <Label>Interval (minutes)</Label>
              <Input v-model.number="formData.intervalMinutes" type="number" placeholder="60" class="mt-1.5" />
              <p class="text-xs text-muted-foreground mt-1">How often to trigger (in minutes)</p>
            </div>
          </div>

          <!-- Appearance -->
          <div class="space-y-3">
            <div class="flex items-center gap-2 mb-3">
              <Palette class="h-5 w-5 text-primary" />
              <h3 class="text-sm font-semibold">Appearance</h3>
            </div>
            <Separator />

            <div class="flex items-center gap-4">
              <Popover>
                <PopoverTrigger as-child>
                  <Button variant="outline" size="lg" class="h-16 w-16">
                    <Bell class="h-8 w-8" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-80">
                  <p class="text-sm">Icon picker coming soon</p>
                </PopoverContent>
              </Popover>
              <div class="flex-1">
                <p class="text-sm font-medium">Icon</p>
                <p class="text-xs text-muted-foreground">Current: {{ formData.icon }}</p>
              </div>
            </div>

            <div>
              <Label>Tags</Label>
              <Input v-model="tagsInput" placeholder="work, important (comma separated)" class="mt-1.5" @blur="updateTags" />
            </div>
          </div>

          <!-- Advanced Settings -->
          <Accordion type="single" collapsible>
            <AccordionItem value="advanced">
              <AccordionTrigger>
                <div class="flex items-center gap-2">
                  <Settings class="h-4 w-4" />
                  <span>Advanced Notification Settings</span>
                  <Badge variant="secondary" class="ml-2">Optional</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent class="space-y-3 pt-3">
                <p class="text-xs text-muted-foreground">Customize notification text. Leave empty to use template title and description.</p>
                <div>
                  <Label>Notification Title</Label>
                  <Input v-model="formData.notificationTitle" placeholder="Leave empty to use template title" class="mt-1.5" />
                </div>
                <div>
                  <Label>Notification Body</Label>
                  <Textarea v-model="formData.notificationBody" placeholder="Leave empty to use template description" rows="2" class="mt-1.5" />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { Info, Clock, Palette, Settings, Bell } from 'lucide-vue-next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ReminderTemplate {
  id?: string;
  name: string;
  description?: string | null;
  importanceLevel?: string;
  triggerType?: string;
  fixedTime?: string;
  intervalMinutes?: number;
  notificationTitle?: string;
  notificationBody?: string;
  color?: string | null;
  icon?: string | null;
  tags?: string[];
  groupId?: string | null;
  trigger?: any;
}

interface ReminderGroup {
  id: string;
  name: string;
}

interface Props {
  template?: ReminderTemplate | null;
  groupOptions?: ReminderGroup[];
}

const props = withDefaults(defineProps<Props>(), {
  template: null,
  groupOptions: () => [],
});

const emit = defineEmits<{
  'save': [data: any];
  'update': [id: string, data: any];
}>();

const visible = ref(false);
const saving = ref(false);
const showColorPicker = ref(false);
const tagsInput = ref('');

const formData = reactive({
  title: '',
  description: '',
  importanceLevel: 'MODERATE',
  triggerType: 'FIXED_TIME',
  fixedTime: '09:00',
  intervalMinutes: 60,
  notificationTitle: '',
  notificationBody: '',
  color: '#2196F3',
  icon: 'mdi-bell',
  tags: [] as string[],
  groupId: undefined as string | undefined,
});

const colorOptions = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#E91E63', '#00BCD4', '#9E9E9E'];

const isEditMode = computed(() => !!props.template?.id);
const formValid = computed(() => formData.title.trim().length > 0);

const updateTags = () => {
  formData.tags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean);
};

const resetForm = () => {
  Object.assign(formData, {
    title: '', description: '', importanceLevel: 'MODERATE',
    triggerType: 'FIXED_TIME', fixedTime: '09:00', intervalMinutes: 60,
    notificationTitle: '', notificationBody: '', color: '#2196F3',
    icon: 'mdi-bell', tags: [], groupId: undefined,
  });
  tagsInput.value = '';
};

const loadTemplateData = (template: ReminderTemplate) => {
  Object.assign(formData, {
    title: template.name,
    description: template.description || '',
    importanceLevel: template.importanceLevel || 'MODERATE',
    triggerType: template.trigger?.type || 'FIXED_TIME',
    fixedTime: template.trigger?.fixedTime?.time || '09:00',
    intervalMinutes: template.trigger?.interval?.minutes || 60,
    notificationTitle: template.notificationTitle || '',
    notificationBody: template.notificationBody || '',
    color: template.color || '#2196F3',
    icon: template.icon || 'mdi-bell',
    tags: template.tags || [],
    groupId: template.groupId,
  });
  tagsInput.value = (template.tags || []).join(', ');
};

const open = () => {
  resetForm();
  visible.value = true;
};

const openForCreate = () => {
  resetForm();
  visible.value = true;
};

const openForEdit = (template: ReminderTemplate) => {
  loadTemplateData(template);
  visible.value = true;
};

const close = () => {
  visible.value = false;
  setTimeout(resetForm, 300);
};

const handleVisibleChange = (value: boolean) => {
  visible.value = value;
  if (!value) setTimeout(resetForm, 300);
};

const handleSave = async () => {
  if (!formValid.value) return;
  
  saving.value = true;
  try {
    const data = {
      name: formData.title,
      description: formData.description || undefined,
      importanceLevel: formData.importanceLevel,
      trigger: formData.triggerType === 'FIXED_TIME' 
        ? { type: 'FIXED_TIME', fixedTime: { time: formData.fixedTime, timezone: null }, interval: null }
        : { type: 'INTERVAL', interval: { minutes: formData.intervalMinutes, startTime: null }, fixedTime: null },
      notificationConfig: {
        channels: ['PUSH', 'IN_APP'],
        title: formData.notificationTitle || formData.title,
        body: formData.notificationBody || formData.description || 'Reminder',
        sound: { enabled: true, soundName: 'default' },
        vibration: { enabled: true, pattern: null },
        actions: null,
      },
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      color: formData.color || undefined,
      icon: formData.icon || undefined,
      groupId: formData.groupId,
    };

    if (isEditMode.value && props.template?.id) {
      emit('update', props.template.id, data);
    } else {
      emit('save', { ...data, type: 'RECURRING', activeTime: { activatedAt: Date.now() } });
    }
    
    close();
  } finally {
    saving.value = false;
  }
};

defineExpose({ open, openForCreate, openForEdit, close });
</script>
