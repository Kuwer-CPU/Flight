export interface TravelEssential { name: string; detail: string; href: string; affiliate: boolean }
/** Optional server-side affiliate destinations; never accept javascript/data URLs. */
export function travelEssentials(config: Record<string, string | undefined> = process.env): TravelEssential[] {
  return [
    { name: 'Digital luggage scale', detail: 'Weigh each bag before leaving home.', key: 'TRAVEL_ESSENTIALS_SCALE_URL', query: 'digital luggage scale' },
    { name: 'Packing cubes', detail: 'Organise your packing; they do not reduce its weight.', key: 'TRAVEL_ESSENTIALS_CUBES_URL', query: 'travel packing cubes' },
    { name: 'Cabin bag', detail: 'Check your airline’s dimensions and weight limits first.', key: 'TRAVEL_ESSENTIALS_CABIN_URL', query: 'cabin luggage' },
  ].map(item => {
    let href = 'https://www.amazon.com/s?k=' + encodeURIComponent(item.query);
    let affiliate = false;
    try {
      const url = new URL(config[item.key] || '');
      if (url.protocol === 'https:' && !url.username && !url.password && !url.port) { href = url.href; affiliate = true; }
    } catch { /* Fall back to a clearly labelled retailer search. */ }
    return { name: item.name, detail: item.detail, href, affiliate };
  });
}
