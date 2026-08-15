/** Browser plugin for the OpenCode Go usage dock. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/** No injected services: the dock polls the plugin's HTTP routes itself. */
export declare const inject: readonly string[];
/**
 * Mount the floating dock through a body portal (the web shell owns no
 * bottom-right slot). The dock is global — it stays available across
 * sessions — and cleans up on plugin unload.
 */
export declare function apply(ctx: ClientContext): void;
