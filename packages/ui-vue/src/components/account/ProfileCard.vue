<script setup lang="ts">
import { computed } from 'vue';
import {
  Card,
  CardHeader,
  CardContent,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge,
  Button
} from '@dailyuse/ui-vue-shadcn';
import type { AccountProfileDTO } from '@dailyuse/contracts/account';

interface ProfileCardProps {
  profile: AccountProfileDTO;
  showEditButton?: boolean;
  loading?: boolean;
}

interface ProfileCardEmits {
  (e: 'edit'): void;
}

const props = withDefaults(defineProps<ProfileCardProps>(), {
  showEditButton: true,
  loading: false,
});

const emit = defineEmits<ProfileCardEmits>();

const initials = computed(() => {
  if (props.profile.realName) {
    return props.profile.realName.slice(0, 2).toUpperCase();
  }
  return props.profile.nickname.slice(0, 2).toUpperCase();
});

const genderText = computed(() => {
  switch (props.profile.gender) {
    case 'MALE':
      return '男';
    case 'FEMALE':
      return '女';
    case 'OTHER':
      return '其他';
    default:
      return '未设置';
  }
});

const formatBirthday = (birthday: number | null) => {
  if (!birthday) return '未设置';
  try {
    const date = new Date(birthday);
    return date.toLocaleDateString('zh-CN');
  } catch {
    return '未设置';
  }
};

const handleEdit = () => {
  emit('edit');
};
</script>

<template>
  <Card class="w-full">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
      <div class="flex items-center space-x-4">
        <Avatar class="h-16 w-16">
          <AvatarImage v-if="profile.avatarUrl" :src="profile.avatarUrl" :alt="profile.nickname" />
          <AvatarFallback>{{ initials }}</AvatarFallback>
        </Avatar>
        <div>
          <h3 class="text-2xl font-bold">{{ profile.nickname }}</h3>
          <p v-if="profile.realName" class="text-sm text-muted-foreground">
            {{ profile.realName }}
          </p>
        </div>
      </div>
      <Button
        v-if="showEditButton"
        variant="outline"
        size="sm"
        :disabled="loading"
        @click="handleEdit"
      >
        编辑资料
      </Button>
    </CardHeader>
    
    <CardContent class="space-y-4">
      <div v-if="profile.bio" class="space-y-2">
        <h4 class="text-sm font-medium text-muted-foreground">个人简介</h4>
        <p class="text-sm">{{ profile.bio }}</p>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <h4 class="text-sm font-medium text-muted-foreground">性别</h4>
          <Badge variant="secondary">{{ genderText }}</Badge>
        </div>
        
        <div class="space-y-1">
          <h4 class="text-sm font-medium text-muted-foreground">生日</h4>
          <p class="text-sm">{{ formatBirthday(profile.birthday) }}</p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
