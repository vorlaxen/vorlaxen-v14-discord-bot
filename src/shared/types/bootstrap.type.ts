export interface GracefulRedis {
  quit: () => Promise<unknown>;
}

export interface ShutdownDeps {
  redis: GracefulRedis;
}
