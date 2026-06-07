import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderTokenHighlights } from '@/lib/highlighter'

/**
 * AC-2.1.7: Token highlighter MUST use textContent, never innerHTML.
 * Arbitrary user-pasted content (including from shared URLs) must not be
 * able to execute JavaScript or inject DOM elements.
 */
describe('XSS safety — textContent prevents script injection (AC-2.1.7)', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    // Reset any accidental global pollution from previous tests
    delete (window as unknown as Record<string, unknown>).__xss
  })

  afterEach(() => {
    document.body.removeChild(container)
    delete (window as unknown as Record<string, unknown>).__xss
  })

  it('does not execute onerror handler when token text contains an img tag', () => {
    const xssPayload = '<img src=x onerror="window.__xss=true">'
    const span = document.createElement('span')
    span.textContent = xssPayload
    container.appendChild(span)

    // The img tag should be treated as literal text, not parsed as HTML
    expect((window as unknown as Record<string, unknown>).__xss).toBeUndefined()
    // No img element should have been injected into the DOM
    expect(document.querySelector('img')).toBeNull()
    // The text content should be the raw string
    expect(span.textContent).toBe(xssPayload)
  })

  it('does not execute script tag payloads via textContent', () => {
    const xssPayload = '<script>window.__xss = true</script>'
    const span = document.createElement('span')
    span.textContent = xssPayload
    container.appendChild(span)

    expect((window as unknown as Record<string, unknown>).__xss).toBeUndefined()
    expect(document.querySelector('script')).toBeNull()
  })

  it('does not execute event-handler-style payloads', () => {
    const payload = 'javascript:window.__xss=true'
    const span = document.createElement('span')
    span.textContent = payload
    container.appendChild(span)

    expect((window as unknown as Record<string, unknown>).__xss).toBeUndefined()
  })

  it('renderTokenHighlights renders tokens as literal text, not HTML', () => {
    const tokens = ['Hello', '<img src=x onerror="window.__xss=true">', 'World']
    renderTokenHighlights(container, tokens)

    // No img should be in the DOM
    expect(container.querySelector('img')).toBeNull()
    expect((window as unknown as Record<string, unknown>).__xss).toBeUndefined()

    // The spans should contain the literal text
    const spans = container.querySelectorAll('span')
    expect(spans.length).toBe(3)
    expect(spans[0].textContent).toBe('Hello')
    expect(spans[1].textContent).toBe('<img src=x onerror="window.__xss=true">')
    expect(spans[2].textContent).toBe('World')
  })

  it('renderTokenHighlights alternates CSS classes (token-highlight-a / token-highlight-b)', () => {
    const tokens = ['alpha', 'beta', 'gamma']
    renderTokenHighlights(container, tokens)

    const spans = container.querySelectorAll('span')
    expect(spans[0].className).toBe('token-highlight-a')
    expect(spans[1].className).toBe('token-highlight-b')
    expect(spans[2].className).toBe('token-highlight-a')
  })

  it('renderTokenHighlights clears previous content before re-rendering', () => {
    renderTokenHighlights(container, ['first', 'render'])
    expect(container.querySelectorAll('span').length).toBe(2)

    renderTokenHighlights(container, ['second'])
    expect(container.querySelectorAll('span').length).toBe(1)
    expect(container.querySelector('span')!.textContent).toBe('second')
  })

  it('renderTokenHighlights handles empty token array without errors', () => {
    renderTokenHighlights(container, [])
    expect(container.querySelectorAll('span').length).toBe(0)
  })
})
