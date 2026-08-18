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
export const zh = {
  // Window names (top-level rows + badge legend).
  'window.rolling': '5h 滚动',
  'window.weekly': '本周',
  'window.monthly': '本月',

  // Countdown units.
  'countdown.reset': '已重置',
  'countdown.daysHours': '{days}天{hours}小时',
  'countdown.hoursMinutes': '{hours}小时{minutes}分',
  'countdown.minutesSeconds': '{minutes}分{seconds}秒',
  'countdown.seconds': '{seconds}秒',

  // Relative sample age.
  'relative.justNow': '刚刚',
  'relative.secondsAgo': '{seconds}秒前',
  'relative.minutesAgo': '{minutes}分钟前',
  'relative.hoursAgo': '{hours}小时前',
  'relative.daysAgo': '{days}天前',

  // Host-reported failure codes.
  'error.idle': '尚未刷新',
  'error.unconfigured': '未找到 OpenCode Go API Key：请在 Web 设置 → 模型 中选择「官方渠道 · OpenCode Go」并填入 API Key',
  'error.connect': '无法连接 OpenCode 用量服务：{detail}',
  'error.timeout': '请求超时',
  'error.unauthorized': 'API Key 无效或已过期（HTTP 401/403），请检查 OPENCODE_GO_API_KEY',
  'error.http': 'OpenCode 用量服务返回 HTTP {status}',
  'error.parse': 'OpenCode 用量服务返回了无法解析的响应',
  'error.no-data': '响应中没有可用的用量数据（usage.rolling/weekly/monthly 均缺失）',

  // Dock chrome.
  'dock.title': 'OpenCode Go 用量：滚/周/月配额 + 5h 滚动重置倒计时',
  'dock.aria': 'OpenCode Go 用量',
  'dock.badgeCountdown.title': '5h 滚动窗口重置倒计时',
  'close.aria': '关闭',
  'empty.note': '用量服务未返回任何窗口数据。',
  'health.connecting': '连接中…',
  'health.live': '实时',
  'health.stale': '数据过期',
  'health.error': '异常',
  'error.connecting': '正在连接用量服务…',
  'error.fetchFailed': '用量获取失败',
  'error.connecting.detail': '如果长时间停留在该状态，请检查 dsh 服务是否运行了 dsh-opencode-go-usage 插件。',
  'error.unconfigured.hint': '配置方法：打开 Web 设置 → 模型，选择「官方渠道 · OpenCode Go」，填入 API Key 后稍候片刻即会自动生效。',
  'footer.updatedAt': '更新于 {relative}',
  'footer.staleNote': ' · 刷新失败，显示上次数据',
  'console.title': '在浏览器中打开 OpenCode Go 控制台',
  'console.label': '控制台',
  'refresh.idle': '立即刷新',
  'refresh.loading': '刷新中…',
  'row.used': '已用 {percent}%',
  'row.remaining': '剩余 {percent}%',
  'row.resetsIn': '重置于 {countdown}',
  'ring.aria': '{window}已用 {used}%，窗口剩余时间 {remaining}%',
} as const

/** The plugin-owned dictionary keys, used as the LocaleNamespaceMap entry. */
export type UsageLocaleKey = keyof typeof zh

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The usage dock's copy. */
    'opencode-usage': UsageLocaleKey
  }
}

/** `opencode-usage` namespace dictionaries. */
/** English dictionary, checked complete against the zh key set. */
export const en: Record<UsageLocaleKey, string> = {
  'window.rolling': '5h Rolling',
  'window.weekly': 'This Week',
  'window.monthly': 'This Month',

  'countdown.reset': 'Reset',
  'countdown.daysHours': '{days}d {hours}h',
  'countdown.hoursMinutes': '{hours}h {minutes}m',
  'countdown.minutesSeconds': '{minutes}m {seconds}s',
  'countdown.seconds': '{seconds}s',

  'relative.justNow': 'just now',
  'relative.secondsAgo': '{seconds}s ago',
  'relative.minutesAgo': '{minutes} min ago',
  'relative.hoursAgo': '{hours} h ago',
  'relative.daysAgo': '{days} d ago',

  'error.idle': 'Not refreshed yet',
  'error.unconfigured': 'No OpenCode Go API key found: open Web Settings → Models, choose “Official · OpenCode Go” and enter the API key',
  'error.connect': 'Cannot reach the OpenCode usage service: {detail}',
  'error.timeout': 'Request timed out',
  'error.unauthorized': 'Invalid or expired API key (HTTP 401/403); check OPENCODE_GO_API_KEY',
  'error.http': 'The OpenCode usage service returned HTTP {status}',
  'error.parse': 'The OpenCode usage service returned an unparsable response',
  'error.no-data': 'No usable usage data in the response (usage.rolling/weekly/monthly all missing)',

  'dock.title': 'OpenCode Go usage: rolling/weekly/monthly quotas + 5h rolling reset countdown',
  'dock.aria': 'OpenCode Go usage',
  'dock.badgeCountdown.title': '5h rolling window reset countdown',
  'close.aria': 'Close',
  'empty.note': 'The usage service returned no window data.',
  'health.connecting': 'Connecting…',
  'health.live': 'Live',
  'health.stale': 'Stale',
  'health.error': 'Error',
  'error.connecting': 'Connecting to the usage service…',
  'error.fetchFailed': 'Usage fetch failed',
  'error.connecting.detail': 'If this persists, check that the dsh service runs the dsh-opencode-go-usage plugin.',
  'error.unconfigured.hint': 'To configure: open Web Settings → Models, choose “Official · OpenCode Go”, enter the API key — it takes effect shortly.',
  'footer.updatedAt': 'Updated {relative}',
  'footer.staleNote': ' · Refresh failed, showing previous data',
  'console.title': 'Open the OpenCode Go console in the browser',
  'console.label': 'Console',
  'refresh.idle': 'Refresh now',
  'refresh.loading': 'Refreshing…',
  'row.used': 'Used {percent}%',
  'row.remaining': 'Remaining {percent}%',
  'row.resetsIn': 'Resets in {countdown}',
  'ring.aria': '{window}: {used}% used, {remaining}% of window remaining',
}

/** Namespace this plugin registers into the locale service. */
export const USAGE_NS = 'opencode-usage'

/**
 * Build a pure translator over one dictionary (tests, fixtures): resolves a
 * key and interpolates `{name}` placeholders. Mirrors the interpolation the
 * locale service applies on top of its lookup chain.
 * @param dict - flat key → template dictionary.
 * @returns a `t`-shaped translate function.
 */
export function createTranslator(dict: Record<string, string>): (key: string, params?: Record<string, unknown>) => string {
  return (key, params) => {
    const template = dict[key] ?? key
    if (!params) return template
    return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))
  }
}
