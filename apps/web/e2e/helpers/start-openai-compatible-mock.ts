import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

const port = Number(process.env.E2E_OPENAI_MOCK_PORT ?? 58102);
const embedding = [1, ...Array.from({ length: 47 }, () => 0)];

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
}

const server = createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/healthz') {
    sendJson(response, 200, { status: 'ok' });
    return;
  }

  if (request.method === 'POST' && request.url === '/v1/embeddings') {
    const body = await readJson(request);
    const input = Array.isArray(body.input) ? body.input : [body.input];
    sendJson(response, 200, {
      object: 'list',
      model: body.model ?? 'text-embedding-3-small',
      data: input.map((_value, index) => ({
        object: 'embedding',
        index,
        embedding,
      })),
      usage: { prompt_tokens: input.length, total_tokens: input.length },
    });
    return;
  }

  if (request.method === 'POST' && request.url === '/v1/chat/completions') {
    const body = await readJson(request);
    sendJson(response, 200, {
      id: 'chatcmpl-e2e-knowledge',
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: body.model ?? 'e2e-knowledge-model',
      choices: [
        {
          index: 0,
          finish_reason: 'stop',
          message: {
            role: 'assistant',
            content:
              'The indexed note states that the cobalt orchard protocol uses seven lanterns.',
          },
        },
      ],
      usage: { prompt_tokens: 12, completion_tokens: 13, total_tokens: 25 },
    });
    return;
  }

  sendJson(response, 404, { error: { message: 'Unknown E2E provider route' } });
});

server.listen(port, '127.0.0.1');

function shutdown(): void {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
