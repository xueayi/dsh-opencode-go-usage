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
export declare const zh: {
    readonly 'window.rolling': "5h 滚动";
    readonly 'window.weekly': "本周";
    readonly 'window.monthly': "本月";
    readonly 'countdown.reset': "已重置";
    readonly 'countdown.daysHours': "{days}天{hours}小时";
    readonly 'countdown.hoursMinutes': "{hours}小时{minutes}分";
    readonly 'countdown.minutesSeconds': "{minutes}分{seconds}秒";
    readonly 'countdown.seconds': "{seconds}秒";
    readonly 'relative.justNow': "刚刚";
    readonly 'relative.secondsAgo': "{seconds}秒前";
    readonly 'relative.minutesAgo': "{minutes}分钟前";
    readonly 'relative.hoursAgo': "{hours}小时前";
    readonly 'relative.daysAgo': "{days}天前";
    readonly 'error.idle': "尚未刷新";
    readonly 'error.unconfigured': "未找到 OpenCode Go API Key：请在 Web 设置 → 模型 中选择「官方渠道 · OpenCode Go」并填入 API Key";
    readonly 'error.connect': "无法连接 OpenCode 用量服务：{detail}";
    readonly 'error.timeout': "请求超时";
    readonly 'error.unauthorized': "API Key 无效或已过期（HTTP 401/403），请检查 OPENCODE_GO_API_KEY";
    readonly 'error.http': "OpenCode 用量服务返回 HTTP {status}";
    readonly 'error.parse': "OpenCode 用量服务返回了无法解析的响应";
    readonly 'error.no-data': "响应中没有可用的用量数据（usage.rolling/weekly/monthly 均缺失）";
    readonly 'dock.title': "OpenCode Go 用量：滚/周/月配额 + 5h 滚动重置倒计时";
    readonly 'dock.aria': "OpenCode Go 用量";
    readonly 'dock.badgeCountdown.title': "5h 滚动窗口重置倒计时";
    readonly 'close.aria': "关闭";
    readonly 'empty.note': "用量服务未返回任何窗口数据。";
    readonly 'health.connecting': "连接中…";
    readonly 'health.live': "实时";
    readonly 'health.stale': "数据过期";
    readonly 'health.error': "异常";
    readonly 'error.connecting': "正在连接用量服务…";
    readonly 'error.fetchFailed': "用量获取失败";
    readonly 'error.connecting.detail': "如果长时间停留在该状态，请检查 dsh 服务是否运行了 dsh-opencode-go-usage 插件。";
    readonly 'error.unconfigured.hint': "配置方法：打开 Web 设置 → 模型，选择「官方渠道 · OpenCode Go」，填入 API Key 后稍候片刻即会自动生效。";
    readonly 'footer.updatedAt': "更新于 {relative}";
    readonly 'footer.staleNote': " · 刷新失败，显示上次数据";
    readonly 'console.title': "在浏览器中打开 OpenCode Go 控制台";
    readonly 'console.label': "控制台";
    readonly 'refresh.idle': "立即刷新";
    readonly 'refresh.loading': "刷新中…";
    readonly 'row.used': "已用 {percent}%";
    readonly 'row.remaining': "剩余 {percent}%";
    readonly 'row.resetsIn': "重置于 {countdown}";
    readonly 'ring.aria': "{window}已用 {used}%，窗口剩余时间 {remaining}%";
};
/** The plugin-owned dictionary keys, used as the LocaleNamespaceMap entry. */
export type UsageLocaleKey = keyof typeof zh;
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The usage dock's copy. */
        'opencode-usage': UsageLocaleKey;
    }
}
/** `opencode-usage` namespace dictionaries. */
/** English dictionary, checked complete against the zh key set. */
export declare const en: Record<UsageLocaleKey, string>;
/** Namespace this plugin registers into the locale service. */
export declare const USAGE_NS = "opencode-usage";
/**
 * Build a pure translator over one dictionary (tests, fixtures): resolves a
 * key and interpolates `{name}` placeholders. Mirrors the interpolation the
 * locale service applies on top of its lookup chain.
 * @param dict - flat key → template dictionary.
 * @returns a `t`-shaped translate function.
 */
export declare function createTranslator(dict: Record<string, string>): (key: string, params?: Record<string, unknown>) => string;
