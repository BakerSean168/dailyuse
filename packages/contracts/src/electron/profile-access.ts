export type ProfileKind = 'guest' | 'registered';
export type ProfileUnlockState = 'LOCKED' | 'UNLOCKED';
export type ProfileCloudState = 'UNBOUND' | 'CHECKING' | 'ONLINE' | 'OFFLINE' | 'REAUTH_REQUIRED';

export interface ProfileSummary {
  profileId: string;
  profileKind: ProfileKind;
  displayName: string;
  avatarSeed: string;
  identifierHint: string | null;
  cloudAccountId: string | null;
  lastActiveAt: number;
  hasPin: boolean;
}

export interface SelectProfileRequest {
  profileId: string;
  pin?: string;
}

export interface RemoveProfileRequest {
  profileId: string;
}

export interface DesktopAccessSnapshot {
  profile: ProfileSummary | null;
  unlockState: ProfileUnlockState;
  cloudState: ProfileCloudState;
  capabilities: {
    local: boolean;
    sync: boolean;
    cloudAi: boolean;
    repositoryConnection: boolean;
  };
}
