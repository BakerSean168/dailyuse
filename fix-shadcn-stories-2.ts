import fs from 'fs';

const fixStory = (path: string, replacer: (content: string) => string) => {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = replacer(content);
    fs.writeFileSync(path, content);
  }
};

fixStory('packages/ui-vue-shadcn/src/components/custom/linear/LinearListItem.stories.ts', c => c.replace(/render: \(\) => \(\{\n/g, 'render: (args: any) => ({\n'));
fixStory('packages/ui-vue-shadcn/src/components/custom/linear/LinearSidebarItem.stories.ts', c => c.replace(/render: \(\) => \(\{\n/g, 'render: (args: any) => ({\n'));
fixStory('packages/ui-vue-shadcn/src/components/ui/button/Button.stories.ts', c => c.replace(/disabled: false as any,/g, ''));
fixStory('packages/ui-vue-shadcn/src/components/ui/input/Input.stories.ts', c => c.replace(/placeholder: "Enter text..." as any,/g, '').replace(/disabled: true as any,/g, ''));
fixStory('packages/ui-vue-shadcn/src/components/ui/textarea/Textarea.stories.ts', c => c.replace(/placeholder: "Enter your message here..." as any,/g, '').replace(/disabled: true as any,/g, ''));
