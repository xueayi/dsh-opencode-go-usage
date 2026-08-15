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

/** The cached usage sample plus its health, served to the web client. */
export type OpenCodeUsageState =
  | {
    /** A fresh sample was fetched successfully. */
    status: 'ok'
    /** Epoch millis of the successful fetch. */
    fetchedAt: number
    usage: OpenCodeUsageData
  }
  | {
    /** The last fetch failed; `error` carries a user-facing reason. */
    status: 'error'
    /** Epoch millis of the failed attempt. */
    fetchedAt: number
    error: string
  }
  | {
    /** No API key is resolvable, so no fetch is attempted. */
    status: 'unconfigured'
    /** Epoch millis of the last attempt (0 before the first). */
    fetchedAt: number
    error: string
  }
