export interface GracefulRedis {
  disconnect: () => Promise<unknown>;
}

export interface GracefulDB {
  close: () => Promise<unknown>;
}

export interface GracefulBullMQ {
  shutdown: () => Promise<void>;
}

export interface GracefulBot {
  destroy: () => Promise<void>;
}

export interface ShutdownDeps {
  redis: GracefulRedis;
  db: GracefulDB;
  bullmq: GracefulBullMQ;
  bot: GracefulBot;
}

export interface WorkerShutdownDeps {
  bullmq: GracefulBullMQ;
}
