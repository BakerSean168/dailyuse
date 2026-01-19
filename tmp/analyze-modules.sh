#!/bin/bash

# Story 2.6 - Batch Migration Analysis Script
# 分析所有 10 个 Web 模块的结构和依赖

MODULES=("account" "ai" "app" "authentication" "dashboard" "editor" "notification" "reminder" "repository" "setting")
WEB_MODULES_PATH="/workspaces/dailyuse/apps/web/src/modules"

echo "═══════════════════════════════════════════════════════════════"
echo "Story 2.6 - 10个Web模块迁移分析"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Function to analyze a single module
analyze_module() {
    local module=$1
    local path="$WEB_MODULES_PATH/$module"
    
    if [ ! -d "$path" ]; then
        echo "❌ 模块不存在: $module"
        return
    fi
    
    echo "📦 模块: $module"
    
    # Check subdirectories
    [ -d "$path/application" ] && echo "  ✓ application 层" || echo "  ✗ application 层"
    [ -d "$path/infrastructure" ] && echo "  ✓ infrastructure 层" || echo "  ✗ infrastructure 层"
    [ -d "$path/initialization" ] && echo "  ✓ initialization 层" || echo "  ✗ initialization 层"
    [ -d "$path/presentation" ] && echo "  ✓ presentation 层" || echo "  ✗ presentation 层"
    
    # Count files in each layer
    if [ -d "$path/application" ]; then
        app_files=$(find "$path/application" -type f | wc -l)
        echo "  📊 application 文件数: $app_files"
    fi
    
    if [ -d "$path/infrastructure" ]; then
        infra_files=$(find "$path/infrastructure" -type f | wc -l)
        echo "  📊 infrastructure 文件数: $infra_files"
    fi
    
    if [ -d "$path/presentation" ]; then
        pres_files=$(find "$path/presentation" -type f | wc -l)
        echo "  📊 presentation 文件数: $pres_files"
    fi
    
    # Check index.ts
    if [ -f "$path/index.ts" ]; then
        echo "  ✓ index.ts 存在"
    else
        echo "  ✗ index.ts 缺失"
    fi
    
    echo ""
}

# Analyze all modules
for module in "${MODULES[@]}"; do
    analyze_module "$module"
done

echo "═══════════════════════════════════════════════════════════════"
echo "分析完成"
echo "═══════════════════════════════════════════════════════════════"
