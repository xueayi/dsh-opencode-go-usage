window.__ModuleLoader__.load({
	id: "@nanmicoder/dsh-opencode-go-usage",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react_dom_client = require("react-dom/client");
		let react = require("react");
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
					resetsAt: Date.parse(window.resetsAt)
				});
			}
			return views;
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
		const css = ".AURZ6a_badge{z-index:2147483000;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-module-platform) 88%, transparent);-webkit-backdrop-filter:blur(16px)saturate(1.4);height:42px;box-shadow:0 10px 32px color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent);color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border-radius:999px;align-items:center;gap:9px;padding:0 16px;font-size:13px;font-weight:600;line-height:20px;transition:border-color .15s,transform .12s,box-shadow .15s;display:inline-flex;position:fixed;bottom:18px;right:18px}.AURZ6a_badge:hover{border-color:var(--dsw-alias-border-l3);box-shadow:0 12px 36px color-mix(in srgb, var(--dsw-alias-label-primary) 18%, transparent);transform:translateY(-1px)}.AURZ6a_badgeRing{flex:none}.AURZ6a_badgeRingText{fill:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;font-size:9.5px;font-weight:700}.AURZ6a_badgeCountdown{border-left:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-tertiary);white-space:nowrap;align-items:baseline;gap:4px;margin-left:3px;padding-left:10px;font-size:13px;font-weight:600;display:inline-flex}.AURZ6a_badgeCountdownIcon{flex:none;font-size:12px;line-height:1}.AURZ6a_badgeCountdownValue{white-space:nowrap;font-variant-numeric:tabular-nums}.AURZ6a_badgeText{letter-spacing:.02em;white-space:nowrap}.AURZ6a_healthUnknown{background:var(--dsw-alias-label-tertiary);border-radius:50%;width:9px;height:9px}.AURZ6a_healthOk{background:var(--dsw-alias-state-success-primary);width:9px;height:9px;box-shadow:0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-success-primary) 22%, transparent);border-radius:50%;animation:2.4s ease-in-out infinite AURZ6a_usage-pulse}.AURZ6a_healthBad{background:var(--dsw-alias-state-error-primary);width:9px;height:9px;box-shadow:0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-error-primary) 22%, transparent);border-radius:50%}.AURZ6a_healthStale{background:var(--dsw-alias-state-warn-primary);width:9px;height:9px;box-shadow:0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-warn-primary) 22%, transparent);border-radius:50%}@keyframes AURZ6a_usage-pulse{0%,to{opacity:1}50%{opacity:.45}}.AURZ6a_panel{z-index:2147483000;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-module-platform) 82%, transparent);-webkit-backdrop-filter:blur(24px)saturate(1.5);width:362px;box-shadow:0 24px 64px color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent);transform-origin:100% 100%;border-radius:16px;animation:.18s cubic-bezier(.22,1,.36,1) AURZ6a_usage-pop;position:fixed;bottom:72px;right:18px;overflow:hidden}@keyframes AURZ6a_usage-pop{0%{opacity:0;transform:translateY(8px)scale(.96)}to{opacity:1;transform:translateY(0)scale(1)}}.AURZ6a_panelHeader{border-bottom:1px solid var(--dsw-alias-border-l1);justify-content:space-between;align-items:center;padding:14px 16px 12px;display:flex}.AURZ6a_panelTitle{color:var(--dsw-alias-label-primary);letter-spacing:.01em;align-items:center;gap:8px;font-size:14px;font-weight:700;display:inline-flex}.AURZ6a_panelLogo{color:var(--dsw-alias-brand-primary);font-size:17px;line-height:1}.AURZ6a_healthLabel{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-interactive-bg-hover);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:600}.AURZ6a_iconButton{width:28px;height:28px;color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;background:0 0;border:0;border-radius:8px;justify-content:center;align-items:center;padding:0;font-size:13px;line-height:1;transition:background .12s,color .12s;display:inline-flex}.AURZ6a_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.AURZ6a_windows{flex-direction:column;gap:2px;padding:10px 12px;display:flex}.AURZ6a_windowRow{border-radius:12px;align-items:center;gap:14px;padding:11px 12px;transition:background .12s;display:flex}.AURZ6a_windowRow:hover{background:var(--dsw-alias-interactive-bg-hover)}.AURZ6a_ring{flex:none}.AURZ6a_ringTrack{stroke:var(--dsw-alias-border-l2)}.AURZ6a_ringBar[data-tone=ok]{stroke:var(--dsw-alias-state-success-primary)}.AURZ6a_ringBar[data-tone=warn]{stroke:var(--dsw-alias-state-warn-primary)}.AURZ6a_ringBar[data-tone=danger]{stroke:var(--dsw-alias-state-error-primary)}.AURZ6a_ringText{fill:var(--dsw-alias-label-primary);font-size:10px;font-weight:700}.AURZ6a_windowBody{flex:1;min-width:0}.AURZ6a_windowName{align-items:baseline;gap:7px;display:flex}.AURZ6a_windowName>span:first-child{color:var(--dsw-alias-label-primary);font-size:13.5px;font-weight:650}.AURZ6a_windowSublabel{color:var(--dsw-alias-label-tertiary);letter-spacing:.02em;font-size:11.5px}.AURZ6a_windowMeta{gap:10px;margin-top:3px;font-size:12px;display:flex}.AURZ6a_usedText{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}.AURZ6a_remainingText{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}.AURZ6a_countdown{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;margin-top:2px;font-size:11.5px}.AURZ6a_emptyNote{color:var(--dsw-alias-label-tertiary);text-align:center;margin:0;padding:14px 10px;font-size:13px}.AURZ6a_errorBox{border:1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary) 38%, transparent);background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 8%, transparent);border-radius:12px;margin:10px 14px;padding:12px 14px}.AURZ6a_errorTitle{color:var(--dsw-alias-state-warn-primary);margin:0;font-size:13.5px;font-weight:650}.AURZ6a_errorDetail{color:var(--dsw-alias-label-secondary);word-break:break-all;margin:6px 0 0;font-size:12.5px;line-height:1.6}.AURZ6a_errorHint{color:var(--dsw-alias-label-tertiary);margin:8px 0 0;font-size:12px;line-height:1.6}.AURZ6a_panelFooter{border-top:1px solid var(--dsw-alias-border-l1);justify-content:space-between;align-items:center;padding:9px 14px 12px;display:flex}.AURZ6a_updatedAt{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-size:11.5px}.AURZ6a_staleNote{color:var(--dsw-alias-state-warn-primary);font-size:11px}.AURZ6a_refreshButton{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-floating-fill);color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;border-radius:999px;padding:5px 14px;font-size:12px;font-weight:600;line-height:20px;transition:background .12s,border-color .12s}.AURZ6a_refreshButton:hover:not(:disabled){background:var(--dsw-alias-button-floating-hover);border-color:var(--dsw-alias-border-l3)}.AURZ6a_refreshButton:disabled{opacity:.55;cursor:default}";
		const tagId = "@nanmicoder/dsh-opencode-go-usage/usage.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@nanmicoder/dsh-opencode-go-usage";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var usage_module_css_default = {
			"badge": "AURZ6a_badge",
			"badgeCountdown": "AURZ6a_badgeCountdown",
			"badgeCountdownIcon": "AURZ6a_badgeCountdownIcon",
			"badgeCountdownValue": "AURZ6a_badgeCountdownValue",
			"badgeRing": "AURZ6a_badgeRing",
			"badgeRingText": "AURZ6a_badgeRingText",
			"badgeText": "AURZ6a_badgeText",
			"countdown": "AURZ6a_countdown",
			"emptyNote": "AURZ6a_emptyNote",
			"errorBox": "AURZ6a_errorBox",
			"errorDetail": "AURZ6a_errorDetail",
			"errorHint": "AURZ6a_errorHint",
			"errorTitle": "AURZ6a_errorTitle",
			"healthBad": "AURZ6a_healthBad",
			"healthLabel": "AURZ6a_healthLabel",
			"healthOk": "AURZ6a_healthOk",
			"healthStale": "AURZ6a_healthStale",
			"healthUnknown": "AURZ6a_healthUnknown",
			"iconButton": "AURZ6a_iconButton",
			"panel": "AURZ6a_panel",
			"panelFooter": "AURZ6a_panelFooter",
			"panelHeader": "AURZ6a_panelHeader",
			"panelLogo": "AURZ6a_panelLogo",
			"panelTitle": "AURZ6a_panelTitle",
			"refreshButton": "AURZ6a_refreshButton",
			"remainingText": "AURZ6a_remainingText",
			"ring": "AURZ6a_ring",
			"ringBar": "AURZ6a_ringBar",
			"ringText": "AURZ6a_ringText",
			"ringTrack": "AURZ6a_ringTrack",
			"staleNote": "AURZ6a_staleNote",
			"updatedAt": "AURZ6a_updatedAt",
			"usage-pop": "AURZ6a_usage-pop",
			"usage-pulse": "AURZ6a_usage-pulse",
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
		* theme.
		* @module dsh-opencode-go-usage/client/dock
		*/
		/** Poll cadence: fast while the panel is open, calm while collapsed. */
		const OPEN_POLL_MS = 1e4;
		const COLLAPSED_POLL_MS = 6e4;
		/** Root state: the dock itself. */
		function UsageDock() {
			const [open, setOpen] = (0, react.useState)(false);
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
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: usage_module_css_default.badge,
				onClick: () => setOpen((value) => !value),
				title: "OpenCode Go 用量：滚/周/月配额 + 5h 滚动重置倒计时",
				"aria-expanded": open,
				"aria-label": "OpenCode Go 用量",
				children: [windows.length > 0 ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [windows.map((window) => (0, react_jsx_runtime.jsx)(BadgeRing, {
					percent: window.percent,
					tone: percentTone(window.percent),
					label: window.label
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
				}), (0, react_jsx_runtime.jsx)("span", {
					className: state === null ? usage_module_css_default.healthUnknown : state.health.status === "ok" ? usage_module_css_default.healthOk : stateHasUsage(state) ? usage_module_css_default.healthStale : usage_module_css_default.healthBad,
					"aria-hidden": "true"
				})]
			}), open && (0, react_jsx_runtime.jsxs)("section", {
				className: usage_module_css_default.panel,
				role: "dialog",
				"aria-label": "OpenCode Go 用量",
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
							onClick: () => setOpen(false),
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
								children: "配置方法：在 dsh 凭据（如 ~/.dsh/.credentials.yaml 或环境变量）中设置 OPENCODE_GO_API_KEY， 或在 cordis.yml 中为该插件配置 apiKey 字段。"
							})
						]
					}),
					(0, react_jsx_runtime.jsxs)("footer", {
						className: usage_module_css_default.panelFooter,
						children: [(0, react_jsx_runtime.jsxs)("span", {
							className: usage_module_css_default.updatedAt,
							children: [state === null ? "" : `更新于 ${formatRelative(state.usageFetchedAt ?? state.health.fetchedAt, now)}`, state !== null && stateHasUsage(state) && state.health.status !== "ok" && (0, react_jsx_runtime.jsx)("span", {
								className: usage_module_css_default.staleNote,
								children: " · 刷新失败，显示上次数据"
							})]
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: usage_module_css_default.refreshButton,
							onClick: () => {
								handleRefresh();
							},
							disabled: refreshing,
							children: refreshing ? "刷新中…" : "立即刷新"
						})]
					})
				]
			})] });
		}
		/** One quota window row: ring + labels + countdown. */
		function WindowRow({ window, now }) {
			const remaining = Math.max(0, 100 - window.percent);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: usage_module_css_default.windowRow,
				children: [(0, react_jsx_runtime.jsx)(Ring, {
					percent: window.percent,
					tone: percentTone(window.percent)
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
							children: ["重置于 ", formatRemaining(window.resetsAt, now)]
						})
					]
				})]
			});
		}
		/** Circular progress ring, colored by tone. */
		function Ring({ percent, tone, size = 50 }) {
			const stroke = 5;
			const radius = (size - stroke) / 2;
			const circumference = 2 * Math.PI * radius;
			const used = Math.min(100, Math.max(0, percent));
			const dash = circumference * used / 100;
			return (0, react_jsx_runtime.jsxs)("svg", {
				className: usage_module_css_default.ring,
				width: size,
				height: size,
				viewBox: `0 0 ${size} ${size}`,
				role: "img",
				"aria-label": `已用 ${used}%`,
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
						cx: size / 2,
						cy: size / 2,
						r: radius,
						strokeWidth: stroke,
						fill: "none",
						strokeDasharray: `${dash} ${circumference - dash}`,
						strokeDashoffset: circumference / 4,
						strokeLinecap: "round"
					}),
					(0, react_jsx_runtime.jsxs)("text", {
						className: usage_module_css_default.ringText,
						x: "50%",
						y: "50%",
						dominantBaseline: "central",
						textAnchor: "middle",
						children: [Math.round(used), "%"]
					})
				]
			});
		}
		/**
		* Fixed-size mini ring for the collapsed badge: circular progress plus the
		* percent centered inside. Fixed SVG dimensions keep the badge layout stable
		* — no inline text can overlap regardless of font fallback or zoom.
		*/
		function BadgeRing({ percent, tone, label }) {
			const size = 36;
			const stroke = 3.5;
			const radius = (size - stroke) / 2;
			const circumference = 2 * Math.PI * radius;
			const used = Math.min(100, Math.max(0, percent));
			const dash = circumference * used / 100;
			return (0, react_jsx_runtime.jsxs)("svg", {
				className: usage_module_css_default.badgeRing,
				width: size,
				height: size,
				viewBox: `0 0 ${size} ${size}`,
				role: "img",
				"aria-label": `${label}已用 ${used}%`,
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
						cx: size / 2,
						cy: size / 2,
						r: radius,
						strokeWidth: stroke,
						fill: "none",
						strokeDasharray: `${dash} ${circumference - dash}`,
						strokeDashoffset: circumference / 4,
						strokeLinecap: "round"
					}),
					(0, react_jsx_runtime.jsxs)("text", {
						className: usage_module_css_default.badgeRingText,
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