import type { PricesData } from '../types/prices';
import { differenceInDays, parseISO } from 'date-fns';

export type StalenessLevel = 'fresh' | 'amber' | 'red';

export async function fetchPrices(): Promise<PricesData> {
  const response = await fetch('/api/v1/prices.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch prices: ${response.status}`);
  }
  return response.json() as Promise<PricesData>;
}

export function getStalenessLevel(lastHumanVerified: string): StalenessLevel {
  const days = differenceInDays(new Date(), parseISO(lastHumanVerified));
  if (days > 30) return 'red';
  if (days > 15) return 'amber';
  return 'fresh';
}

export function isPricesStale(lastHumanVerified: string): boolean {
  return getStalenessLevel(lastHumanVerified) !== 'fresh';
}
