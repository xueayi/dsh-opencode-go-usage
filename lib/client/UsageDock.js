import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
import { useEffect, useState } from 'react';
import { StateDot, Button } from '@deepseek-ai/dsh-client-ui-primitives';
import { fetchState, formatRelative, formatRemaining, formatRemainingCompact, percentTone, refreshState, remainingRatio, stateHasUsage, usageWindows, } from "./usage-model.js";
import styles from './usage.module.css';
/** Poll cadence: fast while the panel is open, calm while collapsed. */
const OPEN_POLL_MS = 10_000;
const COLLAPSED_POLL_MS = 60_000;
/** Whether the user asked the OS to cut non-essential motion. */
function prefersReducedMotion() {
    return typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
/** Root state: the dock itself. */
export function UsageDock() {
    const [open, setOpen] = useState(false);
    // Closing drives the exit animation: set first, the `usage-pop-out` reverse
    // tweens play, and onAnimationEnd finally flips `open` to false.
    const [closing, setClosing] = useState(false);
    const [state, setState] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    // Re-rendered once a second so badge and panel countdowns stay live.
    const [now, setNow] = useState(() => Date.now());
    // Poll the host cache; interval follows the open state.
    useEffect(() => {
        let alive = true;
        const tick = async () => {
            try {
                const next = await fetchState();
                if (alive)
                    setState(next);
            }
            catch {
                // Keep the last sample; transient network failures must not blank the dock.
            }
        };
        void tick();
        const id = window.setInterval(() => { void tick(); }, open ? OPEN_POLL_MS : COLLAPSED_POLL_MS);
        return () => {
            alive = false;
            window.clearInterval(id);
        };
    }, [open]);
    // Countdown ticker: always on (the badge shows the rolling countdown too).
    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(id);
    }, []);
    const openPanel = () => {
        setClosing(false);
        setOpen(true);
    };
    const requestClose = () => {
        if (!open)
            return;
        // Under reduced motion, skip the exit tween and unmount right away so the
        // panel does not sit waiting for an onAnimationEnd that never fires.
        if (prefersReducedMotion()) {
            setClosing(false);
            setOpen(false);
            return;
        }
        setClosing(true);
    };
    const handlePanelAnimationEnd = () => {
        if (closing) {
            setClosing(false);
            setOpen(false);
        }
    };
    const handleRefresh = async () => {
        if (refreshing)
            return;
        setRefreshing(true);
        try {
            setState(await refreshState());
            setNow(Date.now());
        }
        catch {
            // The next poll will surface host-side health; keep the current sample.
        }
        finally {
            setRefreshing(false);
        }
    };
    const windows = usageWindows(stateHasUsage(state) ? state.usage : undefined);
    const rolling = windows.find((window) => window.key === 'rolling');
    // State-dot semantics map onto the shared StateDot states:
    // connecting → ongoing, live → done, stale → warning, error/unconfigured → error.
    const dotState = state === null ? 'ongoing'
        : state.health.status === 'ok' ? 'done'
            : stateHasUsage(state) ? 'warning'
                : 'error';
    // ErrorBox variant: an info tone for connecting / unconfigured prompts, an
    // error tone for real fetch failures (the previous single warn tone
    // conflated both).
    const errorVariant = state === null || state.health.status === 'unconfigured' ? 'info' : 'error';
    return (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: styles.badge, onClick: () => (open ? requestClose() : openPanel()), title: "OpenCode Go \u7528\u91CF\uFF1A\u6EDA/\u5468/\u6708\u914D\u989D + 5h \u6EDA\u52A8\u91CD\u7F6E\u5012\u8BA1\u65F6", "aria-expanded": open, "aria-label": "OpenCode Go \u7528\u91CF", children: [windows.length > 0 ? (_jsxs(_Fragment, { children: [windows.map((window) => (_jsx(Ring, { window: window, now: now, size: 36 }, window.key))), rolling !== undefined && (_jsxs("span", { className: styles.badgeCountdown, title: "5h \u6EDA\u52A8\u7A97\u53E3\u91CD\u7F6E\u5012\u8BA1\u65F6", children: [_jsx("span", { className: styles.badgeCountdownIcon, "aria-hidden": "true", children: "\u21BB" }), _jsx("span", { className: styles.badgeCountdownValue, children: formatRemainingCompact(rolling.resetsAt, now) })] }))] })) : (_jsx("span", { className: styles.badgeText, children: "Go \u2014" })), _jsx(StateDot, { state: dotState, size: 9 })] }), open && (_jsxs("section", { className: styles.panel, "data-closing": closing || undefined, role: "dialog", "aria-label": "OpenCode Go \u7528\u91CF", onAnimationEnd: handlePanelAnimationEnd, children: [_jsxs("header", { className: styles.panelHeader, children: [_jsxs("div", { className: styles.panelTitle, children: [_jsx("span", { className: styles.panelLogo, "aria-hidden": "true", children: "\u25C8" }), _jsx("span", { children: "OpenCode Go \u7528\u91CF" }), _jsx("span", { className: styles.healthLabel, children: state === null ? '连接中…'
                                            : state.health.status === 'ok' ? '实时'
                                                : stateHasUsage(state) ? '数据过期'
                                                    : '异常' })] }), _jsx("button", { type: "button", className: styles.iconButton, onClick: requestClose, "aria-label": "\u5173\u95ED", children: "\u2715" })] }), state !== null && stateHasUsage(state) ? (_jsxs("div", { className: styles.windows, children: [windows.map((window) => (_jsx(WindowRow, { window: window, now: now }, window.key))), windows.length === 0 && (_jsx("p", { className: styles.emptyNote, children: "\u7528\u91CF\u670D\u52A1\u672A\u8FD4\u56DE\u4EFB\u4F55\u7A97\u53E3\u6570\u636E\u3002" }))] })) : (_jsxs("div", { className: styles.errorBox, "data-variant": errorVariant, children: [_jsx("p", { className: styles.errorTitle, children: state === null ? '正在连接用量服务…'
                                    : state.health.status === 'unconfigured' ? '尚未配置 API Key'
                                        : '用量获取失败' }), _jsx("p", { className: styles.errorDetail, children: state === null
                                    ? '如果长时间停留在该状态，请检查 dsh 服务是否运行了 dsh-opencode-go-usage 插件。'
                                    : state.health.error }), state !== null && state.health.status === 'unconfigured' && (_jsx("p", { className: styles.errorHint, children: "\u914D\u7F6E\u65B9\u6CD5\uFF1A\u6253\u5F00 Web \u8BBE\u7F6E \u2192 \u6A21\u578B\uFF0C\u9009\u62E9\u300C\u5B98\u65B9\u6E20\u9053 \u00B7 OpenCode Go\u300D\uFF0C\u586B\u5165 API Key \u540E\u7A0D\u5019\u7247\u523B\u5373\u4F1A\u81EA\u52A8\u751F\u6548\u3002" }))] })), _jsxs("footer", { className: styles.panelFooter, children: [_jsxs("span", { className: styles.updatedAt, children: [state === null ? '' : `更新于 ${formatRelative(state.usageFetchedAt ?? state.health.fetchedAt, now)}`, state !== null && stateHasUsage(state) && state.health.status !== 'ok' && (_jsx("span", { className: styles.staleNote, children: " \u00B7 \u5237\u65B0\u5931\u8D25\uFF0C\u663E\u793A\u4E0A\u6B21\u6570\u636E" }))] }), _jsxs("a", { className: styles.consoleLink, href: "https://opencode.ai/auth", target: "_blank", rel: "noopener noreferrer", title: "\u5728\u6D4F\u89C8\u5668\u4E2D\u6253\u5F00 OpenCode Go \u63A7\u5236\u53F0", children: ["\u63A7\u5236\u53F0 ", _jsx("span", { "aria-hidden": "true", children: "\u2197" })] }), _jsx(Button, { variant: "outline", size: "sm", type: "button", onClick: () => { void handleRefresh(); }, disabled: refreshing, children: refreshing ? '刷新中…' : '立即刷新' })] })] }))] }));
}
/** One quota window row: ring + labels + countdown. The ring mirrors the
   collapsed badge's double ring (used-percent outer + brand-blue remaining-
   time inner), and inline legend dots restate the color coding for the row:
   a green/amber/red dot before "已用" restates the usage ring color, a blue
   dot before "重置于" restates the inner remaining-time ring color. */
function WindowRow({ window, now }) {
    const remaining = Math.max(0, 100 - window.percent);
    const tone = percentTone(window.percent);
    return (_jsxs("div", { className: styles.windowRow, children: [_jsx(Ring, { window: window, now: now }), _jsxs("div", { className: styles.windowBody, children: [_jsxs("div", { className: styles.windowName, children: [_jsx("span", { children: window.label }), _jsx("span", { className: styles.windowSublabel, children: window.sublabel })] }), _jsxs("div", { className: styles.windowMeta, children: [_jsxs("span", { className: styles.usedText, children: [_jsx("span", { className: styles.rowDot, "data-tone": tone, "aria-hidden": "true" }), "\u5DF2\u7528 ", window.percent, "%"] }), _jsxs("span", { className: styles.remainingText, children: ["\u5269\u4F59 ", remaining, "%"] })] }), _jsxs("div", { className: styles.countdown, children: [_jsx("span", { className: styles.rowDot, "data-tone": "time", "aria-hidden": "true" }), "\u91CD\u7F6E\u4E8E ", formatRemaining(window.resetsAt, now)] })] })] }));
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
 */
export function Ring({ window, now, size = 50 }) {
    const stroke = size >= 44 ? 5 : 3.5;
    const timeStroke = size >= 44 ? 3 : 2.5;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const used = Math.min(100, Math.max(0, window.percent));
    const dash = (circumference * used) / 100;
    const usedEmpty = used <= 0;
    const tone = percentTone(used);
    // Inner ring hugs the outer ring tight (zero gap): its center radius sits
    // exactly at the outer ring's inner edge minus half the inner stroke, so the
    // two colored strokes touch edge-to-edge as one band.
    const timeRadius = radius - (stroke + timeStroke) / 2;
    const timeCircumference = 2 * Math.PI * timeRadius;
    const remaining = remainingRatio(window.resetsAt, window.periodMs, now);
    const timeDash = timeCircumference * remaining;
    const timeEmpty = remaining <= 0;
    return (_jsxs("svg", { className: styles.ring, width: size, height: size, viewBox: `0 0 ${size} ${size}`, role: "img", "aria-label": `${window.label}已用 ${used}%，窗口剩余时间 ${Math.round(remaining * 100)}%`, children: [_jsx("circle", { className: styles.ringTrack, cx: size / 2, cy: size / 2, r: radius, strokeWidth: stroke, fill: "none" }), _jsx("circle", { className: styles.ringBar, "data-tone": tone, "data-zero": usedEmpty ? 'true' : 'false', cx: size / 2, cy: size / 2, r: radius, strokeWidth: stroke, fill: "none", strokeDasharray: `${dash} ${circumference - dash}`, strokeDashoffset: circumference / 4, strokeLinecap: usedEmpty ? 'butt' : 'round' }), _jsx("circle", { className: styles.ringTimeTrack, cx: size / 2, cy: size / 2, r: timeRadius, strokeWidth: timeStroke, fill: "none" }), _jsx("circle", { className: styles.ringTimeBar, "data-zero": timeEmpty ? 'true' : 'false', cx: size / 2, cy: size / 2, r: timeRadius, strokeWidth: timeStroke, fill: "none", strokeDasharray: `${timeDash} ${timeCircumference - timeDash}`, strokeDashoffset: timeCircumference / 4, strokeLinecap: timeEmpty ? 'butt' : 'round' }), _jsxs("text", { className: size >= 44 ? styles.ringText : styles.badgeRingText, x: "50%", y: "50%", dominantBaseline: "central", textAnchor: "middle", children: [Math.round(used), "%"] })] }));
}
