import fs from 'fs';

const fixStory = (path: string, replacer: (content: string) => string) => {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = replacer(content);
    fs.writeFileSync(path, content);
  }
};

// We need to bypass `satisfies Meta<typeof Component>`
fixStory('packages/ui-vue-shadcn/src/components/ui/button/Button.stories.ts', c => c.replace(/\} satisfies Meta<typeof Button>;/g, '} as Meta<typeof Button>;'));
fixStory('packages/ui-vue-shadcn/src/components/ui/input/Input.stories.ts', c => c.replace(/\} satisfies Meta<typeof Input>;/g, '} as Meta<typeof Input>;'));
fixStory('packages/ui-vue-shadcn/src/components/ui/textarea/Textarea.stories.ts', c => c.replace(/\} satisfies Meta<typeof Textarea>;/g, '} as Meta<typeof Textarea>;'));
fixStory('packages/ui-vue-shadcn/src/components/ui/chart/ChartTooltip.stories.ts', c => c.replace(/\} satisfies Meta<typeof ChartTooltip>;/g, '} as Meta<typeof ChartTooltip>;'));
fixStory('packages/ui-vue-shadcn/src/components/custom/linear/LinearListItem.stories.ts', c => c.replace(/\} satisfies Meta<typeof LinearListItem>;/g, '} as Meta<typeof LinearListItem>;'));
fixStory('packages/ui-vue-shadcn/src/components/custom/linear/LinearSidebarItem.stories.ts', c => c.replace(/\} satisfies Meta<typeof LinearSidebarItem>;/g, '} as Meta<typeof LinearSidebarItem>;'));
fixStory('packages/ui-vue-shadcn/src/components/ui/resizable/ResizablePanelGroup.stories.ts', c => c.replace(/\} satisfies Meta<typeof ResizablePanelGroup>;/g, '} as Meta<typeof ResizablePanelGroup>;'));
