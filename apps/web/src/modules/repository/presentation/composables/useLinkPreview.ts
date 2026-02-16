/**
 * useLinkPreview - 链接预览组合式函数
 * 
 * 处理编辑器中 [[link]] 和 ![[embed]] 的悬停预览
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { useDebounceFn } from '@vueuse/core';

export interface PreviewContent {
  type: 'markdown' | 'image' | 'audio' | 'video' | 'pdf' | 'other';
  name: string;
  url?: string;
  excerpt?: string;
  size?: number;
  id?: string;
}

export interface UseLinkPreviewOptions {
  /** 延迟显示时间（毫秒） */
  delay?: number;
  /** 获取链接内容的回调 */
  fetchContent?: (linkName: string) => Promise<PreviewContent | null>;
  /** 容器元素选择器 */
  containerSelector?: string;
}

export function useLinkPreview(options: UseLinkPreviewOptions = {}) {
  const {
    delay = 300,
    fetchContent = defaultFetchContent,
    containerSelector = '.reading-view',
  } = options;

  // State
  const visible = ref(false);
  const content = ref<PreviewContent | null>(null);
  const position = ref({ x: 0, y: 0 });

  let hideTimeout: ReturnType<typeof setTimeout> | null = null;
  let currentTarget: HTMLElement | null = null;

  /**
   * 默认的内容获取函数（模拟）
   */
  async function defaultFetchContent(linkName: string): Promise<PreviewContent | null> {
    // 判断文件类型
    const ext = linkName.split('.').pop()?.toLowerCase() || '';
    
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
      return {
        type: 'image',
        name: linkName,
        url: `/api/resources/preview/${encodeURIComponent(linkName)}`,
      };
    }
    
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
      return {
        type: 'audio',
        name: linkName,
      };
    }
    
    if (['mp4', 'webm', 'ogv', 'mov'].includes(ext)) {
      return {
        type: 'video',
        name: linkName,
      };
    }
    
    if (ext === 'pdf') {
      return {
        type: 'pdf',
        name: linkName,
      };
    }
    
    // 默认当作 markdown 笔记
    if (!ext || ext === 'md') {
      return {
        type: 'markdown',
        name: linkName,
        excerpt: `# ${linkName}\n\n这是笔记 "${linkName}" 的预览内容...`,
      };
    }
    
    return {
      type: 'other',
      name: linkName,
    };
  }

  /**
   * 处理鼠标移入链接
   */
  const handleMouseEnter = useDebounceFn(async (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target) return;

    // 检查是否是内部链接 (Obsidian 风格)
    const linkText = extractLinkText(target);
    if (!linkText) return;

    // 清除隐藏定时器
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    currentTarget = target;

    // 获取预览内容
    const previewContent = await fetchContent(linkText);
    if (!previewContent) return;

    // 计算位置
    const rect = target.getBoundingClientRect();
    const popoverWidth = 320;
    const popoverHeight = 300;
    const margin = 10;

    let x = rect.left;
    let y = rect.bottom + margin;

    // 边界检测 - 右边界
    if (x + popoverWidth > window.innerWidth) {
      x = window.innerWidth - popoverWidth - margin;
    }

    // 边界检测 - 下边界
    if (y + popoverHeight > window.innerHeight) {
      y = rect.top - popoverHeight - margin;
    }

    // 确保不超出左边界和上边界
    x = Math.max(margin, x);
    y = Math.max(margin, y);

    position.value = { x, y };
    content.value = previewContent;
    visible.value = true;
  }, delay);

  /**
   * 处理鼠标移出链接
   */
  function handleMouseLeave() {
    hideTimeout = setTimeout(() => {
      visible.value = false;
      content.value = null;
      currentTarget = null;
    }, 150);
  }

  /**
   * 从元素中提取链接文本
   */
  function extractLinkText(element: HTMLElement): string | null {
    // 检查是否是内部链接 <a> 标签
    if (element.tagName === 'A') {
      const href = element.getAttribute('href') || '';
      // Obsidian 内部链接格式
      if (href.startsWith('#') || !href.startsWith('http')) {
        return element.textContent?.trim() || null;
      }
    }

    // 检查自定义的 data-link 属性
    const dataLink = element.getAttribute('data-internal-link');
    if (dataLink) {
      return dataLink;
    }

    return null;
  }

  /**
   * 设置事件监听器
   */
  function setupListeners() {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // 使用事件委托
    container.addEventListener('mouseenter', handleMouseEnterWrapper, true);
    container.addEventListener('mouseleave', handleMouseLeaveWrapper, true);
  }

  /**
   * 移除事件监听器
   */
  function removeListeners() {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    container.removeEventListener('mouseenter', handleMouseEnterWrapper, true);
    container.removeEventListener('mouseleave', handleMouseLeaveWrapper, true);
  }

  function handleMouseEnterWrapper(event: Event) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'A' || target.hasAttribute('data-internal-link')) {
      handleMouseEnter(event as MouseEvent);
    }
  }

  function handleMouseLeaveWrapper(event: Event) {
    const target = event.target as HTMLElement;
    if (target === currentTarget) {
      handleMouseLeave();
    }
  }

  /**
   * 隐藏预览
   */
  function hide() {
    visible.value = false;
    content.value = null;
  }

  /**
   * 保持预览可见（鼠标进入预览层时调用）
   */
  function keepVisible() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  }

  // 生命周期
  onMounted(() => {
    // 延迟设置监听器，等待 DOM 渲染
    setTimeout(setupListeners, 100);
  });

  onUnmounted(() => {
    removeListeners();
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
  });

  return {
    visible,
    content,
    position,
    hide,
    keepVisible,
    setupListeners,
    removeListeners,
  };
}
