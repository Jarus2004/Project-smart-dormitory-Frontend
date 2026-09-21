export declare const DEFAULT_API_BASE_URL: string;

export declare function resolveApiBaseUrl(
  env?: {
    VITE_API_URL?: string;
  },
): string;
