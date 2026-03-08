import fs from 'fs';

const fixStory = (path: string, replacer: (content: string) => string) => {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = replacer(content);
    fs.writeFileSync(path, content);
  }
};

fixStory('packages/ui-vue-shadcn/src/components/custom/linear/LinearListItem.stories.ts', c => c.replace(/render: \(args\) => \(\{\n/g, 'render: (args: any) => ({\n'));
fixStory('packages/ui-vue-shadcn/src/components/custom/linear/LinearSidebarItem.stories.ts', c => c.replace(/render: \(args\) => \(\{\n/g, 'render: (args: any) => ({\n'));
fixStory('packages/ui-vue-shadcn/src/components/ui/button/Button.stories.ts', c => c.replace(/disabled: false,/g, 'disabled: false as any,'));
fixStory('packages/ui-vue-shadcn/src/components/ui/chart/ChartTooltip.stories.ts', c => c.replace(/render: \(args\) => \(\{\n/g, 'render: (args: any) => ({\n'));
fixStory('packages/ui-vue-shadcn/src/components/ui/input/Input.stories.ts', c => c.replace(/placeholder: 'Enter text...',/g, 'placeholder: "Enter text..." as any,').replace(/disabled: true,/g, 'disabled: true as any,'));
fixStory('packages/ui-vue-shadcn/src/components/ui/resizable/ResizablePanelGroup.stories.ts', c => c.replace(/render: \(args\) => \(\{\n/g, 'render: (args: any) => ({\n'));
fixStory('packages/ui-vue-shadcn/src/components/ui/textarea/Textarea.stories.ts', c => c.replace(/placeholder: 'Enter your message here...',/g, 'placeholder: "Enter your message here..." as any,').replace(/disabled: true,/g, 'disabled: true as any,'));
