/**
 * Authentication - Login Operations
 *
 * Email/password login DTO surface. Phone/SMS login was removed until a real
 * SMS provider exists (no stub routes).
 */

import { z } from 'zod';
import type { AuthResponseDTO } from '../dtos/auth-response';

/**
 * 邮箱密码登录 Schema
 */
export const LoginByEmailSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  rememberPassword: z.boolean().default(false).optional(),
  autoLogin: z.boolean().default(false).optional(),
});

export type LoginByEmailReq = z.infer<typeof LoginByEmailSchema>;
export type LoginByEmailRes = AuthResponseDTO;
