/**
 * phone number 值对象的接口文件，用于定义 phone number 相关的类型和接口。
 * 主要是 persistenceDTO 和 DTO 的定义。
 * 还有 值对象接口定义、静态方法定义。
 */

// ============ 值对象接口 ============

export interface PhoneNumber {
    readonly value: string;
    domain(): string;
}

// ============ DTO 定义 ============

/**
 * PhoneNumber DTO
 */
export interface PhoneNumberDTO {
    value: string;
}

/**
 * PhoneNumber Persistence DTO
 */
export interface PhoneNumberPersistenceDTO {
    value: string;
}