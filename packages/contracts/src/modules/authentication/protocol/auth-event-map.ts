/**
 * Authentication Domain Event Map
 * 
 * Event Naming Convention: auth:<action>
 * - auth:login - User logged in
 * - auth:logout - User logged out
 * - auth:register - User registered
 * - auth:password-change - Password changed
 * - auth:password-reset - Password reset
 * - auth:identity-create - Identity created
 */
export type AuthEventMap = {
  'auth:login': { 
    identityId: string;
    method: 'EMAIL' | 'PHONE' | 'OAUTH';
    ip: string;
    timestamp: number;
  };
  
  'auth:logout': {
    identityId: string;
    timestamp: number;
  };
  
  'auth:register': {
    identityId: string;
    method: 'EMAIL' | 'PHONE';
    timestamp: number;
  };
  
  'auth:password-change': { 
    identityId: string;
    timestamp: number;
  };
  
  'auth:password-reset': {
    identityId: string;
    timestamp: number;
  };
  
  'auth:identity-create': { 
    identityId: string;
    createMethod: 'EMAIL' | 'PHONE' | 'OAUTH' | 'API_KEY';
    timestamp: number;
  };
};
