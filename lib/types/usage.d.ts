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
import type { OpenCodeUsageData } from './types.ts';
/** Recognized quota window keys, in display order. */
export declare const WINDOW_KEYS: readonly ["rolling", "weekly", "monthly"];
/**
 * Fetch and validate one usage sample from the OpenCode Go quota endpoint.
 * @param endpoint - full quota URL (defaults in the plugin config).
 * @param apiKey - the Anthropic-compatible OpenCode Go API key.
 * @param timeoutMs - abort timeout for the whole request.
 * @returns the parsed windows; throws a user-facing `Error` on any failure.
 */
export declare function fetchOpenCodeUsage(endpoint: string, apiKey: string, timeoutMs: number): Promise<OpenCodeUsageData>;
/**
 * Normalize a `/v1/usage` response body into window records.
 * @param body - parsed JSON payload.
 * @returns the recognized windows, or `undefined` when none are usable.
 */
export declare function parseUsageBody(body: unknown): OpenCodeUsageData | undefined;
