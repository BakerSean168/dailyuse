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

  const faviconLink = ensureHeadLink('link[data-dailyuse-favicon]');
  faviconLink.rel = 'icon';
  faviconLink.type = 'image/x-icon';
  faviconLink.href = options.faviconHref;
  faviconLink.setAttribute('data-dailyuse-favicon', 'true');

  if (!options.appleTouchIconHref) {
    return;
  }

  const appleTouchLink = ensureHeadLink('link[data-dailyuse-apple-touch-icon]');
  appleTouchLink.rel = 'apple-touch-icon';
  appleTouchLink.href = options.appleTouchIconHref;
  appleTouchLink.setAttribute('data-dailyuse-apple-touch-icon', 'true');
}
