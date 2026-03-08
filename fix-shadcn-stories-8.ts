import fs from 'fs';

const useCarouselPath = 'packages/ui-vue-shadcn/src/components/ui/carousel/useCarousel.ts';
let useCarouselContent = fs.readFileSync(useCarouselPath, 'utf8');
useCarouselContent = "import type { EmblaCarouselType } from 'embla-carousel';\n" + useCarouselContent;
fs.writeFileSync(useCarouselPath, useCarouselContent);

const vueCarouselPath = 'packages/ui-vue-shadcn/src/components/ui/carousel/Carousel.vue';
let vueCarouselContent = fs.readFileSync(vueCarouselPath, 'utf8');
vueCarouselContent = vueCarouselContent.replace(/<script setup lang="ts">/, "<script setup lang=\"ts\">\nimport type { EmblaCarouselType } from 'embla-carousel';\n");
fs.writeFileSync(vueCarouselPath, vueCarouselContent);
