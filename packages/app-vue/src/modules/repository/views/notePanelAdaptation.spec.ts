import { describe, expect, it } from 'vitest';
import { computed, defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { providePanelWidth, usePanelWidth } from '../../../layouts/shell/usePanelWidth';

/**
 * Lightweight probe for S4-Note panel adaptation (V2 §6 Note / §7):
 * - segment bar always present; deep-link path selects notes vs governance
 * - narrow (split): repository sidebar switcher; wide restores full sidebar
 *
 * Mirrors NoteModuleLayout + RepositoryWorkspaceView tier surface without
 * mounting stores/editor.
 */
function mountNotePanelAdaptationProbe(initialWidth: number, path = '/repository') {
  const widthHandle: { current: number } = { current: initialWidth };
  const currentPath = ref(path);

  const Probe = defineComponent({
    name: 'NotePanelAdaptationProbe',
    setup() {
      const { isNarrow } = usePanelWidth();
      const activeSegment = computed(() =>
        currentPath.value === '/governance' || currentPath.value.startsWith('/governance/')
          ? 'governance'
          : 'notes',
      );
      const showSwitcher = computed(() => isNarrow.value);
      const showSidebar = computed(() => !isNarrow.value);

      return () =>
        h('div', { 'data-testid': 'note-module-layout' }, [
          h('div', { 'data-testid': 'note-segment-bar' }, [
            h(
              'button',
              {
                'data-testid': 'note-segment-notes',
                'data-active': String(activeSegment.value === 'notes'),
                onClick: () => {
                  currentPath.value = '/repository';
                },
              },
              'notes',
            ),
            h(
              'button',
              {
                'data-testid': 'note-segment-governance',
                'data-active': String(activeSegment.value === 'governance'),
                onClick: () => {
                  currentPath.value = '/governance';
                },
              },
              'governance',
            ),
          ]),
          h('div', { 'data-testid': 'note-active-segment' }, activeSegment.value),
          showSwitcher.value
            ? h('div', { 'data-testid': 'repository-sidebar-switcher' }, 'switcher')
            : null,
          showSidebar.value
            ? h('div', { 'data-testid': 'repository-group-sidebar' }, 'sidebar')
            : null,
        ]);
    },
  });

  const Parent = defineComponent({
    setup() {
      const { width } = providePanelWidth();
      width.value = widthHandle.current;
      Object.defineProperty(widthHandle, 'current', {
        get: () => width.value ?? initialWidth,
        set: (value: number) => {
          width.value = value;
        },
      });
      return () => h(Probe);
    },
  });

  const wrapper = mount(Parent);
  return {
    wrapper,
    setWidth: (value: number) => {
      widthHandle.current = value;
    },
    setPath: async (value: string) => {
      currentPath.value = value;
      await nextTick();
    },
  };
}

describe('Note panel adaptation (V2 §6 Note / §7)', () => {
  it('switches notes|governance segments and two-tier sidebar navigation', async () => {
    const { wrapper, setWidth, setPath } = mountNotePanelAdaptationProbe(450, '/repository');

    expect(wrapper.find('[data-testid="note-segment-bar"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="note-active-segment"]').text()).toBe('notes');
    expect(wrapper.find('[data-testid="repository-sidebar-switcher"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="repository-group-sidebar"]').exists()).toBe(false);

    await wrapper.get('[data-testid="note-segment-governance"]').trigger('click');
    await nextTick();
    expect(wrapper.get('[data-testid="note-active-segment"]').text()).toBe('governance');

    // Deep-link governance path lands on standards segment
    await setPath('/governance/rule-1');
    expect(wrapper.get('[data-testid="note-active-segment"]').text()).toBe('governance');

    // Wide / focus restores full sidebar for notes workspace
    await setPath('/repository');
    setWidth(1200);
    await nextTick();
    expect(wrapper.find('[data-testid="repository-sidebar-switcher"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="repository-group-sidebar"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="note-active-segment"]').text()).toBe('notes');

    wrapper.unmount();
  });
});
