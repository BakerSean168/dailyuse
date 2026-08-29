import { createApp } from 'vue';
import InterventionWindowApp from '../intervention-window/InterventionWindowApp.vue';

export async function bootstrapInterventionWindow(): Promise<void> {
  const root = document.querySelector<HTMLElement>('#app');
  if (!root) throw new Error('InterventionWindow root #app is missing');
  createApp(InterventionWindowApp).mount(root);
}
