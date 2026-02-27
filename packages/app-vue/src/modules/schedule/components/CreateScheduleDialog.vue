<template>
  <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{
          isEditing ? t('schedule.createDialog.titleEdit') : t('schedule.createDialog.titleCreate')
        }}</DialogTitle>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-4">
          <!-- 标题 -->
          <div>
            <Label for="title">{{ t('schedule.createDialog.fieldTitle') }}</Label>
            <Input
              id="title"
              v-model="formData.title"
              :placeholder="t('schedule.createDialog.fieldTitlePlaceholder')"
              maxlength="200"
              required
            />
            <p class="text-sm text-muted-foreground mt-1">{{ formData.title.length }}/200</p>
          </div>

          <!-- 描述 -->
          <div>
            <Label for="description">{{ t('schedule.createDialog.fieldDescription') }}</Label>
            <Textarea
              id="description"
              v-model="formData.description"
              :placeholder="t('schedule.createDialog.fieldDescriptionPlaceholder')"
              rows="3"
              maxlength="1000"
            />
            <p class="text-sm text-muted-foreground mt-1">{{ formData.description.length }}/1000</p>
          </div>

          <!-- 开始时间 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label for="startDate">{{ t('schedule.createDialog.fieldStartDate') }}</Label>
              <Input id="startDate" v-model="formData.startDate" type="date" required />
            </div>
            <div>
              <Label for="startTime">{{ t('schedule.createDialog.fieldStartTime') }}</Label>
              <Input id="startTime" v-model="formData.startTime" type="time" required />
            </div>
          </div>

          <!-- 结束时间 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label for="endDate">{{ t('schedule.createDialog.fieldEndDate') }}</Label>
              <Input id="endDate" v-model="formData.endDate" type="date" required />
            </div>
            <div>
              <Label for="endTime">{{ t('schedule.createDialog.fieldEndTime') }}</Label>
              <Input id="endTime" v-model="formData.endTime" type="time" required />
            </div>
          </div>

          <!-- 优先级 -->
          <div>
            <Label for="priority">{{ t('schedule.createDialog.fieldPriority') }}</Label>
            <Select v-model="formData.priority">
              <SelectTrigger>
                <SelectValue :placeholder="t('schedule.createDialog.fieldPriorityPlaceholder')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{{ t('schedule.createDialog.priorityNone') }}</SelectItem>
                <SelectItem value="1">{{ t('schedule.createDialog.priorityLowest') }}</SelectItem>
                <SelectItem value="2">{{ t('schedule.createDialog.priorityVeryLow') }}</SelectItem>
                <SelectItem value="3">{{ t('schedule.createDialog.priorityLow') }}</SelectItem>
                <SelectItem value="4">{{
                  t('schedule.createDialog.priorityBelowMedium')
                }}</SelectItem>
                <SelectItem value="5">{{ t('schedule.createDialog.priorityMedium') }}</SelectItem>
                <SelectItem value="6">{{
                  t('schedule.createDialog.priorityAboveMedium')
                }}</SelectItem>
                <SelectItem value="7">{{ t('schedule.createDialog.priorityHigh') }}</SelectItem>
                <SelectItem value="8">{{ t('schedule.createDialog.priorityVeryHigh') }}</SelectItem>
                <SelectItem value="9">{{ t('schedule.createDialog.priorityExtreme') }}</SelectItem>
                <SelectItem value="10">{{ t('schedule.createDialog.priorityHighest') }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 自动检测冲突 -->
          <div class="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label for="auto-detect-conflicts" class="text-sm font-medium">{{
                t('schedule.createDialog.autoDetectConflicts')
              }}</Label>
              <p class="text-xs text-muted-foreground">
                {{ t('schedule.createDialog.autoDetectConflictsDescription') }}
              </p>
            </div>
            <Switch
              id="auto-detect-conflicts"
              :checked="formData.autoDetectConflicts"
              @update:checked="formData.autoDetectConflicts = $event"
            />
          </div>

          <!-- 地点 -->
          <div>
            <Label for="location">{{ t('schedule.createDialog.fieldLocation') }}</Label>
            <div class="relative">
              <MapPin class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                v-model="formData.location"
                :placeholder="t('schedule.createDialog.fieldLocationPlaceholder')"
                class="pl-10"
                maxlength="200"
              />
            </div>
            <p class="text-sm text-muted-foreground mt-1">{{ formData.location.length }}/200</p>
          </div>

          <!-- 参与者 -->
          <div>
            <Label>{{ t('schedule.createDialog.fieldAttendees') }}</Label>
            <div class="flex flex-wrap gap-2 mb-2">
              <Badge
                v-for="(attendee, index) in formData.attendees"
                :key="index"
                variant="secondary"
                class="gap-1"
              >
                {{ attendee }}
                <button
                  type="button"
                  @click="removeAttendee(index)"
                  class="hover:bg-destructive/20 rounded-full"
                >
                  <X class="h-3 w-3" />
                </button>
              </Badge>
            </div>
            <div class="flex gap-2">
              <Input
                v-model="newAttendee"
                :placeholder="t('schedule.createDialog.fieldAttendeePlaceholder')"
                @keydown.enter.prevent="addAttendee"
              />
              <Button type="button" variant="outline" size="sm" @click="addAttendee">
                {{ t('schedule.createDialog.addAttendee') }}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose">
            {{ t('common.cancel') }}
          </Button>
          <Button type="submit" :disabled="loading">
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ isEditing ? t('common.save') : t('common.create') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';
import { Textarea } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Switch } from '@dailyuse/ui-vue-shadcn';
import { MapPin, X, Loader2 } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import type { ScheduleJobClientDTO } from '@dailyuse/contracts/schedule';

interface Props {
  modelValue: boolean;
  schedule?: ScheduleJobClientDTO | null;
  loading?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', data: any): void;
}

const props = withDefaults(defineProps<Props>(), {
  schedule: null,
  loading: false,
});

const emit = defineEmits<Emits>();

const { t } = useI18n();

const isEditing = ref(false);
const newAttendee = ref('');

const formData = reactive({
  title: '',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  priority: '' as string,
  location: '',
  attendees: [] as string[],
  autoDetectConflicts: true,
});

function resetForm() {
  formData.title = '';
  formData.description = '';
  formData.startDate = '';
  formData.startTime = '';
  formData.endDate = '';
  formData.endTime = '';
  formData.priority = '';
  formData.location = '';
  formData.attendees = [];
  formData.autoDetectConflicts = true;
  newAttendee.value = '';
}

function handleClose() {
  emit('update:modelValue', false);
  resetForm();
}

function addAttendee() {
  if (newAttendee.value.trim() && !formData.attendees.includes(newAttendee.value.trim())) {
    formData.attendees.push(newAttendee.value.trim());
    newAttendee.value = '';
  }
}

function removeAttendee(index: number) {
  formData.attendees.splice(index, 1);
}

function handleSubmit() {
  const startTimestamp = new Date(`${formData.startDate}T${formData.startTime}`).getTime();
  const endTimestamp = new Date(`${formData.endDate}T${formData.endTime}`).getTime();

  if (startTimestamp >= endTimestamp) {
    alert(t('schedule.confirm.endBeforeStart'));
    return;
  }

  emit('submit', {
    name: formData.title,
    description: formData.description || undefined,
    startTime: startTimestamp,
    endTime: endTimestamp,
    duration: endTimestamp - startTimestamp,
    priority: formData.priority ? Number(formData.priority) : undefined,
    location: formData.location || undefined,
    attendees: formData.attendees.length > 0 ? formData.attendees : undefined,
    autoDetectConflicts: formData.autoDetectConflicts,
  });
}

watch(
  () => props.schedule,
  (schedule) => {
    if (schedule) {
      isEditing.value = true;
      formData.title = schedule.title;
      formData.description = schedule.description || '';
      formData.priority = String(schedule.priority || '');
      formData.location = schedule.location || '';
      formData.attendees = schedule.attendees ? [...schedule.attendees] : [];

      const startDate = new Date(schedule.startTime);
      const endDate = new Date(schedule.endTime);

      formData.startDate = startDate.toISOString().split('T')[0];
      formData.startTime = startDate.toTimeString().slice(0, 5);
      formData.endDate = endDate.toISOString().split('T')[0];
      formData.endTime = endDate.toTimeString().slice(0, 5);
    } else {
      isEditing.value = false;
      resetForm();
    }
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (value) => {
    if (!value) {
      resetForm();
    } else if (!props.schedule) {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      formData.startDate = now.toISOString().split('T')[0];
      formData.startTime = now.toTimeString().slice(0, 5);
      formData.endDate = oneHourLater.toISOString().split('T')[0];
      formData.endTime = oneHourLater.toTimeString().slice(0, 5);
    }
  },
);
</script>
