import { validatedFrameOrigin } from './flight-integration';

/** CSP extensions for officially approved widget resources, never arbitrary HTML or endpoints. */
export function partnerResourceOrigins(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  if (value.length > 4096) return [];
  const entries = value.split(',').map(entry => entry.trim());
  if (entries.length > 20) return [];
  const origins: string[] = [];
  for (const entry of entries) {
    const origin = validatedFrameOrigin(entry);
    if (!origin) return [];
    const url = new URL(entry);
    if (url.pathname !== '/' || url.search || url.hash) return [];
    origins.push(origin);
  }
  return [...new Set(origins)];
}
