import type { UrlParams } from '../types/calculator';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function decodeUrlState(search: string): Partial<UrlParams> {
  const params = new URLSearchParams(search);
  const result: Partial<UrlParams> = {};

  const out = params.get('out');
  if (out !== null) {
    const parsed = parseFloat(out);
    if (!isNaN(parsed)) {
      result.out = clamp(parsed, 0, 10);
    }
  }

  const think = params.get('think');
  if (think !== null) {
    result.think = think === '1';
  }

  const models = params.get('models');
  if (models !== null && models.length > 0) {
    result.models = models.split(',').filter(Boolean);
  }

  return result;
}

export function encodeUrlState(params: Partial<UrlParams>): string {
  const urlParams = new URLSearchParams();

  if (params.out !== undefined && params.out !== 1) {
    urlParams.set('out', String(params.out));
  }

  if (params.think) {
    urlParams.set('think', '1');
  }

  if (params.models && params.models.length > 0) {
    urlParams.set('models', params.models.join(','));
  }

  const str = urlParams.toString();
  return str ? `?${str}` : '';
}
