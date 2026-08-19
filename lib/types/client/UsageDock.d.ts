/**
 * OpenCode Go usage dock — the whole browser surface.
 *
 * A bottom-right floating dock: a compact glassy badge shows all three quota
 * windows (滚/周/月) with threshold-colored percentages plus the 5h-rolling
 * window's live reset countdown; clicking it toggles a glassy panel with the
 * full window rows, a manual refresh button, and clear error / unconfigured
 * states. The dock is mounted through a body portal by `client/index.tsx`
 * and follows DSH design tokens (`--dsw-alias-*`), so it blends with either
 * theme. Reuses the shared `StateDot` and `Button` primitives so the dock's
 * affordances stay visually consistent with the rest of DSH.
 * @module dsh-opencode-go-usage/client/dock
 */
import type { ReactElement } from 'react';
import { type WindowView } from './usage-model.ts';
/** Root state: the dock itself. */
export declare function UsageDock(): ReactElement;
/**
 * Double ring for one quota window, shared by the collapsed badge (size 36)
 * and the expanded panel row (size 50). The outer ring shows the *remaining*
 * quota share as an arc (full ring at 0% used, shrinking as quota is spent)
 * and is threshold-colored by spent share: green <60% spent / orange ≥60% /
 * red ≥85% — so a low remaining share reads as red. The inner ring is the
 * share of the window period still left before its reset, drawn in the DS
 * brand tone (`--dsw-alias-state-business-primary`) and hugging the outer ring
 * with no visible gap so the two read as one bicolored band. Rounded caps
 * switch to butt at both ends of the arc (0% and 100% remaining) so neither an
 * empty nor a full ring shows a phantom or bumpy seam, and the dash transition
 * tweens in for a smooth shrink on refresh. Fixed SVG dimensions keep the
 * layout stable regardless of font fallback or zoom.
 * @param window - the projected quota window view (percent, reset, periodMs).
 * @param now - current epoch ms (drives the inner remaining-time arc).
 * @param size - outer diameter in px (50 for the panel, 36 for the badge).
 */
export declare function Ring({ window, now, size }: {
    window: WindowView;
    now: number;
    size?: number;
}): ReactElement;
