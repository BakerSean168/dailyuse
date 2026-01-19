/**
 * Server-Sent Events (SSE) Routes
 * 提供实时推送通知的 SSE 端点
 */

import type { Router, Request, Response } from 'express';
import { Router as ExpressRouter } from 'express';

/**
 * SSE 连接管理器 - 单例模式
 */
export class SSEConnectionManager {
  private static instance: SSEConnectionManager;
  private connections: Map<string, Response> = new Map();

  private constructor() {}

  static getInstance(): SSEConnectionManager {
    if (!SSEConnectionManager.instance) {
      SSEConnectionManager.instance = new SSEConnectionManager();
    }
    return SSEConnectionManager.instance;
  }

  /**
   * 添加 SSE 连接
   */
  addConnection(clientId: string, res: Response): void {
    this.connections.set(clientId, res);
  }

  /**
   * 移除 SSE 连接
   */
  removeConnection(clientId: string): void {
    this.connections.delete(clientId);
  }

  /**
   * 发送消息给特定客户端
   */
  sendMessage(clientId: string, eventType: string, data: unknown): void {
    const res = this.connections.get(clientId);
    if (res && !res.writableEnded) {
      res.write(`event: ${eventType}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }

  /**
   * 发送消息给所有连接的客户端
   */
  broadcastMessage(eventType: string, data: unknown): void {
    this.connections.forEach((res) => {
      if (!res.writableEnded) {
        res.write(`event: ${eventType}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    });
  }

  /**
   * 获取活跃连接数
   */
  getConnectionCount(): number {
    return this.connections.size;
  }
}

/**
 * 注册 SSE 路由
 */
export function registerSSERoutes(): Router {
  const router = ExpressRouter();
  const sseManager = SSEConnectionManager.getInstance();

  /**
   * SSE 连接端点
   * GET /sse/connect
   * 建立 SSE 连接，接收实时通知
   */
  router.get('/connect', (req: Request, res: Response) => {
    const clientId = req.query.clientId as string;
    const accountId = (req as any).user?.accountUuid;

    if (!clientId || !accountId) {
      return res.status(400).json({ error: 'Missing clientId or authentication' });
    }

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 添加连接
    sseManager.addConnection(accountId, res);

    // 发送连接成功消息
    res.write('event: connected\n');
    res.write(`data: ${JSON.stringify({ clientId, accountId })}\n\n`);

    // 定期发送心跳保持连接活跃
    const heartbeat = setInterval(() => {
      if (!res.writableEnded) {
        res.write(':\n\n'); // 心跳注释
      } else {
        clearInterval(heartbeat);
      }
    }, 30000); // 每 30 秒发送一次

    // 处理客户端断开连接
    req.on('close', () => {
      clearInterval(heartbeat);
      sseManager.removeConnection(accountId);
      res.end();
    });

    req.on('error', () => {
      clearInterval(heartbeat);
      sseManager.removeConnection(accountId);
      res.end();
    });
  });

  /**
   * 健康检查端点
   * GET /sse/health
   */
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      connections: sseManager.getConnectionCount(),
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
