import fs from 'fs';

const fixStory = (path: string, replacer: (content: string) => string) => {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = replacer(content);
    fs.writeFileSync(path, content);
  }
};

// Fix the carousel inference issue by explicitly typing meta
fixStory('packages/ui-vue-shadcn/src/components/ui/carousel/Carousel.stories.ts', c => c.replace(/const meta = \{/g, 'const meta: any = {'));

// Fix skeleton issue
fixStory('packages/ui-vue-shadcn/src/components/ui/skeleton/Skeleton.stories.ts', c => c.replace(/const meta = \{/g, 'const meta: any = {'));
