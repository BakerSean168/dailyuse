"""Find all uuid property usages in packages/ source files."""
import os
import re

ROOT = r"d:\home\projects\dailyuse\packages"
SKIP_DIRS = {"dist", "node_modules", "generated", ".git"}
EXTENSIONS = {".ts", ".tsx", ".vue"}

# Patterns to EXCLUDE
EXCLUDE_PATTERNS = [
    re.compile(r"generateUUID", re.IGNORECASE),
    re.compile(r"isValidUUID", re.IGNORECASE),
    re.compile(r"randomUUID"),
    re.compile(r"^\s*//"),          # line comments
    re.compile(r"^\s*\*"),          # block comment lines
    re.compile(r"^\s*import\s"),    # import statements
    re.compile(r"^\s*export\s.*from"), # re-export statements  
    re.compile(r"""['"`].*uuid.*['"`]""", re.IGNORECASE),  # string literals containing uuid
]

# uuid as word boundary
UUID_WORD = re.compile(r"\buuid\b", re.IGNORECASE)
# uuid as property - more specific
UUID_PROP = re.compile(r"\buuid\b(?!\s*\()", re.IGNORECASE)  # not followed by ( which would be function call

results = []

for dirpath, dirnames, filenames in os.walk(ROOT):
    # Skip excluded directories
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
    
    for fname in filenames:
        ext = os.path.splitext(fname)[1]
        if ext not in EXTENSIONS:
            continue
        
        filepath = os.path.join(dirpath, fname)
        try:
            with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                lines = f.readlines()
        except Exception:
            continue
        
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            
            # Must contain uuid as a word
            if not UUID_PROP.search(stripped):
                continue
            
            # Skip excluded patterns
            skip = False
            for pat in EXCLUDE_PATTERNS:
                if pat.search(stripped):
                    skip = True
                    break
            if skip:
                continue
            
            # Classify the match
            category = "unknown"
            
            # Type/interface definition: uuid: type, uuid?: type, readonly uuid
            if re.search(r"\buuid\s*[\?]?\s*:", stripped) and not re.search(r"\(\s*uuid\s*:", stripped):
                category = "TYPE_DEFINITION"
            elif re.search(r"\breadonly\s+uuid\b", stripped):
                category = "TYPE_DEFINITION"
            # Property access: this.uuid, .uuid =, .uuid,, .uuid), .uuid}
            elif re.search(r"\.\buuid\b", stripped):
                category = "PROPERTY_ACCESS"
            # Destructuring: { uuid }, { uuid, ... }
            elif re.search(r"\{\s*uuid\s*[,\}]", stripped) or re.search(r",\s*uuid\s*[,\}]", stripped):
                category = "DESTRUCTURING"
            # Object literal with uuid key: { uuid: ..., or uuid, (shorthand)
            elif re.search(r"\buuid\s*:", stripped):
                # Could be function param like (uuid: string) => - check
                if re.search(r"\(\s*uuid\s*:", stripped) or re.search(r",\s*uuid\s*:\s*\w+\s*\)", stripped):
                    category = "FUNCTION_PARAM"
                else:
                    category = "OBJECT_LITERAL/TYPE"
            # Template literal or key access: `...${xxx.uuid}...`
            elif re.search(r"\buuid\b", stripped):
                category = "OTHER_USAGE"
            
            # Skip function parameters (uuid: string) as standalone
            if category == "FUNCTION_PARAM":
                continue
            
            relpath = filepath.replace(r"d:\home\projects\dailyuse" + "\\", "").replace("\\", "/")
            results.append((relpath, i, stripped, category))

# Print results grouped by category
categories = {}
for relpath, line, content, cat in results:
    categories.setdefault(cat, []).append((relpath, line, content))

total = 0
for cat in sorted(categories.keys()):
    items = categories[cat]
    print(f"\n{'='*80}")
    print(f"  {cat} ({len(items)} matches)")
    print(f"{'='*80}")
    for relpath, line, content in items:
        print(f"  {relpath}:{line}")
        print(f"    {content}")
    total += len(items)

print(f"\n{'='*80}")
print(f"  TOTAL: {total} matches")
print(f"{'='*80}")
