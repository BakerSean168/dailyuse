/**
 * Account API Export
 */

// === Schemas ===
export { CheckAvailabilitySchema, CloseAccountSchema } from './lifecycle';
export { GetPublicProfileSchema, UpdateProfileSchema } from './profile';
export { UpdateSettingsSchema } from './settings';

// === Request/Response Types ===
export type { 
  CheckAvailabilityReq, CheckAvailabilityRes,
  CloseAccountReq, CloseAccountRes
} from './lifecycle';
export type {
  GetMyProfileReq, GetMyProfileRes,
  GetPublicProfileReq, PublicProfileRes,
  UpdateProfileReq, UpdateProfileRes
} from './profile';
export type {
  UpdateSettingsReq, UpdateSettingsRes
} from './settings';
