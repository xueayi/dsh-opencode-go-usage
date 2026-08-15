/**
 * OpenCode Go usage API client.
 *
 * The official quota endpoint is
 * `GET https://opencode.ai/zen/go/v1/usage` authenticated with the regular
 * Anthropic-compatible API key (`Authorization: Bearer <key>`); no workspace
 * id or web-session cookie is required. The response shape is:
 *
 * ```json
 * {
 *   "usage": {
 *     "rolling": { "status": "ok", "percent": 4,  "resetsAt": "..." },
 *     "weekly":  { "status": "ok", "percent": 3,  "resetsAt": "..." },
 *     "monthly": { "status": "ok", "percent": 1,  "resetsAt": "..." }
 *   }
 * }
 * ```
 *
 * Unknown fields are tolerated (the API may grow), but a body without any
 * recognizable window is rejected loudly so a silently-broken monitor never
 * masquerades as a healthy one.
 * @module dsh-opencode-go-usage/usage
 */
/** Recognized quota window keys, in display order. */
export const WINDOW_KEYS = ['rolling', 'weekly', 'monthly'];
/**
 * Fetch and validate one usage sample from the OpenCode Go quota endpoint.
 * @param endpoint - full quota URL (defaults in the plugin config).
 * @param apiKey - the Anthropic-compatible OpenCode Go API key.
 * @param timeoutMs - abort timeout for the whole request.
 * @returns the parsed windows; throws a user-facing `Error` on any failure.
 */
export async function fetchOpenCodeUsage(endpoint, apiKey, timeoutMs) {
    let response;
    try {
        response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: 'application/json',
                'User-Agent': 'dsh-opencode-go-usage/1.0',
            },
            signal: AbortSignal.timeout(timeoutMs),
        });
    }
    catch (error) {
        throw new Error(`无法连接 OpenCode 用量服务：${errorMessage(error)}`);
    }
    if (response.status === 401 || response.status === 403) {
        throw new Error('API Key 无效或已过期（HTTP 401/403），请检查 OPENCODE_GO_API_KEY');
    }
    if (!response.ok) {
        throw new Error(`OpenCode 用量服务返回 HTTP ${response.status}`);
    }
    let body;
    try {
        body = await response.json();
    }
    catch {
        throw new Error('OpenCode 用量服务返回了无法解析的响应');
    }
    const parsed = parseUsageBody(body);
    if (parsed === undefined) {
        throw new Error('响应中没有可用的用量数据（usage.rolling/weekly/monthly 均缺失）');
    }
    return parsed;
}
/**
 * Normalize a `/v1/usage` response body into window records.
 * @param body - parsed JSON payload.
 * @returns the recognized windows, or `undefined` when none are usable.
 */
export function parseUsageBody(body) {
    if (typeof body !== 'object' || body === null)
        return undefined;
    const usage = body.usage;
    if (typeof usage !== 'object' || usage === null)
        return undefined;
    const record = usage;
    const out = {};
    for (const key of WINDOW_KEYS) {
        const window = parseWindow(record[key]);
        if (window !== undefined)
            out[key] = window;
    }
    return out.rolling !== undefined || out.weekly !== undefined || out.monthly !== undefined
        ? out
        : undefined;
}
/** Validate one window record; returns `undefined` when malformed. */
function parseWindow(value) {
    if (typeof value !== 'object' || value === null)
        return undefined;
    const record = value;
    if (typeof record.percent !== 'number' || typeof record.resetsAt !== 'string')
        return undefined;
    return {
        status: typeof record.status === 'string' ? record.status : 'ok',
        percent: record.percent,
        resetsAt: record.resetsAt,
    };
}
/** Human-readable message for an unknown failure. */
function errorMessage(error) {
    if (error instanceof Error && error.name === 'TimeoutError')
        return '请求超时';
    if (error instanceof Error && error.message !== '')
        return error.message;
    return String(error);
}
