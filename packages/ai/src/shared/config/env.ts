/**
 * Environment Configuration
 *
 * 服务端环境变量配置
 */

export const env = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  QI_NIU_YUN_API_KEY: process.env.QI_NIU_YUN_API_KEY || '',
  QI_NIU_YUN_BASE_URL: process.env.QI_NIU_YUN_BASE_URL || '',
  QI_NIU_YUN_MODEL_ID: process.env.QI_NIU_YUN_MODEL_ID || '',
};
