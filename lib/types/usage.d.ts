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
import type { OpenCodeUsageData, OpenCodeUsageErrorCode } from './types.ts';
/** Recognized quota window keys, in display order. */
export declare const WINDOW_KEYS: readonly ["rolling", "weekly", "monthly"];
/**
 * Structured fetch failure: a stable `code` for the client's locale
 * dictionary plus `params` for template interpolation. `.message` keeps a
 * technical English fallback for logs.
 */
export declare class OpenCodeUsageFetchError extends Error {
    /** Stable failure code understood by the web client's dictionaries. */
    readonly code: OpenCodeUsageErrorCode;
    /** Template parameters interpolated by the client (`{status}`, `{detail}`, ...). */
    readonly params: Record<string, string | number>;
    constructor(code: OpenCodeUsageErrorCode, params?: Record<string, string | number>, message?: string);
}
/**
 * Fetch and validate one usage sample from the OpenCode Go quota endpoint.
 * @param endpoint - full quota URL (defaults in the plugin config).
 * @param apiKey - the Anthropic-compatible OpenCode Go API key.
 * @param timeoutMs - abort timeout for the whole request.
 * @returns the parsed windows; throws an {@link OpenCodeUsageFetchError} on any failure.
 */
export declare function fetchOpenCodeUsage(endpoint: string, apiKey: string, timeoutMs: number): Promise<OpenCodeUsageData>;
/**
 * Normalize a `/v1/usage` response body into window records.
 * @param body - parsed JSON payload.
 * @returns the recognized windows, or `undefined` when none are usable.
 */
export declare function parseUsageBody(body: unknown): OpenCodeUsageData | undefined;
