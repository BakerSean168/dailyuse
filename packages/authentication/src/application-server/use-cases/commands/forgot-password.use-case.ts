import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type {
  IAuthIdentityRepository,
  IEmailSender,
  IPasswordResetCodeStore,
} from '../../../domain-server';
import type { ForgotPasswordReq } from '@dailyuse/contracts/authentication';

export class ForgotPasswordUseCase {
  constructor(
    private readonly identityRepository: IAuthIdentityRepository,
    private readonly codeStore: IPasswordResetCodeStore,
    private readonly emailSender: IEmailSender,
  ) {}

  async execute(input: ForgotPasswordReq): Promise<Result<void>> {
    const identity = await this.identityRepository.findByEmail(input.email);

    if (!identity) {
      // Security: don't reveal whether the email exists in the system.
      return ok(undefined);
    }

    const code = await this.codeStore.generateCode(input.email);
    await this.emailSender.sendPasswordResetCode(input.email, code);

    return ok(undefined);
  }
}
