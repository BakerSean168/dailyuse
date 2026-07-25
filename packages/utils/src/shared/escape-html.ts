/**
 * Residual 943: sole escapeHtml helper body.
 * Desktop renderer startup error path and app-vue safe-markdown import this;
 * local dual function bodies retired.
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
