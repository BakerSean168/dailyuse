#!/bin/bash

# Story 2.6 - Batch Migration Script for All Remaining Modules
# Automates the bridge pattern migration for all Web modules

set -e

WEB_PATH="/workspaces/dailyuse/apps/web/src/modules"
MODULES=("authentication" "dashboard" "editor" "notification" "reminder" "repository" "setting")

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Batch Migration: Remaining 7 Modules (Groups B & C)       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

migrate_module() {
    local module=$1
    local module_path="$WEB_PATH/$module"
    
    echo "📦 Processing module: $module"
    
    if [ ! -d "$module_path" ]; then
        echo "  ❌ Module directory not found"
        return 1
    fi
    
    # Delete old application files
    if [ -d "$module_path/application" ]; then
        find "$module_path/application" -type d ! -name application ! -name "." -exec rm -rf {} + 2>/dev/null || true
        echo "  ✓ Deleted application layer files"
    fi
    
    # Delete old infrastructure files
    if [ -d "$module_path/infrastructure" ]; then
        find "$module_path/infrastructure" -type d ! -name infrastructure ! -name "." -exec rm -rf {} + 2>/dev/null || true
        echo "  ✓ Deleted infrastructure layer files"
    fi
    
    echo "  ✅ Module $module completed"
    echo ""
}

# Process each module
for module in "${MODULES[@]}"; do
    migrate_module "$module"
done

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              Batch Deletion Complete                          ║"
echo "║                                                                ║"
echo "║  Next steps:                                                   ║"
echo "║  1. Create bridge index.ts files for application layer        ║"
echo "║  2. Create bridge index.ts files for infrastructure layer     ║"
echo "║  3. Update initialization layer imports                       ║"
echo "║  4. Run verification tests                                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
