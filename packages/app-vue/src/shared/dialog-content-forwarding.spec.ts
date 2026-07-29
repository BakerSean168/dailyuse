import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  Dialog as AppDialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@memoflow/ui-vue-shadcn';

const DialogHost = defineComponent({
  components: {
    AppDialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
  },
  template: `
    <AppDialog :open="true">
      <DialogContent data-testid="forwarded-dialog" aria-label="Forwarded dialog content">
        <DialogTitle>Forwarded dialog title</DialogTitle>
        <DialogDescription>Forwarded dialog description</DialogDescription>
        hello
      </DialogContent>
    </AppDialog>
  `,
});

const AlertDialogHost = defineComponent({
  components: {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
  },
  template: `
    <AlertDialog :open="true">
      <AlertDialogContent data-testid="forwarded-alert-dialog" aria-label="Forwarded alert dialog content">
        <AlertDialogTitle>Forwarded alert dialog title</AlertDialogTitle>
        <AlertDialogDescription>Forwarded alert dialog description</AlertDialogDescription>
        hello
      </AlertDialogContent>
    </AlertDialog>
  `,
});

describe('DialogContent attr forwarding', () => {
  it('forwards non-prop attrs to the rendered dialog node', async () => {
    const wrapper = mount(DialogHost, {
      attachTo: document.body,
    });

    await nextTick();

    const dialog = document.body.querySelector('[data-testid="forwarded-dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('aria-label')).toBe('Forwarded dialog content');

    wrapper.unmount();
  });

  it('forwards non-prop attrs to the rendered alert dialog node', async () => {
    const wrapper = mount(AlertDialogHost, {
      attachTo: document.body,
    });

    await nextTick();

    const dialog = document.body.querySelector('[data-testid="forwarded-alert-dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('aria-label')).toBe('Forwarded alert dialog content');

    wrapper.unmount();
  });
});
