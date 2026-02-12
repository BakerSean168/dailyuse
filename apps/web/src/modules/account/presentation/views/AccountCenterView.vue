<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ProfileCard, ProfileForm } from '@dailyuse/ui-vue';
import type { AccountProfileDTO } from '@dailyuse/contracts/account';
import { useAccount } from '../composables/useAccount';
import { toast } from 'vue-sonner';
import { Button } from '@dailyuse/ui-vue-shadcn/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@dailyuse/ui-vue-shadcn/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@dailyuse/ui-vue-shadcn/components/ui/tabs';

const router = useRouter();
const { currentAccount, isLoading, loadMyProfile, updateMyProfile } = useAccount();

const isEditing = ref(false);

// 从 store 获取 profile 数据
const profile = ref<AccountProfileDTO>({
  nickname: '用户昵称',
  realName: null,
  avatarUrl: null,
  bio: null,
  gender: 'UNSPECIFIED',
  birthday: null,
});

onMounted(async () => {
  await loadMyProfile();
  if (currentAccount.value?.profile) {
    profile.value = { ...currentAccount.value.profile };
  }
});

const handleEdit = () => {
  isEditing.value = true;
};

const handleSave = async (data: AccountProfileDTO) => {
  const success = await updateMyProfile({
    nickname: data.nickname,
    avatar: data.avatarUrl,
    bio: data.bio,
  });

  if (success) {
    profile.value = data;
    isEditing.value = false;
  }
};

const handleCancel = () => {
  isEditing.value = false;
};

const handleUploadAvatar = () => {
  toast.info('功能开发中', { description: '头像上传功能即将推出' });
};

const handleChangePassword = () => {
  router.push('/account/security');
};
</script>

<template>
  <div class="container max-w-6xl mx-auto p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">个人中心</h1>
        <p class="text-muted-foreground">管理您的个人资料和账户设置</p>
      </div>
    </div>
    
    <Tabs default-value="profile" class="w-full">
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="profile">个人资料</TabsTrigger>
        <TabsTrigger value="security">安全设置</TabsTrigger>
        <TabsTrigger value="preferences">偏好设置</TabsTrigger>
      </TabsList>
      
      <!-- 个人资料 Tab -->
      <TabsContent value="profile" class="space-y-6">
        <div v-if="!isEditing" class="space-y-6">
          <ProfileCard
            :profile="profile"
            :loading="isLoading"
            @edit="handleEdit"
          />
        </div>
        
        <div v-else class="flex justify-center">
          <ProfileForm
            :profile="profile"
            :loading="isLoading"
            @save="handleSave"
            @cancel="handleCancel"
            @upload-avatar="handleUploadAvatar"
          />
        </div>
      </TabsContent>
      
      <!-- 安全设置 Tab -->
      <TabsContent value="security" class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>账户安全</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium">登录密码</h4>
                <p class="text-sm text-muted-foreground">定期更新密码以保护账户安全</p>
              </div>
              <Button variant="outline" @click="handleChangePassword">
                修改密码
              </Button>
            </div>
            
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium">两步验证</h4>
                <p class="text-sm text-muted-foreground">为您的账户添加额外的安全保护</p>
              </div>
              <Button variant="outline" disabled>
                启用
              </Button>
            </div>
            
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium">登录设备</h4>
                <p class="text-sm text-muted-foreground">管理您的登录设备和会话</p>
              </div>
              <Button variant="outline" disabled>
                查看
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <!-- 偏好设置 Tab -->
      <TabsContent value="preferences" class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>个性化设置</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium">主题模式</h4>
                <p class="text-sm text-muted-foreground">选择您喜欢的界面主题</p>
              </div>
              <Button variant="outline" disabled>
                切换主题
              </Button>
            </div>
            
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium">语言设置</h4>
                <p class="text-sm text-muted-foreground">更改界面显示语言</p>
              </div>
              <Button variant="outline" disabled>
                中文
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
