# Database Tooling

## AI Knowledge Index Smoke Check

Run the AI knowledge-index smoke check after deploying Prisma migrations:

```bash
pnpm nx run database:ai-knowledge-smoke
```

Require the optional `pgvector` path as well:

```bash
pnpm nx run database:ai-knowledge-smoke --args="--require-pgvector"
```

The command reads `DATABASE_URL`, verifies that `ai_knowledge_index_entries` exists, checks the base columns, and optionally validates the `retrieval_vector` column plus `pgvector` probe path.

For local development, `docker-compose.yml` now uses `pgvector/pgvector` images for both the dev and test Postgres services. Recreate the database container before expecting `--require-pgvector` to pass.

If your local development database already has schema state but no Prisma migration baseline, bootstrap the AI knowledge-index structures directly:

```bash
pnpm nx run database:ai-knowledge-bootstrap
```
