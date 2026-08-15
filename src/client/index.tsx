/** Browser plugin for the OpenCode Go usage dock. */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { createRoot } from 'react-dom/client'
import { UsageDock } from './UsageDock.tsx'

/** No injected services: the dock polls the plugin's HTTP routes itself. */
export const inject: readonly string[] = []

/**
 * Mount the floating dock through a body portal (the web shell owns no
 * bottom-right slot). The dock is global — it stays available across
 * sessions — and cleans up on plugin unload.
 */
export function apply(ctx: ClientContext): void {
  const host = document.createElement('div')
  host.dataset.opencodeUsageHost = ''
  document.body.appendChild(host)
  const root = createRoot(host)
  root.render(<UsageDock />)
  ctx.effect(() => () => {
    root.unmount()
    host.remove()
  }, 'opencode-go-usage: dock')
}
