import { ProviderEndpointPolicy } from './provider-endpoint-policy';

vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(async (hostname: string) => {
    if (hostname === 'public.example') return [{ address: '203.0.113.10', family: 4 }];
    if (hostname === 'private.example') return [{ address: '10.0.0.8', family: 4 }];
    return [{ address: '8.8.8.8', family: 4 }];
  }),
}));

describe('ProviderEndpointPolicy', () => {
  const policy = new ProviderEndpointPolicy();

  it('accepts public HTTPS endpoints', async () => {
    await expect(policy.validate({ baseUrl: 'https://public.example/v1' })).resolves.toBeUndefined();
  });

  it.each([
    'http://public.example/v1',
    'https://127.0.0.1/v1',
    'https://169.254.169.254/latest/meta-data',
    'https://10.0.0.5/v1',
    'https://metadata.google.internal/computeMetadata/v1',
    'https://private.example/v1',
  ])('rejects unsafe provider endpoint %s', async (baseUrl) => {
    await expect(policy.validate({ baseUrl })).rejects.toMatchObject({ category: 'validation' });
  });

  it('allows an explicitly deployment-approved private host:port', async () => {
    const allowlisted = new ProviderEndpointPolicy(new Set(['10.0.0.5:8443']));
    await expect(allowlisted.validate({ baseUrl: 'https://10.0.0.5:8443/v1' })).resolves.toBeUndefined();
  });
});
