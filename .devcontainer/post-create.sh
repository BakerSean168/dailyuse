#!/bin/bash
set -e

echo "🚀 DailyUse Dev Environment - Post Create Setup"
echo "================================================"

# 1. 安装 pnpm (如果未安装)
echo "📦 Installing pnpm..."
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm@10.18.3
fi

# 2. 安装项目依赖
echo "📦 Installing project dependencies..."
pnpm install --frozen-lockfile

# 3. 设置 Git 配置
echo "🔧 Configuring Git..."
git config --global core.autocrlf input
git config --global core.eol lf
git config --global pull.rebase false

# 4. 创建必要的目录
echo "📁 Creating necessary directories..."
mkdir -p apps/api/logs
mkdir -p apps/web/dist
mkdir -p apps/desktop/dist

# 4.1 如果系统没有 swap，则创建一个 2GB 的 swap 文件以缓解内存压力
echo "🛠 Checking swap..."
SWAP_TOTAL_KB=$(awk '/SwapTotal/ {print $2}' /proc/meminfo || echo 0)
if [ -z "$SWAP_TOTAL_KB" ] || [ "$SWAP_TOTAL_KB" -eq 0 ]; then
    echo "⚠️ No swap detected — creating 2GB swap at /swapfile (requires sudo)"
    SWAPFILE=/swapfile
    if [ ! -f "$SWAPFILE" ]; then
        # Try fallocate then fallback to dd
        if command -v fallocate &> /dev/null; then
            sudo fallocate -l 2G $SWAPFILE || true
        fi
        if [ ! -s $SWAPFILE ]; then
            sudo dd if=/dev/zero of=$SWAPFILE bs=1M count=2048 status=none || true
        fi
        sudo chmod 600 $SWAPFILE || true
        sudo mkswap $SWAPFILE || true
    fi
    # Enable swap (idempotent)
    if ! sudo swapon --show=NAME | grep -q "$SWAPFILE"; then
        sudo swapon $SWAPFILE || true
    fi
    # Persist across reboots (append only if not present)
    if ! grep -qF "$SWAPFILE none swap" /etc/fstab 2>/dev/null; then
        echo "$SWAPFILE none swap sw 0 0" | sudo tee -a /etc/fstab >/dev/null || true
    fi
    # Reduce swappiness slightly to avoid aggressive swapping
    sudo sysctl -w vm.swappiness=10 >/dev/null 2>&1 || true
    echo "✅ Swap enabled (if permitted)."
else
    echo "✅ Swap present: ${SWAP_TOTAL_KB} KB"
fi

# 5. 设置环境变量 (如果 .env 文件不存在)
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    fi
fi

# 6. Nx Cloud 连接（可选）
echo "☁️ Nx workspace ready"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Quick Start Commands:"
echo "  - pnpm exec nx run api:dev       # 启动 API 服务器"
echo "  - pnpm exec nx run web:dev       # 启动 Web 前端"
echo "  - pnpm exec nx graph              # 查看项目依赖图"
echo "  - pnpm exec nx affected:test      # 运行受影响的测试"
echo ""
