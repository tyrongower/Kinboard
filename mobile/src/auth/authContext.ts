// Shared auth state used by the API client interceptors.
// This module must not import the API client to avoid require cycles.

let accessToken: string | null = null;

type UnauthorizedHandler = () => void | Promise<void>;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export function handleUnauthorized(): void {
  if (!unauthorizedHandler) return;

  try {
    const result = unauthorizedHandler();
    if (result && typeof (result as Promise<void>).catch === 'function') {
      (result as Promise<void>).catch((e) => {
        // eslint-disable-next-line no-console
        console.error('Unauthorized handler failed', e);
      });
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Unauthorized handler failed', e);
  }
}
