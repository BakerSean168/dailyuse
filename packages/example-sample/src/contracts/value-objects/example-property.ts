/**
 * ExampleProperty Value Object
 * 
 * 【规范说明：Value Object 的作用】
 * Value Object 是不变对象（Immutable），代表领域中的一个值。
 * 与 Entity 不同：
 * - Entity：有唯一 ID，生命周期长，可变
 * - Value Object：无 ID，通过值来判断相等性，不可变
 * 
 * 这个文件展示如何定义一个复杂的、可复用的 Value Object。
 */

import type { DomainDate } from "@/primitives";
import type { PersistenceDate, TransferDate } from "@/primitives";

/**
 * 领域层 Value Object
 * - 包含验证逻辑和业务不变量
 * - 可以包含方法来封装业务行为
 * - 类型比 DTO 更严格
 * - 时间字段使用 DomainDate
 */
export interface ExampleProperty {
  key: string;
  value: string;
  date: DomainDate;
  description: string | null;
}



/**
 * 传输层 DTO（数据传输对象）
 * - 用于序列化/反序列化
 * - 直接对应数据库字段或 API 响应
 * - 使用基础类型（string, number, boolean）
 * - 时间字段使用 TransferDate
 */
export interface ExamplePropertyDTO {
  key: string;
  value: string;
  date: TransferDate
  description: string | null;
}

/**
 * 持久层 DTO（数据库存储对象）
 * - 用于数据库存储
 * - 可能包含数据库特定的字段或格式
 * - 时间字段使用 PersistenceDate
 */
export interface ExamplePropertyPersistenceDTO {
  key: string;
  value: string;
  date: PersistenceDate;
  description: string | null;
}