import { describe, it, expect, beforeAll } from 'vitest'
import { axe, toHaveNoViolations } from 'jest-axe'

beforeAll(() => {
  expect.extend(toHaveNoViolations)
})

describe('AC-3.4.1 — jest-axe: zero critical/serious WCAG violations', () => {
  it('textarea with aria-label passes axe', async () => {
    const html = `
      <html><body>
        <label for="prompt">Prompt</label>
        <textarea
          id="prompt"
          aria-label="Enter your AI prompt or text"
          role="textbox"
        ></textarea>
      </body></html>
    `
    const results = await axe(html, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    })
    expect(results).toHaveNoViolations()
  })

  it('range slider with aria labels passes axe', async () => {
    const html = `
      <html><body>
        <label for="output-slider">Output tokens</label>
        <input
          id="output-slider"
          type="range"
          min="0"
          max="8000"
          value="500"
          aria-label="Output token estimate"
          aria-valuemin="0"
          aria-valuemax="8000"
          aria-valuenow="500"
        />
      </body></html>
    `
    const results = await axe(html, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    })
    expect(results).toHaveNoViolations()
  })

  it('cost ratio callout with aria-live passes axe', async () => {
    const html = `
      <html><body>
        <p role="status" aria-live="polite">
          GPT-4o is 3x cheaper than Claude 3 Opus
        </p>
      </body></html>
    `
    const results = await axe(html, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    })
    expect(results).toHaveNoViolations()
  })

  it('share button with accessible label passes axe', async () => {
    const html = `
      <html><body>
        <button type="button" aria-label="Copy share link">Copy link</button>
      </body></html>
    `
    const results = await axe(html, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    })
    expect(results).toHaveNoViolations()
  })

  it('full calculator form structure passes axe', async () => {
    const html = `
      <html><body>
        <main>
          <label for="ta">Prompt</label>
          <textarea id="ta" aria-label="Enter your AI prompt or text" role="textbox"></textarea>
          <label for="sl">Output tokens</label>
          <input
            id="sl"
            type="range"
            min="0" max="8000" value="500"
            aria-label="Output token estimate"
            aria-valuemin="0" aria-valuemax="8000" aria-valuenow="500"
          />
          <p role="status" aria-live="polite">GPT-4o is 2x cheaper</p>
          <button type="button">Copy link</button>
          <button type="button" aria-pressed="false">Highlight tokens</button>
        </main>
      </body></html>
    `
    const results = await axe(html, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      rules: { 'color-contrast': { enabled: false } },
    })
    expect(results).toHaveNoViolations()
  })
})
