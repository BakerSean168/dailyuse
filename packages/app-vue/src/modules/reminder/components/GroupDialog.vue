<template>
  <Dialog :open="visible" @update:open="handleVisibleChange">
    <DialogContent class="flex max-h-[85vh] min-h-0 max-w-2xl flex-col overflow-hidden p-0">
      <DialogHeader class="shrink-0 px-6 pt-6 pb-4">
        <DialogTitle class="text-xl">{{
          isEditMode ? t('reminder.groupDialog.titleEdit') : t('reminder.groupDialog.titleCreate')
        }}</DialogTitle>
        <DialogDescription class="text-sm text-muted-foreground">
          {{
            isEditMode ? t('reminder.groupDialog.descEdit') : t('reminder.groupDialog.descCreate')
          }}
        </DialogDescription>
      </DialogHeader>

      <div class="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
        <div class="space-y-6 py-2">
          <!-- Basic Info -->
          <div class="space-y-3">
            <div class="flex items-center gap-2 mb-3">
              <Info class="h-5 w-5 text-primary" />
              <h3 class="text-sm font-semibold">
                {{ t('reminder.groupDialog.sectionBasicInfo') }}
              </h3>
            </div>
            <Separator />

            <div class="flex gap-3">
              <div class="flex-1">
                <Label for="group-name">{{ t('reminder.groupDialog.labelName') }}</Label>
                <Input
                  id="group-name"
                  v-model="formData.name"
                  :placeholder="t('reminder.groupDialog.placeholderName')"
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
                    <Button variant="ghost" size="sm" class="mt-1 h-6 text-xs">{{
                      t('reminder.groupDialog.btnPick')
                    }}</Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-3">
                    <div class="grid grid-cols-4 gap-2">
                      <div
                        v-for="color in colorOptions"
                        :key="color"
                        class="w-8 h-8 rounded-full cursor-pointer border-2 transition-all hover:scale-110"
                        :class="{
                          'border-primary': formData.color === color,
                          'border-transparent': formData.color !== color,
                        }"
                        :style="{ backgroundColor: color }"
                        @click="
                          formData.color = color;
                          showColorPicker = false;
                        "
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label for="group-description">{{
                t('reminder.groupDialog.labelDescription')
              }}</Label>
              <Textarea
                id="group-description"
                v-model="formData.description"
                :placeholder="t('reminder.groupDialog.placeholderDescription')"
                rows="3"
                maxlength="200"
                class="mt-1.5"
              />
              <p class="text-xs text-muted-foreground mt-1">
                {{ formData.description?.length || 0 }}/200
              </p>
            </div>
          </div>

          <!-- Appearance -->
          <div class="space-y-3">
            <div class="flex items-center gap-2 mb-3">
              <Palette class="h-5 w-5 text-primary" />
              <h3 class="text-sm font-semibold">
                {{ t('reminder.groupDialog.sectionAppearance') }}
              </h3>
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
                    <h4 class="text-sm font-medium">
                      {{ t('reminder.groupDialog.selectIcon') }}
                    </h4>
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
                <p class="text-sm font-medium">{{ t('reminder.groupDialog.labelIcon') }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ t('reminder.groupDialog.currentIcon', { icon: formData.icon }) }}
                </p>
              </div>
            </div>

            <div>
              <Label for="group-order">{{ t('reminder.groupDialog.labelSortOrder') }}</Label>
              <Input
                id="group-order"
                v-model.number="formData.order"
                type="number"
                placeholder="0"
                class="mt-1.5"
              />
              <p class="text-xs text-muted-foreground mt-1">
                {{ t('reminder.groupDialog.hintSortOrder') }}
              </p>
            </div>
          </div>

          <!-- Control Mode -->
          <div class="space-y-3">
            <div class="flex items-center gap-2 mb-3">
              <Settings class="h-5 w-5 text-primary" />
              <h3 class="text-sm font-semibold">
                {{ t('reminder.groupDialog.sectionControlMode') }}
              </h3>
            </div>
            <Separator />

            <RadioGroup v-model="formData.controlMode">
              <div class="flex items-start space-x-3 space-y-0 p-4 border rounded-lg">
                <RadioGroupItem value="Individual" id="individual" />
                <Label for="individual" class="flex-1 cursor-pointer">
                  <div class="font-medium">{{ t('reminder.groupDialog.controlIndividual') }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ t('reminder.groupDialog.controlIndividualDesc') }}
                  </div>
                </Label>
              </div>
              <div class="flex items-start space-x-3 space-y-0 p-4 border rounded-lg">
                <RadioGroupItem value="Group" id="group" />
                <Label for="group" class="flex-1 cursor-pointer">
                  <div class="font-medium">{{ t('reminder.groupDialog.controlGroup') }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ t('reminder.groupDialog.controlGroupDesc') }}
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>

      <DialogFooter class="shrink-0 border-t p-6 pt-4">
        <Button variant="ghost" @click="close" :disabled="isSaving">
          {{ t('reminder.groupDialog.btnCancel') }}
        </Button>
        <Button variant="default" @click="handleSave" :disabled="!formValid || isSaving">
          {{ t('reminder.groupDialog.btnDone') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  CreateReminderGroupReq,
  ReminderGroupClientDTO,
  UpdateReminderGroupReq,
} from '@dailyuse/contracts/reminder';
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
} from '@lucide/vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import { Textarea } from '@dailyuse/ui-vue-shadcn';
import { RadioGroup, RadioGroupItem } from '@dailyuse/ui-vue-shadcn';
import { Separator } from '@dailyuse/ui-vue-shadcn';
import { Popover, PopoverContent, PopoverTrigger } from '@dailyuse/ui-vue-shadcn';

const props = defineProps<{
  group?: ReminderGroupClientDTO | null;
  saving?: boolean;
}>();

const { t } = useI18n();

const emit = defineEmits<{
  save: [data: CreateReminderGroupReq];
  update: [id: string, data: UpdateReminderGroupReq];
}>();

const visible = ref(false);
const showColorPicker = ref(false);
const isSaving = computed(() => props.saving ?? false);

const formData = reactive({
  name: '',
  description: '',
  icon: 'mdi-folder',
  color: '#2196F3',
  controlMode: 'Individual' as CreateReminderGroupReq['controlMode'],
  order: 0,
});

const colorOptions = [
  '#2196F3',
  '#4CAF50',
  '#FF9800',
  '#F44336',
  '#9C27B0',
  '#E91E63',
  '#00BCD4',
  '#9E9E9E',
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

const isEditMode = computed(() => !!props.group?.id);
const formValid = computed(() => formData.name.trim().length >= 2);

const getIcon = (iconValue: string) => {
  const option = iconOptions.find((opt) => opt.value === iconValue);
  return option?.icon || Folder;
};

const resetForm = () => {
  formData.name = '';
  formData.description = '';
  formData.icon = 'mdi-folder';
  formData.color = '#2196F3';
  formData.controlMode = 'Individual';
  formData.order = 0;
};

const fillForm = (group: ReminderGroupClientDTO) => {
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

const openForEdit = (group: ReminderGroupClientDTO) => {
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
  if (!formValid.value || isSaving.value) return;

  const data: CreateReminderGroupReq = {
    name: formData.name.trim(),
    description: formData.description?.trim() || undefined,
    color: formData.color,
    icon: formData.icon,
    controlMode: formData.controlMode,
    order: formData.order,
  };

  if (isEditMode.value && props.group?.id) {
    emit('update', props.group.id, data);
  } else {
    emit('save', data);
  }
};

defineExpose({
  open,
  openForEdit,
  close,
});
</script>
