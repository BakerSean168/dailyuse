/**
 * Account Domain Event Map
 * 
 * Event Naming Convention: account:<action>
 * - account:create - Account created
 * - account:close - Account closed
 * - account:update-profile - Profile updated
 * - account:update-settings - Settings updated
 */
export type AccountEventMap = {
  'account:create': { 
    accountId: string;
    email: string; 
    createdAt: number;
  };
  
  'account:close': { 
    accountId: string;
    reason: string;
    closedAt: number;
  };
  
  'account:update-profile': { 
    accountId: string;
    updatedFields: string[];
  };
  
  'account:update-settings': {
    accountId: string;
    updatedFields: string[];
  };
};
