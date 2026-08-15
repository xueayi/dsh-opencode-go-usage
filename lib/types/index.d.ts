/**
 * OpenCode Go usage monitor for DeepSeek Harness.
 *
 * A host-plane plugin that periodically queries the official OpenCode Go
 * quota API and serves the cached sample to the browser client through two
 * web routes:
 *
 * - `GET  /plugins/dsh-opencode-go-usage/state`   — current cached sample
 * - `POST /plugins/dsh-opencode-go-usage/refresh` — force an immediate refresh
 *
 * The API key is resolved per refresh through `ctx.credentials` under the
 * configurable `apiKeyEnv` reference (env / user-env layers, e.g.
 * `~/.dsh/.credentials.yaml`), so a changed credential reaches the next
 * refresh without a restart and no secret ever appears in configuration.
 * The browser dock polls `state` and renders the three quota windows
 * (5h-rolling / weekly / monthly) as a floating, theme-aware panel.
 *
 * Installation (bundle): `dsh plugin --profile <name> add @nanmicoder/dsh-opencode-go-usage`
 * (or a local path). The bundle patch mounts this plugin row into the host
 * composition; the routes register lazily so webless profiles stay clean.
 *
 * @module dsh-opencode-go-usage
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
export declare const name = "opencode-go-usage";
export declare const inject: readonly string[];
/** Plugin configuration. */
export interface Config {
    /**
     * Credential reference resolved per refresh through `ctx.credentials`
     * (default `OPENCODE_GO_API_KEY`).
     */
    apiKeyEnv?: string;
    /** Direct API key fallback when the credential reference is unconfigured. */
    apiKey?: string;
    /** Official OpenCode Go quota endpoint (default `https://opencode.ai/zen/go/v1/usage`). */
    endpoint?: string;
    /** Auto-refresh interval in millis (default `60000`). */
    refreshMs?: number;
    /** Per-request timeout in millis (default `10000`). */
    timeoutMs?: number;
}
export declare const Config: z<Config>;
export declare function apply(ctx: Context, config: Config): void;
