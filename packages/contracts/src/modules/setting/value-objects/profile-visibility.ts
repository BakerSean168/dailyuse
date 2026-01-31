/**
 * 隐私可见性
 */
export const ProfileVisibility = {
  Public: 'Public',
  Private: 'Private',
  FriendsOnly: 'FriendsOnly',
} as const;

export type ProfileVisibility = (typeof ProfileVisibility)[keyof typeof ProfileVisibility];
