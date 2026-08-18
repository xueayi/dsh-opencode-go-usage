/**
 * OpenCode Go usage dock — the whole browser surface.
 *
 * A bottom-right floating dock: a compact glassy badge shows all three quota
 * windows (rolling/weekly/monthly) with threshold-colored percentages plus
 * the 5h-rolling window's live reset countdown; clicking it toggles a glassy
 * panel with the
 * full window rows, a manual refresh button, and clear error / unconfigured
 * states. The dock is mounted through a body portal by `client/index.tsx`
 * and follows DSH design tokens (`--dsw-alias-*`), so it blends with either
 * theme. Reuses the shared `StateDot` and `Button` primitives so the dock's
 * affordances stay visually consistent with the rest of DSH.
 *
 * Copy is locale-aware: `t` is the namespace-bound translate (typed to the
 * plugin's dictionary) and `locale` the LocaleRuntime, whose active language
 * follows dsh's `locale.preference` with a browser fallback. A locale switch
 * bumps the runtime revision, which this component watches through
 * `useSyncExternalStore` to re-render in place; the bound `t` reads the new
 * active locale on the next render, so the whole dock follows instantly.
 * @module dsh-opencode-go-usage/client/dock
 */

import { useEffect, useSyncExternalStore, useState } from 'react'
import type { ReactElement } from 'react'
import { StateDot, Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { OpenCodeUsageState } from '../types.ts'
import {
  fetchState, formatRelative, formatRemaining, formatRemainingCompact,
  percentTone, refreshState, remainingRatio, stateHasUsage, usageWindows,
  type WindowView,
} from './usage-model.ts'
import styles from './usage.module.css'

/** Poll cadence: fast while the panel is open, calm while collapsed. */
const OPEN_POLL_MS = 10_000
const COLLAPSED_POLL_MS = 60_000

/** Whether the user asked the OS to cut non-essential motion. */
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Root dock props: the namespace-bound translator and the locale service.
 * Supplied by the browser plugin mount (`client/index.tsx`).
 */
export interface UsageDockProps {
  /** Namespace-bound translate for this plugin's dictionary. */
  t: TranslateNS<'opencode-usage'>
  /** Locale runtime carrying the live zh/en preference. */
  locale: LocaleRuntime
}

/** Root state: the dock itself. */
export function UsageDock({ t, locale }: UsageDockProps): ReactElement {
  const [open, setOpen] = useState(false)
  // Closing drives the exit animation: set first, the `usage-pop-out` reverse
  // tweens play, and onAnimationEnd finally flips `open` to false.
  const [closing, setClosing] = useState(false)
  const [state, setState] = useState<OpenCodeUsageState | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  // Re-rendered once a second so badge and panel countdowns stay live.
  const [now, setNow] = useState(() => Date.now())

  // Watch the locale revision: a language switch re-renders this component
  // in place (bound `t` then resolves the new active locale).
  const localeRevision = useSyncExternalStore(
    (callback) => locale.subscribe(callback),
    () => locale.getSnapshot().revision,
  )
  void localeRevision // revision feeds the render subscription, no other use.

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

  const openPanel = (): void => {
    setClosing(false)
    setOpen(true)
  }

  const requestClose = (): void => {
    if (!open) return
    // Under reduced motion, skip the exit tween and unmount right away so the
    // panel does not sit waiting for an onAnimationEnd that never fires.
    if (prefersReducedMotion()) {
      setClosing(false)
      setOpen(false)
      return
    }
    setClosing(true)
  }

  const handlePanelAnimationEnd = (): void => {
    if (closing) {
      setClosing(false)
      setOpen(false)
    }
  }

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

  const windows = usageWindows(stateHasUsage(state) ? state.usage : undefined, t)
  const rolling = windows.find((window) => window.key === 'rolling')

  // State-dot semantics map onto the shared StateDot states:
  // connecting → ongoing, live → done, stale → warning, error/unconfigured → error.
  const dotState = state === null ? 'ongoing'
    : state.health.status === 'ok' ? 'done'
    : stateHasUsage(state) ? 'warning'
    : 'error'

  // ErrorBox variant: an info tone for connecting / unconfigured prompts, an
  // error tone for real fetch failures (the previous single warn tone
  // conflated both).
  const errorVariant = state === null || state.health.status === 'unconfigured' ? 'info' : 'error'

  /** Resolve the user-visible failure detail from a structured health error. */
  const errorText = (): string => {
    if (state === null) return t('error.connecting.detail')
    const error = state.health.error
    if (error === undefined) return ''
    return t(`error.${error.code}`, error.params ?? {})
  }

  return (
    <>
      <button
        type="button"
        className={styles.badge}
        onClick={() => (open ? requestClose() : openPanel())}
        title={t('dock.title')}
        aria-expanded={open}
        aria-label={t('dock.aria')}
      >
        {windows.length > 0 ? (
          <>
            {windows.map((window) => (
              <Ring
                key={window.key}
                window={window}
                now={now}
                size={36}
                t={t}
              />
            ))}
            {rolling !== undefined && (
              <span className={styles.badgeCountdown} title={t('dock.badgeCountdown.title')}>
                <span className={styles.badgeCountdownIcon} aria-hidden="true">↻</span>
                <span className={styles.badgeCountdownValue}>
                  {formatRemainingCompact(rolling.resetsAt, now, t)}
                </span>
              </span>
            )}
          </>
        ) : (
          <span className={styles.badgeText}>Go —</span>
        )}
        <StateDot state={dotState} size={9} />
      </button>
      {open && (
        <section
          className={styles.panel}
          data-closing={closing || undefined}
          role="dialog"
          aria-label={t('dock.aria')}
          onAnimationEnd={handlePanelAnimationEnd}
        >
          <header className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <span className={styles.panelLogo} aria-hidden="true">◈</span>
              <span>{t('dock.aria')}</span>
              <span className={styles.healthLabel}>
                {state === null ? t('health.connecting')
                  : state.health.status === 'ok' ? t('health.live')
                  : stateHasUsage(state) ? t('health.stale')
                  : t('health.error')}
              </span>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={requestClose}
              aria-label={t('close.aria')}
            >
              ✕
            </button>
          </header>

          {state !== null && stateHasUsage(state) ? (
            <div className={styles.windows}>
              {windows.map((window) => (
                <WindowRow
                  key={window.key}
                  window={window}
                  now={now}
                  t={t}
                  showSublabel={locale.getSnapshot().active === 'zh'}
                />
              ))}
              {windows.length === 0 && (
                <p className={styles.emptyNote}>{t('empty.note')}</p>
              )}
            </div>
          ) : (
            <div className={styles.errorBox} data-variant={errorVariant}>
              <p className={styles.errorTitle}>
                {state === null ? t('error.connecting')
                  : state.health.status === 'unconfigured' ? t('error.unconfigured')
                  : t('error.fetchFailed')}
              </p>
              <p className={styles.errorDetail}>
                {errorText()}
              </p>
              {state !== null && state.health.status === 'unconfigured' && (
                <p className={styles.errorHint}>
                  {t('error.unconfigured.hint')}
                </p>
              )}
            </div>
          )}

          <footer className={styles.panelFooter}>
            <span className={styles.updatedAt}>
              {state === null ? '' : t('footer.updatedAt', {
                relative: formatRelative(state.usageFetchedAt ?? state.health.fetchedAt, now, t),
              })}
              {state !== null && stateHasUsage(state) && state.health.status !== 'ok' && (
                <span className={styles.staleNote}>{t('footer.staleNote')}</span>
              )}
            </span>
            <a
              className={styles.consoleLink}
              href="https://opencode.ai/auth"
              target="_blank"
              rel="noopener noreferrer"
              title={t('console.title')}
            >
              {t('console.label')} <span aria-hidden="true">↗</span>
            </a>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => { void handleRefresh() }}
              disabled={refreshing}
            >
              {refreshing ? t('refresh.loading') : t('refresh.idle')}
            </Button>
          </footer>
        </section>
      )}
    </>
  )
}

/**
 * One quota window row: ring + labels + countdown. The ring mirrors the
 * collapsed badge's double ring (used-percent outer + brand-blue remaining-
 * time inner), and inline legend dots restate the color coding for the row:
 * a green/amber/red dot before the used-percent text restates the usage ring
 * color, a blue dot before the reset-countdown text restates the inner
 * remaining-time ring color.
 */
function WindowRow({ window, now, t, showSublabel }: {
  window: WindowView
  now: number
  t: TranslateNS<'opencode-usage'>
  showSublabel: boolean
}): ReactElement {
  const remaining = Math.max(0, 100 - window.percent)
  const tone = percentTone(window.percent)
  return (
    <div className={styles.windowRow}>
      <Ring window={window} now={now} t={t} />
      <div className={styles.windowBody}>
        <div className={styles.windowName}>
          <span>{window.label}</span>
          {showSublabel && <span className={styles.windowSublabel}>{window.sublabel}</span>}
        </div>
        <div className={styles.windowMeta}>
          <span className={styles.usedText}>
            <span className={styles.rowDot} data-tone={tone} aria-hidden="true" />
            {t('row.used', { percent: window.percent })}
          </span>
          <span className={styles.remainingText}>{t('row.remaining', { percent: remaining })}</span>
        </div>
        <div className={styles.countdown}>
          <span className={styles.rowDot} data-tone="time" aria-hidden="true" />
          {t('row.resetsIn', { countdown: formatRemaining(window.resetsAt, now, t) })}
        </div>
      </div>
    </div>
  )
}

/**
 * Double ring for one quota window, shared by the collapsed badge (size 36)
 * and the expanded panel row (size 50). The outer ring is the used percent
 * (threshold-colored: green <60% / orange ≥60% / red ≥85%); the inner ring is
 * the share of the window period still left before its reset, drawn in the DS
 * brand tone (`--dsw-alias-state-business-primary`) and hugging the outer ring
 * with no visible gap so the two read as one bicolored band. Rounded caps
 * switch to butt at zero so a 0% window never shows a phantom arc, and the
 * dash transition tweens in for a smooth fill on refresh. Fixed SVG dimensions
 * keep the layout stable regardless of font fallback or zoom.
 * @param window - the projected quota window view (percent, reset, periodMs).
 * @param now - current epoch ms (drives the inner remaining-time arc).
 * @param size - outer diameter in px (50 for the panel, 36 for the badge).
 * @param t - namespace-bound translate for the aria label.
 */
export function Ring({ window, now, size = 50, t }: {
  window: WindowView
  now: number
  size?: number
  t: TranslateNS<'opencode-usage'>
}): ReactElement {
  const stroke = size >= 44 ? 5 : 3.5
  const timeStroke = size >= 44 ? 3 : 2.5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const used = Math.min(100, Math.max(0, window.percent))
  const dash = (circumference * used) / 100
  const usedEmpty = used <= 0
  const tone = percentTone(used)

  // Inner ring hugs the outer ring tight (zero gap): its center radius sits
  // exactly at the outer ring's inner edge minus half the inner stroke, so the
  // two colored strokes touch edge-to-edge as one band.
  const timeRadius = radius - (stroke + timeStroke) / 2
  const timeCircumference = 2 * Math.PI * timeRadius
  const remaining = remainingRatio(window.resetsAt, window.periodMs, now)
  const timeDash = timeCircumference * remaining
  const timeEmpty = remaining <= 0

  return (
    <svg
      className={styles.ring}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={t('ring.aria', {
        window: window.label,
        used: Math.round(used),
        remaining: Math.round(remaining * 100),
      })}
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
        data-zero={usedEmpty ? 'true' : 'false'}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={circumference / 4}
        strokeLinecap={usedEmpty ? 'butt' : 'round'}
      />
      <circle
        className={styles.ringTimeTrack}
        cx={size / 2}
        cy={size / 2}
        r={timeRadius}
        strokeWidth={timeStroke}
        fill="none"
      />
      <circle
        className={styles.ringTimeBar}
        data-zero={timeEmpty ? 'true' : 'false'}
        cx={size / 2}
        cy={size / 2}
        r={timeRadius}
        strokeWidth={timeStroke}
        fill="none"
        strokeDasharray={`${timeDash} ${timeCircumference - timeDash}`}
        strokeDashoffset={timeCircumference / 4}
        strokeLinecap={timeEmpty ? 'butt' : 'round'}
      />
      <text
        className={size >= 44 ? styles.ringText : styles.badgeRingText}
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
