#!/bin/sh
# Database Migration Runner
# Ensures DATABASE_URL is properly set before running Prisma migrations
# 
# Usage:
#   docker exec dailyuse-prod-api ./scripts/run-migrations.sh
#   docker exec dailyuse-prod-api ./scripts/run-migrations.sh --verbose
#
# This script will:
#   1. Verify DATABASE_URL is set (from docker-compose env or fallback to DB_* vars)
#   2. Display connection details for debugging
#   3. Run Prisma migrations
#   4. Report success/failure

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "${BLUE}================================${NC}"
echo "${BLUE}Prisma Database Migration Tool${NC}"
echo "${BLUE}================================${NC}"
echo ""

# Step 1: Verify DATABASE_URL is available
echo "${YELLOW}Step 1: Checking DATABASE_URL...${NC}"

if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "undefined" ]; then
  echo "${YELLOW}⚠️  DATABASE_URL not explicitly set, generating from DB_* variables...${NC}"
  
  # Verify required DB_* variables
  if [ -z "$DB_HOST" ]; then
    echo "${RED}❌ Error: DATABASE_URL and DB_HOST not set${NC}"
    echo "${RED}   Please ensure .env file is loaded with database configuration${NC}"
    exit 1
  fi
  
  DB_USER=${DB_USER:-dailyuse}
  DB_PORT=${DB_PORT:-5432}
  DB_NAME=${DB_NAME:-dailyuse}

  export DATABASE_URL=$(
    node -e "const username = encodeURIComponent(process.env.DB_USER || 'dailyuse'); const password = process.env.DB_PASSWORD ? ':' + encodeURIComponent(process.env.DB_PASSWORD) : ''; const host = process.env.DB_HOST; const port = process.env.DB_PORT || '5432'; const database = encodeURIComponent(process.env.DB_NAME || 'dailyuse'); process.stdout.write(\`postgresql://\${username}\${password}@\${host}:\${port}/\${database}?schema=public\`);"
  )
  echo "${GREEN}✅ Generated DATABASE_URL from DB_* variables${NC}"
else
  echo "${GREEN}✅ DATABASE_URL is set${NC}"
fi

# Step 2: Extract and display connection details (without exposing password)
echo ""
echo "${YELLOW}Step 2: Connection Details${NC}"
echo "   ${BLUE}Host:${NC} $(echo $DATABASE_URL | sed 's/.*@\([^:]*\).*/\1/')"
echo "   ${BLUE}Port:${NC} $(echo $DATABASE_URL | sed 's/.*:\([0-9]*\).*/\1/')"
echo "   ${BLUE}Database:${NC} $(echo $DATABASE_URL | sed 's/.*\/\([^?]*\).*/\1/')"
echo "   ${BLUE}User:${NC} $DB_USER"
echo ""

# Step 3: Wait for database to be ready (optional, but recommended)
echo "${YELLOW}Step 3: Waiting for database to be ready...${NC}"
if command -v pg_isready > /dev/null 2>&1; then
  # Extract host and port from DATABASE_URL
  DB_HOST_CHECK=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
  DB_PORT_CHECK=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\).*/\1/p')
  
  # Wait max 30 seconds for database to be ready
  RETRY_COUNT=0
  MAX_RETRIES=30
  
  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if pg_isready -h "$DB_HOST_CHECK" -p "$DB_PORT_CHECK" -U "$DB_USER" > /dev/null 2>&1; then
      echo "${GREEN}✅ Database is ready${NC}"
      break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
      echo "${RED}❌ Database not ready after ${MAX_RETRIES} seconds${NC}"
      echo "${RED}   Check PostgreSQL container status: docker logs dailyuse-prod-db${NC}"
      exit 1
    fi
    
    echo "   Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 1
  done
else
  echo "   ${YELLOW}⚠️  pg_isready not available, skipping readiness check${NC}"
fi

# Step 4: Run Prisma migrations
echo ""
echo "${YELLOW}Step 4: Initializing database schema${NC}"
echo ""

cd /app

has_prisma_migration_dirs() {
  [ -d "packages/database/prisma/migrations" ] || return 1

  find "packages/database/prisma/migrations" \
    -mindepth 2 \
    -maxdepth 2 \
    -type f \
    -name "migration.sql" \
    -print \
    -quit | grep -q .
}

if has_prisma_migration_dirs; then
  echo "   Command: /app/node_modules/.bin/prisma migrate deploy --config ./prisma/prisma.config.ts"
  echo ""
  MIGRATION_RESULT=0
  MIGRATION_OUTPUT=$(cd /app/packages/database && /app/node_modules/.bin/prisma migrate deploy --config ./prisma/prisma.config.ts 2>&1) || MIGRATION_RESULT=$?
else
  echo "${YELLOW}⚠️  No Prisma migration directories found, falling back to schema push${NC}"
  echo "   Preparing editor workspace natural key before schema push"
  echo "   Command: /app/node_modules/.bin/tsx ./scripts/prepare-editor-workspace-natural-key.ts"
  echo ""
  (cd /app/packages/database && /app/node_modules/.bin/tsx ./scripts/prepare-editor-workspace-natural-key.ts)
  echo ""
  echo "   Command: /app/node_modules/.bin/prisma db push --config ./prisma/prisma.config.ts"
  echo ""
  MIGRATION_RESULT=0
  MIGRATION_OUTPUT=$(cd /app/packages/database && /app/node_modules/.bin/prisma db push --config ./prisma/prisma.config.ts 2>&1) || MIGRATION_RESULT=$?
fi

echo "$MIGRATION_OUTPUT"

[ $MIGRATION_RESULT -ne 0 ] && exit $MIGRATION_RESULT

echo ""
echo "${GREEN}✅ Database schema initialized successfully${NC}"

# Step 5: Bootstrap and verify the AI knowledge-index schema.
# Bootstrap is intentionally idempotent; the required smoke check must fail the
# container before the API process starts if pgvector or any retrieval structure
# is unavailable.
echo ""
echo "${YELLOW}Step 5: Bootstrapping AI knowledge index${NC}"
echo "   Command: /app/node_modules/.bin/tsx ./scripts/bootstrap-ai-knowledge-index.ts"
echo ""

cd /app/packages/database
/app/node_modules/.bin/tsx ./scripts/bootstrap-ai-knowledge-index.ts

echo ""
echo "${YELLOW}Step 6: Verifying required AI knowledge-index structures${NC}"
echo "   Command: /app/node_modules/.bin/tsx ./scripts/verify-ai-knowledge-index.ts --require-pgvector"
echo ""

/app/node_modules/.bin/tsx ./scripts/verify-ai-knowledge-index.ts --require-pgvector

echo ""
echo "${GREEN}✅ AI knowledge index initialized and verified successfully${NC}"
