/**
 * OpenCode Go usage dock — the whole browser surface.
 *
 * A bottom-right floating dock: a compact glassy badge shows all three quota
 * windows (滚/周/月) with threshold-colored percentages plus the 5h-rolling
 * window's live reset countdown; clicking it toggles a glassy panel with the
 * full window rows, a manual refresh button, and clear error / unconfigured
 * states. The dock is mounted through a body portal by `client/index.tsx`
 * and follows DSH design tokens (`--dsw-alias-*`), so it blends with either
 * theme.
 * @module dsh-opencode-go-usage/client/dock
 */

import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import type { OpenCodeUsageState } from '../types.ts'
import {
  fetchState, formatRelative, formatRemaining, formatRemainingCompact,
  percentTone, refreshState, stateHasUsage, usageWindows,
  type UsageTone, type WindowView,
} from './usage-model.ts'
import styles from './usage.module.css'

/** Poll cadence: fast while the panel is open, calm while collapsed. */
const OPEN_POLL_MS = 10_000
const COLLAPSED_POLL_MS = 60_000

/** Root state: the dock itself. */
export function UsageDock(): ReactElement {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<OpenCodeUsageState | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  // Re-rendered once a second so badge and panel countdowns stay live.
  const [now, setNow] = useState(() => Date.now())

  // Poll the host cache; interval follows the open state.
  useEffect(() => {
    let alive = true
    const tick = async (): Promise<void> => {
      try {
        const next = await fetchState()
        if (alive) setState(next)
      } catch {
        // Keep the last sample; transient network failures must not blank the dock.
      }
    }
    void tick()
    const id = window.setInterval(() => { void tick() }, open ? OPEN_POLL_MS : COLLAPSED_POLL_MS)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [open])

  // Countdown ticker: always on (the badge shows the rolling countdown too).
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const handleRefresh = async (): Promise<void> => {
    if (refreshing) return
    setRefreshing(true)
    try {
      setState(await refreshState())
      setNow(Date.now())
    } catch {
      // The next poll will surface host-side health; keep the current sample.
    } finally {
      setRefreshing(false)
    }
  }

  const windows = usageWindows(stateHasUsage(state) ? state.usage : undefined)
  const rolling = windows.find((window) => window.key === 'rolling')

  return (
    <>
      <button
        type="button"
        className={styles.badge}
        onClick={() => setOpen((value) => !value)}
        title="OpenCode Go 用量：滚/周/月配额 + 5h 滚动重置倒计时"
        aria-expanded={open}
        aria-label="OpenCode Go 用量"
      >
        {windows.length > 0 ? (
          <>
            {windows.map((window) => (
              <BadgeRing
                key={window.key}
                percent={window.percent}
                tone={percentTone(window.percent)}
                label={window.label}
              />
            ))}
            {rolling !== undefined && (
              <span className={styles.badgeCountdown} title="5h 滚动窗口重置倒计时">
                <span className={styles.badgeCountdownIcon} aria-hidden="true">↻</span>
                <span className={styles.badgeCountdownValue}>
                  {formatRemainingCompact(rolling.resetsAt, now)}
                </span>
              </span>
            )}
          </>
        ) : (
          <span className={styles.badgeText}>Go —</span>
        )}
        <span
          className={state === null ? styles.healthUnknown
            : state.status === 'ok' ? styles.healthOk
            : styles.healthBad}
          aria-hidden="true"
        />
      </button>
      {open && (
        <section className={styles.panel} role="dialog" aria-label="OpenCode Go 用量">
          <header className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <span className={styles.panelLogo} aria-hidden="true">◈</span>
              <span>OpenCode Go 用量</span>
              <span className={styles.healthLabel}>
                {state === null ? '连接中…' : state.status === 'ok' ? '实时' : '异常'}
              </span>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setOpen(false)}
              aria-label="关闭"
            >
              ✕
            </button>
          </header>

          {state !== null && state.status === 'ok' ? (
            <div className={styles.windows}>
              {windows.map((window) => (
                <WindowRow key={window.key} window={window} now={now} />
              ))}
              {windows.length === 0 && (
                <p className={styles.emptyNote}>用量服务未返回任何窗口数据。</p>
              )}
            </div>
          ) : (
            <div className={styles.errorBox}>
              <p className={styles.errorTitle}>
                {state === null ? '正在连接用量服务…' : state.status === 'error' ? '用量获取失败' : '尚未配置 API Key'}
              </p>
              <p className={styles.errorDetail}>
                {state === null
                  ? '如果长时间停留在该状态，请检查 dsh 服务是否运行了 dsh-opencode-go-usage 插件。'
                  : state.error}
              </p>
              {state !== null && state.status === 'unconfigured' && (
                <p className={styles.errorHint}>
                  配置方法：在 dsh 凭据（如 ~/.dsh/.credentials.yaml 或环境变量）中设置 OPENCODE_GO_API_KEY，
                  或在 cordis.yml 中为该插件配置 apiKey 字段。
                </p>
              )}
            </div>
          )}

          <footer className={styles.panelFooter}>
            <span className={styles.updatedAt}>
              {state === null ? '' : `更新于 ${formatRelative(state.fetchedAt, now)}`}
            </span>
            <button
              type="button"
              className={styles.refreshButton}
              onClick={() => { void handleRefresh() }}
              disabled={refreshing}
            >
              {refreshing ? '刷新中…' : '立即刷新'}
            </button>
          </footer>
        </section>
      )}
    </>
  )
}

/** One quota window row: ring + labels + countdown. */
function WindowRow({ window, now }: { window: WindowView; now: number }): ReactElement {
  const remaining = Math.max(0, 100 - window.percent)
  return (
    <div className={styles.windowRow}>
      <Ring percent={window.percent} tone={percentTone(window.percent)} />
      <div className={styles.windowBody}>
        <div className={styles.windowName}>
          <span>{window.label}</span>
          <span className={styles.windowSublabel}>{window.sublabel}</span>
        </div>
        <div className={styles.windowMeta}>
          <span className={styles.usedText}>已用 {window.percent}%</span>
          <span className={styles.remainingText}>剩余 {remaining}%</span>
        </div>
        <div className={styles.countdown}>重置于 {formatRemaining(window.resetsAt, now)}</div>
      </div>
    </div>
  )
}

/** Circular progress ring, colored by tone. */
export function Ring({ percent, tone, size = 50 }: { percent: number; tone: UsageTone; size?: number }): ReactElement {
  const stroke = 5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const used = Math.min(100, Math.max(0, percent))
  const dash = (circumference * used) / 100
  return (
    <svg
      className={styles.ring}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`已用 ${used}%`}
    >
      <circle
        className={styles.ringTrack}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        className={styles.ringBar}
        data-tone={tone}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={circumference / 4}
        strokeLinecap="round"
      />
      <text
        className={styles.ringText}
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
      >
        {Math.round(used)}%
      </text>
    </svg>
  )
}

/**
 * Fixed-size mini ring for the collapsed badge: circular progress plus the
 * percent centered inside. Fixed SVG dimensions keep the badge layout stable
 * — no inline text can overlap regardless of font fallback or zoom.
 */
function BadgeRing({ percent, tone, label }: { percent: number; tone: UsageTone; label: string }): ReactElement {
  const size = 36
  const stroke = 3.5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const used = Math.min(100, Math.max(0, percent))
  const dash = (circumference * used) / 100
  return (
    <svg
      className={styles.badgeRing}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${label}已用 ${used}%`}
    >
      <circle
        className={styles.ringTrack}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        className={styles.ringBar}
        data-tone={tone}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={circumference / 4}
        strokeLinecap="round"
      />
      <text
        className={styles.badgeRingText}
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
      >
        {Math.round(used)}%
      </text>
    </svg>
  )
}
