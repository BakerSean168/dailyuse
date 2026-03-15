/**
 * Editor transport handler mapping.
 * 编辑器传输层处理器映射。
 *
 * This file converts the module facade into the function signatures required by
 * controllers. It is shared by HTTP and Electron transports so the mapping is
 * defined once.
 *
 * 这个文件把模块门面转换成控制器所需的函数签名。
 * HTTP 和 Electron 共用这一层，避免重复定义同样的 handler 映射。
 */

import type { EditorUseCases } from '../controllers/editor.controller';
import type { EditorApplicationPort } from '../infrastructure-server';

/**
 * Converts the composition-root application port into the controller's use-case port.
 * 将组合根的应用层门面转换为控制器的用例端口。
 *
 * Currently a direct pass-through because EditorApplicationPort and EditorUseCases
 * share the same shape. If the two drift apart in the future, mapping logic goes here.
 *
 * 当前为直接透传，因为 EditorApplicationPort 与 EditorUseCases 拥有相同的形状。
 * 如果未来两者形状发生分化，映射逻辑将放在此处。
 */
export function createEditorTransportHandlers(api: EditorApplicationPort): EditorUseCases {
  return api;
}
