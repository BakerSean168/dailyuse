/**
 * AI Domain Event Map
 * 
 * Event Naming Convention: ai:<action>
 * - ai:quota-create - AI quota created
 * - ai:quota-consume - AI quota consumed
 * - ai:quota-reset - AI quota reset
 * - ai:quota-exceed - AI quota exceeded
 * - ai:quota-update-limit - AI quota limit updated
 */
export type AIEventMap = {
  'ai:quota-create': { 
    quotaId: string; 
    identityId: string; 
    quotaLimit: number;
  };
  
  'ai:quota-consume': { 
    quotaId: string; 
    identityId: string; 
    amount: number; 
    previousUsage: number; 
    newUsage: number;
  };
  
  'ai:quota-reset': { 
    quotaId: string; 
    identityId: string; 
    previousUsage: number; 
    resetAt: number; 
    nextResetAt: number;
  };
  
  'ai:quota-exceed': { 
    quotaId: string; 
    identityId: string; 
    quotaLimit: number; 
    currentUsage: number;
  };
  
  'ai:quota-update-limit': { 
    quotaId: string; 
    previousLimit: number; 
    newLimit: number;
  };
};
