-- CreateTable
CREATE TABLE "rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "deprecationReason" TEXT,
    "replacementRuleId" TEXT,
    "liveReferenceLocation" TEXT,
    "tags" TEXT NOT NULL,
    "goodExamples" TEXT NOT NULL,
    "badExamples" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rules_replacementRuleId_fkey" FOREIGN KEY ("replacementRuleId") REFERENCES "rules" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rule_revisions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "authorId" TEXT NOT NULL,
    "changedFields" TEXT NOT NULL,
    "previousValues" TEXT,
    "newValues" TEXT,
    "changeType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rule_revisions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "rules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "rules_code_key" ON "rules"("code");

-- CreateIndex
CREATE INDEX "rules_code_idx" ON "rules"("code");

-- CreateIndex
CREATE INDEX "rules_status_idx" ON "rules"("status");

-- CreateIndex
CREATE INDEX "rules_severity_idx" ON "rules"("severity");

-- CreateIndex
CREATE INDEX "rules_authorId_idx" ON "rules"("authorId");

-- CreateIndex
CREATE INDEX "rule_revisions_ruleId_idx" ON "rule_revisions"("ruleId");

-- CreateIndex
CREATE INDEX "rule_revisions_authorId_idx" ON "rule_revisions"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "rule_revisions_ruleId_revisionNumber_key" ON "rule_revisions"("ruleId", "revisionNumber");
