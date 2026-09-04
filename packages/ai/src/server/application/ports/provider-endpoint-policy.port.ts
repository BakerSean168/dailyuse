export interface ProviderEndpointValidationInput {
  readonly baseUrl: string;
}

/** Guards user-controlled provider endpoints before the server performs egress. */
export interface IAIProviderEndpointPolicyPort {
  validate(input: ProviderEndpointValidationInput): Promise<void>;
}
