/**
 * Robust HTML sanitization utility using DOMParser.
 * Follows a whitelist approach for tags and attributes.
 * Fail-closed: returns an empty string if DOMParser is unavailable or if an error occurs.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'span', 'div', 'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins', 'mark',
  'sub', 'sup', 'small', 'blockquote', 'q', 'cite', 'abbr', 'address',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'code', 'pre', 'kbd', 'samp', 'var',
  'a', 'img', 'hr'
]);

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  '*': ['class', 'title', 'dir', 'lang'],
  'a': ['href', 'target', 'rel', 'data-title', 'data-section'],
  'img': ['src', 'alt', 'width', 'height', 'data-repository-destination'],
  'th': ['colspan', 'rowspan', 'scope'],
  'td': ['colspan', 'rowspan', 'scope'],
  'ol': ['start', 'type', 'reversed'],
};

// Use whitelist for protocols instead of blacklist
const ALLOWED_PROTOCOLS = /^(https?|mailto|tel|#|data:image\/)/i;

// Tags that should be completely discarded including their content
const DISCARD_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'head', 'base']);

/**
 * Sanitizes an HTML string.
 * @param html The HTML string to sanitize.
 * @returns The sanitized HTML string.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    // Fail-closed in non-browser environments
    return '';
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    if (!body) return '';

    // Create a wrapper element to hold the sanitized content
    const container = document.createElement('div');

    // Sanitize children of body and append to container
    for (let i = 0; i < body.childNodes.length; i++) {
      const sanitizedChild = sanitizeNode(body.childNodes[i]);
      if (sanitizedChild) {
        container.appendChild(sanitizedChild);
      }
    }

    return container.innerHTML;
  } catch (error) {
    console.error('HTML sanitization error:', error);
    return '';
  }
}

function sanitizeNode(node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.cloneNode(true);
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    // If tag is in discard list, return null to discard the whole subtree
    if (DISCARD_TAGS.has(tagName)) {
      return null;
    }

    if (ALLOWED_TAGS.has(tagName)) {
      const sanitizedElement = document.createElement(tagName);

      // Sanitize attributes
      const allowedAttrs = ALLOWED_ATTRIBUTES[tagName] || [];
      const globalAttrs = ALLOWED_ATTRIBUTES['*'] || [];
      const allAllowedAttrs = [...allowedAttrs, ...globalAttrs];

      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        const attrName = attr.name.toLowerCase();

        if (allAllowedAttrs.includes(attrName)) {
          const attrValue = attr.value;

          // Special handling for href and src to block dangerous protocols
          if (attrName === 'href' || attrName === 'src') {
            if (!ALLOWED_PROTOCOLS.test(attrValue.trim())) {
              continue;
            }
          }

          sanitizedElement.setAttribute(attrName, attrValue);
        }
      }

      // Recursively sanitize children
      for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];
        const sanitizedChild = sanitizeNode(child);
        if (sanitizedChild) {
          sanitizedElement.appendChild(sanitizedChild);
        }
      }

      return sanitizedElement;
    }
  }

  // If node is not allowed but not in discard list, return its sanitized children (stripping the tag)
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    const sanitizedChild = sanitizeNode(child);
    if (sanitizedChild) {
      fragment.appendChild(sanitizedChild);
    }
  }
  return fragment;
}
