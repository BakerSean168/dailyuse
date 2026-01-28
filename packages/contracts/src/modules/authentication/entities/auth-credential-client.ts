/**
 * AuthCredential Entity - Client Interface
 * 认证凭证实体 - 客户端接口
 */




// ============ 实体接口 ============

export interface AuthCredentialClient {
  

}

export interface AuthCredentialClientStatic {
  fromClientDTO(dto: AuthCredentialClientDTO): AuthCredentialClient;
}


// ============ DTO 定义 ============

/**
 * AuthCredential Client DTO
 */
export interface AuthCredentialClientDTO {
  
}

