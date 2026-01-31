/**
 * email address 值对象的接口文件，用于定义 email address 相关的类型和接口。
 * 主要是 persistenceDTO 和 DTO 的定义。
 * 还有 值对象接口定义、静态方法定义。
 */

// ============ 值对象接口 ============

export interface EmailAddress {
    readonly value: string;
}


// ============ DTO 定义 ============

/**
 * EmailAddress DTO
 */
export interface EmailAddressDTO {
    value: string;
}

/**
 * EmailAddress Persistence DTO
 */
export interface EmailAddressPersistenceDTO {
    value: string;
}
