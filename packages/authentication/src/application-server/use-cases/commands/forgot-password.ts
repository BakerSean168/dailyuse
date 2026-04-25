import type {
  IAuthIdentityRepository,
  IEmailSender,
  IPasswordResetCodeStore,
} from '../../../domain-server';
import type { ForgotPasswordReq } from '@dailyuse/contracts/authentication';

export class ForgotPassword {
  constructor(
    private readonly identityRepository: IAuthIdentityRepository,
    private readonly codeStore: IPasswordResetCodeStore,
    private readonly emailSender: IEmailSender,
  ) {}

  async execute(input: ForgotPasswordReq): Promise<void> {
    const identity = await this.identityRepository.findByEmail(input.email);

    if (!identity) {
      // Security: don't reveal whether the email exists in the system.
      // 安全：不泄露邮箱是否存在于系统中。
      return;
    }

    const code = await this.codeStore.generateCode(input.email);
    await this.emailSender.sendPasswordResetCode(input.email, code);
  }
}
