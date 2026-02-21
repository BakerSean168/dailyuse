# @dailyuse/web

## 指令

使用了 Nx 来管理项目任务，具体配置查看 project.json 配置文件

为了方便在不同环境下启动 configurations 字段配置了参数。Nx 通过 -c (或 --configuration) 参数来指定运行哪个配置。

目前可以使用以下命令：

1. 启动本地开发服务 (Serve)

默认 (加载 .env.development): nx serve web

指定 Staging 环境 (加载 .env.staging): nx serve web -c staging
(注意：如果在 staging 模式下你不想走代理，而是直接请求线上接口，Vite 的 mode 就会变成 staging，你的 needProxy 就会是 false，这符合逻辑。)

2. 打包构建 (Build)

默认构建: nx build web
构建 Staging 产物 (加载 .env.staging): nx build web -c staging
构建 Production 产物 (加载 .env.production): nx build web -c production