#!/usr/bin/env node
/**
 * Offline smoke verification for dsh-opencode-usage.
 *
 * Runs the pure usage-parsing rules and the browser dock display projections
 * against fixed fixtures. Requires a prior `pnpm build` (lib/ present).
 * Does not touch the network or any running DSH instance.
 *
 * Usage: node scripts/verify.mjs
 */

import { parseUsageBody, fetchOpenCodeUsage } from '../lib/usage.js'
import {
  formatRelative, formatRemaining, formatRemainingCompact, percentTone,
  stateHasUsage, usageWindows,
} from '../lib/client/usage-model.js'

let failures = 0
function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${label}`)
  } else {
    failures += 1
    console.error(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

console.log('usage parse')
{
  const sample = parseUsageBody({
    usage: {
      rolling: { status: 'ok', percent: 51, resetsAt: '2026-08-15T19:40:30.751Z' },
      weekly: { status: 'ok', percent: 32, resetsAt: '2026-08-17T00:00:00.751Z' },
      monthly: { status: 'ok', percent: 16, resetsAt: '2026-09-15T07:08:59.751Z' },
    },
  })
  check('parses a full sample', sample !== undefined)
  check('rolling percent', sample?.rolling?.percent === 51, String(sample?.rolling?.percent))
  check('monthly percent', sample?.monthly?.percent === 16, String(sample?.monthly?.percent))
  check('resetsAt kept verbatim', sample?.weekly?.resetsAt === '2026-08-17T00:00:00.751Z')

  check('rejects a non-object body', parseUsageBody(null) === undefined)
  check('rejects a missing usage key', parseUsageBody({ foo: 1 }) === undefined)
  check('rejects a malformed window', parseUsageBody({ usage: { rolling: { status: 'ok' } } }) === undefined)
  const partial = parseUsageBody({ usage: { rolling: { status: 'ok', percent: 1, resetsAt: 'x' } } })
  check('accepts a partial sample with one window', partial?.rolling?.percent === 1)
  check('drops unknown window keys', partial?.monthly === undefined)
}

console.log('fetch failure path')
{
  const failure = await fetchOpenCodeUsage('not-a-url', 'sk-test', 2000)
    .then(() => 'resolved')
    .catch((error) => error instanceof Error ? error.message : 'non-error')
  check('fetch rejects with a user-facing message', failure !== 'resolved' && failure.length > 0, failure)
}

console.log('state model')
{
  const withData = {
    usage: { rolling: { status: 'ok', percent: 1, resetsAt: 'x' } },
    usageFetchedAt: 1,
    health: { status: 'error', fetchedAt: 2, error: 'boom' },
  }
  const withoutData = { health: { status: 'unconfigured', fetchedAt: 3, error: 'no key' } }
  check('state with usage is usable', stateHasUsage(withData) === true)
  check('state without usage is not usable', stateHasUsage(withoutData) === false)
  check('null state is not usable', stateHasUsage(null) === false)
  const windows = usageWindows(withData.usage)
  check('windows still project from kept data', windows.length === 1 && windows[0].percent === 1)
}

console.log('dock projections')
{
  const now = Date.parse('2026-08-15T12:00:00.000Z')
  const usage = {
    rolling: { status: 'ok', percent: 51, resetsAt: '2026-08-15T19:40:30.751Z' },
    monthly: { status: 'ok', percent: 16, resetsAt: '2026-09-15T07:08:59.751Z' },
  }
  const windows = usageWindows(usage)
  check('windows in display order', windows.map((w) => w.key).join(',') === 'rolling,monthly', windows.map((w) => w.key).join(','))
  check('weekly dropped when absent', windows.length === 2, String(windows.length))
  check('labels', windows[0]?.label === '5h 滚动' && windows[1]?.label === '本月')

  check('tone ok below 60', percentTone(16) === 'ok')
  check('tone warn at 60', percentTone(60) === 'warn')
  check('tone danger at 85', percentTone(85) === 'danger')
  check('tone clamps unknown', percentTone(Number.NaN) === 'ok')

  check('countdown days+hours', formatRemaining(Date.parse('2026-08-19T12:00:00.000Z'), now) === '4天0小时')
  check('countdown hours+minutes', formatRemaining(Date.parse('2026-08-15T15:30:00.000Z'), now) === '3小时30分')
  check('countdown minutes+seconds', formatRemaining(Date.parse('2026-08-15T12:05:30.000Z'), now) === '5分30秒')
  check('countdown seconds', formatRemaining(Date.parse('2026-08-15T12:00:45.000Z'), now) === '45秒')
  check('countdown expired', formatRemaining(now - 1000, now) === '已重置')

  check('compact days', formatRemainingCompact(Date.parse('2026-08-19T12:00:00.000Z'), now) === '4d')
  check('compact days+hours', formatRemainingCompact(Date.parse('2026-08-18T15:00:00.000Z'), now) === '3d3h')
  check('compact hours+minutes', formatRemainingCompact(Date.parse('2026-08-15T15:30:00.000Z'), now) === '3h30m')
  check('compact minutes+seconds', formatRemainingCompact(Date.parse('2026-08-15T12:05:07.000Z'), now) === '5m07s')
  check('compact seconds', formatRemainingCompact(Date.parse('2026-08-15T12:00:09.000Z'), now) === '9s')
  check('compact expired', formatRemainingCompact(now - 1000, now) === '已重置')

  check('relative just now', formatRelative(now, now + 3000) === '刚刚')
  check('relative seconds', formatRelative(now, now + 30_000) === '30秒前')
  check('relative minutes', formatRelative(now, now + 5 * 60_000) === '5分钟前')
  check('relative hours', formatRelative(now, now + 3 * 3_600_000) === '3小时前')
  check('relative days', formatRelative(now, now + 50 * 3_600_000) === '2天前')
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log('\nall checks passed')
