<script setup lang="ts">
/**
 * AccountCenterView - 个人中心视图
 *
 * Refactored to use Shadcn UI + Tailwind CSS (Linear Style).
 * Replaces external ui-vue components with direct Shadcn usage.
 */
import { ref } from 'vue';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  Label,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Separator,
  Badge
} from '@dailyuse/ui-vue-shadcn';
import { User, Bell, Shield, Camera } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

// --- Mock Data ---
const profile = ref({
  nickname: 'Jules',
  email: 'jules@dailyuse.app',
  bio: 'AI Assistant & Developer',
  avatarUrl: '',
  role: 'Admin'
});

const isEditing = ref(false);
const isLoading = ref(false);

const handleSave = () => {
  isLoading.value = true;
  setTimeout(() => {
    isLoading.value = false;
    isEditing.value = false;
    toast.success('Profile updated successfully');
  }, 1000);
};

const handleAvatarClick = () => {
  toast.info('Upload avatar feature coming soon');
};

</script>

<template>
  <div class="container max-w-4xl mx-auto py-10 px-4">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p class="text-muted-foreground mt-1">Manage your account profile and security preferences.</p>
      </div>
    </div>

    <Tabs default-value="general" class="space-y-6">
      <TabsList>
        <TabsTrigger value="general" class="flex items-center gap-2">
          <User class="h-4 w-4" />
          General
        </TabsTrigger>
        <TabsTrigger value="security" class="flex items-center gap-2">
          <Shield class="h-4 w-4" />
          Security
        </TabsTrigger>
        <TabsTrigger value="notifications" class="flex items-center gap-2">
          <Bell class="h-4 w-4" />
          Notifications
        </TabsTrigger>
      </TabsList>

      <!-- General Tab -->
      <TabsContent value="general" class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your photo and personal details.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <!-- Avatar Section -->
            <div class="flex items-center gap-6">
              <div class="relative group cursor-pointer" @click="handleAvatarClick">
                <Avatar class="h-24 w-24 border-2 border-border">
                  <AvatarImage :src="profile.avatarUrl" />
                  <AvatarFallback class="text-2xl">JU</AvatarFallback>
                </Avatar>
                <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera class="h-8 w-8 text-white" />
                </div>
              </div>
              <div class="space-y-1">
                <h3 class="font-medium">Profile Photo</h3>
                <p class="text-sm text-muted-foreground">Click to upload a new photo. JPG or PNG. Max 2MB.</p>
                <Badge variant="secondary" class="mt-2">{{ profile.role }}</Badge>
              </div>
            </div>

            <Separator />

            <!-- Form Fields -->
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <Label for="nickname">Display Name</Label>
                <Input id="nickname" v-model="profile.nickname" :disabled="!isEditing" />
              </div>
              <div class="space-y-2">
                <Label for="email">Email</Label>
                <Input id="email" v-model="profile.email" disabled />
              </div>
              <div class="space-y-2 md:col-span-2">
                <Label for="bio">Bio</Label>
                <Input id="bio" v-model="profile.bio" :disabled="!isEditing" placeholder="Tell us a little about yourself" />
              </div>
            </div>
          </CardContent>
          <CardFooter class="flex justify-end gap-2 border-t px-6 py-4 bg-secondary/10">
            <Button v-if="!isEditing" variant="outline" @click="isEditing = true">Edit Profile</Button>
            <template v-else>
              <Button variant="ghost" @click="isEditing = false">Cancel</Button>
              <Button @click="handleSave" :disabled="isLoading">Save Changes</Button>
            </template>
          </CardFooter>
        </Card>
      </TabsContent>

      <!-- Security Tab Placeholder -->
      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your password and 2FA.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
             <div class="flex items-center justify-between py-4">
              <div class="space-y-1">
                <h4 class="text-sm font-medium">Password</h4>
                <p class="text-sm text-muted-foreground">Last changed 3 months ago</p>
              </div>
              <Button variant="outline">Change Password</Button>
            </div>
            <Separator />
            <div class="flex items-center justify-between py-4">
              <div class="space-y-1">
                <h4 class="text-sm font-medium">Two-Factor Authentication</h4>
                <p class="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Button variant="outline" disabled>Enable 2FA</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Notifications Tab Placeholder -->
      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose what you want to be notified about.</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="p-8 text-center text-muted-foreground">
              Notification settings coming soon.
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
