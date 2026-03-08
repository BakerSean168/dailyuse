import fs from 'fs';

const useCarouselPath = 'packages/ui-vue-shadcn/src/components/ui/carousel/useCarousel.ts';
let useCarouselContent = fs.readFileSync(useCarouselPath, 'utf8');
useCarouselContent = useCarouselContent.replace(/export function useProvideCarousel\(/g, 'export function useProvideCarousel(carouselProps: any, emits: any): any');
useCarouselContent = useCarouselContent.replace(/export function useCarousel\(/g, 'export function useCarousel(): any');
fs.writeFileSync(useCarouselPath, useCarouselContent);
