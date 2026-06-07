/**
 * Token highlighter utilities.
 *
 * CRITICAL: DOM construction MUST use element.textContent, NEVER innerHTML.
 * This module renders arbitrary user-pasted content — innerHTML would be XSS.
 */

/**
 * Clears and re-renders token highlight spans into the given container.
 * Uses alternating CSS classes token-highlight-a / token-highlight-b.
 */
export function renderTokenHighlights(
  container: HTMLDivElement,
  tokens: string[]
): void {
  // Clear existing children without innerHTML
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  for (let i = 0; i < tokens.length; i++) {
    const span = document.createElement('span');
    span.textContent = tokens[i];
    span.className = i % 2 === 0 ? 'token-highlight-a' : 'token-highlight-b';
    container.appendChild(span);
  }
}

/**
 * Returns the decoded token strings for the given text using js-tiktoken.
 * Only works for o200k_base and cl100k_base encodings.
 * Falls back to [text] as a single "token" on any error.
 */
export async function getTokenStringsForHighlight(
  text: string,
  encoding: 'o200k_base' | 'cl100k_base'
): Promise<string[]> {
  if (!text) return [];

  try {
    const { getEncoding } = await import('js-tiktoken');
    const enc = getEncoding(encoding);
    const tokenIds = enc.encode(text);

    const tokenStrings: string[] = [];
    for (const id of tokenIds) {
      // decode a single token ID to its string representation
      tokenStrings.push(enc.decode([id]));
    }

    return tokenStrings;
  } catch {
    // Graceful degradation: treat the whole text as one token
    return [text];
  }
}
