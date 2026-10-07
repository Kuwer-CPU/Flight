import { baggageKg } from './baggage';
import type { FlightOffer, SearchQuery } from './types';

export interface StudentComparison {
  standardKg?: number;
  extraKg?: number;
  eligibleKg?: number;
  additionalCostPerAdult?: number;
  comparableCostPerAdult?: number;
  example: boolean;
  verificationRequired: boolean;
  registrationRequired: boolean;
}

export function studentComparison(offer: FlightOffer, query: Pick<SearchQuery, 'student' | 'baggage'>): StudentComparison {
  const standardKg = baggageKg(offer.baggage);
  const sample = offer.mode === 'demo' && offer.studentExample &&
    Number.isFinite(offer.studentExample.extraKg) && offer.studentExample.extraKg >= 0 ? offer.studentExample : undefined;
  const extraKg = query.student && sample ? sample.extraKg : query.student ? undefined : 0;
  const eligibleKg = standardKg !== undefined && extraKg !== undefined ? standardKg + extraKg : undefined;
  // Unknown benefits never increase confirmed baggage. Known standard baggage can still cover the request.
  const available = eligibleKg ?? standardKg;
  let additionalCostPerAdult: number | undefined;
  if (query.baggage === 0 || (available !== undefined && available >= query.baggage)) additionalCostPerAdult = 0;
  else if (available !== undefined && sample?.addOn && sample.addOn.currency === offer.currency &&
    Number.isFinite(sample.addOn.kg) && sample.addOn.kg > 0 &&
    Number.isFinite(sample.addOn.pricePerAdult) && sample.addOn.pricePerAdult > 0) {
    additionalCostPerAdult = Math.ceil((query.baggage - available) / sample.addOn.kg) * sample.addOn.pricePerAdult;
  }
  return {
    standardKg, extraKg, eligibleKg, additionalCostPerAdult,
    comparableCostPerAdult: additionalCostPerAdult === undefined ? undefined : offer.price / offer.passengers + additionalCostPerAdult,
    example: !!sample,
    verificationRequired: !!(query.student && sample && sample.extraKg > 0 && sample.verificationRequired),
    registrationRequired: !!(query.student && sample && sample.extraKg > 0 && sample.registrationRequired),
  };
}

/** Relative score: 40% comparable cost, 45% included baggage coverage, 15% total travel time. */
export function studentValueScores(offers: FlightOffer[], query: SearchQuery): Map<string, number> {
  const result = new Map<string, number>();
  const totalDuration = (offer: FlightOffer) => offer.itineraries.reduce((sum, it) => sum + it.duration, 0);
  const comparable = offers.map(offer => ({ offer, comparison: studentComparison(offer, query) }))
    .filter(({ offer, comparison: c }) => c.eligibleKg !== undefined && c.comparableCostPerAdult !== undefined &&
      c.comparableCostPerAdult > 0 && totalDuration(offer) > 0);
  // Scores from different currencies cannot be compared without a currency-conversion quote.
  if (new Set(comparable.map(({ offer }) => offer.currency)).size !== 1) return result;
  const minimum = Math.min(...comparable.map(({ comparison: c }) => c.comparableCostPerAdult!));
  const shortest = Math.min(...comparable.map(({ offer }) => totalDuration(offer)));
  for (const { offer, comparison: c } of comparable) {
    const coverage = query.baggage === 0 ? 1 : Math.min(1, c.eligibleKg! / query.baggage);
    const score = (0.4 * minimum / c.comparableCostPerAdult! + 0.45 * coverage + 0.15 * shortest / totalDuration(offer)) * 10;
    result.set(offer.id, Math.round(score * 10) / 10);
  }
  return result;
}
