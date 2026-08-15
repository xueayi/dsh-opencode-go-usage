/**
 * OpenCode Go usage types — pure types only, zero imports.
 *
 * This file intentionally imports nothing: both the host program (the
 * fetcher in `usage.ts` and the emitter in `index.ts`) and the browser
 * program (the dock model in `client/`) must be able to load these types
 * without pulling in host-side `Context` augmentations.
 * @module dsh-opencode-go-usage/types
 */
export {};
