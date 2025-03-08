interface TokenResponse {
  access_token: string;
  error?: string;
}

interface TokenClient {
  requestAccessToken(): void;
}

interface OAuth2 {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
  }): TokenClient;
}

interface Google {
  accounts: {
    oauth2: OAuth2;
  };
}

declare global {
  interface Window {
    google?: Google;
  }
} 