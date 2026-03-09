export type NetworkStatus = 'online' | 'offline' | 'unknown';

export interface NetworkStateChangeEvent {
  status: NetworkStatus;
  previousStatus: NetworkStatus;
  timestamp: number;
}

export interface NetworkCheckConfig {
  checkInterval?: number;
  healthCheckUrl?: string;
  enableHealthCheck?: boolean;
  timeout?: number;
}
