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
 *
 * Failures are reported as {@link OpenCodeUsageFetchError} carrying a stable
 * `code` (plus interpolation `params`) instead of a localized sentence —
 * the web client translates codes through its locale dictionary, keeping the
 * host language-agnostic.
 * @module dsh-opencode-go-usage/usage
 */
/** Recognized quota window keys, in display order. */
export const WINDOW_KEYS = ['rolling', 'weekly', 'monthly'];
/**
 * Structured fetch failure: a stable `code` for the client's locale
 * dictionary plus `params` for template interpolation. `.message` keeps a
 * technical English fallback for logs.
 */
export class OpenCodeUsageFetchError extends Error {
    /** Stable failure code understood by the web client's dictionaries. */
    code;
    /** Template parameters interpolated by the client (`{status}`, `{detail}`, ...). */
    params;
    constructor(code, params = {}, message) {
        super(message ?? code);
        this.name = 'OpenCodeUsageFetchError';
        this.code = code;
        this.params = params;
    }
}
/**
 * Fetch and validate one usage sample from the OpenCode Go quota endpoint.
 * @param endpoint - full quota URL (defaults in the plugin config).
 * @param apiKey - the Anthropic-compatible OpenCode Go API key.
 * @param timeoutMs - abort timeout for the whole request.
 * @returns the parsed windows; throws an {@link OpenCodeUsageFetchError} on any failure.
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
        const timeout = error instanceof Error && error.name === 'TimeoutError';
        throw new OpenCodeUsageFetchError(timeout ? 'timeout' : 'connect', timeout ? {} : { detail: errorMessage(error) }, error instanceof Error ? error.message : String(error));
    }
    if (response.status === 401 || response.status === 403) {
        throw new OpenCodeUsageFetchError('unauthorized', {}, `HTTP ${response.status}`);
    }
    if (!response.ok) {
        throw new OpenCodeUsageFetchError('http', { status: response.status }, `HTTP ${response.status}`);
    }
    let body;
    try {
        body = await response.json();
    }
    catch {
        throw new OpenCodeUsageFetchError('parse');
    }
    const parsed = parseUsageBody(body);
    if (parsed === undefined) {
        throw new OpenCodeUsageFetchError('no-data');
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
/** Short technical description of an unknown failure (client-visible `detail`). */
function errorMessage(error) {
    if (error instanceof Error && error.message !== '')
        return error.message;
    return String(error);
}
