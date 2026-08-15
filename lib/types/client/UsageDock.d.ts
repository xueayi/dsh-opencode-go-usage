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
import type { ReactElement } from 'react';
import { type UsageTone } from './usage-model.ts';
/** Root state: the dock itself. */
export declare function UsageDock(): ReactElement;
/** Circular progress ring, colored by tone. */
export declare function Ring({ percent, tone, size }: {
    percent: number;
    tone: UsageTone;
    size?: number;
}): ReactElement;
