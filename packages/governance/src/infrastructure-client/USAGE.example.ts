// /**
//  * Infrastructure Client - Usage Examples
//  * 基础设施客户端 - 使用示例
//  */

// // ============================================================================
// // Web Application (HTTP)
// // ============================================================================

// import { createRuleHttpAdapter } from '@/infrastructure-client';
// import { CreateRule, ListRules } from '@/application-client';

// // 1. 创建 HTTP 客户端（使用 axios 或其他 HTTP 库）
// const httpClient = {
//   async get(url: string, config?: { params?: any }) {
//     const response = await fetch(url + '?' + new URLSearchParams(config?.params));
//     return response.json();
//   },
//   async post(url: string, data?: any) {
//     const response = await fetch(url, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data),
//     });
//     return response.json();
//   },
//   async patch(url: string, data?: any) {
//     const response = await fetch(url, {
//       method: 'PATCH',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data),
//     });
//     return response.json();
//   },
//   async delete(url: string) {
//     const response = await fetch(url, { method: 'DELETE' });
//     return response.json();
//   },
// };

// // 2. 创建 Rule API 客户端适配器
// const ruleApiClient = createRuleHttpAdapter(httpClient);

// // 3. 在 Vue Composable 中使用
// export function useCreateRule() {
//   const isCreating = ref(false);
//   const error = ref<Error | null>(null);

//   const createRule = async (req: CreateRuleReq) => {
//     isCreating.value = true;
//     error.value = null;
//     try {
//       const createUseCase = CreateRule.getInstance(ruleApiClient);
//       const rule = await createUseCase.execute(req);
//       return rule;
//     } catch (e) {
//       error.value = e as Error;
//       throw e;
//     } finally {
//       isCreating.value = false;
//     }
//   };

//   return { createRule, isCreating, error };
// }

// // 4. 在 React Hook 中使用
// export function useRuleList() {
//   const [rules, setRules] = useState<Rule[]>([]);
//   const [loading, setLoading] = useState(false);

//   const loadRules = async (query?: ListRulesQuery) => {
//     setLoading(true);
//     try {
//       const listUseCase = ListRules.getInstance(ruleApiClient);
//       const { rules } = await listUseCase.execute(query);
//       setRules(rules);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return { rules, loading, loadRules };
// }

// // ============================================================================
// // Desktop Application (IPC)
// // ============================================================================

// import { createRuleIpcAdapter } from '@dailyuse/governance/infrastructure-client';

// // 1. 创建 IPC 客户端（Electron）
// const ipcClient = {
//   async invoke(channel: string, ...args: any[]) {
//     // 使用 Electron 的 ipcRenderer
//     return window.electron.ipcRenderer.invoke(channel, ...args);
//   },
// };

// // 2. 创建 Rule API 客户端适配器
// const ruleApiClientDesktop = createRuleIpcAdapter(ipcClient);

// // 3. 在 Desktop App 中使用
// export function useCreateRuleDesktop() {
//   const createRule = async (req: CreateRuleReq) => {
//     const createUseCase = CreateRule.getInstance(ruleApiClientDesktop);
//     return await createUseCase.execute(req);
//   };

//   return { createRule };
// }
