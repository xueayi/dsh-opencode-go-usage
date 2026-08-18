window.__ModuleLoader__.load({
	id: "@xueayi/dsh-opencode-go-usage",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react_dom_client = require("react-dom/client");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region lib/client/usage-model.js
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
			rolling: "5h Rolling",
			weekly: "Weekly",
			monthly: "Monthly"
		};
		/** Window periods: rolling is a fixed 5h, weekly a fixed 7d; monthly uses a
		*  30-day approximation of the subscription cycle (the API only reports the
		*  next reset instant, so the exact cycle cannot be derived). */
		const WINDOW_PERIOD_MS = {
			rolling: 300 * 60 * 1e3,
			weekly: 10080 * 60 * 1e3,
			monthly: 720 * 60 * 60 * 1e3
		};
		/**
		* Project a usage sample into ordered window views (missing windows dropped).
		* Window names come from the locale dictionary via `t`.
		* @param usage - the last successful sample (or undefined).
		* @param t - translator for the window labels.
		*/
		function usageWindows(usage, t) {
			if (usage === void 0) return [];
			const views = [];
			for (const key of [
				"rolling",
				"weekly",
				"monthly"
			]) {
				const window = usage[key];
				if (window === void 0) continue;
				views.push({
					key,
					label: t(`window.${key}`),
					sublabel: WINDOW_SUBLABEL[key],
					percent: window.percent,
					resetsAt: Date.parse(window.resetsAt),
					periodMs: WINDOW_PERIOD_MS[key]
				});
			}
			return views;
		}
		/**
		* Fraction of the window period still left before the reset, 0–1; the
		* badge's inner ring draws this as its remaining arc. Returns 0 once the
		* reset instant has passed (the next refresh will report a fresh window).
		*/
		function remainingRatio(resetsAt, periodMs, now) {
			if (!Number.isFinite(resetsAt) || !Number.isFinite(periodMs) || periodMs <= 0) return 0;
			const remaining = resetsAt - now;
			if (remaining <= 0) return 0;
			return Math.min(1, remaining / periodMs);
		}
		/** Tone for a used percentage (invalid numbers clamp to `ok`). */
		function percentTone(percent) {
			if (!Number.isFinite(percent)) return "ok";
			if (percent >= 85) return "danger";
			if (percent >= 60) return "warn";
			return "ok";
		}
		/** Countdown until a reset instant, localized via `t`. */
		function formatRemaining(resetsAt, now, t) {
			const diff = resetsAt - now;
			if (!Number.isFinite(diff)) return "—";
			if (diff <= 0) return t("countdown.reset");
			const totalMinutes = Math.floor(diff / 6e4);
			const days = Math.floor(totalMinutes / 1440);
			const hours = Math.floor(totalMinutes % 1440 / 60);
			const minutes = totalMinutes % 60;
			if (days > 0) return t("countdown.daysHours", {
				days,
				hours
			});
			if (hours > 0) return t("countdown.hoursMinutes", {
				hours,
				minutes
			});
			if (minutes > 0) return t("countdown.minutesSeconds", {
				minutes,
				seconds: Math.max(0, Math.floor(diff % 6e4 / 1e3))
			});
			return t("countdown.seconds", { seconds: Math.max(0, Math.floor(diff / 1e3)) });
		}
		/** Minimal countdown for tight surfaces (the dock badge): uses the shared
		*  Latin units `4d3h`/`3h25m`/`12m05s`/`9s`; only the expired state is
		*  localized. */
		function formatRemainingCompact(resetsAt, now, t) {
			const diff = resetsAt - now;
			if (!Number.isFinite(diff)) return "—";
			if (diff <= 0) return t("countdown.reset");
			const totalMinutes = Math.floor(diff / 6e4);
			const days = Math.floor(totalMinutes / 1440);
			const hours = Math.floor(totalMinutes % 1440 / 60);
			const minutes = totalMinutes % 60;
			const seconds = Math.max(0, Math.floor(diff % 6e4 / 1e3));
			if (days > 0) return hours > 0 ? `${days}d${hours}h` : `${days}d`;
			if (hours > 0) return `${hours}h${minutes}m`;
			if (minutes > 0) return `${minutes}m${String(seconds).padStart(2, "0")}s`;
			return `${seconds}s`;
		}
		/** Human-readable age of a sample, localized via `t`. */
		function formatRelative(fetchedAt, now, t) {
			const diff = Math.max(0, now - fetchedAt);
			const seconds = Math.floor(diff / 1e3);
			if (seconds < 10) return t("relative.justNow");
			if (seconds < 60) return t("relative.secondsAgo", { seconds });
			const minutes = Math.floor(seconds / 60);
			if (minutes < 60) return t("relative.minutesAgo", { minutes });
			const hours = Math.floor(minutes / 60);
			if (hours < 24) return t("relative.hoursAgo", { hours });
			return t("relative.daysAgo", { days: Math.floor(hours / 24) });
		}
		/** Whether a state carries usable quota windows (kept across failed refreshes). */
		function stateHasUsage(state) {
			return state !== null && state.usage !== void 0;
		}
		/** Fetch the current cached sample from the plugin route. */
		async function fetchState() {
			const response = await fetch("/plugins/dsh-opencode-go-usage/state", { cache: "no-store" });
			if (!response.ok) throw new Error(`state HTTP ${response.status}`);
			return await response.json();
		}
		/** Ask the host for an immediate refresh and return the new sample. */
		async function refreshState() {
			const response = await fetch("/plugins/dsh-opencode-go-usage/refresh", { method: "POST" });
			if (!response.ok) throw new Error(`refresh HTTP ${response.status}`);
			return await response.json();
		}
		//#endregion
		//#region \0dsh-css:/home/cyril/Workspace/Perso/dsh-opencode-go-usage/src/client/usage.module.css.mjs
		const css = ".OxHraW_badge{right:calc(18px + env(safe-area-inset-right));bottom:calc(22px + env(safe-area-inset-bottom));z-index:2147483000;height:48px;max-width:calc(100vw - 36px - env(safe-area-inset-right) - env(safe-area-inset-left));box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-module-platform) 88%, transparent);-webkit-backdrop-filter:blur(16px)saturate(1.4);box-shadow:0 10px 32px color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent);color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border-radius:999px;align-items:center;gap:9px;padding:0 16px;font-size:13px;font-weight:600;line-height:20px;transition:border-color .15s,transform .12s,box-shadow .15s;display:inline-flex;position:fixed}.OxHraW_badge:hover{border-color:var(--dsw-alias-border-l3);box-shadow:0 12px 36px color-mix(in srgb, var(--dsw-alias-label-primary) 18%, transparent);transform:translateY(-1px)}.OxHraW_badge:active{transform:translateY(0)scale(.98)}.OxHraW_badgeRingText{fill:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;font-size:9px;font-weight:700}.OxHraW_ringTimeTrack{stroke:var(--dsw-alias-border-l2)}.OxHraW_ringTimeBar{stroke:var(--dsw-alias-state-business-primary);transition:stroke-dasharray .6s cubic-bezier(.22,1,.36,1),stroke-dashoffset .6s cubic-bezier(.22,1,.36,1)}.OxHraW_badgeCountdown{border-left:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-tertiary);white-space:nowrap;align-items:baseline;gap:4px;margin-left:3px;padding-left:10px;font-size:13px;font-weight:600;display:inline-flex}.OxHraW_badgeCountdownIcon{flex:none;font-size:12px;line-height:1}.OxHraW_badgeCountdownValue{white-space:nowrap;font-variant-numeric:tabular-nums}.OxHraW_badgeText{letter-spacing:.02em;white-space:nowrap}.OxHraW_ringBar{transition:stroke-dasharray .6s cubic-bezier(.22,1,.36,1),stroke-dashoffset .6s cubic-bezier(.22,1,.36,1)}.OxHraW_ringBar[data-zero=true],.OxHraW_ringTimeBar[data-zero=true]{stroke-linecap:butt}.OxHraW_panel{right:calc(18px + env(safe-area-inset-right));bottom:calc(82px + env(safe-area-inset-bottom));z-index:2147483000;width:min(362px, calc(100vw - 36px - env(safe-area-inset-right) - env(safe-area-inset-left)));box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-module-platform) 82%, transparent);-webkit-backdrop-filter:blur(24px)saturate(1.5);box-shadow:0 24px 64px color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent);transform-origin:100% 100%;border-radius:16px;animation:.18s cubic-bezier(.22,1,.36,1) OxHraW_usage-pop;position:fixed;overflow:hidden}.OxHraW_panel[data-closing=true]{animation:.16s cubic-bezier(.36,0,.66,0) forwards OxHraW_usage-pop-out}@keyframes OxHraW_usage-pop{0%{opacity:0;transform:translateY(8px)scale(.96)}to{opacity:1;transform:translateY(0)scale(1)}}@keyframes OxHraW_usage-pop-out{0%{opacity:1;transform:translateY(0)scale(1)}to{opacity:0;transform:translateY(8px)scale(.96)}}.OxHraW_panelHeader{border-bottom:1px solid var(--dsw-alias-border-l1);justify-content:space-between;align-items:center;padding:14px 16px 12px;display:flex}.OxHraW_panelTitle{color:var(--dsw-alias-label-primary);letter-spacing:.01em;align-items:center;gap:8px;font-size:14px;font-weight:700;display:inline-flex}.OxHraW_panelLogo{color:var(--dsw-alias-brand-primary);font-size:17px;line-height:1}.OxHraW_healthLabel{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-interactive-bg-hover);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:600}.OxHraW_iconButton{width:28px;height:28px;color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;background:0 0;border:0;border-radius:8px;justify-content:center;align-items:center;padding:0;font-size:13px;line-height:1;transition:background .12s,color .12s;display:inline-flex}.OxHraW_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.OxHraW_windows{flex-direction:column;gap:2px;padding:10px 12px;display:flex}.OxHraW_windowRow{border-radius:12px;align-items:center;gap:14px;padding:11px 12px;transition:background .12s;display:flex}.OxHraW_windowRow:hover{background:var(--dsw-alias-interactive-bg-hover)}.OxHraW_ring{flex:none}.OxHraW_ringTrack{stroke:var(--dsw-alias-border-l2)}.OxHraW_ringBar[data-tone=ok]{stroke:var(--dsw-alias-state-success-primary)}.OxHraW_ringBar[data-tone=warn]{stroke:var(--dsw-alias-state-warn-primary)}.OxHraW_ringBar[data-tone=danger]{stroke:var(--dsw-alias-state-error-primary)}.OxHraW_ringText{fill:var(--dsw-alias-label-primary);font-size:10px;font-weight:700}.OxHraW_windowBody{flex:1;min-width:0}.OxHraW_windowName{align-items:baseline;gap:7px;display:flex}.OxHraW_windowName>span:first-child{color:var(--dsw-alias-label-primary);font-size:13.5px;font-weight:650}.OxHraW_windowSublabel{color:var(--dsw-alias-label-caption);letter-spacing:.03em;font-size:11.5px}.OxHraW_windowMeta{gap:10px;margin-top:5px;font-size:12px;display:flex}.OxHraW_usedText{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;align-items:center;gap:5px;display:inline-flex}.OxHraW_remainingText{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}.OxHraW_countdown{color:var(--dsw-alias-label-caption);font-variant-numeric:tabular-nums;align-items:center;gap:6px;margin-top:6px;font-size:11.5px;display:inline-flex}.OxHraW_rowDot{border-radius:50%;flex:none;width:7px;height:7px}.OxHraW_rowDot[data-tone=ok]{background:var(--dsw-alias-state-success-primary)}.OxHraW_rowDot[data-tone=warn]{background:var(--dsw-alias-state-warn-primary)}.OxHraW_rowDot[data-tone=danger]{background:var(--dsw-alias-state-error-primary)}.OxHraW_rowDot[data-tone=time]{background:var(--dsw-alias-state-business-primary)}.OxHraW_emptyNote{color:var(--dsw-alias-label-tertiary);text-align:center;margin:0;padding:14px 10px;font-size:13px}.OxHraW_errorBox{border:1px solid #0000;border-radius:12px;margin:10px 14px;padding:12px 14px}.OxHraW_errorBox[data-variant=info]{border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 30%, transparent);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 6%, transparent)}.OxHraW_errorBox[data-variant=error]{border-color:color-mix(in srgb, var(--dsw-alias-state-error-secondary) 38%, transparent);background:color-mix(in srgb, var(--dsw-alias-state-error-secondary) 8%, transparent)}.OxHraW_errorTitle{margin:0;font-size:13.5px;font-weight:650}.OxHraW_errorBox[data-variant=info] .OxHraW_errorTitle{color:var(--dsw-alias-state-business-primary)}.OxHraW_errorBox[data-variant=error] .OxHraW_errorTitle{color:var(--dsw-alias-state-error-primary)}.OxHraW_errorDetail{color:var(--dsw-alias-label-secondary);word-break:break-all;margin:6px 0 0;font-size:12.5px;line-height:1.6}.OxHraW_errorHint{color:var(--dsw-alias-label-tertiary);margin:8px 0 0;font-size:12px;line-height:1.6}.OxHraW_panelFooter{border-top:1px solid var(--dsw-alias-border-l1);justify-content:space-between;align-items:center;padding:9px 14px 12px;display:flex}.OxHraW_updatedAt{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-size:11.5px}.OxHraW_staleNote{color:var(--dsw-alias-state-warn-primary);font-size:11px}.OxHraW_consoleLink{color:var(--dsw-alias-label-secondary);white-space:nowrap;border-radius:999px;align-items:center;gap:3px;padding:4px 10px;font-size:11.5px;font-weight:600;line-height:18px;text-decoration:none;transition:background .12s,color .12s;display:inline-flex}.OxHraW_consoleLink:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}@media (prefers-reduced-motion:reduce){.OxHraW_badge,.OxHraW_panel{transition:none!important;animation:none!important}.OxHraW_ringBar,.OxHraW_ringTimeBar{transition:none!important}}";
		const tagId = "@xueayi/dsh-opencode-go-usage/usage.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@xueayi/dsh-opencode-go-usage";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var usage_module_css_default = {
			"badge": "OxHraW_badge",
			"badgeCountdown": "OxHraW_badgeCountdown",
			"badgeCountdownIcon": "OxHraW_badgeCountdownIcon",
			"badgeCountdownValue": "OxHraW_badgeCountdownValue",
			"badgeRingText": "OxHraW_badgeRingText",
			"badgeText": "OxHraW_badgeText",
			"consoleLink": "OxHraW_consoleLink",
			"countdown": "OxHraW_countdown",
			"emptyNote": "OxHraW_emptyNote",
			"errorBox": "OxHraW_errorBox",
			"errorDetail": "OxHraW_errorDetail",
			"errorHint": "OxHraW_errorHint",
			"errorTitle": "OxHraW_errorTitle",
			"healthLabel": "OxHraW_healthLabel",
			"iconButton": "OxHraW_iconButton",
			"panel": "OxHraW_panel",
			"panelFooter": "OxHraW_panelFooter",
			"panelHeader": "OxHraW_panelHeader",
			"panelLogo": "OxHraW_panelLogo",
			"panelTitle": "OxHraW_panelTitle",
			"remainingText": "OxHraW_remainingText",
			"ring": "OxHraW_ring",
			"ringBar": "OxHraW_ringBar",
			"ringText": "OxHraW_ringText",
			"ringTimeBar": "OxHraW_ringTimeBar",
			"ringTimeTrack": "OxHraW_ringTimeTrack",
			"ringTrack": "OxHraW_ringTrack",
			"rowDot": "OxHraW_rowDot",
			"staleNote": "OxHraW_staleNote",
			"updatedAt": "OxHraW_updatedAt",
			"usage-pop": "OxHraW_usage-pop",
			"usage-pop-out": "OxHraW_usage-pop-out",
			"usedText": "OxHraW_usedText",
			"windowBody": "OxHraW_windowBody",
			"windowMeta": "OxHraW_windowMeta",
			"windowName": "OxHraW_windowName",
			"windowRow": "OxHraW_windowRow",
			"windowSublabel": "OxHraW_windowSublabel",
			"windows": "OxHraW_windows"
		};
		//#endregion
		//#region lib/client/UsageDock.js
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
		/** Poll cadence: fast while the panel is open, calm while collapsed. */
		const OPEN_POLL_MS = 1e4;
		const COLLAPSED_POLL_MS = 6e4;
		/** Whether the user asked the OS to cut non-essential motion. */
		function prefersReducedMotion() {
			return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		}
		/** Root state: the dock itself. */
		function UsageDock({ t, locale }) {
			const [open, setOpen] = (0, react.useState)(false);
			const [closing, setClosing] = (0, react.useState)(false);
			const [state, setState] = (0, react.useState)(null);
			const [refreshing, setRefreshing] = (0, react.useState)(false);
			const [now, setNow] = (0, react.useState)(() => Date.now());
			(0, react.useSyncExternalStore)((callback) => locale.subscribe(callback), () => locale.getSnapshot().revision);
			(0, react.useEffect)(() => {
				let alive = true;
				const tick = async () => {
					try {
						const next = await fetchState();
						if (alive) setState(next);
					} catch {}
				};
				tick();
				const id = window.setInterval(() => {
					tick();
				}, open ? OPEN_POLL_MS : COLLAPSED_POLL_MS);
				return () => {
					alive = false;
					window.clearInterval(id);
				};
			}, [open]);
			(0, react.useEffect)(() => {
				const id = window.setInterval(() => setNow(Date.now()), 1e3);
				return () => window.clearInterval(id);
			}, []);
			const openPanel = () => {
				setClosing(false);
				setOpen(true);
			};
			const requestClose = () => {
				if (!open) return;
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
				if (refreshing) return;
				setRefreshing(true);
				try {
					setState(await refreshState());
					setNow(Date.now());
				} catch {} finally {
					setRefreshing(false);
				}
			};
			const windows = usageWindows(stateHasUsage(state) ? state.usage : void 0, t);
			const rolling = windows.find((window) => window.key === "rolling");
			const dotState = state === null ? "ongoing" : state.health.status === "ok" ? "done" : stateHasUsage(state) ? "warning" : "error";
			const errorVariant = state === null || state.health.status === "unconfigured" ? "info" : "error";
			/** Resolve the user-visible failure detail from a structured health error. */
			const errorText = () => {
				if (state === null) return t("error.connecting.detail");
				const error = state.health.error;
				if (error === void 0) return "";
				return t(`error.${error.code}`, error.params ?? {});
			};
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: usage_module_css_default.badge,
				onClick: () => open ? requestClose() : openPanel(),
				title: t("dock.title"),
				"aria-expanded": open,
				"aria-label": t("dock.aria"),
				children: [windows.length > 0 ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [windows.map((window) => (0, react_jsx_runtime.jsx)(Ring, {
					window,
					now,
					size: 36,
					t
				}, window.key)), rolling !== void 0 && (0, react_jsx_runtime.jsxs)("span", {
					className: usage_module_css_default.badgeCountdown,
					title: t("dock.badgeCountdown.title"),
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: usage_module_css_default.badgeCountdownIcon,
						"aria-hidden": "true",
						children: "↻"
					}), (0, react_jsx_runtime.jsx)("span", {
						className: usage_module_css_default.badgeCountdownValue,
						children: formatRemainingCompact(rolling.resetsAt, now, t)
					})]
				})] }) : (0, react_jsx_runtime.jsx)("span", {
					className: usage_module_css_default.badgeText,
					children: "Go —"
				}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, {
					state: dotState,
					size: 9
				})]
			}), open && (0, react_jsx_runtime.jsxs)("section", {
				className: usage_module_css_default.panel,
				"data-closing": closing || void 0,
				role: "dialog",
				"aria-label": t("dock.aria"),
				onAnimationEnd: handlePanelAnimationEnd,
				children: [
					(0, react_jsx_runtime.jsxs)("header", {
						className: usage_module_css_default.panelHeader,
						children: [(0, react_jsx_runtime.jsxs)("div", {
							className: usage_module_css_default.panelTitle,
							children: [
								(0, react_jsx_runtime.jsx)("span", {
									className: usage_module_css_default.panelLogo,
									"aria-hidden": "true",
									children: "◈"
								}),
								(0, react_jsx_runtime.jsx)("span", { children: t("dock.aria") }),
								(0, react_jsx_runtime.jsx)("span", {
									className: usage_module_css_default.healthLabel,
									children: state === null ? t("health.connecting") : state.health.status === "ok" ? t("health.live") : stateHasUsage(state) ? t("health.stale") : t("health.error")
								})
							]
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: usage_module_css_default.iconButton,
							onClick: requestClose,
							"aria-label": t("close.aria"),
							children: "✕"
						})]
					}),
					state !== null && stateHasUsage(state) ? (0, react_jsx_runtime.jsxs)("div", {
						className: usage_module_css_default.windows,
						children: [windows.map((window) => (0, react_jsx_runtime.jsx)(WindowRow, {
							window,
							now,
							t,
							showSublabel: locale.getSnapshot().active === "zh"
						}, window.key)), windows.length === 0 && (0, react_jsx_runtime.jsx)("p", {
							className: usage_module_css_default.emptyNote,
							children: t("empty.note")
						})]
					}) : (0, react_jsx_runtime.jsxs)("div", {
						className: usage_module_css_default.errorBox,
						"data-variant": errorVariant,
						children: [
							(0, react_jsx_runtime.jsx)("p", {
								className: usage_module_css_default.errorTitle,
								children: state === null ? t("error.connecting") : state.health.status === "unconfigured" ? t("error.unconfigured") : t("error.fetchFailed")
							}),
							(0, react_jsx_runtime.jsx)("p", {
								className: usage_module_css_default.errorDetail,
								children: errorText()
							}),
							state !== null && state.health.status === "unconfigured" && (0, react_jsx_runtime.jsx)("p", {
								className: usage_module_css_default.errorHint,
								children: t("error.unconfigured.hint")
							})
						]
					}),
					(0, react_jsx_runtime.jsxs)("footer", {
						className: usage_module_css_default.panelFooter,
						children: [
							(0, react_jsx_runtime.jsxs)("span", {
								className: usage_module_css_default.updatedAt,
								children: [state === null ? "" : t("footer.updatedAt", { relative: formatRelative(state.usageFetchedAt ?? state.health.fetchedAt, now, t) }), state !== null && stateHasUsage(state) && state.health.status !== "ok" && (0, react_jsx_runtime.jsx)("span", {
									className: usage_module_css_default.staleNote,
									children: t("footer.staleNote")
								})]
							}),
							(0, react_jsx_runtime.jsxs)("a", {
								className: usage_module_css_default.consoleLink,
								href: "https://opencode.ai/auth",
								target: "_blank",
								rel: "noopener noreferrer",
								title: t("console.title"),
								children: [
									t("console.label"),
									" ",
									(0, react_jsx_runtime.jsx)("span", {
										"aria-hidden": "true",
										children: "↗"
									})
								]
							}),
							(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								type: "button",
								onClick: () => {
									handleRefresh();
								},
								disabled: refreshing,
								children: refreshing ? t("refresh.loading") : t("refresh.idle")
							})
						]
					})
				]
			})] });
		}
		/**
		* One quota window row: ring + labels + countdown. The ring mirrors the
		* collapsed badge's double ring (used-percent outer + brand-blue remaining-
		* time inner), and inline legend dots restate the color coding for the row:
		* a green/amber/red dot before the used-percent text restates the usage ring
		* color, a blue dot before the reset-countdown text restates the inner
		* remaining-time ring color.
		*/
		function WindowRow({ window, now, t, showSublabel }) {
			const remaining = Math.max(0, 100 - window.percent);
			const tone = percentTone(window.percent);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: usage_module_css_default.windowRow,
				children: [(0, react_jsx_runtime.jsx)(Ring, {
					window,
					now,
					t
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: usage_module_css_default.windowBody,
					children: [
						(0, react_jsx_runtime.jsxs)("div", {
							className: usage_module_css_default.windowName,
							children: [(0, react_jsx_runtime.jsx)("span", { children: window.label }), showSublabel && (0, react_jsx_runtime.jsx)("span", {
								className: usage_module_css_default.windowSublabel,
								children: window.sublabel
							})]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: usage_module_css_default.windowMeta,
							children: [(0, react_jsx_runtime.jsxs)("span", {
								className: usage_module_css_default.usedText,
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: usage_module_css_default.rowDot,
									"data-tone": tone,
									"aria-hidden": "true"
								}), t("row.used", { percent: window.percent })]
							}), (0, react_jsx_runtime.jsx)("span", {
								className: usage_module_css_default.remainingText,
								children: t("row.remaining", { percent: remaining })
							})]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: usage_module_css_default.countdown,
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: usage_module_css_default.rowDot,
								"data-tone": "time",
								"aria-hidden": "true"
							}), t("row.resetsIn", { countdown: formatRemaining(window.resetsAt, now, t) })]
						})
					]
				})]
			});
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
		function Ring({ window, now, size = 50, t }) {
			const stroke = size >= 44 ? 5 : 3.5;
			const timeStroke = size >= 44 ? 3 : 2.5;
			const radius = (size - stroke) / 2;
			const circumference = 2 * Math.PI * radius;
			const used = Math.min(100, Math.max(0, window.percent));
			const dash = circumference * used / 100;
			const usedEmpty = used <= 0;
			const tone = percentTone(used);
			const timeRadius = radius - (stroke + timeStroke) / 2;
			const timeCircumference = 2 * Math.PI * timeRadius;
			const remaining = remainingRatio(window.resetsAt, window.periodMs, now);
			const timeDash = timeCircumference * remaining;
			const timeEmpty = remaining <= 0;
			return (0, react_jsx_runtime.jsxs)("svg", {
				className: usage_module_css_default.ring,
				width: size,
				height: size,
				viewBox: `0 0 ${size} ${size}`,
				role: "img",
				"aria-label": t("ring.aria", {
					window: window.label,
					used: Math.round(used),
					remaining: Math.round(remaining * 100)
				}),
				children: [
					(0, react_jsx_runtime.jsx)("circle", {
						className: usage_module_css_default.ringTrack,
						cx: size / 2,
						cy: size / 2,
						r: radius,
						strokeWidth: stroke,
						fill: "none"
					}),
					(0, react_jsx_runtime.jsx)("circle", {
						className: usage_module_css_default.ringBar,
						"data-tone": tone,
						"data-zero": usedEmpty ? "true" : "false",
						cx: size / 2,
						cy: size / 2,
						r: radius,
						strokeWidth: stroke,
						fill: "none",
						strokeDasharray: `${dash} ${circumference - dash}`,
						strokeDashoffset: circumference / 4,
						strokeLinecap: usedEmpty ? "butt" : "round"
					}),
					(0, react_jsx_runtime.jsx)("circle", {
						className: usage_module_css_default.ringTimeTrack,
						cx: size / 2,
						cy: size / 2,
						r: timeRadius,
						strokeWidth: timeStroke,
						fill: "none"
					}),
					(0, react_jsx_runtime.jsx)("circle", {
						className: usage_module_css_default.ringTimeBar,
						"data-zero": timeEmpty ? "true" : "false",
						cx: size / 2,
						cy: size / 2,
						r: timeRadius,
						strokeWidth: timeStroke,
						fill: "none",
						strokeDasharray: `${timeDash} ${timeCircumference - timeDash}`,
						strokeDashoffset: timeCircumference / 4,
						strokeLinecap: timeEmpty ? "butt" : "round"
					}),
					(0, react_jsx_runtime.jsxs)("text", {
						className: size >= 44 ? usage_module_css_default.ringText : usage_module_css_default.badgeRingText,
						x: "50%",
						y: "50%",
						dominantBaseline: "central",
						textAnchor: "middle",
						children: [Math.round(used), "%"]
					})
				]
			});
		}
		//#endregion
		//#region lib/client/locales.js
		/**
		* Locale dictionaries for the OpenCode Go usage dock.
		*
		* The plugin owns one namespace (`opencode-usage`) merged into the shared
		* {@link LocaleNamespaceMap}, so `ctx.locale.register(USAGE_NS, { zh, en })`
		* is typed: zh is the key-set source of truth, en is checked complete against
		* it at compile time, and the merged namespace makes `ctx.locale.bind(USAGE_NS)`
		* (and the UI's `t`) typed to exactly these keys.
		*
		* Templates use `{name}` placeholders; `createTranslator` interpolates them
		* for pure tests. Values follow the active locale chosen by dsh's
		* `locale.preference` (with a browser-language fallback) — see the locale
		* plugin's README.
		* @module dsh-opencode-go-usage/client/locales
		*/
		/** `opencode-usage` namespace dictionaries. */
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"window.rolling": "5h 滚动",
			"window.weekly": "本周",
			"window.monthly": "本月",
			"countdown.reset": "已重置",
			"countdown.daysHours": "{days}天{hours}小时",
			"countdown.hoursMinutes": "{hours}小时{minutes}分",
			"countdown.minutesSeconds": "{minutes}分{seconds}秒",
			"countdown.seconds": "{seconds}秒",
			"relative.justNow": "刚刚",
			"relative.secondsAgo": "{seconds}秒前",
			"relative.minutesAgo": "{minutes}分钟前",
			"relative.hoursAgo": "{hours}小时前",
			"relative.daysAgo": "{days}天前",
			"error.idle": "尚未刷新",
			"error.unconfigured": "未找到 OpenCode Go API Key：请在 Web 设置 → 模型 中选择「官方渠道 · OpenCode Go」并填入 API Key",
			"error.connect": "无法连接 OpenCode 用量服务：{detail}",
			"error.timeout": "请求超时",
			"error.unauthorized": "API Key 无效或已过期（HTTP 401/403），请检查 OPENCODE_GO_API_KEY",
			"error.http": "OpenCode 用量服务返回 HTTP {status}",
			"error.parse": "OpenCode 用量服务返回了无法解析的响应",
			"error.no-data": "响应中没有可用的用量数据（usage.rolling/weekly/monthly 均缺失）",
			"dock.title": "OpenCode Go 用量：滚/周/月配额 + 5h 滚动重置倒计时",
			"dock.aria": "OpenCode Go 用量",
			"dock.badgeCountdown.title": "5h 滚动窗口重置倒计时",
			"close.aria": "关闭",
			"empty.note": "用量服务未返回任何窗口数据。",
			"health.connecting": "连接中…",
			"health.live": "实时",
			"health.stale": "数据过期",
			"health.error": "异常",
			"error.connecting": "正在连接用量服务…",
			"error.fetchFailed": "用量获取失败",
			"error.connecting.detail": "如果长时间停留在该状态，请检查 dsh 服务是否运行了 dsh-opencode-go-usage 插件。",
			"error.unconfigured.hint": "配置方法：打开 Web 设置 → 模型，选择「官方渠道 · OpenCode Go」，填入 API Key 后稍候片刻即会自动生效。",
			"footer.updatedAt": "更新于 {relative}",
			"footer.staleNote": " · 刷新失败，显示上次数据",
			"console.title": "在浏览器中打开 OpenCode Go 控制台",
			"console.label": "控制台",
			"refresh.idle": "立即刷新",
			"refresh.loading": "刷新中…",
			"row.used": "已用 {percent}%",
			"row.remaining": "剩余 {percent}%",
			"row.resetsIn": "重置于 {countdown}",
			"ring.aria": "{window}已用 {used}%，窗口剩余时间 {remaining}%"
		};
		/** `opencode-usage` namespace dictionaries. */
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"window.rolling": "5h Rolling",
			"window.weekly": "This Week",
			"window.monthly": "This Month",
			"countdown.reset": "Reset",
			"countdown.daysHours": "{days}d {hours}h",
			"countdown.hoursMinutes": "{hours}h {minutes}m",
			"countdown.minutesSeconds": "{minutes}m {seconds}s",
			"countdown.seconds": "{seconds}s",
			"relative.justNow": "just now",
			"relative.secondsAgo": "{seconds}s ago",
			"relative.minutesAgo": "{minutes} min ago",
			"relative.hoursAgo": "{hours} h ago",
			"relative.daysAgo": "{days} d ago",
			"error.idle": "Not refreshed yet",
			"error.unconfigured": "No OpenCode Go API key found: open Web Settings → Models, choose “Official · OpenCode Go” and enter the API key",
			"error.connect": "Cannot reach the OpenCode usage service: {detail}",
			"error.timeout": "Request timed out",
			"error.unauthorized": "Invalid or expired API key (HTTP 401/403); check OPENCODE_GO_API_KEY",
			"error.http": "The OpenCode usage service returned HTTP {status}",
			"error.parse": "The OpenCode usage service returned an unparsable response",
			"error.no-data": "No usable usage data in the response (usage.rolling/weekly/monthly all missing)",
			"dock.title": "OpenCode Go usage: rolling/weekly/monthly quotas + 5h rolling reset countdown",
			"dock.aria": "OpenCode Go usage",
			"dock.badgeCountdown.title": "5h rolling window reset countdown",
			"close.aria": "Close",
			"empty.note": "The usage service returned no window data.",
			"health.connecting": "Connecting…",
			"health.live": "Live",
			"health.stale": "Stale",
			"health.error": "Error",
			"error.connecting": "Connecting to the usage service…",
			"error.fetchFailed": "Usage fetch failed",
			"error.connecting.detail": "If this persists, check that the dsh service runs the dsh-opencode-go-usage plugin.",
			"error.unconfigured.hint": "To configure: open Web Settings → Models, choose “Official · OpenCode Go”, enter the API key — it takes effect shortly.",
			"footer.updatedAt": "Updated {relative}",
			"footer.staleNote": " · Refresh failed, showing previous data",
			"console.title": "Open the OpenCode Go console in the browser",
			"console.label": "Console",
			"refresh.idle": "Refresh now",
			"refresh.loading": "Refreshing…",
			"row.used": "Used {percent}%",
			"row.remaining": "Remaining {percent}%",
			"row.resetsIn": "Resets in {countdown}",
			"ring.aria": "{window}: {used}% used, {remaining}% of window remaining"
		};
		/** Namespace this plugin registers into the locale service. */
		const USAGE_NS = "opencode-usage";
		//#endregion
		//#region lib/client/index.js
		/** The dock needs the locale service (dictionaries + active-language watch). */
		const inject = ["locale"];
		/**
		* Mount the floating dock through a body portal (the web shell owns no
		* bottom-right slot). Registers the plugin's locale dictionaries with the
		* locale service, binds the typed translator, and hands both to the dock so
		* it follows dsh's active language (locale.preference → browser fallback)
		* and re-renders in place on a switch. The dock is global — it stays
		* available across sessions — and cleans up on plugin unload.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(USAGE_NS, {
				zh,
				en
			}), "opencode-go-usage: dictionaries");
			const t = ctx.locale.bind(USAGE_NS);
			const host = document.createElement("div");
			host.dataset.opencodeUsageHost = "";
			document.body.appendChild(host);
			const root = (0, react_dom_client.createRoot)(host);
			root.render((0, react_jsx_runtime.jsx)(UsageDock, {
				t,
				locale: ctx.locale
			}));
			ctx.effect(() => () => {
				root.unmount();
				host.remove();
			}, "opencode-go-usage: dock");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map