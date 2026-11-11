import type { Quote } from '../db/types';

/** "Chapter 11 · page 54", or whichever of the two exists. */
export function quoteMeta(quote: Pick<Quote, 'chapter' | 'page'>): string {
  return [quote.chapter, quote.page !== undefined ? `page ${quote.page}` : undefined].filter(Boolean).join(' · ');
}
