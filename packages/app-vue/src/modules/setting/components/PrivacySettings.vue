<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ t('setting.privacy.title') }}</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Profile Visibility -->
      <div class="space-y-2">
        <Label for="visibility-select">{{ t('setting.privacy.profileVisibility') }}</Label>
        <Select
          :model-value="modelValue.profileVisibility"
          @update:model-value="
            (value) => emit('update:modelValue', { ...modelValue, profileVisibility: value })
          "
        >
          <SelectTrigger id="visibility-select">
            <SelectValue :placeholder="t('setting.privacy.profileVisibilityPlaceholder')" />
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
          {{ visibilityOptions.find((o) => o.value === modelValue.profileVisibility)?.description }}
        </p>
      </div>

      <Separator />

      <!-- Online Status -->
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <Label class="text-base">{{ t('setting.privacy.showOnlineStatus') }}</Label>
          <p class="text-sm text-muted-foreground">
            {{ t('setting.privacy.showOnlineStatusDescription') }}
          </p>
        </div>
        <Switch
          :checked="modelValue.showOnlineStatus"
          @update:checked="
            (value) => emit('update:modelValue', { ...modelValue, showOnlineStatus: value })
          "
        />
      </div>

      <Separator />

      <!-- Search Permissions -->
      <div class="space-y-4">
        <Label class="text-base flex items-center">
          <Search class="h-4 w-4 mr-2" />
          {{ t('setting.privacy.searchPermissions') }}
        </Label>
        <div class="space-y-3">
          <div class="flex items-start justify-between">
            <Label class="text-sm font-normal">{{ t('setting.privacy.allowSearchByEmail') }}</Label>
            <Switch
              :checked="modelValue.allowSearchByEmail"
              @update:checked="
                (value) => emit('update:modelValue', { ...modelValue, allowSearchByEmail: value })
              "
            />
          </div>
          <div class="flex items-start justify-between">
            <Label class="text-sm font-normal">{{ t('setting.privacy.allowSearchByPhone') }}</Label>
            <Switch
              :checked="modelValue.allowSearchByPhone"
              @update:checked="
                (value) => emit('update:modelValue', { ...modelValue, allowSearchByPhone: value })
              "
            />
          </div>
        </div>
        <p class="text-sm text-muted-foreground">
          {{ t('setting.privacy.searchPermissionsDescription') }}
        </p>
      </div>

      <Separator />

      <!-- Data Sharing -->
      <div class="space-y-4">
        <Label class="text-base flex items-center">
          <Database class="h-4 w-4 mr-2" />
          {{ t('setting.privacy.dataSharing') }}
        </Label>
        <div class="flex items-start justify-between">
          <div class="space-y-1">
            <Label class="text-sm font-normal">{{ t('setting.privacy.shareUsageData') }}</Label>
            <p class="text-sm text-muted-foreground">
              {{ t('setting.privacy.shareUsageDataDescription') }}
            </p>
          </div>
          <Switch
            :checked="modelValue.shareUsageData"
            @update:checked="
              (value) => emit('update:modelValue', { ...modelValue, shareUsageData: value })
            "
          />
        </div>
      </div>

      <Separator />

      <!-- Data Management -->
      <div class="space-y-4">
        <Label class="text-base flex items-center">
          <Settings class="h-4 w-4 mr-2" />
          {{ t('setting.privacy.dataManagement') }}
        </Label>
        <div class="grid grid-cols-1 gap-3 @2xl/panel:grid-cols-3">
          <Button variant="outline" class="w-full" @click="emit('exportData')">
            <Download class="h-4 w-4 mr-2" />
            {{ t('setting.privacy.exportData') }}
          </Button>
          <Button variant="outline" class="w-full" @click="emit('clearCache')">
            <Trash2 class="h-4 w-4 mr-2" />
            {{ t('setting.privacy.clearCache') }}
          </Button>
          <Button variant="destructive" class="w-full" @click="emit('deleteAccount')">
            <UserMinus class="h-4 w-4 mr-2" />
            {{ t('setting.privacy.deleteAccount') }}
          </Button>
        </div>
      </div>

      <!-- Privacy Policy -->
      <Alert>
        <Info class="h-4 w-4" />
        <AlertDescription>
          {{ t('setting.privacy.privacyPolicyNotice') }}
          <a href="#" class="text-primary underline">{{
            t('setting.privacy.privacyPolicyLink')
          }}</a>
          {{ t('setting.privacy.privacyPolicyNoticeEnd') }}
        </AlertDescription>
      </Alert>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dailyuse/ui-vue-shadcn';
import { Switch } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Alert, AlertDescription } from '@dailyuse/ui-vue-shadcn';
import { Separator } from '@dailyuse/ui-vue-shadcn';
import {
  Globe,
  Users,
  Lock,
  Search,
  Database,
  Settings,
  Download,
  Trash2,
  UserMinus,
  Info,
} from '@lucide/vue';

const { t } = useI18n();

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
  exportData: [];
  clearCache: [];
  deleteAccount: [];
}>();

const visibilityOptions = computed(() => [
  {
    label: t('setting.privacy.visibilityPublic'),
    value: 'PUBLIC',
    iconComponent: Globe,
    description: t('setting.privacy.visibilityPublicDesc'),
  },
  {
    label: t('setting.privacy.visibilityFriends'),
    value: 'FRIENDS',
    iconComponent: Users,
    description: t('setting.privacy.visibilityFriendsDesc'),
  },
  {
    label: t('setting.privacy.visibilityPrivate'),
    value: 'PRIVATE',
    iconComponent: Lock,
    description: t('setting.privacy.visibilityPrivateDesc'),
  },
]);
</script>
