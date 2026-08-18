/**
 * OpenCode Go usage types — pure types only, zero imports.
 *
 * This file intentionally imports nothing: both the host program (the
 * fetcher in `usage.ts` and the emitter in `index.ts`) and the browser
 * program (the dock model in `client/`) must be able to load these types
 * without pulling in host-side `Context` augmentations.
 * @module dsh-opencode-go-usage/types
 */

/** One quota window as returned by the OpenCode Go usage API. */
export interface OpenCodeUsageWindow {
  /** API-reported window health (`ok` while the window is usable). */
  status: string
  /** Percent already used in this window, 0–100. */
  percent: number
  /** ISO 8601 instant when the window resets. */
  resetsAt: string
}

/** The three quota windows of the OpenCode Go plan. */
export interface OpenCodeUsageData {
  /** ~5h rolling window. */
  rolling?: OpenCodeUsageWindow
  /** Weekly window. */
  weekly?: OpenCodeUsageWindow
  /** Monthly window. */
  monthly?: OpenCodeUsageWindow
}

/**
 * Machine-readable failure code shipped in {@link OpenCodeUsageHealth}.
 * The web client translates each code through its locale dictionary, so the
 * host stays language-agnostic and one translation source (the client) wins.
 */
export type OpenCodeUsageErrorCode =
  | 'idle'
  | 'unconfigured'
  | 'connect'
  | 'timeout'
  | 'unauthorized'
  | 'http'
  | 'parse'
  | 'no-data'

/** Structured failure reason: a stable code plus interpolation params. */
export interface OpenCodeUsageError {
  /** Stable failure code (see {@link OpenCodeUsageErrorCode}). */
  code: OpenCodeUsageErrorCode
  /** Template params the client interpolates (`{status}`, `{detail}`, ...). */
  params?: Record<string, string | number>
}

/** Health of the most recent refresh attempt, independent of the data. */
export interface OpenCodeUsageHealth {
  /** `ok` after a successful fetch; `error` after a failed one; `unconfigured` while no API key resolves. */
  status: 'ok' | 'error' | 'unconfigured'
  /** Epoch millis of the most recent attempt (0 before the first). */
  fetchedAt: number
  /** Structured failure reason, present when `status` is not `ok`. */
  error?: OpenCodeUsageError
}

/**
 * The cached usage sample served to the web client.
 *
 * Data and health are decoupled on purpose: a failed refresh keeps the last
 * successful sample (`usage` / `usageFetchedAt`) so the dock stays stable —
 * it keeps showing the previous numbers and degrades silently instead of
 * blanking out. `usage` is absent only before the first successful fetch.
 */
export interface OpenCodeUsageState {
  /** Last successfully fetched quota windows; absent only before the first success. */
  usage?: OpenCodeUsageData
  /** Epoch millis of the sample in `usage` (absent together with it). */
  usageFetchedAt?: number
  /** Health of the most recent refresh attempt. */
  health: OpenCodeUsageHealth
}
