import { jsx as _jsx } from "react/jsx-runtime";
import { createRoot } from 'react-dom/client';
import { UsageDock } from "./UsageDock.js";
/** No injected services: the dock polls the plugin's HTTP routes itself. */
export const inject = [];
/**
 * Mount the floating dock through a body portal (the web shell owns no
 * bottom-right slot). The dock is global — it stays available across
 * sessions — and cleans up on plugin unload.
 */
export function apply(ctx) {
    const host = document.createElement('div');
    host.dataset.opencodeUsageHost = '';
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(_jsx(UsageDock, {}));
    ctx.effect(() => () => {
        root.unmount();
        host.remove();
    }, 'opencode-go-usage: dock');
}
