# dsh-opencode-go-usage

DeepSeek Harness 的 **OpenCode Go 计划用量监控**插件：Web GUI 右下角悬浮用量坞，
实时显示 5h 滚动 / 本周 / 本月三个额度窗口的已用百分比与重置倒计时。

数据来自 OpenCode 官方配额 API（`GET https://opencode.ai/zen/go/v1/usage`，
Bearer API Key 认证，无需 workspace id、无需 Cookie）。

## 安装

```sh
dsh plugin --profile <name> add @nanmicoder/dsh-opencode-go-usage
# 或本地路径：
dsh plugin --profile <name> add /path/to/dsh-opencode-go-usage
```

安装后重启对应 profile（Web UI 即 `dsh web`）。

## 配置

插件每次刷新通过 `ctx.credentials` 解析 `apiKeyEnv` 指定的凭据引用（默认
`OPENCODE_GO_API_KEY`），把 Key 存入 `~/.dsh/.credentials.yaml` 或环境变量即可：

```yaml
- insert:
    - id: opencode-go-usage
      name: '@nanmicoder/dsh-opencode-go-usage'
      config:
        apiKeyEnv: OPENCODE_GO_API_KEY
        refreshMs: 60000
```

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `apiKeyEnv` | string | `OPENCODE_GO_API_KEY` | 凭据引用 |
| `apiKey` | string | — | 直接指定 Key（不推荐） |
| `endpoint` | string | `https://opencode.ai/zen/go/v1/usage` | 配额接口 |
| `refreshMs` | number | `60000` | 自动刷新间隔 |
| `timeoutMs` | number | `10000` | 单次请求超时 |

## 显示稳定性

数据与健康状态分离：某次刷新失败（网络超时、API 异常）时，用量坞**继续
显示上次成功获取的额度**，仅状态点转为黄色、面板底部出现一行「刷新失败，
显示上次数据」的淡提示，不打断显示；只有从未成功获取过时才显示错误/未配置
提示。

## Model Experience

### Request surface and condition

本插件不暴露任何模型可见面：模型看不到用量数值，不新增任何系统提示文本
或工具 schema。

#### Token effect

无 —— 不发起模型请求，不注入任何 token。

#### KV Cache effect

无 —— 不新增或替换任何请求 token。

## Known Limitations and Deferred Work

- **轮询延迟** —— 收起态徽章每 60 秒、展开态面板每 10 秒轮询一次，用量
  变化最多延迟一个轮询周期。
- **数据新鲜度** —— 刷新连续失败时继续显示上次成功数据，数据会随时间
  变旧，恢复后自动更新。
- **单账户** —— 每个 profile 只解析一个 API Key；多账户仪表盘不在范围内。
