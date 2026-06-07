export function sanitizeCsvCell(value: string): string {
  return /^[=+\-@\t]/.test(value) ? '\t' + value : value;
}

export function rowsToCsv(
  rows: Record<string, string | number>[],
  headers: string[]
): string {
  const esc = (v: string | number) => sanitizeCsvCell(String(v));
  return [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => esc(r[h] ?? '')).join(',')),
  ].join('\n');
}
