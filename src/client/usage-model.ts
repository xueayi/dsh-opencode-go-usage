/**
 * Pure display projections for the OpenCode Go usage dock.
 *
 * No React, no DOM: every function here is trivially unit-testable, mirroring
 * the host-side purity split. The dock renders the three quota windows as
 * rings with a live reset countdown; tones follow a soft threshold so the
 * panel stays calm until usage climbs.
 * @module dsh-opencode-go-usage/client/model
 */

import type { OpenCodeUsageData, OpenCodeUsageState } from '../types.ts'

/** One quota window in display order. */
export interface WindowView {
  key: 'rolling' | 'weekly' | 'monthly'
  /** Short Chinese label for the panel row. */
  label: string
  /** English label kept for recognizability. */
  sublabel: string
  /** Percent already used, 0–100. */
  percent: number
  /** Epoch millis when the window resets. */
  resetsAt: number
}

/** Tone thresholds for usage rings; `danger` ≥ 85%, `warn` ≥ 60%. */
export type UsageTone = 'ok' | 'warn' | 'danger'

const WINDOW_META: Record<WindowView['key'], { label: string; sublabel: string }> = {
  rolling: { label: '5h 滚动', sublabel: '5h Rolling' },
  weekly: { label: '本周', sublabel: 'Weekly' },
  monthly: { label: '本月', sublabel: 'Monthly' },
}

/** Project a usage sample into ordered window views (missing windows dropped). */
export function usageWindows(usage: OpenCodeUsageData | undefined): WindowView[] {
  if (usage === undefined) return []
  const views: WindowView[] = []
  for (const key of ['rolling', 'weekly', 'monthly'] as const) {
    const window = usage[key]
    if (window === undefined) continue
    views.push({
      key,
      label: WINDOW_META[key].label,
      sublabel: WINDOW_META[key].sublabel,
      percent: window.percent,
      resetsAt: Date.parse(window.resetsAt),
    })
  }
  return views
}

/** Tone for a used percentage (invalid numbers clamp to `ok`). */
export function percentTone(percent: number): UsageTone {
  if (!Number.isFinite(percent)) return 'ok'
  if (percent >= 85) return 'danger'
  if (percent >= 60) return 'warn'
  return 'ok'
}

/** Compact Chinese countdown until a reset instant. */
export function formatRemaining(resetsAt: number, now: number): string {
  const diff = resetsAt - now
  if (!Number.isFinite(diff)) return '—'
  if (diff <= 0) return '已重置'
  const totalMinutes = Math.floor(diff / 60_000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `${days}天${hours}小时`
  if (hours > 0) return `${hours}小时${minutes}分`
  if (minutes > 0) return `${minutes}分${Math.max(0, Math.floor((diff % 60_000) / 1000))}秒`
  return `${Math.max(0, Math.floor(diff / 1000))}秒`
}

/** Minimal countdown for tight surfaces (the dock badge): `4d3h`, `3h25m`, `12m05s`, `9s`. */
export function formatRemainingCompact(resetsAt: number, now: number): string {
  const diff = resetsAt - now
  if (!Number.isFinite(diff)) return '—'
  if (diff <= 0) return '已重置'
  const totalMinutes = Math.floor(diff / 60_000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  const seconds = Math.max(0, Math.floor((diff % 60_000) / 1000))
  if (days > 0) return hours > 0 ? `${days}d${hours}h` : `${days}d`
  if (hours > 0) return `${hours}h${minutes}m`
  if (minutes > 0) return `${minutes}m${String(seconds).padStart(2, '0')}s`
  return `${seconds}s`
}

/** Human-readable age of a sample. */
export function formatRelative(fetchedAt: number, now: number): string {
  const diff = Math.max(0, now - fetchedAt)
  const seconds = Math.floor(diff / 1000)
  if (seconds < 10) return '刚刚'
  if (seconds < 60) return `${seconds}秒前`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

/** Whether a state carries usable quota windows (kept across failed refreshes). */
export function stateHasUsage(state: OpenCodeUsageState | null): state is OpenCodeUsageState & { usage: OpenCodeUsageData } {
  return state !== null && state.usage !== undefined
}

/** Fetch the current cached sample from the plugin route. */
export async function fetchState(): Promise<OpenCodeUsageState> {
  const response = await fetch('/plugins/dsh-opencode-go-usage/state', { cache: 'no-store' })
  if (!response.ok) throw new Error(`state HTTP ${response.status}`)
  return (await response.json()) as OpenCodeUsageState
}

/** Ask the host for an immediate refresh and return the new sample. */
export async function refreshState(): Promise<OpenCodeUsageState> {
  const response = await fetch('/plugins/dsh-opencode-go-usage/refresh', { method: 'POST' })
  if (!response.ok) throw new Error(`refresh HTTP ${response.status}`)
  return (await response.json()) as OpenCodeUsageState
}
