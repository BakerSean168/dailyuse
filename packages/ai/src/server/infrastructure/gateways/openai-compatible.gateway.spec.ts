import {
  extractOpenAICompatibleMessageContent,
  normalizeOpenAICompatibleBaseUrl,
  normalizeOpenAICompatibleMaxTokens,
  normalizeOpenAICompatibleModelId,
  OPENAI_COMPATIBLE_MIN_MAX_TOKENS,
} from '../../shared/openai-compatible-normalize';

describe('normalizeOpenAICompatibleModelId', () => {
  it('strips Google AI Studio models/ prefix', () => {
    expect(normalizeOpenAICompatibleModelId('models/gemini-2.5-flash')).toBe('gemini-2.5-flash');
  });

  it('trims whitespace and leaves plain OpenAI ids untouched', () => {
    expect(normalizeOpenAICompatibleModelId('  gpt-4.1-mini  ')).toBe('gpt-4.1-mini');
  });
});

describe('normalizeOpenAICompatibleMaxTokens', () => {
  it('floors tiny values for Gemini-compatible empty-content protection', () => {
    expect(normalizeOpenAICompatibleMaxTokens(1)).toBe(OPENAI_COMPATIBLE_MIN_MAX_TOKENS);
    expect(normalizeOpenAICompatibleMaxTokens(16)).toBe(OPENAI_COMPATIBLE_MIN_MAX_TOKENS);
  });

  it('keeps larger values and truncates floats', () => {
    expect(normalizeOpenAICompatibleMaxTokens(128.9)).toBe(128);
    expect(normalizeOpenAICompatibleMaxTokens(4096)).toBe(4096);
  });

  it('falls back to the floor for non-finite values', () => {
    expect(normalizeOpenAICompatibleMaxTokens(Number.NaN)).toBe(OPENAI_COMPATIBLE_MIN_MAX_TOKENS);
    expect(normalizeOpenAICompatibleMaxTokens(Number.POSITIVE_INFINITY)).toBe(
      OPENAI_COMPATIBLE_MIN_MAX_TOKENS,
    );
  });
});

describe('extractOpenAICompatibleMessageContent', () => {
  it('returns plain string content', () => {
    expect(extractOpenAICompatibleMessageContent('hello')).toBe('hello');
  });

  it('returns null for blank strings', () => {
    expect(extractOpenAICompatibleMessageContent('   ')).toBeNull();
    expect(extractOpenAICompatibleMessageContent('')).toBeNull();
  });

  it('joins multipartite Gemini/OpenAI content arrays', () => {
    expect(
      extractOpenAICompatibleMessageContent([
        { type: 'text', text: 'Hello ' },
        { type: 'text', text: 'Gemini' },
      ]),
    ).toBe('Hello Gemini');
  });

  it('supports raw string parts in content arrays', () => {
    expect(extractOpenAICompatibleMessageContent(['a', 'b'])).toBe('ab');
  });

  it('returns null for empty multipartite payloads', () => {
    expect(extractOpenAICompatibleMessageContent([])).toBeNull();
    expect(extractOpenAICompatibleMessageContent([{ type: 'text', text: '  ' }])).toBeNull();
  });
});

describe('normalizeOpenAICompatibleBaseUrl', () => {
  it('ensures a single trailing slash for URL resolution', () => {
    expect(normalizeOpenAICompatibleBaseUrl('https://api.example.com/v1')).toBe(
      'https://api.example.com/v1/',
    );
    expect(normalizeOpenAICompatibleBaseUrl('https://api.example.com/v1///')).toBe(
      'https://api.example.com/v1/',
    );
  });
});
