<template>
  <Card>
    <CardHeader>
      <CardTitle>隐私设置</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Profile Visibility -->
      <div class="space-y-2">
        <Label for="visibility-select">个人资料可见性</Label>
        <Select
          :model-value="modelValue.profileVisibility"
          @update:model-value="(value) => emit('update:modelValue', { ...modelValue, profileVisibility: value })"
        >
          <SelectTrigger id="visibility-select">
            <SelectValue placeholder="选择可见性" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in visibilityOptions"
              :key="option.value"
              :value="option.value"
            >
              <div class="flex items-center space-x-2">
                <component :is="option.iconComponent" class="h-4 w-4" />
                <span>{{ option.label }}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p class="text-sm text-muted-foreground">
          {{ visibilityOptions.find(o => o.value === modelValue.profileVisibility)?.description }}
        </p>
      </div>

      <Separator />

      <!-- Online Status -->
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <Label class="text-base">显示在线状态</Label>
          <p class="text-sm text-muted-foreground">让其他用户看到您的在线状态</p>
        </div>
        <Switch
          :checked="modelValue.showOnlineStatus"
          @update:checked="(value) => emit('update:modelValue', { ...modelValue, showOnlineStatus: value })"
        />
      </div>

      <Separator />

      <!-- Search Permissions -->
      <div class="space-y-4">
        <Label class="text-base flex items-center">
          <Search class="h-4 w-4 mr-2" />
          搜索权限
        </Label>
        <div class="space-y-3">
          <div class="flex items-start justify-between">
            <Label class="text-sm font-normal">允许通过邮箱搜索</Label>
            <Switch
              :checked="modelValue.allowSearchByEmail"
              @update:checked="(value) => emit('update:modelValue', { ...modelValue, allowSearchByEmail: value })"
            />
          </div>
          <div class="flex items-start justify-between">
            <Label class="text-sm font-normal">允许通过手机号搜索</Label>
            <Switch
              :checked="modelValue.allowSearchByPhone"
              @update:checked="(value) => emit('update:modelValue', { ...modelValue, allowSearchByPhone: value })"
            />
          </div>
        </div>
        <p class="text-sm text-muted-foreground">控制其他用户是否可以通过您的联系方式找到您</p>
      </div>

      <Separator />

      <!-- Data Sharing -->
      <div class="space-y-4">
        <Label class="text-base flex items-center">
          <Database class="h-4 w-4 mr-2" />
          数据共享
        </Label>
        <div class="flex items-start justify-between">
          <div class="space-y-1">
            <Label class="text-sm font-normal">共享使用数据</Label>
            <p class="text-sm text-muted-foreground">帮助我们改进产品，您的数据将被匿名化处理</p>
          </div>
          <Switch
            :checked="modelValue.shareUsageData"
            @update:checked="(value) => emit('update:modelValue', { ...modelValue, shareUsageData: value })"
          />
        </div>
      </div>

      <Separator />

      <!-- Data Management -->
      <div class="space-y-4">
        <Label class="text-base flex items-center">
          <Settings class="h-4 w-4 mr-2" />
          数据管理
        </Label>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button variant="outline" class="w-full" @click="emit('exportData')">
            <Download class="h-4 w-4 mr-2" />
            导出数据
          </Button>
          <Button variant="outline" class="w-full" @click="emit('clearCache')">
            <Trash2 class="h-4 w-4 mr-2" />
            清除缓存
          </Button>
          <Button variant="destructive" class="w-full" @click="emit('deleteAccount')">
            <UserMinus class="h-4 w-4 mr-2" />
            删除账户
          </Button>
        </div>
      </div>

      <!-- Privacy Policy -->
      <Alert>
        <Info class="h-4 w-4" />
        <AlertDescription>
          您的隐私对我们很重要。查看我们的
          <a href="#" class="text-primary underline">隐私政策</a>
          了解更多关于我们如何保护您的数据。
        </AlertDescription>
      </Alert>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@dailyuse/ui-vue-shadcn';
import { Switch } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Alert, AlertDescription } from '@dailyuse/ui-vue-shadcn';
import { Separator } from '@dailyuse/ui-vue-shadcn';
import { Globe, Users, Lock, Search, Database, Settings, Download, Trash2, UserMinus, Info } from 'lucide-vue-next';

interface PrivacySettings {
  profileVisibility?: string;
  showOnlineStatus?: boolean;
  allowSearchByEmail?: boolean;
  allowSearchByPhone?: boolean;
  shareUsageData?: boolean;
}

interface Props {
  modelValue: PrivacySettings;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: PrivacySettings];
  'exportData': [];
  'clearCache': [];
  'deleteAccount': [];
}>();

const visibilityOptions = [
  {
    label: '公开',
    value: 'PUBLIC',
    iconComponent: Globe,
    description: '所有人都可以查看您的资料',
  },
  {
    label: '好友',
    value: 'FRIENDS',
    iconComponent: Users,
    description: '只有您的好友可以查看',
  },
  {
    label: '私密',
    value: 'PRIVATE',
    iconComponent: Lock,
    description: '只有您自己可以查看',
  },
];
</script>
