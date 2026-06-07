export function heuristicCount(charCount: number): number {
  return Math.ceil(charCount / 4);
}

export function formatCost(cost: number): string {
  if (cost === 0) return '$0.0000';
  if (cost >= 1.0) return `$${cost.toFixed(2)}`;
  if (cost >= 0.01) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(4)}`;
}

export function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(0)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`;
  return String(tokens);
}
