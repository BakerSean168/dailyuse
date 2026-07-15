import { OpenAICompatibleModelCatalogGateway } from './openai-compatible-model-catalog.gateway';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OpenAICompatibleModelCatalogGateway', () => {
  it('normalizes Gemini catalog ids and prefers display_name', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              id: 'models/gemini-2.5-flash',
              name: 'gemini-2.5-flash',
              display_name: 'Gemini 2.5 Flash',
              context_window: 1_048_576,
            },
            { id: 'models/text-embedding-004', display_name: 'Embedding' },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const models = await new OpenAICompatibleModelCatalogGateway().listModels({
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai///',
      apiKey: 'test-key',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://generativelanguage.googleapis.com/v1beta/openai/models',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(models).toEqual([
      expect.objectContaining({
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        contextWindow: 1_048_576,
      }),
    ]);
  });
});
