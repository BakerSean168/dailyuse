/**
 * Architecture-surface AST helpers (RefArch Phase 6).
 * 架构表面 AST 辅助工具（RefArch 阶段 6）。
 *
 * Thin TypeScript compiler-API helpers used by `architecture-surface-audit.mjs`
 * and its mutation fixtures. Every check is AST-based — never fragile
 * full-text substring matching — so renames/splits of symbols turn red instead
 * of silently passing.
 *
 * 供 `architecture-surface-audit.mjs` 及其 mutation fixtures 使用的精简
 * TypeScript compiler-API 辅助工具。所有检查都是 AST 级——绝不使用脆弱的全文
 * substring 匹配——因此符号重命名/拆分都会变红而不是静默通过。
 */

import ts from 'typescript';

/**
 * Parses TypeScript source text into a source file AST.
 * 将 TypeScript 源码文本解析为 source file AST。
 *
 * @param sourceText - Raw TypeScript source.
 * @param fileName - Virtual file name used for diagnostics/tokens.
 * @returns A `ts.SourceFile` ready for AST queries.
 */
export function parseSource(sourceText, fileName = 'source.ts') {
  return ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

/**
 * Walks a node and its descendants, invoking `visit` for every node.
 * 遍历节点及其后代，对每个节点调用 `visit`。
 *
 * @param node - Root AST node.
 * @param visit - Callback returning `false` to skip descending.
 */
export function walk(node, visit) {
  const shouldContinue = visit(node);
  if (shouldContinue === false) return;
  node.forEachChild((child) => walk(child, visit));
}

/**
 * Finds an exported interface declaration by name.
 * 按名称查找 export interface 声明。
 *
 * @param sourceFile - Parsed source file.
 * @param name - Interface name.
 * @returns The interface declaration node or `null`.
 */
export function findInterfaceDeclaration(sourceFile, name) {
  let found = null;
  for (const statement of sourceFile.statements) {
    if (
      ts.isInterfaceDeclaration(statement) &&
      statement.name.text === name &&
      (ts.getCombinedModifierFlags(statement) & ts.ModifierFlags.Export) !== 0
    ) {
      found = statement;
    }
  }
  return found;
}

/**
 * Finds a class declaration by name (exported or not).
 * 按名称查找 class 声明（无论是否导出）。
 *
 * @param sourceFile - Parsed source file.
 * @param name - Class name.
 * @returns The class declaration node or `null`.
 */
export function findClassDeclaration(sourceFile, name) {
  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement) && statement.name?.text === name) {
      return statement;
    }
  }
  return null;
}

/**
 * Checks whether a class declaration directly implements the named interface.
 * 检查 class 声明是否直接 implements 指定接口。
 *
 * @param classDecl - Class declaration node.
 * @param portName - Port/interface name.
 * @returns `true` when the heritage clause references the port name.
 */
export function classImplements(classDecl, portName) {
  if (!classDecl.heritageClauses) return false;
  for (const clause of classDecl.heritageClauses) {
    if (clause.token !== ts.SyntaxKind.ImplementsKeyword) continue;
    for (const typeNode of clause.types) {
      if (typeText(typeNode) === portName) return true;
    }
  }
  return false;
}

/**
 * Finds a method declaration inside a class by name.
 * 在 class 内按名称查找方法声明。
 *
 * @param classDecl - Class declaration node.
 * @param methodName - Method name.
 * @returns The method declaration node or `null`.
 */
export function findClassMethod(classDecl, methodName) {
  for (const member of classDecl.members) {
    if (
      ts.isMethodDeclaration(member) &&
      member.name &&
      (member.name.text === methodName || member.name.getText() === methodName)
    ) {
      return member;
    }
  }
  return null;
}

/**
 * Checks whether an AST node contains a call to the named callee.
 * 检查 AST 节点是否包含对指定 callee 的调用。
 *
 * Matches `executeApproved(...)`, `this.executeApproved(...)` and
 * `port.executeApproved(...)` — not mere textual mentions.
 *
 * 匹配 `executeApproved(...)`、`this.executeApproved(...)` 与
 * `port.executeApproved(...)`——而不只是文本提及。
 *
 * @param node - Root AST node to scan.
 * @param calleeName - Callee/property name to look for.
 * @returns `true` when a matching call expression exists.
 */
export function containsCallTo(node, calleeName) {
  let found = false;
  walk(node, (child) => {
    if (found) return false;
    if (!ts.isCallExpression(child)) return;
    const expression = child.expression;
    if (ts.isIdentifier(expression) && expression.text === calleeName) {
      found = true;
      return false;
    }
    if (ts.isPropertyAccessExpression(expression) && expression.name.text === calleeName) {
      found = true;
      return false;
    }
  });
  return found;
}

/**
 * Checks whether a node contains a string literal with the exact value.
 * 检查节点是否包含值完全匹配的字符串字面量。
 *
 * @param node - Root AST node.
 * @param value - Exact string literal text to find.
 * @returns `true` when a matching string literal exists.
 */
export function containsStringLiteral(node, value) {
  let found = false;
  walk(node, (child) => {
    if (found) return false;
    if (ts.isStringLiteral(child) && child.text === value) {
      found = true;
      return false;
    }
  });
  return found;
}

/**
 * Extracts the module specifier and imported binding names of an import
 * declaration. 提取 import 声明的模块说明符与导入绑定名。
 *
 * @param importDecl - An import declaration node.
 * @returns `{ specifier, names }` where `names` includes default/named imports.
 */
export function importBindings(importDecl) {
  const specifier = importDecl.moduleSpecifier
    ? importDecl.moduleSpecifier.getText().replace(/^['"]|['"]$/g, '')
    : '';
  const names = [];
  if (importDecl.importClause) {
    if (importDecl.importClause.name) names.push(importDecl.importClause.name.text);
    for (const named of importDecl.importClause.namedBindings?.elements ?? []) {
      if (ts.isImportSpecifier(named)) names.push(named.name.text);
    }
    const namespace = importDecl.importClause.namedBindings;
    if (namespace && ts.isNamespaceImport(namespace)) names.push(namespace.name.text);
  }
  return { specifier, names };
}

/**
 * Collects all import bindings of a source file.
 * 收集 source file 的所有导入绑定。
 *
 * @param sourceFile - Parsed source file.
 * @returns An array of `{ specifier, names }`.
 */
export function collectImports(sourceFile) {
  const imports = [];
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && statement.moduleSpecifier) {
      imports.push(importBindings(statement));
    }
  }
  return imports;
}

/**
 * Returns the plain text of a type node (drops generic arguments).
 * 返回类型节点的纯文本（去掉泛型参数）。
 *
 * @param typeNode - A type node.
 * @returns Normalized type text.
 */
function typeText(typeNode) {
  return typeNode.getText().replace(/<.*>$/g, '');
}

/**
 * Collects exported declaration names (interfaces/types/classes/functions/consts).
 * 收集导出的声明名（interface/type/class/function/const）。
 *
 * @param sourceFile - Parsed source file.
 * @returns Array of exported symbol names.
 */
export function collectExportedNames(sourceFile) {
  const names = [];
  for (const statement of sourceFile.statements) {
    if ((ts.getCombinedModifierFlags(statement) & ts.ModifierFlags.Export) === 0) continue;
    if (ts.isInterfaceDeclaration(statement)) names.push(statement.name.text);
    else if (ts.isClassDeclaration(statement) && statement.name) names.push(statement.name.text);
    else if (ts.isFunctionDeclaration(statement) && statement.name) names.push(statement.name.text);
    else if (ts.isTypeAliasDeclaration(statement)) names.push(statement.name.text);
    else if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) names.push(decl.name.text);
      }
    }
  }
  return names;
}
