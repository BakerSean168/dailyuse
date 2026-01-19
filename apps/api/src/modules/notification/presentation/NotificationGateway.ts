// @ts-nocheck
/**
 * NotificationGateway
 * WebSocket 网关 - 实时推送通知
 * 标准 Socket.io 实现 - 移除了 NestJS @WebSocketGateway 装饰器
 */

import { Server, Socket } from 'socket.io';
import type { NotificationServerDTO, NotificationPreferenceServerDTO } from '@dailyuse/contracts/notification';

/**
 * 简单的日志工具
 */
class Logger {
  constructor(readonly name: string) {}
  log(msg: string) { console.log(`[${this.name}] ${msg}`); }
  debug(msg: string) { console.debug(`[${this.name}] ${msg}`); }
  warn(msg: string) { console.warn(`[${this.name}] ${msg}`); }
}

export class NotificationGateway {
  private server: Server | null = null;
  private readonly logger = new Logger('NotificationGateway');
  private userSockets = new Map<string, Set<string>>(); // accountUuid -> Set<socketId>

  /**
   * 初始化 WebSocket 服务器
   */
  setServer(server: Server) {
    this.server = server;
    this.setupNamespace();
  }

  /**
   * 设置 notifications 命名空间
   */
  private setupNamespace() {
    if (!this.server) return;

    const nsp = this.server.of('/notifications');

    nsp.on('connection', (client: Socket) => {
      const accountUuid = client.handshake.auth?.accountUuid;
      
      if (!accountUuid) {
        this.logger.warn(`Client ${client.id} connected without accountUuid`);
        client.disconnect();
        return;
      }

      // 记录用户的 socket 连接
      if (!this.userSockets.has(accountUuid)) {
        this.userSockets.set(accountUuid, new Set());
      }
      this.userSockets.get(accountUuid)!.add(client.id);

      // 加入用户专属房间
      client.join(`user:${accountUuid}`);

      this.logger.log(`Client ${client.id} connected for user ${accountUuid}`);

      // 断开连接处理
      client.on('disconnect', () => {
        const sockets = this.userSockets.get(accountUuid);
        if (sockets) {
          sockets.delete(client.id);
          if (sockets.size === 0) {
            this.userSockets.delete(accountUuid);
          }
        }
        this.logger.log(`Client ${client.id} disconnected`);
      });
    });
  }

  /**
   * 推送新通知给用户
   */
  sendNotificationToUser(
    accountUuid: string,
    notification: any
  ) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }
    this.server.to(`/notifications:user:${accountUuid}`).emit('notification:new', notification);
    this.logger.debug(`Notification sent to user ${accountUuid}`);
  }

  /**
   * 通知用户某个通知已读
   */
  notifyNotificationRead(accountUuid: string, notificationUuid: string) {
    if (!this.server) return;
    this.server.to(`/notifications:user:${accountUuid}`).emit('notification:read', {
      uuid: notificationUuid,
    });
  }

  /**
   * 通知用户某个通知已删除
   */
  notifyNotificationDeleted(accountUuid: string, notificationUuid: string) {
    if (!this.server) return;
    this.server.to(`/notifications:user:${accountUuid}`).emit('notification:deleted', {
      uuid: notificationUuid,
    });
  }

  /**
   * 更新未读数量
   */
  updateUnreadCount(accountUuid: string, count: number) {
    if (!this.server) return;
    this.server.to(`/notifications:user:${accountUuid}`).emit('notification:unread-count', {
      count,
    });
  }
}

