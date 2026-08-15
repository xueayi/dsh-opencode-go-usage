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
 * Installation (bundle): `dsh plugin --profile <name> add @xueayi/dsh-opencode-go-usage`
 * (or a local path). The bundle patch mounts this plugin row into the host
 * composition; the routes register lazily so webless profiles stay clean.
 *
 * @module dsh-opencode-go-usage
 */
import z from '@deepseek-ai/schemastery';
import { credentialRef } from '@deepseek-ai/dsh-credentials';
import { fetchOpenCodeUsage } from "./usage.js";
/** Web-server service key candidates, newest first. */
const WEB_SERVER_KEYS = ['webServer', 'httpServer'];
export const name = 'opencode-go-usage';
export const inject = [];
export const Config = z.object({
    apiKeyEnv: z.string().default('OPENCODE_GO_API_KEY'),
    apiKey: z.string(),
    endpoint: z.string().default('https://opencode.ai/zen/go/v1/usage'),
    refreshMs: z.natural().min(10_000).default(60_000),
    timeoutMs: z.natural().min(1_000).default(10_000),
});
/** Resolve the API key for one refresh: direct config, then credentials. */
async function resolveApiKey(ctx, config) {
    if (config.apiKey !== undefined && config.apiKey !== '')
        return config.apiKey;
    const credentials = ctx.get('credentials');
    if (credentials === undefined)
        return undefined;
    const resolved = await credentials.resolve(credentialRef(config.apiKeyEnv ?? 'OPENCODE_GO_API_KEY'));
    return resolved?.value;
}
export function apply(ctx, config) {
    const endpoint = config.endpoint ?? 'https://opencode.ai/zen/go/v1/usage';
    const timeoutMs = config.timeoutMs ?? 10_000;
    /** Last successful sample; kept across failed refreshes so the UI stays stable. */
    let lastGood = null;
    /** Health of the most recent refresh attempt. */
    let health = {
        status: 'unconfigured',
        fetchedAt: 0,
        error: '尚未刷新',
    };
    /** In-flight refresh, so concurrent triggers share one request. */
    let refreshing = null;
    /** Assemble the state served to the web client from data + health. */
    const buildState = () => ({
        ...(lastGood !== null ? { usage: lastGood.usage, usageFetchedAt: lastGood.fetchedAt } : {}),
        health,
    });
    /** Run one refresh and publish its sample; concurrent calls coalesce. */
    const refresh = () => {
        if (refreshing !== null)
            return refreshing;
        refreshing = (async () => {
            const fetchedAt = Date.now();
            const apiKey = await resolveApiKey(ctx, config);
            if (apiKey === undefined) {
                health = {
                    status: 'unconfigured',
                    fetchedAt,
                    error: '未找到 OpenCode Go API Key：请在 Web 设置 → 模型 中选择「官方渠道 · OpenCode Go」并填入 API Key',
                };
                return buildState();
            }
            try {
                const usage = await fetchOpenCodeUsage(endpoint, apiKey, timeoutMs);
                lastGood = { usage, fetchedAt };
                health = { status: 'ok', fetchedAt };
            }
            catch (error) {
                // Silent degradation: keep showing the last successful sample; only
                // the health record changes (debug-level log, no user-facing noise).
                health = {
                    status: 'error',
                    fetchedAt,
                    error: error instanceof Error ? error.message : String(error),
                };
                ctx.logger.debug(`opencode-go-usage: refresh failed: ${health.error}`);
            }
            return buildState();
        })().then((next) => next).finally(() => {
            refreshing = null;
        });
        return refreshing;
    };
    // Refresh immediately on mount and then on the configured interval.
    void refresh();
    const timer = globalThis.setInterval(() => {
        void refresh();
    }, config.refreshMs ?? 60_000);
    ctx.effect(() => () => {
        globalThis.clearInterval(timer);
    }, 'opencode-go-usage: refresh timer');
    /** Send one JSON state payload with no-store caching. */
    const sendJson = (res, payload, status = 200) => {
        const body = JSON.stringify(payload);
        res.writeHead(status, {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
        });
        res.end(body);
    };
    // The web server may bind after this plugin under concurrent activation;
    // register the routes lazily, now and on each service binding event.
    let webRegistered = false;
    const registerWebSurface = () => {
        if (webRegistered)
            return;
        const webServer = (ctx.get(WEB_SERVER_KEYS[0]) ?? ctx.get(WEB_SERVER_KEYS[1]));
        if (webServer === undefined)
            return;
        webRegistered = true;
        ctx.effect(() => webServer.register({
            kind: 'exact',
            path: '/plugins/dsh-opencode-go-usage/state',
            handler: (_req, res) => {
                sendJson(res, buildState());
            },
        }), 'opencode-go-usage: state route');
        ctx.effect(() => webServer.register({
            kind: 'exact',
            path: '/plugins/dsh-opencode-go-usage/refresh',
            handler: async (_req, res) => {
                try {
                    sendJson(res, await refresh());
                }
                catch (error) {
                    // Last-resort guard: refresh() itself never throws (failures land in
                    // health), so this only fires on unexpected internal errors.
                    ctx.logger.warn(`opencode-go-usage: refresh crashed: ${String(error)}`);
                    sendJson(res, buildState(), 500);
                }
            },
        }), 'opencode-go-usage: refresh route');
    };
    registerWebSurface();
    ctx.on('internal/service', (serviceName) => {
        if (WEB_SERVER_KEYS.includes(serviceName)) {
            registerWebSurface();
        }
    });
}
