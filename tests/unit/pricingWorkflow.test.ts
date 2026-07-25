import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

/**
 * Guards the wiring between scripts/check-page-changes.js and
 * .github/workflows/pricing-check.yml.
 *
 * Both bugs below shipped and stayed invisible: a GitHub Actions step output
 * that does not exist resolves to "" rather than erroring, and `git add` on a
 * gitignored path exits 1, which under `bash -e` silently killed the commit
 * chain. Neither surfaced until the audit step ahead of them was fixed.
 */

const repoRoot = path.resolve(__dirname, '../..')
const workflow = fs.readFileSync(
  path.join(repoRoot, '.github/workflows/pricing-check.yml'),
  'utf8'
)
const script = fs.readFileSync(
  path.join(repoRoot, 'scripts/check-page-changes.js'),
  'utf8'
)

describe('pricing-check workflow wiring', () => {
  it('reads a detection step output that check-page-changes.js actually writes', () => {
    const referenced = [...workflow.matchAll(/steps\.detection\.outputs\.(\w+)/g)].map(
      (m) => m[1]
    )
    expect(referenced.length).toBeGreaterThan(0)

    // Names the script appends to $GITHUB_OUTPUT, plus those the workflow
    // writes inline in the same step (e.g. detected_sha).
    const writtenByScript = [...script.matchAll(/`(\w+)=\$\{/g)].map((m) => m[1])
    const writtenInline = [...workflow.matchAll(/echo "(\w+)=.*>> \$GITHUB_OUTPUT/g)].map(
      (m) => m[1]
    )
    const written = new Set([...writtenByScript, ...writtenInline])

    for (const name of referenced) {
      expect(
        written.has(name),
        `workflow reads steps.detection.outputs.${name}, but nothing writes "${name}=" ` +
          `to $GITHUB_OUTPUT. A missing output resolves to "" and silently skips ` +
          `notify-price-changes. Written: ${[...written].join(', ')}`
      ).toBe(true)
    }
  })

  it('never git-adds a path that .gitignore excludes', () => {
    const ignored = fs
      .readFileSync(path.join(repoRoot, '.gitignore'), 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && !l.startsWith('!'))

    const addArgs = [...workflow.matchAll(/^\s*git add (.+?)\s*&&\s*$/gm)]
      .flatMap((m) => m[1].split(/\s+/))
      .map((p) => p.replace(/\/$/, ''))

    expect(addArgs.length).toBeGreaterThan(0)
    for (const arg of addArgs) {
      expect(
        ignored.includes(arg),
        `workflow runs "git add ${arg}" but .gitignore excludes it. git add exits 1 ` +
          `on an ignored path, and under "bash -e" that aborts the commit and push.`
      ).toBe(false)
    }
  })
})
