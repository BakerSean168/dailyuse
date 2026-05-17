为了方便调试，可以在本地运行docker，部署项目。 
配置docker file：docker-compose.local.yml

在这个本地配置文件中，所有业务服务（api, web, ai-service）都被强制设置为 本地构建：

```yaml
image: dailyuse-api:local
pull_policy: never
build:
  context: .
``` 

`pull_policy: never` 意味着本地开发环境压根不会去 ACR 拉取镜像，它永远只使用名为 `:local` 的本地构建镜像。

如果你想让本地环境与最新的代码/功能保持一致，你有两种做法：

推荐方案：直接拉取最新代码并重新构建
既然代码有更新且在 ACR 打包了新镜像，那么最标准的本地更新方式是把最新代码拉下来自己构建一次，这和 ACR 的结果是一样的。 在项目根目录下执行以下命令：

```bash
# 1. 拉取最新代码
git pull

# 2. 强制重新构建并启动本地环境
docker compose -f docker-compose.local.yml --env-file .env.production.local up -d --build
```

加上 `--build` 参数后，Docker 会根据最新代码重新构建 `dailyuse-api:local` 等镜像并平滑重启容器。

### 如果想看日志，直接用下命令

```bash
docker compose -f docker-compose.local.yml --env-file .env.production.local up -d
docker compose -f docker-compose.local.yml logs -f
```