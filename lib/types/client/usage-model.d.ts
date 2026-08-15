/**
 * Pure display projections for the OpenCode Go usage dock.
 *
 * No React, no DOM: every function here is trivially unit-testable, mirroring
 * the host-side purity split. The dock renders the three quota windows as
 * rings with a live reset countdown; tones follow a soft threshold so the
 * panel stays calm until usage climbs.
 * @module dsh-opencode-go-usage/client/model
 */
import type { OpenCodeUsageData, OpenCodeUsageState } from '../types.ts';
/** One quota window in display order. */
export interface WindowView {
    key: 'rolling' | 'weekly' | 'monthly';
    /** Short Chinese label for the panel row. */
    label: string;
    /** English label kept for recognizability. */
    sublabel: string;
    /** Percent already used, 0–100. */
    percent: number;
    /** Epoch millis when the window resets. */
    resetsAt: number;
}
/** Tone thresholds for usage rings; `danger` ≥ 85%, `warn` ≥ 60%. */
export type UsageTone = 'ok' | 'warn' | 'danger';
/** Project a usage sample into ordered window views (missing windows dropped). */
export declare function usageWindows(usage: OpenCodeUsageData | undefined): WindowView[];
/** Tone for a used percentage (invalid numbers clamp to `ok`). */
export declare function percentTone(percent: number): UsageTone;
/** Compact Chinese countdown until a reset instant. */
export declare function formatRemaining(resetsAt: number, now: number): string;
/** Minimal countdown for tight surfaces (the dock badge): `4d3h`, `3h25m`, `12m05s`, `9s`. */
export declare function formatRemainingCompact(resetsAt: number, now: number): string;
/** Human-readable age of a sample. */
export declare function formatRelative(fetchedAt: number, now: number): string;
/** Whether a state carries usable quota windows (kept across failed refreshes). */
export declare function stateHasUsage(state: OpenCodeUsageState | null): state is OpenCodeUsageState & {
    usage: OpenCodeUsageData;
};
/** Fetch the current cached sample from the plugin route. */
export declare function fetchState(): Promise<OpenCodeUsageState>;
/** Ask the host for an immediate refresh and return the new sample. */
export declare function refreshState(): Promise<OpenCodeUsageState>;
