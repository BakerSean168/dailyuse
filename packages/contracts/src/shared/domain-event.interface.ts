// 这是一个泛型接口，用于描述存储在聚合根里的事件结构
export interface IDomainEvent<P = any> {
  // 对应 AppEventRegistry 里的 Key (如 'account:closed')
  eventType: string; 
  
  // 对应 AppEventRegistry 里的 Value
  payload: P;
  
  // 元数据
  aggregateId: string;
  occurredAt: Date;
}
