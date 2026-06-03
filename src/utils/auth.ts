let _clearUser: (() => void) | null = null;

export function registerClearUser(fn: () => void): void {
  _clearUser = fn;
}

export function handleUnauthorized(): void {
  _clearUser?.();
  window.location.href = `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/google`;
}
