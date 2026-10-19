export interface EssentialCategory {
  id: string;
  name: string;
  description: string;
}

export interface EssentialProduct {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  tip: string;
  keywords: string[];
}

export type EssentialAffiliateNetwork = 'admitad' | 'amazon-associates' | 'retailer';

export interface VerifiedEssentialPrice {
  amount: number;
  currency: 'INR';
  verifiedAt: string;
  sourceUrl: string;
}

export interface ResolvedEssential extends EssentialProduct {
  href: string;
  affiliate: boolean;
  retailer: string;
  network?: EssentialAffiliateNetwork;
  offerTitle?: string;
  verifiedPrice?: VerifiedEssentialPrice;
}

export const essentialsCategories: EssentialCategory[] = [
  { id: 'comfort', name: 'In-flight comfort', description: 'Small comforts for the long journey ahead.' },
  { id: 'baggage', name: 'Baggage accessories', description: 'Weigh, identify and secure your bags before departure.' },
  { id: 'personalization', name: 'Luggage personalization', description: 'Give your suitcase a little personality.' },
  { id: 'packing', name: 'Packing & organization', description: 'A place for everything, from shoes to toiletries.' },
  { id: 'electronics', name: 'Travel electronics', description: 'Plan for plugs, charging and cable clutter.' },
  { id: 'documents', name: 'Passport & document accessories', description: 'Keep important travel documents close at hand.' },
  { id: 'bags', name: 'Bags & luggage', description: 'Find a bag that suits your journey and ticket limits.' },
  { id: 'hygiene', name: 'Toiletries & hygiene', description: 'Pack everyday care for your first days abroad.' },
];

/** Generic shopping ideas, not specific retailer listings or endorsements. */
export const essentialsProducts: EssentialProduct[] = [
  {
    id: 'neck-pillow', categoryId: 'comfort', name: 'Neck pillow',
    description: 'A little support for long flights and airport waits.',
    tip: 'Choose a fit that feels comfortable and a cover you can wash.',
    keywords: ['travel pillow', 'sleep', 'long haul', 'comfort'],
  },
  {
    id: 'eye-mask', categoryId: 'comfort', name: 'Eye mask',
    description: 'Create your own quiet corner when the cabin lights are on.',
    tip: 'Look for a comfortable strap and a fit that blocks light without pressure.',
    keywords: ['sleep mask', 'sleep', 'light', 'comfort'],
  },
  {
    id: 'earplugs', categoryId: 'comfort', name: 'Earplugs',
    description: 'A small addition to your in-flight rest kit.',
    tip: 'Follow the maker’s fit and hygiene instructions, and stay aware of announcements.',
    keywords: ['noise', 'sleep', 'comfort'],
  },
  {
    id: 'travel-blanket', categoryId: 'comfort', name: 'Travel blanket',
    description: 'An extra layer for air-conditioned cabins and terminals.',
    tip: 'A compact, washable layer is easier to carry between connections.',
    keywords: ['warmth', 'throw', 'comfort', 'long haul'],
  },
  {
    id: 'digital-luggage-scale', categoryId: 'baggage', name: 'Digital luggage scale',
    description: 'Check each packed bag’s weight before leaving home.',
    tip: 'Recheck after packing; a scale does not increase your ticket’s baggage allowance.',
    keywords: ['weigh', 'weight', 'checked bags', 'baggage scale'],
  },
  {
    id: 'tsa-lock', categoryId: 'baggage', name: 'TSA-compatible lock',
    description: 'Compare travel locks for your luggage and destination.',
    tip: 'Check the lock’s compatibility and local screening guidance. No lock guarantees security.',
    keywords: ['luggage lock', 'tsa', 'combination', 'security'],
  },
  {
    id: 'luggage-straps', categoryId: 'baggage', name: 'Luggage straps',
    description: 'Add an easy-to-spot detail to your checked suitcase.',
    tip: 'Fit straps securely and keep them clear of wheels and handles.',
    keywords: ['suitcase strap', 'identify', 'checked bags'],
  },
  {
    id: 'luggage-tags', categoryId: 'baggage', name: 'Luggage tags',
    description: 'Keep useful contact details attached to your bags.',
    tip: 'Use a covered contact panel and avoid displaying your home address unnecessarily.',
    keywords: ['bag tag', 'contact', 'identify', 'checked bags'],
  },
  {
    id: 'travel-stickers', categoryId: 'personalization', name: 'Travel stickers',
    description: 'Add a little character to your suitcase or laptop.',
    tip: 'Keep airline baggage labels, barcodes and safety markings visible.',
    keywords: ['stickers', 'decoration', 'personalise', 'personalize'],
  },
  {
    id: 'suitcase-decals', categoryId: 'personalization', name: 'Suitcase decals',
    description: 'Make your luggage easier to recognise on the carousel.',
    tip: 'Check the finish is suitable for your suitcase material before applying.',
    keywords: ['vinyl', 'decals', 'decoration', 'personalise'],
  },
  {
    id: 'name-labels', categoryId: 'personalization', name: 'Name labels',
    description: 'Label the little things that travel with you.',
    tip: 'Share only the contact details you are comfortable making visible.',
    keywords: ['personalised labels', 'personalized labels', 'identify', 'name'],
  },
  {
    id: 'packing-cubes', categoryId: 'packing', name: 'Packing cubes',
    description: 'Group outfits and everyday essentials inside your suitcase.',
    tip: 'Cubes organise your packing; they do not reduce its weight.',
    keywords: ['organiser', 'organizer', 'clothes', 'packing cubes'],
  },
  {
    id: 'compression-bags', categoryId: 'packing', name: 'Compression bags',
    description: 'Make bulky clothes easier to arrange in your bag.',
    tip: 'Compression saves space, not weight. Weigh the fully packed bag again.',
    keywords: ['vacuum bags', 'space saving', 'clothes', 'compression'],
  },
  {
    id: 'shoe-bags', categoryId: 'packing', name: 'Shoe bags',
    description: 'Keep shoes separate from the rest of your packing.',
    tip: 'Dry and clean footwear before packing, and check destination biosecurity rules.',
    keywords: ['footwear', 'shoe pouch', 'organiser', 'organizer'],
  },
  {
    id: 'toiletry-organizer', categoryId: 'packing', name: 'Toiletry organizer',
    description: 'Keep your bathroom essentials together from home to your new room.',
    tip: 'An organizer does not replace airport liquid-container and screening requirements.',
    keywords: ['wash bag', 'dopp kit', 'hanging organizer', 'toiletries'],
  },
  {
    id: 'universal-adapter', categoryId: 'electronics', name: 'Universal travel adapter',
    description: 'Prepare for the plug sockets at your study destination.',
    tip: 'An adapter is not a voltage converter. Check destination sockets and device ratings.',
    keywords: ['plug', 'socket', 'UK', 'USA', 'Europe', 'Australia', 'adapter'],
  },
  {
    id: 'travel-charger', categoryId: 'electronics', name: 'Travel charger',
    description: 'Compare chargers for the devices you actually take.',
    tip: 'Check voltage, connector compatibility and the power your devices require.',
    keywords: ['usb', 'usb-c', 'charging', 'phone', 'laptop'],
  },
  {
    id: 'cable-organizer', categoryId: 'electronics', name: 'Cable organizer',
    description: 'Keep charging leads and small accessories easy to find.',
    tip: 'Keep the cable you need in transit somewhere accessible.',
    keywords: ['cables', 'tech pouch', 'electronics organizer', 'charging'],
  },
  {
    id: 'power-bank', categoryId: 'electronics', name: 'Power bank',
    description: 'Compare portable charging options for a long travel day.',
    tip: 'Check your airline’s battery, watt-hour, cabin-only and in-flight-use rules before buying.',
    keywords: ['portable charger', 'battery', 'charging', 'wh', 'electronics'],
  },
  {
    id: 'passport-holder', categoryId: 'documents', name: 'Passport holder',
    description: 'A simple cover to keep your passport close at hand.',
    tip: 'Keep your passport accessible; screening staff may ask you to remove the cover.',
    keywords: ['passport cover', 'documents', 'immigration'],
  },
  {
    id: 'document-organizer', categoryId: 'documents', name: 'Document organizer',
    description: 'Bring your passport, admission papers and travel documents together.',
    tip: 'Keep essential originals in your cabin bag and secure backup copies separately.',
    keywords: ['visa', 'admission', 'student documents', 'folder', 'papers'],
  },
  {
    id: 'travel-wallet', categoryId: 'documents', name: 'Travel wallet',
    description: 'Organise the small essentials you use along the way.',
    tip: 'Avoid keeping every card, all cash and all documents in one place.',
    keywords: ['wallet', 'cards', 'currency', 'documents'],
  },
  {
    id: 'suitcase', categoryId: 'bags', name: 'Suitcase',
    description: 'Compare checked luggage for your move abroad.',
    tip: 'Check empty weight, packed dimensions and your ticket’s per-bag limits before buying.',
    keywords: ['checked baggage', 'trolley', 'hard shell', 'luggage'],
  },
  {
    id: 'cabin-bag', categoryId: 'bags', name: 'Cabin bag',
    description: 'Keep your in-flight essentials and first-day items together.',
    tip: 'Cabin size and weight limits vary by airline, fare and aircraft. Check your ticket.',
    keywords: ['carry-on', 'carry on', 'hand luggage', 'cabin luggage'],
  },
  {
    id: 'backpack', categoryId: 'bags', name: 'Backpack',
    description: 'A bag for your travel day and the campus days that follow.',
    tip: 'Do not assume a backpack is an extra free item; check your fare’s personal-item rules.',
    keywords: ['rucksack', 'laptop bag', 'campus', 'personal item'],
  },
  {
    id: 'duffel-bag', categoryId: 'bags', name: 'Duffel bag',
    description: 'Explore a soft-sided option for flexible packing.',
    tip: 'Measure and weigh it when packed. A soft bag still has to meet your ticket’s limits.',
    keywords: ['duffle', 'holdall', 'weekend bag', 'luggage'],
  },
  {
    id: 'refillable-bottles', categoryId: 'hygiene', name: 'Refillable travel bottles',
    description: 'Bring smaller portions of your everyday toiletries.',
    tip: 'Check airport and transit liquid rules; bottle size matters, not only the amount inside.',
    keywords: ['liquids', 'shampoo', 'containers', 'toiletries'],
  },
  {
    id: 'clear-toiletry-bag', categoryId: 'hygiene', name: 'Clear toiletry bag',
    description: 'Keep the toiletries you need during transit easy to find.',
    tip: 'Check the required size and closure rules for your departure and transit airports.',
    keywords: ['liquids bag', 'transparent', 'wash bag', 'toiletries'],
  },
  {
    id: 'travel-hygiene-kit', categoryId: 'hygiene', name: 'Travel hygiene kit',
    description: 'Build a small kit for freshening up during a long journey.',
    tip: 'Check liquid and restricted-item rules for each item before packing it in your cabin bag.',
    keywords: ['hygiene', 'toothbrush', 'wipes', 'toiletries', 'freshen up'],
  },
];

export interface EssentialsFilters {
  query?: string;
  categoryId?: string;
  linkType?: 'all' | 'affiliate' | 'search';
}

/** Search applies alongside category and destination-type filters without changing catalog order. */
export function filterEssentialsProducts(
  products: ResolvedEssential[], filters: EssentialsFilters = {},
): ResolvedEssential[] {
  const terms = (filters.query ?? '').toLocaleLowerCase('en-IN').trim().split(/\s+/).filter(Boolean);
  return products.filter(product => {
    if (filters.categoryId && filters.categoryId !== 'all' && product.categoryId !== filters.categoryId) return false;
    if (filters.linkType === 'affiliate' && !product.affiliate) return false;
    if (filters.linkType === 'search' && product.affiliate) return false;
    const category = essentialsCategories.find(item => item.id === product.categoryId);
    const searchable = [product.name, product.description, product.tip, ...product.keywords, category?.name ?? '']
      .join(' ').toLocaleLowerCase('en-IN');
    return terms.every(term => searchable.includes(term));
  });
}
