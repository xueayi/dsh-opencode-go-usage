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
		* No React, no DOM: every function here is trivially unit-testable, mirroring
		* the host-side purity split. The dock renders the three quota windows as
		* rings with a live reset countdown; tones follow a soft threshold so the
		* panel stays calm until usage climbs.
		* @module dsh-opencode-go-usage/client/model
		*/
		const WINDOW_META = {
			rolling: {
				label: "5h 滚动",
				sublabel: "5h Rolling"
			},
			weekly: {
				label: "本周",
				sublabel: "Weekly"
			},
			monthly: {
				label: "本月",
				sublabel: "Monthly"
			}
		};
		/** Window periods: rolling is a fixed 5h, weekly a fixed 7d; monthly uses a
		*  30-day approximation of the subscription cycle (the API only reports the
		*  next reset instant, so the exact cycle cannot be derived). */
		const WINDOW_PERIOD_MS = {
			rolling: 300 * 60 * 1e3,
			weekly: 10080 * 60 * 1e3,
			monthly: 720 * 60 * 60 * 1e3
		};
		/** Project a usage sample into ordered window views (missing windows dropped). */
		function usageWindows(usage) {
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
					label: WINDOW_META[key].label,
					sublabel: WINDOW_META[key].sublabel,
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
		/** Compact Chinese countdown until a reset instant. */
		function formatRemaining(resetsAt, now) {
			const diff = resetsAt - now;
			if (!Number.isFinite(diff)) return "—";
			if (diff <= 0) return "已重置";
			const totalMinutes = Math.floor(diff / 6e4);
			const days = Math.floor(totalMinutes / 1440);
			const hours = Math.floor(totalMinutes % 1440 / 60);
			const minutes = totalMinutes % 60;
			if (days > 0) return `${days}天${hours}小时`;
			if (hours > 0) return `${hours}小时${minutes}分`;
			if (minutes > 0) return `${minutes}分${Math.max(0, Math.floor(diff % 6e4 / 1e3))}秒`;
			return `${Math.max(0, Math.floor(diff / 1e3))}秒`;
		}
		/** Minimal countdown for tight surfaces (the dock badge): `4d3h`, `3h25m`, `12m05s`, `9s`. */
		function formatRemainingCompact(resetsAt, now) {
			const diff = resetsAt - now;
			if (!Number.isFinite(diff)) return "—";
			if (diff <= 0) return "已重置";
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
		/** Human-readable age of a sample. */
		function formatRelative(fetchedAt, now) {
			const diff = Math.max(0, now - fetchedAt);
			const seconds = Math.floor(diff / 1e3);
			if (seconds < 10) return "刚刚";
			if (seconds < 60) return `${seconds}秒前`;
			const minutes = Math.floor(seconds / 60);
			if (minutes < 60) return `${minutes}分钟前`;
			const hours = Math.floor(minutes / 60);
			if (hours < 24) return `${hours}小时前`;
			return `${Math.floor(hours / 24)}天前`;
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
		//#region \0dsh-css:/home/xueayi/01_workspace/dsh_tmp/dsh-opencode-go-usage/src/client/usage.module.css.mjs
		const css = ".AURZ6a_badge{right:calc(18px + env(safe-area-inset-right));bottom:calc(22px + env(safe-area-inset-bottom));z-index:2147483000;height:48px;max-width:calc(100vw - 36px - env(safe-area-inset-right) - env(safe-area-inset-left));box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-module-platform) 88%, transparent);-webkit-backdrop-filter:blur(16px)saturate(1.4);box-shadow:0 10px 32px color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent);color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border-radius:999px;align-items:center;gap:9px;padding:0 16px;font-size:13px;font-weight:600;line-height:20px;transition:border-color .15s,transform .12s,box-shadow .15s;display:inline-flex;position:fixed}.AURZ6a_badge:hover{border-color:var(--dsw-alias-border-l3);box-shadow:0 12px 36px color-mix(in srgb, var(--dsw-alias-label-primary) 18%, transparent);transform:translateY(-1px)}.AURZ6a_badge:active{transform:translateY(0)scale(.98)}.AURZ6a_badgeRingText{fill:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;font-size:9px;font-weight:700}.AURZ6a_ringTimeTrack{stroke:var(--dsw-alias-border-l2)}.AURZ6a_ringTimeBar{stroke:var(--dsw-alias-state-business-primary);transition:stroke-dasharray .6s cubic-bezier(.22,1,.36,1),stroke-dashoffset .6s cubic-bezier(.22,1,.36,1)}.AURZ6a_badgeCountdown{border-left:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-tertiary);white-space:nowrap;align-items:baseline;gap:4px;margin-left:3px;padding-left:10px;font-size:13px;font-weight:600;display:inline-flex}.AURZ6a_badgeCountdownIcon{flex:none;font-size:12px;line-height:1}.AURZ6a_badgeCountdownValue{white-space:nowrap;font-variant-numeric:tabular-nums}.AURZ6a_badgeText{letter-spacing:.02em;white-space:nowrap}.AURZ6a_ringBar{transition:stroke-dasharray .6s cubic-bezier(.22,1,.36,1),stroke-dashoffset .6s cubic-bezier(.22,1,.36,1)}.AURZ6a_ringBar[data-zero=true],.AURZ6a_ringBar[data-full=true],.AURZ6a_ringTimeBar[data-zero=true]{stroke-linecap:butt}.AURZ6a_panel{right:calc(18px + env(safe-area-inset-right));bottom:calc(82px + env(safe-area-inset-bottom));z-index:2147483000;width:min(362px, calc(100vw - 36px - env(safe-area-inset-right) - env(safe-area-inset-left)));box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-module-platform) 82%, transparent);-webkit-backdrop-filter:blur(24px)saturate(1.5);box-shadow:0 24px 64px color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent);transform-origin:100% 100%;border-radius:16px;animation:.18s cubic-bezier(.22,1,.36,1) AURZ6a_usage-pop;position:fixed;overflow:hidden}.AURZ6a_panel[data-closing=true]{animation:.16s cubic-bezier(.36,0,.66,0) forwards AURZ6a_usage-pop-out}@keyframes AURZ6a_usage-pop{0%{opacity:0;transform:translateY(8px)scale(.96)}to{opacity:1;transform:translateY(0)scale(1)}}@keyframes AURZ6a_usage-pop-out{0%{opacity:1;transform:translateY(0)scale(1)}to{opacity:0;transform:translateY(8px)scale(.96)}}.AURZ6a_panelHeader{border-bottom:1px solid var(--dsw-alias-border-l1);justify-content:space-between;align-items:center;padding:14px 16px 12px;display:flex}.AURZ6a_panelTitle{color:var(--dsw-alias-label-primary);letter-spacing:.01em;align-items:center;gap:8px;font-size:14px;font-weight:700;display:inline-flex}.AURZ6a_panelLogo{color:var(--dsw-alias-brand-primary);font-size:17px;line-height:1}.AURZ6a_healthLabel{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-interactive-bg-hover);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:600}.AURZ6a_iconButton{width:28px;height:28px;color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;background:0 0;border:0;border-radius:8px;justify-content:center;align-items:center;padding:0;font-size:13px;line-height:1;transition:background .12s,color .12s;display:inline-flex}.AURZ6a_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.AURZ6a_windows{flex-direction:column;gap:2px;padding:10px 12px;display:flex}.AURZ6a_windowRow{border-radius:12px;align-items:center;gap:14px;padding:11px 12px;transition:background .12s;display:flex}.AURZ6a_windowRow:hover{background:var(--dsw-alias-interactive-bg-hover)}.AURZ6a_ring{flex:none}.AURZ6a_ringTrack{stroke:var(--dsw-alias-border-l2)}.AURZ6a_ringBar[data-tone=ok]{stroke:var(--dsw-alias-state-success-primary)}.AURZ6a_ringBar[data-tone=warn]{stroke:var(--dsw-alias-state-warn-primary)}.AURZ6a_ringBar[data-tone=danger]{stroke:var(--dsw-alias-state-error-primary)}.AURZ6a_ringText{fill:var(--dsw-alias-label-primary);font-size:10px;font-weight:700}.AURZ6a_windowBody{flex:1;min-width:0}.AURZ6a_windowName{align-items:baseline;gap:7px;display:flex}.AURZ6a_windowName>span:first-child{color:var(--dsw-alias-label-primary);font-size:13.5px;font-weight:650}.AURZ6a_windowSublabel{color:var(--dsw-alias-label-caption);letter-spacing:.03em;font-size:11.5px}.AURZ6a_windowMeta{gap:10px;margin-top:5px;font-size:12px;display:flex}.AURZ6a_usedText{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;align-items:center;gap:5px;display:inline-flex}.AURZ6a_remainingText{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}.AURZ6a_countdown{color:var(--dsw-alias-label-caption);font-variant-numeric:tabular-nums;align-items:center;gap:6px;margin-top:6px;font-size:11.5px;display:inline-flex}.AURZ6a_rowDot{border-radius:50%;flex:none;width:7px;height:7px}.AURZ6a_rowDot[data-tone=ok]{background:var(--dsw-alias-state-success-primary)}.AURZ6a_rowDot[data-tone=warn]{background:var(--dsw-alias-state-warn-primary)}.AURZ6a_rowDot[data-tone=danger]{background:var(--dsw-alias-state-error-primary)}.AURZ6a_rowDot[data-tone=time]{background:var(--dsw-alias-state-business-primary)}.AURZ6a_emptyNote{color:var(--dsw-alias-label-tertiary);text-align:center;margin:0;padding:14px 10px;font-size:13px}.AURZ6a_errorBox{border:1px solid #0000;border-radius:12px;margin:10px 14px;padding:12px 14px}.AURZ6a_errorBox[data-variant=info]{border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 30%, transparent);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 6%, transparent)}.AURZ6a_errorBox[data-variant=error]{border-color:color-mix(in srgb, var(--dsw-alias-state-error-secondary) 38%, transparent);background:color-mix(in srgb, var(--dsw-alias-state-error-secondary) 8%, transparent)}.AURZ6a_errorTitle{margin:0;font-size:13.5px;font-weight:650}.AURZ6a_errorBox[data-variant=info] .AURZ6a_errorTitle{color:var(--dsw-alias-state-business-primary)}.AURZ6a_errorBox[data-variant=error] .AURZ6a_errorTitle{color:var(--dsw-alias-state-error-primary)}.AURZ6a_errorDetail{color:var(--dsw-alias-label-secondary);word-break:break-all;margin:6px 0 0;font-size:12.5px;line-height:1.6}.AURZ6a_errorHint{color:var(--dsw-alias-label-tertiary);margin:8px 0 0;font-size:12px;line-height:1.6}.AURZ6a_panelFooter{border-top:1px solid var(--dsw-alias-border-l1);justify-content:space-between;align-items:center;padding:9px 14px 12px;display:flex}.AURZ6a_updatedAt{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-size:11.5px}.AURZ6a_staleNote{color:var(--dsw-alias-state-warn-primary);font-size:11px}.AURZ6a_consoleLink{color:var(--dsw-alias-label-secondary);white-space:nowrap;border-radius:999px;align-items:center;gap:3px;padding:4px 10px;font-size:11.5px;font-weight:600;line-height:18px;text-decoration:none;transition:background .12s,color .12s;display:inline-flex}.AURZ6a_consoleLink:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}@media (prefers-reduced-motion:reduce){.AURZ6a_badge,.AURZ6a_panel{transition:none!important;animation:none!important}.AURZ6a_ringBar,.AURZ6a_ringTimeBar{transition:none!important}}";
		const tagId = "@xueayi/dsh-opencode-go-usage/usage.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@xueayi/dsh-opencode-go-usage";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var usage_module_css_default = {
			"badge": "AURZ6a_badge",
			"badgeCountdown": "AURZ6a_badgeCountdown",
			"badgeCountdownIcon": "AURZ6a_badgeCountdownIcon",
			"badgeCountdownValue": "AURZ6a_badgeCountdownValue",
			"badgeRingText": "AURZ6a_badgeRingText",
			"badgeText": "AURZ6a_badgeText",
			"consoleLink": "AURZ6a_consoleLink",
			"countdown": "AURZ6a_countdown",
			"emptyNote": "AURZ6a_emptyNote",
			"errorBox": "AURZ6a_errorBox",
			"errorDetail": "AURZ6a_errorDetail",
			"errorHint": "AURZ6a_errorHint",
			"errorTitle": "AURZ6a_errorTitle",
			"healthLabel": "AURZ6a_healthLabel",
			"iconButton": "AURZ6a_iconButton",
			"panel": "AURZ6a_panel",
			"panelFooter": "AURZ6a_panelFooter",
			"panelHeader": "AURZ6a_panelHeader",
			"panelLogo": "AURZ6a_panelLogo",
			"panelTitle": "AURZ6a_panelTitle",
			"remainingText": "AURZ6a_remainingText",
			"ring": "AURZ6a_ring",
			"ringBar": "AURZ6a_ringBar",
			"ringText": "AURZ6a_ringText",
			"ringTimeBar": "AURZ6a_ringTimeBar",
			"ringTimeTrack": "AURZ6a_ringTimeTrack",
			"ringTrack": "AURZ6a_ringTrack",
			"rowDot": "AURZ6a_rowDot",
			"staleNote": "AURZ6a_staleNote",
			"updatedAt": "AURZ6a_updatedAt",
			"usage-pop": "AURZ6a_usage-pop",
			"usage-pop-out": "AURZ6a_usage-pop-out",
			"usedText": "AURZ6a_usedText",
			"windowBody": "AURZ6a_windowBody",
			"windowMeta": "AURZ6a_windowMeta",
			"windowName": "AURZ6a_windowName",
			"windowRow": "AURZ6a_windowRow",
			"windowSublabel": "AURZ6a_windowSublabel",
			"windows": "AURZ6a_windows"
		};
		//#endregion
		//#region lib/client/UsageDock.js
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
		/** Poll cadence: fast while the panel is open, calm while collapsed. */
		const OPEN_POLL_MS = 1e4;
		const COLLAPSED_POLL_MS = 6e4;
		/** Whether the user asked the OS to cut non-essential motion. */
		function prefersReducedMotion() {
			return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		}
		/** Root state: the dock itself. */
		function UsageDock() {
			const [open, setOpen] = (0, react.useState)(false);
			const [closing, setClosing] = (0, react.useState)(false);
			const [state, setState] = (0, react.useState)(null);
			const [refreshing, setRefreshing] = (0, react.useState)(false);
			const [now, setNow] = (0, react.useState)(() => Date.now());
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
			const windows = usageWindows(stateHasUsage(state) ? state.usage : void 0);
			const rolling = windows.find((window) => window.key === "rolling");
			const dotState = state === null ? "ongoing" : state.health.status === "ok" ? "done" : stateHasUsage(state) ? "warning" : "error";
			const errorVariant = state === null || state.health.status === "unconfigured" ? "info" : "error";
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: usage_module_css_default.badge,
				onClick: () => open ? requestClose() : openPanel(),
				title: "OpenCode Go 用量：滚/周/月配额 + 5h 滚动重置倒计时",
				"aria-expanded": open,
				"aria-label": "OpenCode Go 用量",
				children: [windows.length > 0 ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [windows.map((window) => (0, react_jsx_runtime.jsx)(Ring, {
					window,
					now,
					size: 36
				}, window.key)), rolling !== void 0 && (0, react_jsx_runtime.jsxs)("span", {
					className: usage_module_css_default.badgeCountdown,
					title: "5h 滚动窗口重置倒计时",
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: usage_module_css_default.badgeCountdownIcon,
						"aria-hidden": "true",
						children: "↻"
					}), (0, react_jsx_runtime.jsx)("span", {
						className: usage_module_css_default.badgeCountdownValue,
						children: formatRemainingCompact(rolling.resetsAt, now)
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
				"aria-label": "OpenCode Go 用量",
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
								(0, react_jsx_runtime.jsx)("span", { children: "OpenCode Go 用量" }),
								(0, react_jsx_runtime.jsx)("span", {
									className: usage_module_css_default.healthLabel,
									children: state === null ? "连接中…" : state.health.status === "ok" ? "实时" : stateHasUsage(state) ? "数据过期" : "异常"
								})
							]
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: usage_module_css_default.iconButton,
							onClick: requestClose,
							"aria-label": "关闭",
							children: "✕"
						})]
					}),
					state !== null && stateHasUsage(state) ? (0, react_jsx_runtime.jsxs)("div", {
						className: usage_module_css_default.windows,
						children: [windows.map((window) => (0, react_jsx_runtime.jsx)(WindowRow, {
							window,
							now
						}, window.key)), windows.length === 0 && (0, react_jsx_runtime.jsx)("p", {
							className: usage_module_css_default.emptyNote,
							children: "用量服务未返回任何窗口数据。"
						})]
					}) : (0, react_jsx_runtime.jsxs)("div", {
						className: usage_module_css_default.errorBox,
						"data-variant": errorVariant,
						children: [
							(0, react_jsx_runtime.jsx)("p", {
								className: usage_module_css_default.errorTitle,
								children: state === null ? "正在连接用量服务…" : state.health.status === "unconfigured" ? "尚未配置 API Key" : "用量获取失败"
							}),
							(0, react_jsx_runtime.jsx)("p", {
								className: usage_module_css_default.errorDetail,
								children: state === null ? "如果长时间停留在该状态，请检查 dsh 服务是否运行了 dsh-opencode-go-usage 插件。" : state.health.error
							}),
							state !== null && state.health.status === "unconfigured" && (0, react_jsx_runtime.jsx)("p", {
								className: usage_module_css_default.errorHint,
								children: "配置方法：打开 Web 设置 → 模型，选择「官方渠道 · OpenCode Go」，填入 API Key 后稍候片刻即会自动生效。"
							})
						]
					}),
					(0, react_jsx_runtime.jsxs)("footer", {
						className: usage_module_css_default.panelFooter,
						children: [
							(0, react_jsx_runtime.jsxs)("span", {
								className: usage_module_css_default.updatedAt,
								children: [state === null ? "" : `更新于 ${formatRelative(state.usageFetchedAt ?? state.health.fetchedAt, now)}`, state !== null && stateHasUsage(state) && state.health.status !== "ok" && (0, react_jsx_runtime.jsx)("span", {
									className: usage_module_css_default.staleNote,
									children: " · 刷新失败，显示上次数据"
								})]
							}),
							(0, react_jsx_runtime.jsxs)("a", {
								className: usage_module_css_default.consoleLink,
								href: "https://opencode.ai/auth",
								target: "_blank",
								rel: "noopener noreferrer",
								title: "在浏览器中打开 OpenCode Go 控制台",
								children: ["控制台 ", (0, react_jsx_runtime.jsx)("span", {
									"aria-hidden": "true",
									children: "↗"
								})]
							}),
							(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								type: "button",
								onClick: () => {
									handleRefresh();
								},
								disabled: refreshing,
								children: refreshing ? "刷新中…" : "立即刷新"
							})
						]
					})
				]
			})] });
		}
		/** One quota window row: ring + labels + countdown. The ring mirrors the
		collapsed badge's double ring (used-percent outer + brand-blue remaining-
		time inner), and inline legend dots restate the color coding for the row:
		a green/amber/red dot before "已用" restates the usage ring color, a blue
		dot before "重置于" restates the inner remaining-time ring color. */
		function WindowRow({ window, now }) {
			const remaining = Math.max(0, 100 - window.percent);
			const tone = percentTone(window.percent);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: usage_module_css_default.windowRow,
				children: [(0, react_jsx_runtime.jsx)(Ring, {
					window,
					now
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: usage_module_css_default.windowBody,
					children: [
						(0, react_jsx_runtime.jsxs)("div", {
							className: usage_module_css_default.windowName,
							children: [(0, react_jsx_runtime.jsx)("span", { children: window.label }), (0, react_jsx_runtime.jsx)("span", {
								className: usage_module_css_default.windowSublabel,
								children: window.sublabel
							})]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: usage_module_css_default.windowMeta,
							children: [(0, react_jsx_runtime.jsxs)("span", {
								className: usage_module_css_default.usedText,
								children: [
									(0, react_jsx_runtime.jsx)("span", {
										className: usage_module_css_default.rowDot,
										"data-tone": tone,
										"aria-hidden": "true"
									}),
									"已用 ",
									window.percent,
									"%"
								]
							}), (0, react_jsx_runtime.jsxs)("span", {
								className: usage_module_css_default.remainingText,
								children: [
									"剩余 ",
									remaining,
									"%"
								]
							})]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: usage_module_css_default.countdown,
							children: [
								(0, react_jsx_runtime.jsx)("span", {
									className: usage_module_css_default.rowDot,
									"data-tone": "time",
									"aria-hidden": "true"
								}),
								"重置于 ",
								formatRemaining(window.resetsAt, now)
							]
						})
					]
				})]
			});
		}
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
		function Ring({ window, now, size = 50 }) {
			const stroke = size >= 44 ? 5 : 3.5;
			const timeStroke = size >= 44 ? 3 : 2.5;
			const radius = (size - stroke) / 2;
			const circumference = 2 * Math.PI * radius;
			const used = Math.min(100, Math.max(0, window.percent));
			const quotaLeft = 100 - used;
			const dash = circumference * quotaLeft / 100;
			const ringEmpty = quotaLeft <= 0;
			const ringFull = quotaLeft >= 100;
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
				"aria-label": `${window.label}剩余额度 ${Math.round(quotaLeft)}%，窗口剩余时间 ${Math.round(remaining * 100)}%`,
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
						"data-zero": ringEmpty ? "true" : "false",
						"data-full": ringFull ? "true" : "false",
						cx: size / 2,
						cy: size / 2,
						r: radius,
						strokeWidth: stroke,
						fill: "none",
						strokeDasharray: `${dash} ${circumference - dash}`,
						strokeDashoffset: circumference / 4,
						strokeLinecap: ringEmpty || ringFull ? "butt" : "round"
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
						children: [Math.round(quotaLeft), "%"]
					})
				]
			});
		}
		//#endregion
		//#region lib/client/index.js
		/** No injected services: the dock polls the plugin's HTTP routes itself. */
		const inject = [];
		/**
		* Mount the floating dock through a body portal (the web shell owns no
		* bottom-right slot). The dock is global — it stays available across
		* sessions — and cleans up on plugin unload.
		*/
		function apply(ctx) {
			const host = document.createElement("div");
			host.dataset.opencodeUsageHost = "";
			document.body.appendChild(host);
			const root = (0, react_dom_client.createRoot)(host);
			root.render((0, react_jsx_runtime.jsx)(UsageDock, {}));
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