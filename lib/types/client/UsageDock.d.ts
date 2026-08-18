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
import type { ReactElement } from 'react';
import type { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client';
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import { type WindowView } from './usage-model.ts';
/**
 * Root dock props: the namespace-bound translator and the locale service.
 * Supplied by the browser plugin mount (`client/index.tsx`).
 */
export interface UsageDockProps {
    /** Namespace-bound translate for this plugin's dictionary. */
    t: TranslateNS<'opencode-usage'>;
    /** Locale runtime carrying the live zh/en preference. */
    locale: LocaleRuntime;
}
/** Root state: the dock itself. */
export declare function UsageDock({ t, locale }: UsageDockProps): ReactElement;
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
export declare function Ring({ window, now, size, t }: {
    window: WindowView;
    now: number;
    size?: number;
    t: TranslateNS<'opencode-usage'>;
}): ReactElement;
