export interface TokenResponse {
    accessToken: string;
    expiresIn: number;
    tokenType: string;
}
export interface StoredToken {
    accessToken: string;
    expiresAt: number;
    tokenType: string;
}
export interface AuthConfig {
    clientId: string;
    clientSecret: string;
    baseUrl: string;
    tokenEndpoint?: string;
}
export interface QueuedRequest {
    resolve: (token: string) => void;
    reject: (error: Error) => void;
}
//# sourceMappingURL=auth.types.d.ts.map