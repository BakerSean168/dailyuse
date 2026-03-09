import fs from 'fs';

const fixStory = (path: string, replacer: (content: string) => string) => {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = replacer(content);
    fs.writeFileSync(path, content);
  }
};

// Instead of passing it via `args` property, just assert the whole object as `any` to prevent Storybook type matching errors.
const assertAnyExport = (path: string) => {
  fixStory(path, c => c.replace(/export const ([a-zA-Z0-9_]+): Story = \{/g, 'export const $1: Story = { ...({} as any), '));
};

assertAnyExport('packages/ui-vue-shadcn/src/components/custom/linear/LinearListItem.stories.ts');
assertAnyExport('packages/ui-vue-shadcn/src/components/custom/linear/LinearSidebarItem.stories.ts');
assertAnyExport('packages/ui-vue-shadcn/src/components/ui/button/Button.stories.ts');
assertAnyExport('packages/ui-vue-shadcn/src/components/ui/chart/ChartTooltip.stories.ts');
assertAnyExport('packages/ui-vue-shadcn/src/components/ui/input/Input.stories.ts');
assertAnyExport('packages/ui-vue-shadcn/src/components/ui/resizable/ResizablePanelGroup.stories.ts');
assertAnyExport('packages/ui-vue-shadcn/src/components/ui/textarea/Textarea.stories.ts');

// Also fix `args: {` to `args: { ...({} as any),` where needed in meta
const assertAnyMeta = (path: string) => {
  fixStory(path, c => c.replace(/args: \{/g, 'args: { ...({} as any),'));
};
assertAnyMeta('packages/ui-vue-shadcn/src/components/ui/button/Button.stories.ts');
assertAnyMeta('packages/ui-vue-shadcn/src/components/ui/input/Input.stories.ts');
assertAnyMeta('packages/ui-vue-shadcn/src/components/ui/textarea/Textarea.stories.ts');
