/**
 * Unflushed domain-events audit (pure logic, ts-morph).
 *
 * Guards the failure mode fixed in the event-bus hardening plan (H2): an
 * aggregate accumulates domain events via `addDomainEvent`, but the repository
 * that persists it forgets to `flushDomainEvents` — so events are silently lost.
 *
 * Heuristic (tuned for zero false positives on the current tree):
 *   1. Collect domain-server AggregateRoot subclasses that actually emit events
 *      (their class body calls `addDomainEvent`). These are "event-emitting".
 *   2. For every repository class with a `save`/`persist` method whose parameter
 *      type is an event-emitting aggregate, require the repository's source file
 *      to reference `flushDomainEvents` or `publishDomainEvents`. Otherwise flag.
 *
 * Operates on a ts-morph Project so CLI (real tsconfig) and tests (in-memory
 * fixtures) share the exact same logic.
 */

const SAVE_METHOD_NAMES = new Set(['save', 'persist', 'saveMany', 'saveBatch']);

/**
 * Identifiers that prove a file participates in a domain-event flush pathway.
 * Two sanctioned patterns exist in the tree:
 *  - the `flushDomainEvents`/`publishDomainEvents` helper (repo owns its save()); and
 *  - `AggregateRepositoryBase` whose base save() calls `publishAggregateEvents`
 *    (subclasses only implement persist(); the base flushes).
 */
const FLUSH_IDENTIFIERS = [
  'flushDomainEvents',
  'publishDomainEvents',
  'publishAggregateEvents',
  'AggregateRepositoryBase',
];

/** True if the class extends the flush-owning base (its save() auto-publishes). */
function extendsAggregateRepositoryBase(cls) {
  const extendsExpr = cls.getExtends();
  return Boolean(extendsExpr) && /\bAggregateRepositoryBase\b/.test(extendsExpr.getText());
}

/** Returns the set of class names that extend AggregateRoot and call addDomainEvent. */
export function findEventEmittingAggregates(project) {
  const emitting = new Set();

  for (const sourceFile of project.getSourceFiles()) {
    for (const cls of sourceFile.getClasses()) {
      const extendsExpr = cls.getExtends();
      if (!extendsExpr) continue;
      if (!/\bAggregateRoot\b/.test(extendsExpr.getText())) continue;
      if (cls.getText().includes('addDomainEvent')) {
        const name = cls.getName();
        if (name) emitting.add(name);
      }
    }
  }

  return emitting;
}

/** Extract the simple type name(s) referenced by a parameter's type node. */
function parameterTypeNames(param) {
  const typeNode = param.getTypeNode();
  if (!typeNode) return [];
  // Match identifiers in the type text; covers `X`, `X | null`, `X[]`, `readonly X[]`.
  return typeNode.getText().match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [];
}

/**
 * Find repositories that save an event-emitting aggregate but never flush.
 * @returns {Array<{ file: string, className: string, method: string, aggregate: string }>}
 */
export function findUnflushedRepositories(project, emittingAggregates, options = {}) {
  const isAllowlisted = options.isAllowlisted ?? (() => false);
  const violations = [];
  let allowlistedHits = 0;

  for (const sourceFile of project.getSourceFiles()) {
    const fileText = sourceFile.getFullText();
    const flushesSomewhere = FLUSH_IDENTIFIERS.some((id) => fileText.includes(id));

    for (const cls of sourceFile.getClasses()) {
      const className = cls.getName();
      if (!className || !/Repository$/.test(className)) continue;

      // Repos extending the flush-owning base delegate publishing to base.save();
      // their persist() override is not a miss.
      if (extendsAggregateRepositoryBase(cls)) continue;

      for (const method of cls.getMethods()) {
        if (!SAVE_METHOD_NAMES.has(method.getName())) continue;

        const savedAggregate = method
          .getParameters()
          .flatMap((param) => parameterTypeNames(param))
          .find((typeName) => emittingAggregates.has(typeName));

        if (!savedAggregate || flushesSomewhere) continue;

        const filePath = sourceFile.getFilePath();
        if (isAllowlisted(filePath)) {
          allowlistedHits += 1;
          continue;
        }

        violations.push({
          file: filePath,
          className,
          method: method.getName(),
          aggregate: savedAggregate,
        });
      }
    }
  }

  return { violations, allowlistedHits };
}

/** Full audit over a ts-morph Project. */
export function auditUnflushedEvents(project, options = {}) {
  const emitting = findEventEmittingAggregates(project);
  const { violations, allowlistedHits } = findUnflushedRepositories(project, emitting, options);
  return { emitting, violations, allowlistedHits };
}

export function formatUnflushedViolation({ file, className, method, aggregate }, repoRoot = '') {
  const rel = repoRoot && file.startsWith(repoRoot) ? file.slice(repoRoot.length + 1) : file;
  return `${rel}: ${className}.${method}() persists event-emitting aggregate ${aggregate} but the file never calls flushDomainEvents/publishDomainEvents`;
}
