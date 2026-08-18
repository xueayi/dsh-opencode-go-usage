/**
 * Pure display projections for the OpenCode Go usage dock.
 *
 * No React, no DOM, no DSH service: every function here is trivially
 * unit-testable, mirroring the host-side purity split. Text lives in the
 * plugin's locale dictionary, so each projection takes a small translate
 * function `t(key, params)` (the bound `ctx.locale.bind(USAGE_NS)` at the
 * call site, or a fixture translator in tests). The dock renders the three
 * quota windows as rings with a live reset countdown; tones follow a soft
 * threshold so the panel stays calm until usage climbs.
 * @module dsh-opencode-go-usage/client/model
 */
import type { OpenCodeUsageData, OpenCodeUsageState } from '../types.ts';
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
/**
 * Translator shape the projections consume: the plugin's namespace-bound
 * `t`, type-only imported (erased at runtime, the module stays dependency
 * free). Typing it as `TranslateNS` lets the bound `ctx.locale.bind` value
 * flow straight in and keeps every key checked against the dictionaries.
 */
export type TranslateFn = TranslateNS<'opencode-usage'>;
/** One quota window in display order. */
export interface WindowView {
    key: 'rolling' | 'weekly' | 'monthly';
    /** Localized label for the panel row. */
    label: string;
    /** English label kept for recognizability (rendered only in zh). */
    sublabel: string;
    /** Percent already used, 0–100. */
    percent: number;
    /** Epoch millis when the window resets. */
    resetsAt: number;
    /** Full window period in millis (drives the remaining-time ring). */
    periodMs: number;
}
/** Tone thresholds for usage rings; `danger` ≥ 85%, `warn` ≥ 60%. */
export type UsageTone = 'ok' | 'warn' | 'danger';
/** Window periods: rolling is a fixed 5h, weekly a fixed 7d; monthly uses a
 *  30-day approximation of the subscription cycle (the API only reports the
 *  next reset instant, so the exact cycle cannot be derived). */
export declare const WINDOW_PERIOD_MS: Record<WindowView['key'], number>;
/**
 * Project a usage sample into ordered window views (missing windows dropped).
 * Window names come from the locale dictionary via `t`.
 * @param usage - the last successful sample (or undefined).
 * @param t - translator for the window labels.
 */
export declare function usageWindows(usage: OpenCodeUsageData | undefined, t: TranslateFn): WindowView[];
/**
 * Fraction of the window period still left before the reset, 0–1; the
 * badge's inner ring draws this as its remaining arc. Returns 0 once the
 * reset instant has passed (the next refresh will report a fresh window).
 */
export declare function remainingRatio(resetsAt: number, periodMs: number, now: number): number;
/** Tone for a used percentage (invalid numbers clamp to `ok`). */
export declare function percentTone(percent: number): UsageTone;
/** Countdown until a reset instant, localized via `t`. */
export declare function formatRemaining(resetsAt: number, now: number, t: TranslateFn): string;
/** Minimal countdown for tight surfaces (the dock badge): uses the shared
 *  Latin units `4d3h`/`3h25m`/`12m05s`/`9s`; only the expired state is
 *  localized. */
export declare function formatRemainingCompact(resetsAt: number, now: number, t: TranslateFn): string;
/** Human-readable age of a sample, localized via `t`. */
export declare function formatRelative(fetchedAt: number, now: number, t: TranslateFn): string;
/** Whether a state carries usable quota windows (kept across failed refreshes). */
export declare function stateHasUsage(state: OpenCodeUsageState | null): state is OpenCodeUsageState & {
    usage: OpenCodeUsageData;
};
/** Fetch the current cached sample from the plugin route. */
export declare function fetchState(): Promise<OpenCodeUsageState>;
/** Ask the host for an immediate refresh and return the new sample. */
export declare function refreshState(): Promise<OpenCodeUsageState>;
