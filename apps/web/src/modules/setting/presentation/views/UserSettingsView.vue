<script setup lang="ts">
/**
 * UserSettingsView - 用户设置视图
 *
 * Refactored to use Shadcn UI + Tailwind CSS (Linear Style).
 * Sidebar layout for navigation.
 */
import { ref } from 'vue';
import {
  Button,
  ScrollArea,
  Separator,
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@dailyuse/ui-vue-shadcn';
import {
  Palette,
  Globe,
  Workflow,
  Database,
  FileEdit,
  Keyboard,
  Shield,
  FlaskConical,
  Bot,
  Settings as SettingsIcon
} from 'lucide-vue-next';

// --- State ---
const activeSection = ref('appearance');

// --- Navigation ---
const navItems = [
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'locale', label: 'Language & Region', icon: Globe },
  { key: 'workflow', label: 'Workflow', icon: Workflow },
  { key: 'repository', label: 'Repository', icon: Database },
  { key: 'editor', label: 'Editor', icon: FileEdit },
  { key: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { key: 'privacy', label: 'Privacy', icon: Shield },
  { key: 'experimental', label: 'Experimental', icon: FlaskConical },
  { key: 'ai', label: 'AI Services', icon: Bot },
  { key: 'advanced', label: 'Advanced', icon: SettingsIcon },
];

</script>

<template>
  <div class="flex h-screen bg-background text-foreground overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-64 border-r flex flex-col bg-sidebar">
      <div class="p-6 pb-4">
        <h2 class="text-lg font-semibold tracking-tight">Settings</h2>
        <p class="text-sm text-muted-foreground">Manage your workspace preferences</p>
      </div>
      <ScrollArea class="flex-1 px-4">
        <div class="space-y-1">
          <Button
            v-for="item in navItems"
            :key="item.key"
            variant="ghost"
            class="w-full justify-start font-normal"
            :class="activeSection === item.key ? 'bg-sidebar-accent text-sidebar-primary' : 'text-muted-foreground'"
            @click="activeSection = item.key"
          >
            <component :is="item.icon" class="mr-2 h-4 w-4" />
            {{ item.label }}
          </Button>
        </div>
      </ScrollArea>
    </aside>

    <!-- Content -->
    <main class="flex-1 overflow-auto bg-background">
      <div class="max-w-3xl mx-auto p-8">
        <div class="mb-6">
          <h1 class="text-2xl font-bold capitalize">{{ activeSection }}</h1>
          <p class="text-muted-foreground">Manage your {{ activeSection }} settings.</p>
        </div>
        <Separator class="mb-6" />

        <!-- Placeholder for actual settings components -->
        <Card>
          <CardHeader>
            <CardTitle>Settings Area</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground mb-4">
              The settings components for <strong class="text-foreground">{{ activeSection }}</strong> are pending refactor.
            </p>
            <div class="p-4 border border-dashed rounded-lg bg-secondary/20 flex items-center justify-center text-sm text-muted-foreground h-32">
              Component Placeholder
            </div>
            <!-- TODO: Re-implement specific setting components: AppearanceSettings, etc. -->
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
</template>
