<script setup lang="ts">
/**
 * AuthView - 认证视图
 *
 * Refactored to use Shadcn UI + Tailwind CSS (Linear Style).
 * Replaces external ui-vue components with direct Shadcn usage.
 */
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Input,
  Label,
  Separator
} from '@dailyuse/ui-vue-shadcn';
import { Github, Chrome, Mail } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

const router = useRouter();
const isLoading = ref(false);

const email = ref('');
const password = ref('');

const handleLogin = async () => {
  isLoading.value = true;
  // Mock login
  setTimeout(() => {
    isLoading.value = false;
    toast.success('Welcome back!');
    router.push('/');
  }, 1000);
};

const handleRegister = async () => {
  isLoading.value = true;
  // Mock register
  setTimeout(() => {
    isLoading.value = false;
    toast.success('Account created!');
    router.push('/');
  }, 1000);
};

const handleSocialLogin = (provider: string) => {
  toast.info(`Login with ${provider} coming soon`);
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
    <!-- Background Pattern (Optional) -->
    <div class="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

    <Card class="w-[400px] shadow-lg border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader class="space-y-1 text-center">
        <div class="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
          <span class="text-2xl font-bold text-primary">D</span>
        </div>
        <CardTitle class="text-2xl font-semibold tracking-tight">DailyUse</CardTitle>
        <CardDescription>
          Enter your email below to verify your account
        </CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4">
        <Tabs default-value="login" class="w-full">
          <TabsList class="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <div class="grid gap-4">
              <div class="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" v-model="email" />
              </div>
              <div class="grid gap-2">
                <div class="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" class="text-xs text-muted-foreground hover:underline">Forgot password?</a>
                </div>
                <Input id="password" type="password" v-model="password" />
              </div>
              <Button class="w-full" :disabled="isLoading" @click="handleLogin">
                <template v-if="isLoading">Loading...</template>
                <template v-else>Sign In</template>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="register">
             <div class="grid gap-4">
              <div class="grid gap-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" type="email" placeholder="m@example.com" />
              </div>
              <div class="grid gap-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input id="reg-password" type="password" />
              </div>
               <div class="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button class="w-full" :disabled="isLoading" @click="handleRegister">
                Create Account
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t" />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <Button variant="outline" @click="handleSocialLogin('Github')">
            <Github class="mr-2 h-4 w-4" />
            Github
          </Button>
          <Button variant="outline" @click="handleSocialLogin('Google')">
            <Chrome class="mr-2 h-4 w-4" />
            Google
          </Button>
        </div>
      </CardContent>
      <CardFooter class="justify-center text-xs text-muted-foreground">
        By clicking continue, you agree to our Terms of Service and Privacy Policy.
      </CardFooter>
    </Card>
  </div>
</template>
