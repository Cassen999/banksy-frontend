export function handleUnauthorized(): void {
  // Clear auth context state here when AuthContext is implemented
  window.location.href = `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/google`;
}
