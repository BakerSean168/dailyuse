/**
 * 用户输入的原始密码 (构造时校验长度、复杂度)
 */

export interface PlainPassword {
    readonly value: string;
}

export interface PlainPasswordDTO {
    readonly value: string;
}