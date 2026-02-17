<template>
  <Dialog :open="visible" @update:open="handleVisibleChange">
    <DialogContent class="max-w-2xl max-h-[600px] flex flex-col p-0">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b">
        <Button variant="destructive" @click="close" :disabled="isSaving">
          Cancel
        </Button>
        <DialogTitle class="text-xl">{{ isEditMode ? 'Edit Group' : 'Create Group' }}</DialogTitle>
        <Button
          variant="default"
          @click="handleSave"
          :disabled="!formValid || isSaving"
        >
          Done
        </Button>
      </div>

      <!-- Scrollable Content -->
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
                <Label for="group-name">Group Name *</Label>
                <Input
                  id="group-name"
                  v-model="formData.name"
                  placeholder="e.g., Work Reminders, Personal"
                  maxlength="50"
                  autofocus
                  class="mt-1.5"
                />
                <p class="text-xs text-muted-foreground mt-1">{{ formData.name.length }}/50</p>
              </div>
              <div class="flex flex-col items-center justify-start pt-6">
                <div
                  class="w-10 h-10 rounded-full cursor-pointer border-2 transition-colors hover:border-primary"
                  :style="{ backgroundColor: formData.color }"
                  @click="showColorPicker = !showColorPicker"
                />
                <Popover v-model:open="showColorPicker">
                  <PopoverTrigger as-child>
                    <Button variant="ghost" size="sm" class="mt-1 h-6 text-xs">Pick</Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-3">
                    <div class="grid grid-cols-4 gap-2">
                      <div
                        v-for="color in colorOptions"
                        :key="color"
                        class="w-8 h-8 rounded-full cursor-pointer border-2 transition-all hover:scale-110"
                        :class="{ 'border-primary': formData.color === color, 'border-transparent': formData.color !== color }"
                        :style="{ backgroundColor: color }"
                        @click="formData.color = color; showColorPicker = false"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label for="group-description">Description</Label>
              <Textarea
                id="group-description"
                v-model="formData.description"
                placeholder="Describe the purpose of this group..."
                rows="3"
                maxlength="200"
                class="mt-1.5"
              />
              <p class="text-xs text-muted-foreground mt-1">{{ formData.description?.length || 0 }}/200</p>
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
                    <component :is="getIcon(formData.icon)" class="h-8 w-8" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-80">
                  <div class="space-y-2">
                    <h4 class="text-sm font-medium">Select Icon</h4>
                    <div class="grid grid-cols-6 gap-2">
                      <Button
                        v-for="icon in iconOptions"
                        :key="icon.value"
                        variant="ghost"
                        size="icon"
                        @click="formData.icon = icon.value"
                      >
                        <component :is="getIcon(icon.value)" class="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <div class="flex-1">
                <p class="text-sm font-medium">Icon</p>
                <p class="text-xs text-muted-foreground">Current: {{ formData.icon }}</p>
              </div>
            </div>

            <div>
              <Label for="group-order">Sort Order</Label>
              <Input
                id="group-order"
                v-model.number="formData.order"
                type="number"
                placeholder="0"
                class="mt-1.5"
              />
              <p class="text-xs text-muted-foreground mt-1">Lower numbers appear first</p>
            </div>
          </div>

          <!-- Control Mode -->
          <div class="space-y-3">
            <div class="flex items-center gap-2 mb-3">
              <Settings class="h-5 w-5 text-primary" />
              <h3 class="text-sm font-semibold">Control Mode</h3>
            </div>
            <Separator />

            <RadioGroup v-model="formData.controlMode">
              <div class="flex items-start space-x-3 space-y-0 p-4 border rounded-lg">
                <RadioGroupItem value="INDIVIDUAL" id="individual" />
                <Label for="individual" class="flex-1 cursor-pointer">
                  <div class="font-medium">Individual Control</div>
                  <div class="text-xs text-muted-foreground">Each reminder template can be enabled/paused independently</div>
                </Label>
              </div>
              <div class="flex items-start space-x-3 space-y-0 p-4 border rounded-lg">
                <RadioGroupItem value="GROUP" id="group" />
                <Label for="group" class="flex-1 cursor-pointer">
                  <div class="font-medium">Group Control</div>
                  <div class="text-xs text-muted-foreground">All reminder templates are enabled/paused together</div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import {
  Info,
  Palette,
  Settings,
  Folder,
  Briefcase,
  Home,
  School,
  Heart,
  ShoppingCart,
  Gamepad,
  Plane,
  DollarSign,
  Users,
} from 'lucide-vue-next';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ReminderGroup {
  uuid?: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  controlMode: 'INDIVIDUAL' | 'GROUP';
  order?: number;
}

interface Props {
  group?: ReminderGroup | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'save': [data: Omit<ReminderGroup, 'uuid'>];
  'update': [uuid: string, data: Omit<ReminderGroup, 'uuid'>];
}>();

const visible = ref(false);
const isSaving = ref(false);
const showColorPicker = ref(false);

const formData = reactive({
  name: '',
  description: '',
  icon: 'mdi-folder',
  color: '#2196F3',
  controlMode: 'INDIVIDUAL' as 'INDIVIDUAL' | 'GROUP',
  order: 0,
});

const colorOptions = [
  '#2196F3', '#4CAF50', '#FF9800', '#F44336',
  '#9C27B0', '#E91E63', '#00BCD4', '#9E9E9E',
];

const iconOptions = [
  { value: 'mdi-folder', icon: Folder },
  { value: 'mdi-briefcase', icon: Briefcase },
  { value: 'mdi-home', icon: Home },
  { value: 'mdi-school', icon: School },
  { value: 'mdi-heart', icon: Heart },
  { value: 'mdi-cart', icon: ShoppingCart },
  { value: 'mdi-gamepad', icon: Gamepad },
  { value: 'mdi-airplane', icon: Plane },
  { value: 'mdi-currency-usd', icon: DollarSign },
  { value: 'mdi-account-group', icon: Users },
];

const isEditMode = computed(() => !!props.group?.uuid);
const formValid = computed(() => formData.name.trim().length >= 2);

const getIcon = (iconValue: string) => {
  const option = iconOptions.find(opt => opt.value === iconValue);
  return option?.icon || Folder;
};

const resetForm = () => {
  formData.name = '';
  formData.description = '';
  formData.icon = 'mdi-folder';
  formData.color = '#2196F3';
  formData.controlMode = 'INDIVIDUAL';
  formData.order = 0;
};

const fillForm = (group: ReminderGroup) => {
  formData.name = group.name;
  formData.description = group.description || '';
  formData.icon = group.icon || 'mdi-folder';
  formData.color = group.color || '#2196F3';
  formData.controlMode = group.controlMode;
  formData.order = group.order || 0;
};

const open = () => {
  resetForm();
  visible.value = true;
};

const openForEdit = (group: ReminderGroup) => {
  fillForm(group);
  visible.value = true;
};

const close = () => {
  visible.value = false;
  setTimeout(resetForm, 300);
};

const handleVisibleChange = (value: boolean) => {
  visible.value = value;
  if (!value) {
    setTimeout(resetForm, 300);
  }
};

const handleSave = async () => {
  if (!formValid.value) return;

  isSaving.value = true;
  try {
    const data: Omit<ReminderGroup, 'uuid'> = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      color: formData.color,
      icon: formData.icon,
      controlMode: formData.controlMode,
      order: formData.order,
    };

    if (isEditMode.value && props.group?.uuid) {
      emit('update', props.group.uuid, data);
    } else {
      emit('save', data);
    }
    
    close();
  } finally {
    isSaving.value = false;
  }
};

defineExpose({
  open,
  openForEdit,
  close,
});
</script>
