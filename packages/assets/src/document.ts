function ensureHeadLink(selector: string): HTMLLinkElement {
  const existing = document.head.querySelector(selector);
  if (existing instanceof HTMLLinkElement) {
    return existing;
  }

  const link = document.createElement('link');
  document.head.appendChild(link);
  return link;
}

export interface DocumentIconOptions {
  faviconHref: string;
  appleTouchIconHref?: string;
}

export function applyDocumentIcons(options: DocumentIconOptions): void {
  if (typeof document === 'undefined') {
    return;
  }

  const faviconLink = ensureHeadLink('link[data-memoflow-favicon]');
  faviconLink.rel = 'icon';
  faviconLink.type = 'image/x-icon';
  faviconLink.href = options.faviconHref;
  faviconLink.setAttribute('data-memoflow-favicon', 'true');

  if (!options.appleTouchIconHref) {
    return;
  }

  const appleTouchLink = ensureHeadLink('link[data-memoflow-apple-touch-icon]');
  appleTouchLink.rel = 'apple-touch-icon';
  appleTouchLink.href = options.appleTouchIconHref;
  appleTouchLink.setAttribute('data-memoflow-apple-touch-icon', 'true');
}
