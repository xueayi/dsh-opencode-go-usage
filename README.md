# dsh-opencode-go-usage

OpenCode Go plan usage monitor for DeepSeek Harness: a floating dock in the
web GUI showing the 5h-rolling / weekly / monthly quota windows with live
reset countdowns.

Data comes from the official quota API
(`GET https://opencode.ai/zen/go/v1/usage`, Bearer API key; no workspace id,
no cookie).

## Install

```sh
dsh plugin --profile <name> add @nanmicoder/dsh-opencode-go-usage
# or from a local checkout:
dsh plugin --profile <name> add /path/to/dsh-opencode-go-usage
```

Restart the profile afterwards (`dsh web` for the browser UI).

## Configure

The API key is resolved per refresh through `ctx.credentials` under the
`apiKeyEnv` reference (default `OPENCODE_GO_API_KEY`) — store it in
`~/.dsh/.credentials.yaml` or an environment variable, not in config:

```yaml
- insert:
    - id: opencode-go-usage
      name: '@nanmicoder/dsh-opencode-go-usage'
      config:
        apiKeyEnv: OPENCODE_GO_API_KEY
        refreshMs: 60000
```

| Field | Type | Default | Meaning |
| --- | --- | --- | --- |
| `apiKeyEnv` | string | `OPENCODE_GO_API_KEY` | credential reference |
| `apiKey` | string | — | direct key fallback (discouraged) |
| `endpoint` | string | `https://opencode.ai/zen/go/v1/usage` | quota endpoint |
| `refreshMs` | number | `60000` | auto-refresh interval |
| `timeoutMs` | number | `10000` | per-request timeout |

## Model Experience

### Request surface and condition

The plugin exposes no model-facing surface: the model never sees quota
values, no prompt text or tool schema is added.

#### Token effect

None — no model request, no injected tokens.

#### KV Cache effect

None — no request tokens added or replaced.

## Known Limitations and Deferred Work

- **Poll latency** — the collapsed badge polls every 60s, the open panel
  every 10s; quota changes appear within at most one poll cycle.
- **Single account** — one API key per profile; multi-account dashboards are
  out of scope.
