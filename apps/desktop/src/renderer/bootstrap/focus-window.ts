import { createApp } from 'vue';
import FocusWindowApp from '../focus-window/FocusWindowApp.vue';

export async function bootstrapFocusWindow(): Promise<void> {
  const root = document.querySelector('#app');
  if (!root) throw new Error('FocusWindow root #app is missing');
  createApp(FocusWindowApp).mount(root);
}
