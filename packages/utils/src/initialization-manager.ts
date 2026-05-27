export enum InitializationPhase {
  APP_STARTUP = 'APP_STARTUP',
  BEFORE_USER_LOGIN = 'BEFORE_USER_LOGIN',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  APP_SHUTDOWN = 'APP_SHUTDOWN',
}

export interface InitializationTask {
  name: string;
  phase: InitializationPhase;
  priority?: number; // 数字越小优先级越高，默认 100
  dependencies?: string[]; // 依赖的任务名
  parallel?: boolean; // 同 priority 下是否允许并行（默认 false）
  timeoutMs?: number; // 可选超时（毫秒）
  initialize: (context?: unknown) => Promise<void>;
  cleanup?: (context?: unknown) => Promise<void>;
}

export class InitializationManager {
  private tasks: Map<string, InitializationTask> = new Map();
  private completedTasks: Set<string> = new Set();
  private runningTasks: Set<string> = new Set();

  /**
   * 注册任务，返回 unregister 函数
   */
  registerTask(task: InitializationTask): () => void {
    if (!task || !task.name || !task.phase || typeof task.initialize !== 'function') {
      throw new Error('Invalid InitializationTask: name, phase and initialize are required');
    }
    if (this.tasks.has(task.name)) {
      throw new Error(`Task already registered: ${task.name}`);
    }
    const normalized: InitializationTask = {
      priority: 100,
      parallel: false,
      timeoutMs: undefined,
      ...task,
    };
    this.tasks.set(task.name, normalized);
    return () => {
      this.tasks.delete(task.name);
      this.completedTasks.delete(task.name);
      this.runningTasks.delete(task.name);
    };
  }

  /**
   * 执行指定阶段的所有任务（按 priority 升序）
   */
  async executePhase(phase: InitializationPhase, context?: unknown): Promise<void> {
    console.log(`[init] executePhase start: ${phase}`);

    const phaseTasks = Array.from(this.tasks.values())
      .filter((t) => t.phase === phase)
      .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));

    // 按 priority 分组执行，同 priority 内根据 parallel 决定并行/串行
    let idx = 0;
    while (idx < phaseTasks.length) {
      const currentPriority = phaseTasks[idx].priority ?? 100;
      const group: InitializationTask[] = [];
      while (idx < phaseTasks.length && (phaseTasks[idx].priority ?? 100) === currentPriority) {
        group.push(phaseTasks[idx]);
        idx++;
      }

      if (group.length === 0) continue;

      console.log(`[init] executing priority group ${currentPriority} (${group.length} tasks)`);

      // Execute group: if all tasks in group have parallel=true, run in parallel; else run sequentially
      const allParallel = group.every((t) => t.parallel);
      if (allParallel) {
        await Promise.all(group.map((t) => this.executeTaskWithDependencies(t, context)));
      } else {
        for (const task of group) {
          await this.executeTaskWithDependencies(task, context);
        }
      }
    }

    console.log(`[init] executePhase complete: ${phase}`);
  }

  /**
   * 执行单个任务（含依赖处理）并检测循环依赖
   */
  private async executeTaskWithDependencies(
    task: InitializationTask,
    context?: unknown,
    path: Set<string> = new Set(),
  ): Promise<void> {
    if (this.completedTasks.has(task.name)) return;

    if (path.has(task.name)) {
      const cycle = Array.from(path).join(' -> ') + ' -> ' + task.name;
      throw new Error(`Circular dependency detected: ${cycle}`);
    }

    // 先处理依赖
    if (task.dependencies && task.dependencies.length > 0) {
      path.add(task.name);
      for (const depName of task.dependencies) {
        const dep = this.tasks.get(depName);
        if (!dep) {
          throw new Error(`Missing dependency "${depName}" for task "${task.name}"`);
        }
        if (!this.completedTasks.has(depName)) {
          await this.executeTaskWithDependencies(dep, context, path);
        }
      }
      path.delete(task.name);
    }

    // 如果依赖执行完毕且任务仍未完成，则执行
    if (!this.completedTasks.has(task.name)) {
      await this.executeTask(task, context);
    }
  }

  /**
   * 执行单个任务（支持 timeout）
   */
  private async executeTask(task: InitializationTask, context?: unknown): Promise<void> {
    if (this.completedTasks.has(task.name)) return;

    this.runningTasks.add(task.name);
    console.log(`[init] starting task: ${task.name}`);

    const exec = (async () => {
      try {
        await task.initialize(context);
        this.completedTasks.add(task.name);
        console.log(`[init] completed task: ${task.name}`);
      } finally {
        this.runningTasks.delete(task.name);
      }
    })();

    if (task.timeoutMs && task.timeoutMs > 0) {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Task timeout after ${task.timeoutMs}ms: ${task.name}`)),
          task.timeoutMs,
        ),
      );
      await Promise.race([exec, timeout]);
    } else {
      await exec;
    }
  }

  /**
   * 清理指定阶段的任务（按 priority 逆序）
   * 清理遇错不会中止其它清理
   */
  async cleanupPhase(phase: InitializationPhase, context?: unknown): Promise<void> {
    console.log(`[init] cleanupPhase start: ${phase}`);
    const phaseTasks = Array.from(this.tasks.values())
      .filter((t) => t.phase === phase && typeof t.cleanup === 'function')
      .sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100)); // 逆序

    for (const task of phaseTasks) {
      try {
        console.log(`[init] cleaning up task: ${task.name}`);
        await task.cleanup!(context);
        this.completedTasks.delete(task.name);
        console.log(`[init] cleaned task: ${task.name}`);
      } catch (err) {
        console.error(`[init] cleanup failed for ${task.name}:`, err);
        // 继续清理其他任务
      }
    }
    console.log(`[init] cleanupPhase complete: ${phase}`);
  }

  // 便捷方法
  getTask(name: string): InitializationTask | undefined {
    return this.tasks.get(name);
  }

  listTasks(): InitializationTask[] {
    return Array.from(this.tasks.values());
  }

  isTaskCompleted(name: string): boolean {
    return this.completedTasks.has(name);
  }

  isTaskRunning(name: string): boolean {
    return this.runningTasks.has(name);
  }

  /**
   * 重置管理器。若 wantClearTasks 为 true，则同时清除已注册的任务
   */
  reset(wantClearTasks = false): void {
    this.completedTasks.clear();
    this.runningTasks.clear();
    if (wantClearTasks) this.tasks.clear();
    console.log('[init] manager reset' + (wantClearTasks ? ' (cleared tasks)' : ''));
  }
}
