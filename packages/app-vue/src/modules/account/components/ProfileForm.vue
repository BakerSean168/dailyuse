<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fromDate, getLocalTimeZone, type DateValue } from '@internationalized/date';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import { Textarea } from '@dailyuse/ui-vue-shadcn';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@dailyuse/ui-vue-shadcn';
import { Avatar, AvatarImage, AvatarFallback } from '@dailyuse/ui-vue-shadcn';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@dailyuse/ui-vue-shadcn';
import { Calendar } from '@dailyuse/ui-vue-shadcn';
import { Popover, PopoverContent, PopoverTrigger } from '@dailyuse/ui-vue-shadcn';
import type { AccountProfileDTO, GenderType } from '@dailyuse/contracts/account';

interface ProfileFormProps {
  profile: AccountProfileDTO;
  loading?: boolean;
  showCancel?: boolean;
}

interface ProfileFormEmits {
  (e: 'save', data: AccountProfileDTO): void;
  (e: 'cancel'): void;
  (e: 'uploadAvatar'): void;
}

const props = withDefaults(defineProps<ProfileFormProps>(), {
  loading: false,
  showCancel: true,
});

const emit = defineEmits<ProfileFormEmits>();

const formData = ref<AccountProfileDTO>({ ...props.profile });
const timeZone = getLocalTimeZone();

watch(
  () => props.profile,
  (newProfile) => {
    formData.value = { ...newProfile };
  }
);

const initials = computed(() => {
  if (formData.value.realName) {
    return formData.value.realName.slice(0, 2).toUpperCase();
  }
  return formData.value.nickname.slice(0, 2).toUpperCase();
});

const formatDate = (date: number | null) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN');
  } catch {
    return '';
  }
};

const handleSave = () => {
  if (props.loading) return;
  emit('save', formData.value);
};

const handleCancel = () => {
  emit('cancel');
};

const handleUploadAvatar = () => {
  emit('uploadAvatar');
};

const calendarValue = computed<DateValue | undefined>(() => {
  if (!formData.value.birthday) return undefined;
  return fromDate(new Date(formData.value.birthday), timeZone);
});

const handleDateSelect = (date: DateValue | undefined) => {
  if (!date) {
    formData.value.birthday = null;
    return;
  }
  formData.value.birthday = date.toDate(timeZone).getTime();
};

const realNameValue = computed({
  get: () => formData.value.realName ?? '',
  set: (value: string) => {
    formData.value.realName = value.trim() ? value : null;
  }
});

const bioValue = computed({
  get: () => formData.value.bio ?? '',
  set: (value: string) => {
    formData.value.bio = value.trim() ? value : null;
  }
});
</script>

<template>
  <Card class="w-full max-w-2xl">
    <CardHeader>
      <CardTitle>编辑个人资料</CardTitle>
    </CardHeader>
    
    <CardContent class="space-y-6">
      <!-- Avatar -->
      <div class="flex items-center space-x-4">
        <Avatar class="h-20 w-20">
          <AvatarImage v-if="formData.avatarUrl" :src="formData.avatarUrl" :alt="formData.nickname" />
          <AvatarFallback>{{ initials }}</AvatarFallback>
        </Avatar>
        <div class="space-y-1">
          <Button
            variant="outline"
            size="sm"
            :disabled="loading"
            @click="handleUploadAvatar"
          >
            更换头像
          </Button>
          <p class="text-xs text-muted-foreground">
            推荐尺寸: 200x200
          </p>
        </div>
      </div>
      
      <!-- Nickname -->
      <div class="space-y-2">
        <Label for="nickname">昵称</Label>
        <Input
          id="nickname"
          v-model="formData.nickname"
          type="text"
          placeholder="请输入昵称"
          :disabled="loading"
        />
      </div>
      
      <!-- Real Name -->
      <div class="space-y-2">
        <Label for="realName">真实姓名</Label>
        <Input
          id="realName"
          v-model="realNameValue"
          type="text"
          placeholder="请输入真实姓名（可选）"
          :disabled="loading"
        />
      </div>
      
      <!-- Bio -->
      <div class="space-y-2">
        <Label for="bio">个人简介</Label>
        <Textarea
          id="bio"
          v-model="bioValue"
          placeholder="介绍一下自己吧..."
          rows="4"
          :disabled="loading"
        />
      </div>
      
      <!-- Gender -->
      <div class="space-y-2">
        <Label for="gender">性别</Label>
        <Select v-model="formData.gender" :disabled="loading">
          <SelectTrigger id="gender">
            <SelectValue placeholder="请选择性别" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MALE">男</SelectItem>
            <SelectItem value="FEMALE">女</SelectItem>
            <SelectItem value="OTHER">其他</SelectItem>
            <SelectItem value="UNSPECIFIED">不设置</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <!-- Birthday -->
      <div class="space-y-2">
        <Label for="birthday">生日</Label>
        <Popover>
          <PopoverTrigger as-child>
            <Button
              id="birthday"
              variant="outline"
              class="w-full justify-start text-left font-normal"
              :disabled="loading"
            >
              {{ formatDate(formData.birthday) || '选择日期' }}
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0">
            <Calendar
              :model-value="calendarValue"
              @update:model-value="handleDateSelect"
            />
          </PopoverContent>
        </Popover>
      </div>
    </CardContent>
    
    <CardFooter class="flex justify-end space-x-2">
      <Button
        v-if="showCancel"
        variant="outline"
        :disabled="loading"
        @click="handleCancel"
      >
        取消
      </Button>
      <Button
        :disabled="loading"
        @click="handleSave"
      >
        {{ loading ? '保存中...' : '保存' }}
      </Button>
    </CardFooter>
  </Card>
</template>
