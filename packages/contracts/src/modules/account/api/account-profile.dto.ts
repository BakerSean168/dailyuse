import { z } from 'zod';
import type { AccountClientDTO } from '../aggregates';
import { LanguageCode } from '../value-objects/language-code';

export type GetAccountReq = void;
export type GetAccountRes = AccountClientDTO;

export const UpdateAccountSchema = z.object({
  nickname: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  timezone: z.string().optional(),
  language: z.nativeEnum(LanguageCode).optional(),
});

export type UpdateAccountReq = z.infer<typeof UpdateAccountSchema>;
export type UpdateAccountRes = AccountClientDTO;
