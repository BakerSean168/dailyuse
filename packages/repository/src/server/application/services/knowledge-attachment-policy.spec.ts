import { describe, expect, it } from 'vitest';
import {
  MAX_KNOWLEDGE_ATTACHMENT_BYTES,
  resolveKnowledgeAttachmentMediaType,
} from './knowledge-attachment-policy';

describe('knowledge attachment policy', () => {
  it('allows bounded binary media and excludes executable or control paths', () => {
    expect(resolveKnowledgeAttachmentMediaType('assets/diagram.PNG')).toBe('image/png');
    expect(resolveKnowledgeAttachmentMediaType('assets/reference.pdf')).toBe('application/pdf');
    expect(resolveKnowledgeAttachmentMediaType('assets/player.mp4')).toBe('video/mp4');
    expect(resolveKnowledgeAttachmentMediaType('assets/script.html')).toBeNull();
    expect(resolveKnowledgeAttachmentMediaType('assets/diagram.svg')).toBeNull();
    expect(resolveKnowledgeAttachmentMediaType('.obsidian/icon.png')).toBeNull();
    expect(resolveKnowledgeAttachmentMediaType('../outside.png')).toBeNull();
  });

  it('keeps the public read limit explicit', () => {
    expect(MAX_KNOWLEDGE_ATTACHMENT_BYTES).toBe(10 * 1024 * 1024);
  });
});
