# 🔧 故障排除

**预计耗时**：因问题而异  
**适合**：遇到部署问题的所有人员

---

## 🎯 问题快速定位

| 症状 | 可能原因 | 检查命令 |
|------|--------|--------|
| "镜像拉取超时" | 网络问题 / 镜像不存在 | `docker pull crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/Memoflow-api:latest` |
| "容器立即退出" | 环境变量缺失 / 编译错误 | `docker-compose logs api` |
| "连接拒绝" | 端口被占用 / 防火墙阻止 | `netstat -tuln \| grep 3000` |
| "无法连接数据库" | DB 容器未启动 / 密码错误 | `docker-compose logs postgres` |
| "CORS 错误" | 域名配置错误 | 见下面的 "CORS 错误" 部分 |

---

## 🚨 常见错误及解决方案

### 1. Docker 镜像问题

#### 错误：`ImagePullBackOff`
```
Error response from daemon: pull access denied, repository does not exist
```

**解决步骤：**
```bash
# 1. 确认镜像存在
curl -u username:password https://crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/v2/bakersean/Memoflow-api/tags/list

# 2. 重新登录
docker logout
docker login crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com
# 输入正确的用户名和密码

# 3. 重新拉取
docker pull crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/Memoflow-api:latest

# 4. 重启容器
docker-compose down
docker-compose up -d
```

#### 错误：`manifest not found`
```
Error: manifest for Memoflow-api:v1.0.3 not found
```

**解决步骤：**
```bash
# 1. 检查可用标签
docker search crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/Memoflow-api

# 2. 使用 latest 标签
docker pull crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/Memoflow-api:latest

# 3. 更新 docker-compose.yml 中的镜像版本
sed -i 's/Memoflow-api:v[0-9.]*$/Memoflow-api:latest/' docker-compose.yml
```

---

### 2. 容器启动问题

#### 错误：`Container exits immediately`

**诊断：**
```bash
# 查看退出原因
docker-compose logs api | tail -100

# 查看最后一次启动尝试
docker-compose ps -a
```

**常见原因和解决：**

| 原因 | 日志信息 | 解决方案 |
|------|--------|--------|
| 环境变量缺失 | `Error: DATABASE_URL is required` | 检查 .env 文件：`cat .env \| grep DATABASE_URL` |
| TypeScript 编译错误 | `Cannot find module` | 重建镜像：`docker-compose down && docker pull ... && docker-compose up -d` |
| 端口被占用 | `listen EADDRINUSE` | 释放端口：`sudo lsof -i :3000 \| kill -9` |
| 权限问题 | `EACCES: permission denied` | 检查文件权限：`ls -la /opt/memoflow/` |

**解决步骤：**
```bash
# 1. 查看完整日志
docker-compose logs api --tail=200

# 2. 重新检查环境变量
cat /opt/memoflow/.env
# 确保所有必需变量存在

# 3. 重启容器
docker-compose restart api

# 4. 检查启动状态
docker-compose ps
```

---

### 3. 数据库连接问题

#### 错误：`Error: connect ECONNREFUSED`

```bash
# 1. 检查 PostgreSQL 容器是否运行
docker-compose ps postgres
# 应该显示 "Up (healthy)"

# 2. 查看 PostgreSQL 日志
docker-compose logs postgres | tail -50

# 3. 测试连接
docker exec Memoflow-api psql \
  postgresql://postgres:password@postgres:5432/Memoflow \
  -c "SELECT 1"

# 4. 如果容器不健康，重启
docker-compose down
docker-compose up -d
sleep 30
docker-compose logs postgres
```

#### 错误：`database "Memoflow" does not exist`

```bash
# 1. 连接到 PostgreSQL 并创建数据库
docker exec -it Memoflow-postgres psql -U postgres

# 在 psql 中执行：
CREATE DATABASE Memoflow OWNER postgres;
\q

# 2. 或者直接运行
docker exec Memoflow-postgres createdb -U postgres Memoflow

# 3. 验证数据库创建
docker exec Memoflow-postgres psql -U postgres -l | grep Memoflow
```

#### 错误：`FATAL: password authentication failed`

```bash
# 1. 检查 .env 中的密码配置
grep DATABASE_PASSWORD /opt/memoflow/.env

# 2. 重置密码（需要重启容器）
docker-compose down
rm -rf data/postgres/*
docker-compose up -d postgres
sleep 10

# 3. 设置新密码
docker exec Memoflow-postgres psql -U postgres -c "ALTER USER postgres PASSWORD 'new_password';"

# 4. 更新 .env
sed -i 's/DATABASE_PASSWORD=.*/DATABASE_PASSWORD=new_password/' /opt/memoflow/.env

# 5. 重启 API 服务
docker-compose down
docker-compose up -d
```

---

### 4. Redis 连接问题

#### 错误：`Error: connect ECONNREFUSED [::1]:6379`

```bash
# 1. 检查 Redis 容器
docker-compose ps redis

# 2. 查看日志
docker-compose logs redis

# 3. 测试连接
docker exec Memoflow-api redis-cli -h redis ping
# 预期：PONG

# 4. 重启 Redis
docker-compose restart redis

# 5. 检查 Redis 数据
docker exec Memoflow-redis redis-cli DBSIZE
docker exec Memoflow-redis redis-cli KEYS '*'
```

---

### 5. CORS 错误

#### 错误：`Access to XMLHttpRequest has been blocked by CORS policy`

**问题诊断：**
```bash
# 1. 检查请求源
curl -i -H "Origin: https://yourdomain.com" http://localhost:3000/api/health

# 2. 查看响应头
curl -v -H "Origin: https://yourdomain.com" http://localhost:3000/api/health
# 查找：Access-Control-Allow-Origin, Access-Control-Allow-Credentials

# 3. 检查 .env 中的 CORS 配置
grep CORS /opt/memoflow/.env
```

**常见 CORS 问题和解决：**

| 问题 | 原因 | 解决方案 |
|------|------|--------|
| CORS 被完全阻止 | `CORS_ORIGIN` 未配置 | 见下面的 "CORS 配置修复" |
| `credentials` 错误 | `credentials: true` + `CORS_ORIGIN: *` | 在 .env 中设置具体域名 |
| 预检请求失败 | OPTIONS 请求被拒绝 | 确保 OPTIONS 方法在中间件中启用 |

**CORS 配置修复：**
```bash
# 1. 备份原配置
cp /opt/memoflow/.env /opt/memoflow/.env.bak

# 2. 更新 CORS 配置（选择一个方案）

# 方案 A：生产环境（具体域名）
sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com|" /opt/memoflow/.env

# 方案 B：开发环境（任何源）
sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=*|" /opt/memoflow/.env
sed -i "s|CORS_CREDENTIALS=.*|CORS_CREDENTIALS=false|" /opt/memoflow/.env

# 3. 重启 API 服务
docker-compose restart api

# 4. 验证 CORS 配置
docker-compose logs api | grep CORS

# 5. 测试 CORS
curl -i -H "Origin: https://yourdomain.com" http://localhost:3000/api/health
# 查看返回头中的 Access-Control-Allow-Origin
```

**在浏览器中测试：**
```javascript
// 打开浏览器控制台，运行：
fetch('http://localhost:3000/api/health', {
  method: 'GET',
  credentials: 'include'  // 如果需要 cookie
})
  .then(r => r.json())
  .then(d => console.log('✅ CORS OK:', d))
  .catch(e => console.error('❌ CORS Error:', e.message))
```

---

### 6. 端口被占用

#### 错误：`bind: address already in use`

```bash
# 1. 找出占用端口的进程
lsof -i :3000
# 或者
netstat -tuln | grep 3000

# 2. 杀死进程
kill -9 <PID>
# 或者
sudo fuser -k 3000/tcp

# 3. 更改端口（如无法释放原端口）
# 编辑 .env
sed -i 's/API_PORT=3000/API_PORT=3001/' /opt/memoflow/.env

# 4. 重启容器
docker-compose down
docker-compose up -d

# 5. 更新 Nginx 配置指向新端口
```

---

### 7. 内存/磁盘问题

#### 错误：`Cannot allocate memory` / `No space left on device`

```bash
# 1. 检查磁盘空间
df -h
# 如果根目录 < 10%，需要清理

# 2. 检查 Docker 磁盘使用
docker system df
docker image ls
docker container ls -a

# 3. 清理无用镜像和容器
docker image prune -a --force
docker container prune --force
docker volume prune --force

# 4. 清理日志
docker exec Memoflow-api truncate -s 0 /var/log/app.log

# 5. 重启 Docker
systemctl restart docker
```

---

## 🔍 诊断工具和命令

### 完整诊断脚本
```bash
#!/bin/bash
echo "=== Memoflow Deployment Diagnostic ==="

echo -e "\n1. Docker 状态"
docker --version
docker ps
docker system df

echo -e "\n2. 容器状态"
docker-compose ps
docker-compose logs api | tail -20

echo -e "\n3. 网络连通性"
docker exec Memoflow-api ping postgres -c 1
docker exec Memoflow-api ping redis -c 1
docker exec Memoflow-api curl -s http://localhost:3000/healthz | jq .

echo -e "\n4. 环境配置"
grep -E "^(NODE_ENV|API_PORT|DATABASE_|CORS_|JWT_)" /opt/memoflow/.env

echo -e "\n5. 磁盘和内存"
df -h /opt/Memoflow
docker stats --no-stream

echo -e "\n6. 防火墙规则"
sudo ufw status | grep "3000\|80\|443"

echo "=== 诊断完成 ==="
```

**保存并运行：**
```bash
cat > /opt/memoflow/diagnose.sh << 'EOF'
# 上面的脚本内容
EOF

chmod +x /opt/memoflow/diagnose.sh
./diagnose.sh
```

---

## 🆘 获取更多帮助

1. **查看详细日志**
   ```bash
   docker-compose logs api --tail=500
   docker-compose logs postgres --tail=100
   ```

2. **进入容器调试**
   ```bash
   docker exec -it Memoflow-api /bin/bash
   # 然后可以运行命令进行调试
   ```

3. **检查关键文件**
   ```bash
   cat /opt/memoflow/.env
   cat /opt/memoflow/docker-compose.prod.yml
   ls -la /opt/memoflow/data/
   ```

4. **查看完整指南**
   - [01-quick-start.md](01-quick-start.md) - 快速启动
   - [02-build.md](02-build.md) - 镜像构建
   - [03-deploy.md](03-deploy.md) - 部署流程
   - [04-verify.md](04-verify.md) - 验证步骤
   - [README.md](README.md) - 导航中心

---

## 📝 日志位置参考

| 日志类型 | 位置 | 查看命令 |
|--------|------|--------|
| API 应用日志 | `/opt/memoflow/logs/api/` | `docker-compose logs api` |
| PostgreSQL 日志 | 容器日志 | `docker-compose logs postgres` |
| Redis 日志 | 容器日志 | `docker-compose logs redis` |
| Nginx 日志 | `/var/log/nginx/Memoflow.*.log` | `tail -f /var/log/nginx/Memoflow.access.log` |
| Docker 系统日志 | `/var/log/docker.log` | `journalctl -u docker` |

---

**遇到未列出的问题？** 检查：
1. 容器日志：`docker-compose logs [service-name]`
2. 系统日志：`journalctl -xe`
3. Docker 日志：`docker logs [container-id]`

