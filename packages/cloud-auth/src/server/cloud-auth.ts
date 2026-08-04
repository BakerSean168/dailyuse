import type { PrismaClient } from '@memoflow/database';
import { IdentityId } from '@memoflow/domain-shared/shared';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { betterAuth } from 'better-auth';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import { bearer } from 'better-auth/plugins';
import { deviceAuthorization } from 'better-auth/plugins/device-authorization';
import type { RequestHandler } from 'express';
import type { IncomingHttpHeaders } from 'node:http';
import type { CloudAuthEmailDelivery } from './email-delivery.js';

const DESKTOP_DEVICE_CLIENT_ID = 'memoflow-desktop';

export interface CloudPrincipal {
  readonly identityId: string;
  readonly sessionId: string;
  readonly email: string;
  readonly emailVerified: boolean;
}

export interface CloudUserProvisioner {
  provision(input: {
    readonly identityId: string;
    readonly email: string;
    readonly name: string;
    readonly emailVerified: boolean;
  }): Promise<void>;
}

export interface CloudAuthOptions {
  readonly database: PrismaClient;
  readonly secret: string;
  readonly baseUrl: string;
  readonly deviceVerificationUrl: string;
  readonly trustedOrigins: readonly string[];
  readonly github?: {
    readonly clientId: string;
    readonly clientSecret: string;
  };
  readonly userProvisioner: CloudUserProvisioner;
  readonly emailDelivery: CloudAuthEmailDelivery;
}

export interface CloudAuth {
  readonly handler: (request: Request) => Promise<Response>;
  readonly expressHandler: RequestHandler;
  resolvePrincipal(headers: Headers): Promise<CloudPrincipal | null>;
  resolveNodePrincipal(headers: IncomingHttpHeaders): Promise<CloudPrincipal | null>;
  cleanupExpiredDeviceCodes(now?: Date): Promise<number>;
}

export function createCloudAuth(options: CloudAuthOptions): CloudAuth {
  const auth = betterAuth({
    appName: 'MemoFlow',
    baseURL: options.baseUrl,
    secret: options.secret,
    trustedOrigins: [...options.trustedOrigins],
    database: prismaAdapter(options.database, {
      provider: 'postgresql',
      transaction: true,
    }),
    advanced: {
      database: {
        generateId: ({ model }) => model === 'user' ? IdentityId.generate().toString() : false,
      },
    },
    user: { modelName: 'cloudAuthUser' },
    session: { modelName: 'cloudAuthSession' },
    account: { modelName: 'cloudAuthProviderAccount' },
    verification: { modelName: 'cloudAuthVerification' },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        await options.emailDelivery.send({
          kind: 'password-reset',
          email: user.email,
          url,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        await options.emailDelivery.send({
          kind: 'email-verification',
          email: user.email,
          url,
        });
      },
    },
    socialProviders: options.github
      ? {
          github: {
            clientId: options.github.clientId,
            clientSecret: options.github.clientSecret,
          },
        }
      : undefined,
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            try {
              await options.userProvisioner.provision({
                identityId: user.id,
                email: user.email,
                name: user.name,
                emailVerified: user.emailVerified,
              });
            } catch (error) {
              await options.database.cloudAuthUser.delete({ where: { id: user.id } });
              throw error;
            }
          },
        },
        update: {
          after: async (user) => {
            await options.userProvisioner.provision({
              identityId: user.id,
              email: user.email,
              name: user.name,
              emailVerified: user.emailVerified,
            });
          },
        },
      },
    },
    plugins: [
      bearer(),
      deviceAuthorization({
        expiresIn: '10m',
        interval: '5s',
        verificationUri: options.deviceVerificationUrl,
        validateClient: (clientId) => clientId === DESKTOP_DEVICE_CLIENT_ID,
        schema: {
          deviceCode: { modelName: 'cloudAuthDeviceCode' },
        },
      }),
    ],
  });

  return {
    handler: auth.handler,
    expressHandler: toNodeHandler(auth),
    async resolvePrincipal(headers) {
      const resolved = await auth.api.getSession({ headers });
      if (!resolved) return null;

      return {
        identityId: resolved.user.id,
        sessionId: resolved.session.id,
        email: resolved.user.email,
        emailVerified: resolved.user.emailVerified,
      };
    },
    async resolveNodePrincipal(headers) {
      const resolved = await auth.api.getSession({ headers: fromNodeHeaders(headers) });
      if (!resolved) return null;

      return {
        identityId: resolved.user.id,
        sessionId: resolved.session.id,
        email: resolved.user.email,
        emailVerified: resolved.user.emailVerified,
      };
    },
    async cleanupExpiredDeviceCodes(now = new Date()) {
      const result = await options.database.cloudAuthDeviceCode.deleteMany({
        where: { expiresAt: { lt: now } },
      });
      return result.count;
    },
  };
}
