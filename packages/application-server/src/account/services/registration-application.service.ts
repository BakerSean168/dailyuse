/**
 * Registration Application Service
 * 用户注册应用服务 - 负责用户注册的完整流程编排
 */

import type { AccountClientDTO } from '@dailyuse/contracts/account';
import type { IAccountRepository } from '@dailyuse/domain-server/account';
import type { IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';
import { AccountDomainService } from '@dailyuse/domain-server/account';
import { AuthenticationDomainService } from '@dailyuse/domain-server/authentication';
import { AccountContainer, AuthContainer } from '@dailyuse/infrastructure-server';
import { eventBus, createLogger } from '@dailyuse/utils';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const logger = createLogger('RegistrationApplicationService');

export interface RegisterUserRequest {
  username: string;
  email: string;
  password: string;
  profile?: {
    nickname?: string;
    avatarUrl?: string;
    bio?: string;
  };
}

export interface RegisterUserResponse {
  success: boolean;
  account: AccountClientDTO;
  message: string;
}

export class RegistrationApplicationService {
  private static instance: RegistrationApplicationService;
  private accountRepository: IAccountRepository;
  private accountDomainService: AccountDomainService;
  private credentialRepository: IAuthCredentialRepository;
  private authenticationDomainService: AuthenticationDomainService;
  private prisma: PrismaClient;

  private constructor(
    accountRepository: IAccountRepository,
    credentialRepository: IAuthCredentialRepository,
    prisma: PrismaClient,
  ) {
    this.accountRepository = accountRepository;
    this.accountDomainService = new AccountDomainService();
    this.credentialRepository = credentialRepository;
    this.authenticationDomainService = new AuthenticationDomainService();
    this.prisma = prisma;
  }

  static async createInstance(
    accountRepository?: IAccountRepository,
    credentialRepository?: IAuthCredentialRepository,
    prisma?: PrismaClient,
  ): Promise<RegistrationApplicationService> {
    const accountContainer = AccountContainer.getInstance();
    const authContainer = AuthContainer.getInstance();

    const accountRepo = accountRepository || accountContainer.getAccountRepository();
    const credRepo = credentialRepository || authContainer.getCredentialRepository();
    const prismaClient = prisma || accountContainer.getPrismaClient();

    RegistrationApplicationService.instance = new RegistrationApplicationService(
      accountRepo,
      credRepo,
      prismaClient,
    );
    return RegistrationApplicationService.instance;
  }

  static async getInstance(): Promise<RegistrationApplicationService> {
    if (!RegistrationApplicationService.instance) {
      RegistrationApplicationService.instance =
        await RegistrationApplicationService.createInstance();
    }
    return RegistrationApplicationService.instance;
  }

  async registerUser(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    logger.info('[RegistrationApplicationService] Starting user registration', {
      username: request.username,
      email: request.email,
    });

    try {
      this.validateRegistrationInput(request);
      await this.checkUniqueness(request.username, request.email);

      const hashedPassword = await this.hashPassword(request.password);

      const result = await this.createAccountAndCredential({
        username: request.username,
        email: request.email,
        displayName: request.profile?.nickname || request.username,
        hashedPassword,
      });

      await this.publishDomainEvents(result.account, result.credential, request.password);

      logger.info('[RegistrationApplicationService] User registration successful', {
        accountUuid: result.account.uuid,
        username: request.username,
      });

      return {
        success: true,
        account: result.account.toClientDTO(),
        message: 'Registration successful',
      };
    } catch (error) {
      logger.error('[RegistrationApplicationService] Registration failed', {
        username: request.username,
        email: request.email,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private validateRegistrationInput(request: RegisterUserRequest): void {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(request.username)) {
      throw new Error(
        'Username must be 3-20 characters long and contain only letters, numbers, and underscores',
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      throw new Error('Invalid email format');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(request.password)) {
      throw new Error(
        'Password must be at least 8 characters long and include uppercase, lowercase, and numbers',
      );
    }
  }

  private async checkUniqueness(username: string, email: string): Promise<void> {
    const existingByUsername = await this.accountRepository.findByUsername(username);
    if (existingByUsername) {
      throw new Error(`Username already exists: ${username}`);
    }

    const existingByEmail = await this.accountRepository.findByEmail(email);
    if (existingByEmail) {
      throw new Error(`Email already registered: ${email}`);
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  private async createAccountAndCredential(params: {
    username: string;
    email: string;
    displayName: string;
    hashedPassword: string;
  }): Promise<any> {
    return this.prisma.$transaction(async (tx: any) => {
      const account = this.accountDomainService.createAccount({
        username: params.username,
        email: params.email,
        displayName: params.displayName,
      });

      await this.accountRepository.save(account, tx);

      const credential = this.authenticationDomainService.createPasswordCredential({
        accountUuid: account.uuid,
        hashedPassword: params.hashedPassword,
      });

      await this.credentialRepository.save(credential, tx);

      return { account, credential };
    });
  }

  private async publishDomainEvents(account: any, credential: any, password: string): Promise<void> {
    eventBus.publish({
      eventType: 'account:created',
      payload: {
        accountUuid: account.uuid,
        username: account.username,
        email: account.email,
        timestamp: Date.now(),
      },
    });
  }
}
