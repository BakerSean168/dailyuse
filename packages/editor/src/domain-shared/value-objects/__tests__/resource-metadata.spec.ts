import { describe, expect, it } from 'vitest';
import { ResourceMetadata } from '../resource-metadata';

describe('ResourceMetadata', () => {
  it('creates empty metadata', () => {
    const metadata = ResourceMetadata.createEmpty();
    expect(metadata.tags).toEqual([]);
    expect(metadata.category).toBeNull();
    expect(metadata.wordCount).toBeNull();
    expect(metadata.characterCount).toBeNull();
    expect(metadata.readingTime).toBeNull();
    expect(metadata.encoding).toBe('utf-8');
    expect(metadata.language).toBeNull();
    expect(metadata.customFields).toBeNull();
    expect(metadata.hasTags).toBe(false);
    expect(metadata.hasCategory).toBe(false);
    expect(metadata.wordCountFormatted).toBeNull();
    expect(metadata.readingTimeFormatted).toBeNull();
    expect(metadata.tagsDisplay).toBe('-');
  });

  it('adds and removes tags', () => {
    let metadata = ResourceMetadata.createEmpty();
    metadata = metadata.addTag('a');
    metadata = metadata.addTag('b');
    metadata = metadata.addTag('a'); // Should not add duplicate
    expect(metadata.tags).toEqual(['a', 'b']);
    expect(metadata.hasTags).toBe(true);
    expect(metadata.tagsDisplay).toBe('a, b');

    metadata = metadata.removeTag('a');
    expect(metadata.tags).toEqual(['b']);
  });

  it('sets category', () => {
    const metadata = ResourceMetadata.createEmpty().setCategory('Tech');
    expect(metadata.category).toBe('Tech');
    expect(metadata.hasCategory).toBe(true);
  });

  it('updates stats', () => {
    const metadata = ResourceMetadata.createEmpty().updateStats(400, 2000);
    expect(metadata.wordCount).toBe(400);
    expect(metadata.characterCount).toBe(2000);
    expect(metadata.readingTime).toBe(2);
    expect(metadata.wordCountFormatted).toBe('400 字');
    expect(metadata.readingTimeFormatted).toBe('2 分钟阅读');
  });

  it('sets custom fields', () => {
    let metadata = ResourceMetadata.createEmpty();
    metadata = metadata.setCustomField('author', 'John');
    expect(metadata.customFields).toEqual({ author: 'John' });

    metadata = metadata.setCustomField('status', 'draft');
    expect(metadata.customFields).toEqual({ author: 'John', status: 'draft' });
  });

  it('converts to/from DTO', () => {
    const metadata = ResourceMetadata.createEmpty();
    const dto = metadata.toDTO();
    expect(dto.tags).toEqual([]);

    const metadataFromDto = ResourceMetadata.fromDTO(dto);
    expect(metadataFromDto.tags).toEqual([]);

    const metadataCreated = ResourceMetadata.create(dto);
    expect(metadataCreated.tags).toEqual([]);

    // With custom fields
    const metadataWithCustom = ResourceMetadata.createEmpty().setCustomField('key', 'value');
    const dto2 = metadataWithCustom.toDTO();
    expect(dto2.customFields).toEqual({ key: 'value' });
  });

});
