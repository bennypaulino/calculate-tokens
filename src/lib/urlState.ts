import type { UrlParams } from '../types/calculator';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function decodeUrlState(search: string): Partial<UrlParams> {
  const params = new URLSearchParams(search);
  const result: Partial<UrlParams> = {};

  const out = params.get('out');
  if (out !== null) {
    const parsed = parseInt(out, 10);
    if (!isNaN(parsed)) {
      result.out = clamp(parsed, 0, 8000);
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

  const vol = params.get('vol');
  if (vol !== null) {
    const parsed = parseInt(vol, 10);
    if (!isNaN(parsed)) {
      result.vol = clamp(parsed, 1, 100000000);
    }
  }

  const cache = params.get('cache');
  if (cache !== null) {
    result.cache = cache === '1';
  }

  const batch = params.get('batch');
  if (batch !== null) {
    result.batch = batch === '1';
  }

  return result;
}

export function encodeUrlState(params: Partial<UrlParams>): string {
  const urlParams = new URLSearchParams();

  if (params.out !== undefined && params.out !== 500) {
    urlParams.set('out', String(params.out));
  }

  if (params.think) {
    urlParams.set('think', '1');
  }

  if (params.models && params.models.length > 0) {
    urlParams.set('models', params.models.join(','));
  }

  if (params.vol !== undefined && params.vol !== 10000) {
    urlParams.set('vol', String(params.vol));
  }

  if (params.cache) {
    urlParams.set('cache', '1');
  }

  if (params.batch) {
    urlParams.set('batch', '1');
  }

  const str = urlParams.toString();
  return str ? `?${str}` : '';
}
