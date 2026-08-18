/** Browser plugin for the OpenCode Go usage dock. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/** The dock needs the locale service (dictionaries + active-language watch). */
export declare const inject: readonly string[];
/**
 * Mount the floating dock through a body portal (the web shell owns no
 * bottom-right slot). Registers the plugin's locale dictionaries with the
 * locale service, binds the typed translator, and hands both to the dock so
 * it follows dsh's active language (locale.preference → browser fallback)
 * and re-renders in place on a switch. The dock is global — it stays
 * available across sessions — and cleans up on plugin unload.
 */
export declare function apply(ctx: ClientContext): void;
