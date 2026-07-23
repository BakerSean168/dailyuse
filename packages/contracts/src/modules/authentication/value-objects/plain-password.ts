/**
 * 用户输入的原始密码 (构造时校验长度、复杂度)
 *
 * Residual 855: PlainPasswordDTO dual retired — sole PlainPassword interface + type alias.
 */

// Residual 855: sole PlainPassword body.
export interface PlainPassword {
  readonly value: string;
}

// Residual 855: PlainPasswordDTO dual retired — DTO is the PlainPassword shape.
export type PlainPasswordDTO = PlainPassword;
