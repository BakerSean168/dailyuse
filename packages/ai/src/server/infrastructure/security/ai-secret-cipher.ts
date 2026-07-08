import { createHash } from 'node:crypto';

export class AISecretCipher {
  private readonly prefix = 'enc_v1:';
  private readonly key: Buffer;

  constructor(secret = process.env.AI_SECRET_CIPHER_KEY || 'dailyuse-ai-secret') {
    this.key = createHash('sha256').update(secret).digest();
  }

  encrypt(value: string): string {
    const input = Buffer.from(value, 'utf8');
    const output = Buffer.alloc(input.length);

    for (let index = 0; index < input.length; index += 1) {
      output[index] = input[index] ^ this.key[index % this.key.length];
    }

    return `${this.prefix}${output.toString('base64')}`;
  }

  decrypt(value: string): string {
    if (!value.startsWith(this.prefix)) {
      return value;
    }

    const input = Buffer.from(value.slice(this.prefix.length), 'base64');
    const output = Buffer.alloc(input.length);

    for (let index = 0; index < input.length; index += 1) {
      output[index] = input[index] ^ this.key[index % this.key.length];
    }

    return output.toString('utf8');
  }
}
