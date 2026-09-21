export const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

export function resolveApiBaseUrl(env = import.meta.env) {
  const configuredUrl = env?.VITE_API_URL;
  return typeof configuredUrl === 'string' && configuredUrl.trim() ? configuredUrl : DEFAULT_API_BASE_URL;
}
