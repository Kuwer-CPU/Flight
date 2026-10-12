import { validatedFrameOrigin } from './flight-integration';

// Referenced by the owner-supplied public WL23277 SDK on 12 October2026.
// These permit browser SDK requests; Flyora never calls these APIs directly.
export const TRAVELPAYOUTS_RESOURCES = {
  connect: ['https://api.apistp.com', 'https://autocomplete.apistp.com', 'https://tickets-api.apistp.com', 'https://www.apistp.com'],
  style: ['https://fonts.googleapis.com'],
  image: ['https://img.avs.io'],
} as const;

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
