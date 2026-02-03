# RPC Protocol Implementation Guide - Master Index

**Created**: February 3, 2026  
**For**: dailyuse Express.js application  
**Audience**: Backend engineers, architects, frontend developers

---

## 📚 Documentation Structure

This guide consists of **5 comprehensive documents** that cover all aspects of implementing RPC protocols in Express.js:

### 1. **RPC_PROTOCOL_BEST_PRACTICES.md** 
   **The Foundation - Start Here**
   - What is RPC and why use it in Express
   - Core concepts (RPC maps, DTO layers, type safety)
   - Complete architecture explanation with diagrams
   - Middleware patterns and implementation
   - Anti-patterns and what to avoid
   - Code examples (correct vs incorrect)
   - **Best for**: Understanding the "why" and "how"

### 2. **RPC_IMPLEMENTATION_TOOLKIT.md**
   **The Templates - Copy & Paste Ready**
   - Quick start templates for all major components
   - RpcRouter implementation
   - Zod schema validation patterns
   - Entity-to-DTO mapping helpers
   - Error handling wrappers
   - React hooks for client usage
   - Complete working examples
   - **Best for**: Getting started quickly, code templates

### 3. **RPC_ARCHITECTURE_DECISIONS.md**
   **The Decision Trees - Strategic Guidance**
   - Decision trees for RPC vs REST
   - RPC map organization patterns
   - Validation strategy decisions
   - Error handling architecture
   - Type safety patterns
   - Comparison of different organizational approaches
   - Performance considerations
   - **Best for**: Architectural decisions, design patterns

### 4. **RPC_QUICK_REFERENCE.md**
   **The Checklists - Daily Reference**
   - Quick start checklist (15 minutes setup)
   - File structure template
   - Common DTOs template
   - Handler implementation patterns
   - Validation patterns with Zod
   - Error handling quick reference
   - Client usage examples
   - Testing checklist
   - Code review checklist
   - Security and performance checklists
   - Troubleshooting guide
   - **Best for**: Daily development, quick lookups, checklists

### 5. **RPC_CODEBASE_EXAMPLES.md**
   **The Real Examples - From Your Workspace**
   - Authentication RPC protocol example
   - Express route implementation pattern
   - Enhanced RpcRouter with your patterns
   - Domain entity to DTO mapping
   - Unit testing examples
   - App integration
   - Response builder pattern
   - Migration path for your project
   - **Best for**: Contextual examples, applying to your codebase

---

## 🎯 Quick Navigation by Role

### Backend Engineers
1. Read: RPC_PROTOCOL_BEST_PRACTICES.md → Section: "Core Concepts"
2. Copy: RPC_IMPLEMENTATION_TOOLKIT.md → "RPC Router Implementation"
3. Implement: RPC_CODEBASE_EXAMPLES.md → "Example 2: Express Route Implementation"
4. Reference: RPC_QUICK_REFERENCE.md → "Handler Implementation Patterns"
5. Test: RPC_QUICK_REFERENCE.md → "Testing Checklist"

### Architects / Tech Leads
1. Review: RPC_ARCHITECTURE_DECISIONS.md → All decision trees
2. Evaluate: RPC_PROTOCOL_BEST_PRACTICES.md → "Decision Matrix"
3. Plan: RPC_CODEBASE_EXAMPLES.md → "Migration Path"
4. Assess: RPC_QUICK_REFERENCE.md → "Performance Checklist"
5. Secure: RPC_QUICK_REFERENCE.md → "Security Checklist"

### Frontend Developers
1. Learn: RPC_PROTOCOL_BEST_PRACTICES.md → Section: "Overview"
2. Implement: RPC_IMPLEMENTATION_TOOLKIT.md → "React Hook"
3. Reference: RPC_QUICK_REFERENCE.md → "Client Usage Examples"
4. Example: RPC_CODEBASE_EXAMPLES.md → "Example 7"

### DevOps / Operations
1. Understand: RPC_PROTOCOL_BEST_PRACTICES.md → "Type Safety Layers"
2. Monitor: RPC_QUICK_REFERENCE.md → "Key Metrics to Monitor"
3. Troubleshoot: RPC_QUICK_REFERENCE.md → "Troubleshooting Guide"

---

## 📋 Learning Path by Experience Level

### Beginner (First time with RPC)
**Time**: ~2 hours total

1. **Introduction** (15 min)
   - RPC_PROTOCOL_BEST_PRACTICES.md → Overview section
   - Understand: What is RPC and why use it?

2. **Concepts** (30 min)
   - RPC_PROTOCOL_BEST_PRACTICES.md → Core Concepts
   - Understand: RPC maps, DTOs, response types

3. **Implementation** (45 min)
   - RPC_IMPLEMENTATION_TOOLKIT.md → Template 1 (Basic RPC Handler)
   - Copy the template, modify for your needs
   - Follow the file structure

4. **Testing & Integration** (30 min)
   - RPC_QUICK_REFERENCE.md → Handler Implementation Patterns
   - Add validation
   - Write first test

### Intermediate (Built something with RPC)
**Time**: ~1 hour for each topic

1. **Advanced Patterns**
   - RPC_ARCHITECTURE_DECISIONS.md → Architectural Patterns
   - Choose pattern best for your use case

2. **Performance Optimization**
   - RPC_PROTOCOL_BEST_PRACTICES.md → "Middleware Patterns"
   - RPC_QUICK_REFERENCE.md → "Performance Checklist"

3. **Type Safety**
   - RPC_ARCHITECTURE_DECISIONS.md → "Type Safety Patterns"
   - RPC_IMPLEMENTATION_TOOLKIT.md → "Template 7: Type-Safe Client Hook"

### Advanced (Architecting RPC system)
**Time**: ~3 hours for strategy

1. **Decision Making**
   - RPC_ARCHITECTURE_DECISIONS.md → All sections
   - Map decisions to your project

2. **Team Guidance**
   - RPC_QUICK_REFERENCE.md → Checklists (all of them)
   - Create team standards based on examples

3. **Scale & Performance**
   - RPC_QUICK_REFERENCE.md → "Key Metrics to Monitor"
   - RPC_PROTOCOL_BEST_PRACTICES.md → Performance section

---

## 🔑 Key Concepts at a Glance

### What is an RPC Map?
```typescript
// Type-safe registry of all available operations
type AuthRpcMap = {
  'auth:login': [LoginReq, LoginRes];
  'auth:register': [RegisterReq, RegisterRes];
};
```

### The Three-Layer DTO Pattern
```
Domain Entity (internal)
  ↓ map to
Request DTO (from client)
  ↓ process
Response DTO (to client)
```

### Handler Signature
```typescript
async (req: RequestDTO, ctx: RpcContext): Promise<ResponseDTO>
```

### HTTP Protocol
```
POST /api/rpc
Body: {
  action: 'auth:login',
  payload: { email: '...', password: '...' }
}

Response:
{
  success: true,
  data: { accessToken: '...', user: {...} },
  error: null
}
```

---

## 🚀 Getting Started in 30 Minutes

### Step 1: Create Your RPC Map (10 min)
```typescript
// packages/contracts/src/modules/[domain]/protocol/[domain]-rpc-map.ts
export type [Domain]RpcMap = {
  '[domain]:[operation]': [RequestDTO, ResponseDTO];
};
```

### Step 2: Create RpcRouter (5 min)
Copy from: RPC_IMPLEMENTATION_TOOLKIT.md → "Template 2: RPC Router Implementation"

### Step 3: Implement One Handler (10 min)
```typescript
rpc.handle('[domain]:[operation]', async (req) => {
  const service = await Service.getInstance();
  const result = await service.method(req);
  return mapToDto(result);
});
```

### Step 4: Wire Into App (5 min)
```typescript
app.use('/api/[domain]', register[Domain]RpcRoutes());
```

**Test with curl**:
```bash
curl -X POST http://localhost:3000/api/[domain]/rpc \
  -H "Content-Type: application/json" \
  -d '{"action":"[domain]:[operation]","payload":{...}}'
```

---

## ✅ Verification Checklist

After implementing your first RPC operation:

- [ ] **RPC Map is type-safe** (uses DTOs, not entities)
- [ ] **Request DTO** validated with Zod
- [ ] **Response DTO** does not expose sensitive fields
- [ ] **Handler maps** domain entity to response DTO
- [ ] **Error handling** uses standard error types
- [ ] **Context passed** to handler includes auth info
- [ ] **Middleware wraps** response in success/error envelope
- [ ] **Test passes** for happy path
- [ ] **Test passes** for validation error
- [ ] **Test passes** for auth error
- [ ] **No TypeScript errors** (strict mode)

---

## 🔄 Common Development Tasks

### Add a New RPC Operation
1. Create request/response DTOs (with Zod)
2. Add to RPC map
3. Implement handler
4. Register in router
5. Write tests
6. Document

→ See: RPC_QUICK_REFERENCE.md → "Quick Start Checklist"

### Update RPC Map Types
1. Update DTOs (backward compatible if possible)
2. Update RPC map
3. Update handler
4. Update tests
5. Version if breaking change

→ See: RPC_ARCHITECTURE_DECISIONS.md → "Changing RPC map types"

### Handle Complex Validation
1. Define Zod schema with all rules
2. Use .refine() for cross-field validation
3. Use async validation for database checks
4. Provide helpful error messages

→ See: RPC_IMPLEMENTATION_TOOLKIT.md → "Template 5"

### Map Entity to DTO
1. Create mapper function
2. Explicitly list included fields
3. Document excluded fields
4. Test that no sensitive data leaks

→ See: RPC_CODEBASE_EXAMPLES.md → "Example 4"

### Test RPC Handlers
1. Mock service layer
2. Test handler with RpcRouter middleware
3. Verify response format
4. Test error scenarios
5. Verify sensitive data not exposed

→ See: RPC_CODEBASE_EXAMPLES.md → "Example 5"

---

## 🎓 Best Practices Summary

### ✅ Always Do This
- Use RPC maps as source of truth
- Separate domain entities from DTOs completely
- Validate request payloads with Zod
- Map domain entities to DTOs in handlers
- Use standard error types
- Test both success and error paths
- Document RPC operations
- Version RPC operations
- Monitor RPC performance

### ❌ Never Do This
- Export domain entities as response types
- Validate in handlers (use middleware)
- Mix HTTP and RPC response formats
- Include server internals in DTOs
- Allow clients to set generated fields
- Skip validation middleware
- Change RPC types without versioning
- Expose stack traces in production

---

## 📊 Comparison: REST vs RPC

| Aspect | REST | RPC |
|--------|------|-----|
| **Discoverability** | Good (OpenAPI) | Requires docs |
| **Type Safety** | Partial | Full (with TypeScript) |
| **Simplicity** | Simpler for CRUD | Better for workflows |
| **Versioning** | Endpoint URLs | Action names |
| **Error Handling** | HTTP status codes | Custom error codes |
| **Desktop/Native** | Works | Better fit |
| **Public API** | Standard | Less common |
| **Internal APIs** | Works | Preferred |

---

## 🔍 Key Decision Points

### Should I use RPC?
```
Building desktop app (Electron/Tauri)? → YES
Building public API? → NO
Building microservices? → YES (preferred)
Building web SPA? → Maybe (depends on team)
```

### How should I organize handlers?
```
By domain → Auth, User, Task modules
By operation → Fine-grained files
By endpoint → Grouped handlers
```

### Where should I validate?
```
Payload structure → Middleware (Zod)
Business rules → Service layer
Permission rules → Handler/context
Cross-field rules → Zod .refine()
```

### What should I return?
```
Domain entity? → Never
Request DTO? → Only as input
Response DTO? → Always
Mapped fields? → Yes
Sensitive data? → No
```

---

## 📞 Questions & Answers

### Q: What's the difference between Request and Response DTOs?
**A**: Request DTOs are what clients send (includes only user-provided fields). Response DTOs are what server sends (includes only displayable fields). Both are protocol contracts, neither is a domain entity.

### Q: Can I use the same DTO for request and response?
**A**: Only if they happen to have the same shape. Usually they differ (response has id, createdAt; request doesn't).

### Q: How do I version RPC operations?
**A**: Add version to action name: `'auth:login-v1'` and `'auth:login-v2'`. Or create separate RPC maps. Mark old operations as deprecated.

### Q: What if my handler needs database context?
**A**: Inject it via the context parameter, or call service with extracted user ID.

### Q: Can I nest RPC calls?
**A**: Don't. Call services directly instead. RPC is for client-server communication.

### Q: How do I handle file uploads?
**A**: Upload separately to /upload endpoint, get file ID, include in RPC operation. Or use multipart/form-data instead of RPC.

### Q: Should I expose all fields in list operations?
**A**: No. Return minimal fields, load details on-demand. Use separate "detail" operations.

### Q: How do I test RPC without UI?
**A**: Use curl, Postman, or automated tests. See: RPC_QUICK_REFERENCE.md → "Testing Checklist"

---

## 📈 Maturity Levels

### Level 1: Basic RPC (Week 1)
- [ ] RpcRouter implemented
- [ ] 1-2 operations working
- [ ] Basic validation
- [ ] Error handling

### Level 2: Standardized RPC (Week 2-3)
- [ ] Multiple operations per domain
- [ ] Consistent error handling
- [ ] Complete validation
- [ ] Testing infrastructure

### Level 3: Optimized RPC (Week 4+)
- [ ] Performance monitoring
- [ ] Caching strategies
- [ ] Client code generation
- [ ] OpenAPI export

### Level 4: Advanced RPC (Month 2+)
- [ ] Rate limiting
- [ ] Request queuing
- [ ] Batch operations
- [ ] Real-time subscriptions (WebSocket)

---

## 🎯 Next Steps

1. **Choose a starting operation** (recommend: auth:login)
2. **Read the relevant section** in RPC_PROTOCOL_BEST_PRACTICES.md
3. **Copy template** from RPC_IMPLEMENTATION_TOOLKIT.md
4. **Implement** following RPC_CODEBASE_EXAMPLES.md patterns
5. **Test** using RPC_QUICK_REFERENCE.md checklist
6. **Review** using RPC_QUICK_REFERENCE.md code review checklist
7. **Expand** to next operation, repeat

---

## 📖 Document Directory

| Document | Purpose | Length | Read Time |
|----------|---------|--------|-----------|
| RPC_PROTOCOL_BEST_PRACTICES.md | Foundation & concepts | ~4500 lines | 60 min |
| RPC_IMPLEMENTATION_TOOLKIT.md | Code templates | ~2500 lines | 40 min |
| RPC_ARCHITECTURE_DECISIONS.md | Design patterns | ~2000 lines | 35 min |
| RPC_QUICK_REFERENCE.md | Daily reference | ~1500 lines | 25 min |
| RPC_CODEBASE_EXAMPLES.md | Real examples | ~1000 lines | 20 min |
| **This index** | **Navigation guide** | **500 lines** | **10 min** |

---

## 🙏 Contributing to This Guide

If you find improvements:
1. Update relevant document
2. Update this index if structure changes
3. Share with team
4. Maintain consistency

---

## Version History

| Date | Change | Author |
|------|--------|--------|
| 2026-02-03 | Initial creation | RPC Architecture Review |

---

## 📌 Key Files in Your Workspace

Already have good structure for RPC:
- ✅ `packages/contracts/src/modules/[domain]/protocol/` - RPC maps
- ✅ `packages/contracts/src/modules/[domain]/api/` - Request/Response DTOs
- ✅ `apps/api/src/modules/[domain]/interface/` - Route handlers
- ✅ `packages/application-server/` - Business logic

Need to add:
- 🆕 RpcRouter class in infrastructure
- 🆕 Zod validation schemas in DTOs
- 🆕 Entity mapper helpers
- 🆕 Error type definitions

---

**Last Updated**: February 3, 2026  
**Status**: Complete and ready for implementation  
**Next Review**: After first RPC implementation cycle
