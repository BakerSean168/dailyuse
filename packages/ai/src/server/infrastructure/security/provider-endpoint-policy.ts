import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { AIExecutionError } from '../../../shared/ai-execution-error';
import type {
  IAIProviderEndpointPolicyPort,
  ProviderEndpointValidationInput,
} from '../../application/ports/provider-endpoint-policy.port';

const FORBIDDEN_HOSTS = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.google.com',
  'instance-data.ec2.internal',
]);

export class ProviderEndpointPolicy implements IAIProviderEndpointPolicyPort {
  constructor(private readonly allowedPrivateHostPorts: ReadonlySet<string> = new Set()) {}

  async validate(input: ProviderEndpointValidationInput): Promise<void> {
    let url: URL;
    try {
      url = new URL(input.baseUrl);
    } catch {
      throw invalidEndpoint('Provider Base URL is invalid');
    }

    if (url.protocol !== 'https:') {
      throw invalidEndpoint('Provider Base URL must use HTTPS');
    }
    if (url.username || url.password) {
      throw invalidEndpoint('Provider Base URL must not contain credentials');
    }
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    const hostPort = `${hostname}:${url.port || '443'}`;
    if (input.allowPrivate || this.allowedPrivateHostPorts.has(hostPort)) return;
    if (FORBIDDEN_HOSTS.has(hostname) || hostname.endsWith('.localhost')) {
      throw invalidEndpoint('Provider endpoint resolves to a forbidden host');
    }

    if (isIP(hostname)) {
      if (!isPublicAddress(hostname)) throw invalidEndpoint('Provider endpoint must use a public address');
      return;
    }

    let addresses: Array<{ address: string; family: number }>;
    try {
      addresses = await lookup(hostname, { all: true, verbatim: true });
    } catch (error) {
      throw new AIExecutionError('transport', 'Provider endpoint DNS resolution failed', { cause: error });
    }
    if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
      throw invalidEndpoint('Provider endpoint DNS resolves to a non-public address');
    }
  }
}

function invalidEndpoint(message: string): AIExecutionError {
  return new AIExecutionError('validation', message);
}

function isPublicAddress(address: string): boolean {
  if (address.includes(':')) return isPublicIpv6(address);
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a >= 224) return false;
  return true;
}

function isPublicIpv6(address: string): boolean {
  const value = address.toLowerCase();
  if (value === '::' || value === '::1') return false;
  if (value.startsWith('fe8') || value.startsWith('fe9') || value.startsWith('fea') || value.startsWith('feb')) return false;
  if (value.startsWith('fc') || value.startsWith('fd') || value.startsWith('ff')) return false;
  if (value.startsWith('::ffff:')) return isPublicAddress(value.slice('::ffff:'.length));
  return true;
}
