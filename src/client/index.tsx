/** Browser plugin for the OpenCode Go usage dock. */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { createRoot } from 'react-dom/client'
import { UsageDock } from './UsageDock.tsx'
import { USAGE_NS, zh, en } from './locales.ts'

/** The dock needs the locale service (dictionaries + active-language watch). */
export const inject: readonly string[] = ['locale']

/**
 * Mount the floating dock through a body portal (the web shell owns no
 * bottom-right slot). Registers the plugin's locale dictionaries with the
 * locale service, binds the typed translator, and hands both to the dock so
 * it follows dsh's active language (locale.preference → browser fallback)
 * and re-renders in place on a switch. The dock is global — it stays
 * available across sessions — and cleans up on plugin unload.
 */
export function apply(ctx: ClientContext): void {
  // Register before the first render so the bound translator (and the
  // initial frame) resolve against the complete dictionary.
  ctx.effect(() => ctx.locale.register(USAGE_NS, { zh, en }), 'opencode-go-usage: dictionaries')
  const t = ctx.locale.bind(USAGE_NS)

  const host = document.createElement('div')
  host.dataset.opencodeUsageHost = ''
  document.body.appendChild(host)
  const root = createRoot(host)
  root.render(<UsageDock t={t} locale={ctx.locale} />)
  ctx.effect(() => () => {
    root.unmount()
    host.remove()
  }, 'opencode-go-usage: dock')
}
