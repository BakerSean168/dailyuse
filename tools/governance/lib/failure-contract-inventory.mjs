import { createHash } from 'node:crypto';
import path from 'node:path';
import ts from 'typescript';

export const FAILURE_CONTRACT_RULES = Object.freeze({
  MessageBranch: 'FAILURE_MESSAGE_BRANCH',
  RawMessageRethrow: 'RAW_RESULT_MESSAGE_RETHROW',
  UiRawMessage: 'UI_RAW_RESULT_MESSAGE',
  ProviderLeakage: 'PROVIDER_CODE_LEAKAGE',
  DomainErrorSubclass: 'DOMAIN_ERROR_SUBCLASS',
});

export const DEFAULT_PROVIDER_LITERALS = new Set([
  'EMAIL_NOT_VERIFIED',
  'INVALID_EMAIL_OR_PASSWORD',
]);

export const DEFAULT_PROVIDER_SYMBOLS = new Set(['GitHubAppClientError']);

const MESSAGE_IDENTIFIERS = new Set([
  'message',
  'errorMessage',
  'errorMsg',
  'errMessage',
  'errMsg',
]);

const ERROR_MESSAGE_IDENTIFIERS = new Set(['errorMessage', 'errorMsg', 'errMessage', 'errMsg']);

const MESSAGE_PARSE_METHODS = new Set([
  'includes',
  'match',
  'matchAll',
  'startsWith',
  'endsWith',
  'search',
]);

const PRESENTATION_PATH =
  /^(?:apps\/web|apps\/desktop\/src\/renderer|packages\/app-(?:vue|react))\//;
const PROVIDER_ALLOWED_PATH =
  /\/(?:infrastructure|adapters?|gateways?|providers?)\/|\/errors\/prisma-error-mapper\.[cm]?[jt]s$/;
const TEST_FILE =
  /(?:^|\/)(?:__tests__|__mocks__|e2e|test|tests|fixtures?|stories)(?:\/|$)|\.(?:spec|test|stories)\.[cm]?[jt]sx?$/;

function scriptKind(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.tsx') return ts.ScriptKind.TSX;
  if (ext === '.jsx') return ts.ScriptKind.JSX;
  if (ext === '.js' || ext === '.mjs' || ext === '.cjs') return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function walk(node, visit) {
  visit(node);
  node.forEachChild((child) => walk(child, visit));
}

function containsNode(node, predicate) {
  let found = false;
  walk(node, (child) => {
    if (!found && predicate(child)) found = true;
  });
  return found;
}

function isMessageExpression(node) {
  if (ts.isPropertyAccessExpression(node) && node.name.text === 'message') return true;
  return ts.isIdentifier(node) && MESSAGE_IDENTIFIERS.has(node.text);
}

function isDirectErrorMessageExpression(node) {
  if (ts.isPropertyAccessExpression(node) && node.name.text === 'message') return true;
  return ts.isIdentifier(node) && ERROR_MESSAGE_IDENTIFIERS.has(node.text);
}

function containsMessageExpression(node) {
  return containsNode(node, isMessageExpression);
}

function isErrorConstructor(expression) {
  return ts.isIdentifier(expression) && expression.text === 'Error';
}

function providerAllowed(relPath) {
  return PROVIDER_ALLOWED_PATH.test(`/${relPath}`);
}

function normalizeSnippet(text) {
  return text.replace(/\s+/g, ' ').trim().slice(0, 320);
}

function location(sourceFile, node) {
  const start = node.getStart(sourceFile);
  const position = sourceFile.getLineAndCharacterOfPosition(start);
  return { line: position.line + 1, column: position.character + 1 };
}

function addFinding(findings, seen, sourceFile, relPath, ruleId, node) {
  const { line, column } = location(sourceFile, node);
  const snippet = normalizeSnippet(node.getText(sourceFile));
  const localKey = `${ruleId}:${line}:${column}:${snippet}`;
  if (seen.has(localKey)) return;
  seen.add(localKey);
  findings.push({ ruleId, file: relPath, line, column, snippet });
}

function isMessageParserCall(node) {
  if (!ts.isCallExpression(node)) return false;
  const expression = node.expression;
  if (!ts.isPropertyAccessExpression(expression)) return false;

  const method = expression.name.text;
  if (MESSAGE_PARSE_METHODS.has(method)) {
    return containsMessageExpression(expression.expression);
  }

  if (method === 'test') {
    return node.arguments.some(containsMessageExpression);
  }

  return false;
}

function isMessageComparison(node) {
  if (!ts.isBinaryExpression(node)) return false;
  if (ts.isTypeOfExpression(node.left) || ts.isTypeOfExpression(node.right)) return false;
  const comparisonOperators = new Set([
    ts.SyntaxKind.EqualsEqualsToken,
    ts.SyntaxKind.EqualsEqualsEqualsToken,
    ts.SyntaxKind.ExclamationEqualsToken,
    ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ]);
  if (!comparisonOperators.has(node.operatorToken.kind)) return false;

  if (isDirectErrorMessageExpression(node.left) || isDirectErrorMessageExpression(node.right)) {
    return true;
  }

  const identifierSide = ts.isIdentifier(node.left)
    ? node.left
    : ts.isIdentifier(node.right)
      ? node.right
      : null;
  const literalSide = ts.isStringLiteralLike(node.left)
    ? node.left
    : ts.isStringLiteralLike(node.right)
      ? node.right
      : null;
  return (
    identifierSide?.text === 'message' &&
    literalSide !== null &&
    (/^[A-Z][A-Z0-9_]+$/.test(literalSide.text) ||
      /(?:error|failed|not found|denied)/i.test(literalSide.text))
  );
}

function containsResultErrorMessage(node) {
  if (!ts.isPropertyAccessExpression(node) || node.name.text !== 'message') return false;
  const text = node.getText();
  return (
    /\b(?:result|error|failure|err)\.(?:error|failure)?\.message$/.test(text) ||
    /\b(?:error|failure)\.message$/.test(text)
  );
}

function isRawMessageRethrow(node) {
  if (!ts.isThrowStatement(node) || !node.expression) return false;
  const expression = node.expression;
  if (!ts.isNewExpression(expression) || !isErrorConstructor(expression.expression)) return false;
  return (expression.arguments ?? []).some(containsResultErrorMessage);
}

function isUiRawMessage(node, relPath) {
  if (!PRESENTATION_PATH.test(relPath)) return false;
  if (!ts.isPropertyAccessExpression(node) || node.name.text !== 'message') return false;
  const text = node.getText();
  return /(?:^|\.)(?:error|resultError|failure)\.message$/.test(text);
}

function isDomainErrorSubclass(node) {
  if (!ts.isClassDeclaration(node) || !node.heritageClauses) return false;
  return node.heritageClauses.some(
    (clause) =>
      clause.token === ts.SyntaxKind.ExtendsKeyword &&
      clause.types.some((type) => type.expression.getText() === 'DomainError'),
  );
}

function isProviderLiteral(node, relPath, providerLiterals) {
  if (providerAllowed(relPath)) return false;
  return (
    (ts.isStringLiteralLike(node) &&
      (providerLiterals.has(node.text) || /^P\d{4}$/.test(node.text))) ||
    false
  );
}

function isProviderSymbol(node, relPath, providerSymbols) {
  return !providerAllowed(relPath) && ts.isIdentifier(node) && providerSymbols.has(node.text);
}

/** Return whether a repository path is in the production source inventory. */
export function isFailureContractProductionPath(relPath) {
  if (!/^(?:apps|packages)\//.test(relPath)) return false;
  if (TEST_FILE.test(relPath)) return false;
  if (
    /\/(?:dist(?:-[^/]+)?|build|coverage|generated|reports?|playwright-report|[^/]*playwright[^/]*report[^/]*)\//.test(
      `/${relPath}`,
    )
  ) {
    return false;
  }
  return /\.[cm]?[jt]sx?$/.test(relPath);
}

/** Scan one source file for high-confidence failure-contract findings. */
export function scanFailureContractSource(content, relPath, options = {}) {
  if (!isFailureContractProductionPath(relPath)) return [];

  const providerLiterals = options.providerLiterals ?? DEFAULT_PROVIDER_LITERALS;
  const providerSymbols = options.providerSymbols ?? DEFAULT_PROVIDER_SYMBOLS;
  const sourceFile = ts.createSourceFile(
    relPath,
    content,
    ts.ScriptTarget.Latest,
    true,
    scriptKind(relPath),
  );
  const findings = [];
  const seen = new Set();

  walk(sourceFile, (node) => {
    if (isMessageParserCall(node) || isMessageComparison(node)) {
      addFinding(findings, seen, sourceFile, relPath, FAILURE_CONTRACT_RULES.MessageBranch, node);
    }
    if (isRawMessageRethrow(node)) {
      addFinding(
        findings,
        seen,
        sourceFile,
        relPath,
        FAILURE_CONTRACT_RULES.RawMessageRethrow,
        node,
      );
    }
    if (isUiRawMessage(node, relPath)) {
      addFinding(findings, seen, sourceFile, relPath, FAILURE_CONTRACT_RULES.UiRawMessage, node);
    }
    if (
      isProviderLiteral(node, relPath, providerLiterals) ||
      isProviderSymbol(node, relPath, providerSymbols)
    ) {
      addFinding(findings, seen, sourceFile, relPath, FAILURE_CONTRACT_RULES.ProviderLeakage, node);
    }
    if (isDomainErrorSubclass(node)) {
      addFinding(
        findings,
        seen,
        sourceFile,
        relPath,
        FAILURE_CONTRACT_RULES.DomainErrorSubclass,
        node,
      );
    }
  });

  return findings;
}

/** Add stable fingerprints that survive unrelated line movement. */
export function fingerprintFailureFindings(findings) {
  const occurrences = new Map();
  return [...findings]
    .sort((a, b) =>
      [a.ruleId, a.file, a.snippet, a.line, a.column]
        .join('\0')
        .localeCompare([b.ruleId, b.file, b.snippet, b.line, b.column].join('\0')),
    )
    .map((finding) => {
      const occurrenceKey = `${finding.ruleId}\0${finding.file}\0${finding.snippet}`;
      const occurrence = (occurrences.get(occurrenceKey) ?? 0) + 1;
      occurrences.set(occurrenceKey, occurrence);
      const fingerprint = createHash('sha256')
        .update(`${occurrenceKey}\0${occurrence}`)
        .digest('hex')
        .slice(0, 20);
      return { ...finding, occurrence, fingerprint };
    });
}

/** Compare current findings with the owned, expiring historical baseline. */
export function evaluateFailureContractInventory(findings, baseline, now = new Date()) {
  const entries = baseline?.entries ?? {};
  const current = new Map(findings.map((finding) => [finding.fingerprint, finding]));
  const newFindings = findings.filter((finding) => !entries[finding.fingerprint]);
  const expiredFindings = findings.filter((finding) => {
    const entry = entries[finding.fingerprint];
    if (!entry?.retireBy) return false;
    return new Date(`${entry.retireBy}T23:59:59.999Z`).getTime() < now.getTime();
  });
  const staleEntries = Object.entries(entries)
    .filter(([fingerprint]) => !current.has(fingerprint))
    .map(([fingerprint, entry]) => ({ fingerprint, ...entry }));

  return { newFindings, expiredFindings, staleEntries };
}
