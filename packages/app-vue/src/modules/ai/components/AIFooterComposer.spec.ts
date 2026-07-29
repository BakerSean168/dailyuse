/** @vitest-environment jsdom */
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { productionLocaleMessages } from '../../../locales/production-messages';
import AIFooterComposer from './AIFooterComposer.vue';

vi.mock('@memoflow/ui-vue-shadcn', async () => {
  const vue = await import('vue');
  const passthrough = (name: string) =>
    vue.defineComponent({
      name,
      inheritAttrs: false,
      setup(_, { slots, attrs, emit }) {
        return () =>
          vue.h(
            name.startsWith('Button') ? 'button' : 'div',
            {
              ...attrs,
              type: name.startsWith('Button') ? 'button' : undefined,
              onClick: (e: Event) => {
                emit('click', e);
              },
            },
            slots.default?.(),
          );
      },
    });
  return {
    Button: passthrough('ButtonStub'),
    DropdownMenu: passthrough('DropdownMenuStub'),
    DropdownMenuTrigger: passthrough('DropdownMenuTriggerStub'),
    DropdownMenuContent: passthrough('DropdownMenuContentStub'),
    DropdownMenuItem: passthrough('DropdownMenuItemStub'),
    DropdownMenuSeparator: passthrough('DropdownMenuSeparatorStub'),
    Select: passthrough('SelectStub'),
    SelectTrigger: passthrough('SelectTriggerStub'),
    SelectValue: passthrough('SelectValueStub'),
    SelectContent: passthrough('SelectContentStub'),
    SelectGroup: passthrough('SelectGroupStub'),
    SelectLabel: passthrough('SelectLabelStub'),
    SelectItem: passthrough('SelectItemStub'),
  };
});

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: productionLocaleMessages,
});

function mountComposer(
  props: Partial<{
    modelValue: string;
    loading: boolean;
    canSend: boolean;
    toolButtonLabel: string;
    modelGroups: Array<{
      providerId: string;
      providerName: string;
      models: Array<{ key: string; modelName: string }>;
    }>;
    selectedModelKey: string;
    density: 'comfortable' | 'compact' | 'icon';
  }> = {},
) {
  return mount(AIFooterComposer, {
    props: {
      modelValue: '',
      loading: false,
      canSend: true,
      toolButtonLabel: 'Chat',
      modelGroups: [
        {
          providerId: 'p1',
          providerName: 'Provider',
          models: [{ key: 'm1', modelName: 'Model 1' }],
        },
      ],
      selectedModelKey: 'm1',
      density: 'comfortable',
      ...props,
    },
    global: {
      plugins: [i18n],
      stubs: {
        Sparkles: true,
        MessageSquare: true,
        Search: true,
        NotebookPen: true,
        WandSparkles: true,
        BarChart3: true,
        ClipboardCheck: true,
        AlertTriangle: true,
        ArrowUp: true,
        Square: true,
      },
    },
  });
}

describe('AIFooterComposer (Global Composer input)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends on Enter and keeps Shift+Enter as newline', async () => {
    const wrapper = mountComposer({ modelValue: 'hello' });
    const textarea = wrapper.get('[data-testid="ai-chat-composer"]');

    await textarea.trigger('keydown', { key: 'Enter', shiftKey: false });
    expect(wrapper.emitted('send')).toHaveLength(1);

    await textarea.trigger('keydown', { key: 'Enter', shiftKey: true });
    expect(wrapper.emitted('send')).toHaveLength(1);
    wrapper.unmount();
  });

  it('does not send while IME composition is active', async () => {
    const wrapper = mountComposer({ modelValue: '你好' });
    const textarea = wrapper.get('[data-testid="ai-chat-composer"]');

    await textarea.trigger('compositionstart');
    await textarea.trigger('keydown', { key: 'Enter', shiftKey: false, isComposing: true, keyCode: 229 });
    expect(wrapper.emitted('send')).toBeUndefined();

    await textarea.trigger('compositionend');
    await textarea.trigger('keydown', { key: 'Enter', shiftKey: false, isComposing: false, keyCode: 13 });
    expect(wrapper.emitted('send')).toHaveLength(1);
    wrapper.unmount();
  });

  it('emits stop while loading and send when idle', async () => {
    const loading = mountComposer({ loading: true, modelValue: 'x' });
    await loading.get('[data-testid="ai-chat-stop-generating"]').trigger('click');
    expect(loading.emitted('stop')).toHaveLength(1);
    expect(loading.find('[data-testid="ai-chat-send-message"]').exists()).toBe(false);
    loading.unmount();

    const idle = mountComposer({ loading: false, modelValue: 'x' });
    await idle.get('[data-testid="ai-chat-send-message"]').trigger('click');
    expect(idle.emitted('send')).toHaveLength(1);
    idle.unmount();
  });

  it('disables send when empty or canSend is false', () => {
    const empty = mountComposer({ modelValue: '   ' });
    expect((empty.get('[data-testid="ai-chat-send-message"]').element as HTMLButtonElement).disabled).toBe(true);
    empty.unmount();

    const blocked = mountComposer({ modelValue: 'hi', canSend: false });
    expect((blocked.get('[data-testid="ai-chat-send-message"]').element as HTMLButtonElement).disabled).toBe(true);
    blocked.unmount();
  });

  it('shows empty-models warning button instead of permanent dashed card row', () => {
    const wrapper = mountComposer({ modelGroups: [] });
    expect(wrapper.find('[data-testid="ai-chat-empty-models"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('auto-grows textarea height up to the max cap', async () => {
    const wrapper = mountComposer({ modelValue: '' });
    const el = wrapper.get('[data-testid="ai-chat-composer"]').element as HTMLTextAreaElement;
    Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => 320 });
    await wrapper.setProps({ modelValue: 'line\n'.repeat(20) });
    await nextTick();
    // height is clamped by COMPOSER_TEXTAREA_MAX_PX (168)
    expect(el.style.height).toBe('168px');
    wrapper.unmount();
  });

  it('disables quick-entry tools and shows configure cue when no models are available', () => {
    const wrapper = mountComposer({
      modelGroups: [],
      canSend: false,
      selectedModelKey: '',
    });

    const toolTrigger = wrapper.find('[data-testid="ai-chat-tool-menu-trigger"]');
    expect(toolTrigger.exists()).toBe(true);
    expect(toolTrigger.attributes('disabled')).toBeDefined();

    expect(wrapper.find('[data-testid="ai-chat-empty-models"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="ai-chat-empty-models-hint"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="ai-chat-empty-models-cue"]').exists()).toBe(true);

    // Configure cue must not be bare i18n key
    const cueText = wrapper.find('[data-testid="ai-chat-empty-models"]').text();
    expect(cueText).not.toMatch(/aiAssistant\.chatPage/);
    expect(cueText.length).toBeGreaterThan(0);

    wrapper.unmount();
  });
});
