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
/** English recognizability terms, shown under the zh labels. */
const WINDOW_SUBLABEL = {
    rolling: '5h Rolling',
    weekly: 'Weekly',
    monthly: 'Monthly',
};
/** Window periods: rolling is a fixed 5h, weekly a fixed 7d; monthly uses a
 *  30-day approximation of the subscription cycle (the API only reports the
 *  next reset instant, so the exact cycle cannot be derived). */
export const WINDOW_PERIOD_MS = {
    rolling: 5 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
};
/**
 * Project a usage sample into ordered window views (missing windows dropped).
 * Window names come from the locale dictionary via `t`.
 * @param usage - the last successful sample (or undefined).
 * @param t - translator for the window labels.
 */
export function usageWindows(usage, t) {
    if (usage === undefined)
        return [];
    const views = [];
    for (const key of ['rolling', 'weekly', 'monthly']) {
        const window = usage[key];
        if (window === undefined)
            continue;
        views.push({
            key,
            label: t(`window.${key}`),
            sublabel: WINDOW_SUBLABEL[key],
            percent: window.percent,
            resetsAt: Date.parse(window.resetsAt),
            periodMs: WINDOW_PERIOD_MS[key],
        });
    }
    return views;
}
/**
 * Fraction of the window period still left before the reset, 0–1; the
 * badge's inner ring draws this as its remaining arc. Returns 0 once the
 * reset instant has passed (the next refresh will report a fresh window).
 */
export function remainingRatio(resetsAt, periodMs, now) {
    if (!Number.isFinite(resetsAt) || !Number.isFinite(periodMs) || periodMs <= 0)
        return 0;
    const remaining = resetsAt - now;
    if (remaining <= 0)
        return 0;
    return Math.min(1, remaining / periodMs);
}
/** Tone for a used percentage (invalid numbers clamp to `ok`). */
export function percentTone(percent) {
    if (!Number.isFinite(percent))
        return 'ok';
    if (percent >= 85)
        return 'danger';
    if (percent >= 60)
        return 'warn';
    return 'ok';
}
/** Countdown until a reset instant, localized via `t`. */
export function formatRemaining(resetsAt, now, t) {
    const diff = resetsAt - now;
    if (!Number.isFinite(diff))
        return '—';
    if (diff <= 0)
        return t('countdown.reset');
    const totalMinutes = Math.floor(diff / 60_000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0)
        return t('countdown.daysHours', { days, hours });
    if (hours > 0)
        return t('countdown.hoursMinutes', { hours, minutes });
    if (minutes > 0)
        return t('countdown.minutesSeconds', { minutes, seconds: Math.max(0, Math.floor((diff % 60_000) / 1000)) });
    return t('countdown.seconds', { seconds: Math.max(0, Math.floor(diff / 1000)) });
}
/** Minimal countdown for tight surfaces (the dock badge): uses the shared
 *  Latin units `4d3h`/`3h25m`/`12m05s`/`9s`; only the expired state is
 *  localized. */
export function formatRemainingCompact(resetsAt, now, t) {
    const diff = resetsAt - now;
    if (!Number.isFinite(diff))
        return '—';
    if (diff <= 0)
        return t('countdown.reset');
    const totalMinutes = Math.floor(diff / 60_000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const seconds = Math.max(0, Math.floor((diff % 60_000) / 1000));
    if (days > 0)
        return hours > 0 ? `${days}d${hours}h` : `${days}d`;
    if (hours > 0)
        return `${hours}h${minutes}m`;
    if (minutes > 0)
        return `${minutes}m${String(seconds).padStart(2, '0')}s`;
    return `${seconds}s`;
}
/** Human-readable age of a sample, localized via `t`. */
export function formatRelative(fetchedAt, now, t) {
    const diff = Math.max(0, now - fetchedAt);
    const seconds = Math.floor(diff / 1000);
    if (seconds < 10)
        return t('relative.justNow');
    if (seconds < 60)
        return t('relative.secondsAgo', { seconds });
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return t('relative.minutesAgo', { minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return t('relative.hoursAgo', { hours });
    return t('relative.daysAgo', { days: Math.floor(hours / 24) });
}
/** Whether a state carries usable quota windows (kept across failed refreshes). */
export function stateHasUsage(state) {
    return state !== null && state.usage !== undefined;
}
/** Fetch the current cached sample from the plugin route. */
export async function fetchState() {
    const response = await fetch('/plugins/dsh-opencode-go-usage/state', { cache: 'no-store' });
    if (!response.ok)
        throw new Error(`state HTTP ${response.status}`);
    return (await response.json());
}
/** Ask the host for an immediate refresh and return the new sample. */
export async function refreshState() {
    const response = await fetch('/plugins/dsh-opencode-go-usage/refresh', { method: 'POST' });
    if (!response.ok)
        throw new Error(`refresh HTTP ${response.status}`);
    return (await response.json());
}
