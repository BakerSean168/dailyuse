# Contract Tests

`apps/web/src/mocks/handlers/*.spec.ts` 用于覆盖 adapter、mock route 和 contracts schema 之间的最小契约闭环。

当前约定：

- 先断言 adapter 实际发出的 `URL`、`method`、`query/body` 字段名。
- 再用 contracts 导出的 schema 做 smoke parse，确保关键请求和响应 shape 没漂移。
- 对关键边界额外补 route/OpenAPI registry smoke test，直接检查已注册路径和 request schema。
- 共享工具统一放在 `apps/web/src/mocks/handlers/_shared/contract-test-helpers.ts`，避免每个模块重复手写 http spy 和 schema 断言。

新增接口时至少补下面三类断言中的两类，关键链路建议三类都补：

- adapter 请求路径和参数拼装正确
- mock handler 路由前缀与正式接口一致
- contracts schema 能接受 adapter 发出的请求，并能解析 mock/fixture 响应
- route 注册结果包含预期路径，且 request schema 能拒绝旧字段名/错误 shape
